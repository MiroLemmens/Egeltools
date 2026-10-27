import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publisher', Path(__file__).resolve().parents[1] / 'scripts/publisher/server.py')
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)
SOURCE = b"// @version 1.2.3\n// @updateURL https://old\n// @downloadURL https://old\nconst APP = Object.freeze({version: '1.2.3'});\n"


class PublisherTests(unittest.TestCase):
    def claims(self, branch='dev'):
        return dict(ref=f'refs/heads/{branch}', repository=publisher.REPOSITORY,
                    repository_id='1344937945', repository_owner_id='181408858',
                    event_name='push', sha='a' * 40,
                    workflow_ref=f'{publisher.REPOSITORY}/.github/workflows/publish.yml@refs/heads/{branch}')

    def test_allowed_branches(self):
        for branch in ('dev', 'main'):
            self.assertEqual(publisher.authorize(self.claims(branch)), (branch, 'a' * 40))

    def test_wrong_identities_are_rejected(self):
        for field, value in [('ref', 'refs/heads/feature/test'), ('repository', 'attacker/Egeltools'),
                             ('repository_id', '1'), ('repository_owner_id', '1'),
                             ('event_name', 'pull_request'), ('workflow_ref', 'other.yml'),
                             ('sha', '../../bad')]:
            claims = self.claims()
            claims[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                publisher.authorize(claims)

    def test_isolated_channels_and_idempotent_releases(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for branch in ('dev', 'main'):
                publisher.write_release(root, branch, SOURCE, 'a' * 40)
                publisher.write_release(root, branch, SOURCE, 'b' * 40)
                actual = (root / branch / 'EgelTools.user.js').read_bytes()
                self.assertIn(f'/egeltools/{branch}/EgelTools.user.js'.encode(), actual)
                self.assertEqual(actual, (root / branch / 'releases/1.2.3/EgelTools.user.js').read_bytes())
            before = (root / 'dev/EgelTools.user.js').read_bytes()
            with self.assertRaises(ValueError):
                publisher.write_release(root, 'dev', SOURCE + b'// changed\n', 'c' * 40)
            self.assertEqual(before, (root / 'dev/EgelTools.user.js').read_bytes())
            self.assertFalse((root / 'EgelTools.user.js').exists())

    def test_bad_version_or_missing_urls_rejected(self):
        for source in (SOURCE.replace(b"'1.2.3'", b"'1.2.4'"), SOURCE.replace(b'@updateURL', b'@other'), SOURCE.replace(b'1.2.3', b'../../escape')):
            with self.assertRaises(ValueError):
                publisher.render(source, 'dev')

    def test_stale_commit_never_writes(self):
        with patch.object(publisher.subprocess, 'check_output', side_effect=[b'', b'', b'b' * 40 + b'\n']), patch.object(publisher, 'write_release') as write:
            result = publisher.publish('dev', 'a' * 40)
            self.assertIn('skipped', result)
            write.assert_not_called()


if __name__ == '__main__':
    unittest.main()
