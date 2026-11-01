import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('changelog_webhook', Path(__file__).resolve().parents[1] / 'scripts/changelog-webhook.py')
webhook = importlib.util.module_from_spec(spec)
spec.loader.exec_module(webhook)
CHANGELOG = """# Changelog

Intro.

## 1.2.3 — 2026-11-01

- Add **Party trades** to the dock.
- Fix the alarm
  wrapping onto a second line.

## 1.2.2 — 2026-10-30

- Older note.
"""


class ChangelogWebhookTests(unittest.TestCase):
    def test_release_notes_reads_one_section(self):
        self.assertEqual(webhook.release_notes(CHANGELOG, '1.2.3'), ('2026-11-01', [
            'Add **Party trades** to the dock.', 'Fix the alarm wrapping onto a second line.']))
        self.assertEqual(webhook.release_notes(CHANGELOG, '1.2.2'), ('2026-10-30', ['Older note.']))

    def test_missing_or_empty_section_fails(self):
        with self.assertRaises(ValueError):
            webhook.release_notes(CHANGELOG, '9.9.9')
        with self.assertRaises(ValueError):
            webhook.release_notes('## 1.0 — 2026-01-01\n\nNo bullets.\n', '1.0')

    def test_script_version_requires_matching_versions(self):
        self.assertEqual(webhook.script_version("// @version      1.2.3\nversion: '1.2.3',"), '1.2.3')
        with self.assertRaises(ValueError):
            webhook.script_version("// @version 1.2.3\nversion: '1.2.4',")

    def test_detect_kind(self):
        self.assertEqual(webhook.detect_kind('https://discord.com/api/webhooks/1/x'), 'discord')
        self.assertEqual(webhook.detect_kind('https://ptb.discord.com/api/webhooks/1/x'), 'discord')
        self.assertEqual(webhook.detect_kind('https://hooks.slack.com/services/x'), 'slack')
        self.assertEqual(webhook.detect_kind('https://example.com/hook'), 'generic')

    def test_discord_payload_blocks_mentions_and_links_install(self):
        body = webhook.payload('discord', '1.2.3', 'dev', '2026-11-01', ['Add **X**.'])
        embed = body['embeds'][0]
        self.assertEqual(body['allowed_mentions'], {'parse': []})
        self.assertEqual(embed['title'], 'EgelTools 1.2.3 (dev)')
        self.assertEqual(embed['url'], 'https://files.miro23.uk/egeltools/dev/EgelTools.user.js')
        self.assertEqual(embed['description'], '• Add **X**.')

    def test_slack_payload_converts_bold(self):
        text = webhook.payload('slack', '2.0.0', 'main', None, ['Add **X**.'])['text']
        self.assertIn('EgelTools 2.0.0>*', text)
        self.assertIn('• Add *X*.', text)

    def test_long_notes_are_trimmed_with_changelog_link(self):
        notes = [f'Note {i} ' + 'x' * 500 for i in range(20)]
        body = webhook.fit(notes, webhook.DISCORD_LIMIT, '[Full changelog](url)')
        self.assertLessEqual(len(body), webhook.DISCORD_LIMIT)
        self.assertTrue(body.endswith('[Full changelog](url)'))
        self.assertIn('Note 0', body)


if __name__ == '__main__':
    unittest.main()
