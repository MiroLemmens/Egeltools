#!/usr/bin/env node
'use strict';

/*
 * Runs the browser smoke pages (tests/smoke.html and tests/reload-smoke.html) in headless Chrome
 * and fails when a page records assertion failures or never finishes.
 *
 * The pages are self-contained fake-Grepolis pages that load ../EgelTools.user.js, so the repository
 * root is served over HTTP (python3 -m http.server, bound to 127.0.0.1) and Chrome is driven over the
 * DevTools Protocol with Node's built-in WebSocket (Node 22 or newer). Each page collects
 * console.assert failures in window.__assertFailures and marks completion on document.body.dataset
 * (smokeComplete / reloadSmokeComplete). Uncaught exceptions and console errors are printed to help
 * diagnosis, but only the assertion list decides pass or fail: the reload page logs one known
 * "ReferenceError: ITowns is not defined" that is not a test failure.
 *
 * Usage: node scripts/run-smoke-tests.cjs [--chrome <binary>] [--timeout <seconds>] [tests/<page>.html ...]
 * Environment: EGELTOOLS_CHROME or CHROME_BIN picks the browser binary, EGELTOOLS_CHROME_ARGS adds
 * Chrome flags (whitespace separated). Only the Chrome and HTTP server processes started here are
 * stopped afterwards; nothing else on the machine is touched.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = {
  'tests/smoke.html': { completeKey: 'smokeComplete' },
  'tests/reload-smoke.html': { completeKey: 'reloadSmokeComplete' },
};
const POLL_MS = 250;
const DEFAULT_TIMEOUT_SECONDS = 300;

function fail(message) {
  console.error(`run-smoke-tests: ${message}`);
  process.exit(2);
}

function printUsage() {
  console.log('Usage: node scripts/run-smoke-tests.cjs [--chrome <binary>] [--timeout <seconds>] [page ...]');
  console.log(`Pages (default: all): ${Object.keys(PAGES).join(', ')}`);
}

function parseArgs(argv) {
  const options = {
    chrome: process.env.EGELTOOLS_CHROME || process.env.CHROME_BIN || '',
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    pages: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--chrome') options.chrome = argv[++index] ?? '';
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice('--chrome='.length);
    else if (arg === '--timeout') options.timeoutSeconds = Number(argv[++index]);
    else if (arg.startsWith('--timeout=')) options.timeoutSeconds = Number(arg.slice('--timeout='.length));
    else if (arg === '--help' || arg === '-h') { printUsage(); process.exit(0); }
    else if (arg.startsWith('-')) fail(`unknown option ${arg}`);
    else options.pages.push(arg.replace(/^\.\//, '').replaceAll('\\', '/'));
  }
  if (!Number.isFinite(options.timeoutSeconds) || options.timeoutSeconds <= 0) fail('--timeout needs a positive number of seconds');
  if (options.pages.length === 0) options.pages = Object.keys(PAGES);
  for (const page of options.pages) {
    if (!PAGES[page]) fail(`unknown smoke page ${page}; known pages: ${Object.keys(PAGES).join(', ')}`);
  }
  return options;
}

function findOnPath(name) {
  if (name.includes('/') || name.includes(path.sep)) return null;
  const extensions = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const extension of extensions) {
      const candidate = path.join(dir, name + extension);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        // keep looking
      }
    }
  }
  return null;
}

function findChrome(preferred) {
  if (preferred) {
    if (fs.existsSync(preferred)) return preferred;
    const onPath = findOnPath(preferred);
    if (onPath) return onPath;
    fail(`Chrome binary not found: ${preferred}`);
  }
  const fixedCandidates = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
  }[process.platform] || [];
  for (const candidate of fixedCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) {
    const onPath = findOnPath(name);
    if (onPath) return onPath;
  }
  return fail('no Chrome or Chromium binary found; pass --chrome <binary> or set EGELTOOLS_CHROME');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const freePort = () => new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.unref();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

const httpGet = (url) => new Promise((resolve, reject) => {
  const request = http.get(url, (response) => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => { body += chunk; });
    response.on('end', () => resolve({ status: response.statusCode, body }));
  });
  request.on('error', reject);
  request.setTimeout(5000, () => request.destroy(new Error(`timed out fetching ${url}`)));
});

async function waitFor(check, timeoutMs, description) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  for (;;) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      if (error && error.fatal) throw error;
      lastError = error;
    }
    if (Date.now() >= deadline) {
      const detail = lastError ? ` (last error: ${lastError.message})` : '';
      throw new Error(`timed out after ${Math.round(timeoutMs / 1000)} s waiting for ${description}${detail}`);
    }
    await sleep(POLL_MS);
  }
}

class ManagedProcess {
  constructor(label, command, args) {
    this.label = label;
    this.stderr = '';
    this.spawnError = null;
    this.child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    this.exited = new Promise((resolve) => {
      this.child.once('exit', (code, signal) => resolve({ code, signal }));
      this.child.once('error', (error) => { this.spawnError = error; resolve({ code: null, signal: null }); });
    });
    this.child.stderr.on('data', (chunk) => { this.stderr = (this.stderr + chunk).slice(-6000); });
  }

  get alive() {
    return !this.spawnError && this.child.exitCode === null && this.child.signalCode === null;
  }

  // Throws a fatal error (not retried by waitFor) when the process died or never started.
  assertAlive() {
    if (this.alive) return;
    const reason = this.spawnError
      ? `could not start: ${this.spawnError.message}`
      : `exited with ${this.child.signalCode || `code ${this.child.exitCode}`}`;
    const error = new Error(`${this.label} ${reason}${this.stderr ? `\n${this.stderr.trim()}` : ''}`);
    error.fatal = true;
    throw error;
  }

  async stop() {
    if (!this.alive) return;
    this.child.kill('SIGTERM');
    const graceful = await Promise.race([this.exited, sleep(5000).then(() => null)]);
    if (!graceful) {
      this.child.kill('SIGKILL');
      await Promise.race([this.exited, sleep(2000)]);
    }
  }
}

class DevTools {
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error(`could not connect to ${url}`)), { once: true });
    });
    return new DevTools(socket);
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', (event) => this.receive(String(event.data)));
    socket.addEventListener('close', () => this.rejectPending(new Error('DevTools connection closed')));
    socket.addEventListener('error', () => this.rejectPending(new Error('DevTools connection error')));
  }

  receive(raw) {
    const message = JSON.parse(raw);
    if (message.id !== undefined && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message || 'DevTools error'} (code ${message.error.code})`));
      else resolve(message.result);
    } else if (message.method) {
      this.events.push(message);
    }
  }

  rejectPending(error) {
    for (const { reject } of this.pending.values()) reject(error);
    this.pending.clear();
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    }
    return result.value;
  }

  close() {
    try { this.socket.close(); } catch { /* already closed */ }
  }
}

function describeEvent(event) {
  if (event.method === 'Runtime.exceptionThrown') {
    const details = event.params.exceptionDetails;
    const description = details.exception?.description || details.text || 'unknown exception';
    return `uncaught exception: ${description.split('\n')[0]}`;
  }
  if (event.method === 'Runtime.consoleAPICalled' && ['error', 'assert', 'warning'].includes(event.params.type)) {
    const text = event.params.args
      .map((arg) => (arg.value !== undefined ? String(arg.value) : arg.description || arg.type))
      .join(' ');
    return `console.${event.params.type}: ${text}`;
  }
  return null;
}

async function runPage(devtools, baseUrl, page, timeoutMs) {
  const { completeKey } = PAGES[page];
  const url = `${baseUrl}/${page}`;
  devtools.events.length = 0;
  const startedAt = Date.now();
  const navigation = await devtools.send('Page.navigate', { url });
  if (navigation.errorText) throw new Error(`navigation to ${url} failed: ${navigation.errorText}`);
  let completed = true;
  try {
    await waitFor(
      () => devtools.evaluate(`document.body?.dataset?.${completeKey} === 'true'`),
      timeoutMs,
      `document.body.dataset.${completeKey} on ${page}`,
    );
  } catch (error) {
    if (error.fatal) throw error;
    completed = false;
  }
  let failures = null;
  try {
    failures = JSON.parse(await devtools.evaluate(
      'JSON.stringify(Array.isArray(window.__assertFailures) ? window.__assertFailures : null)',
    ));
  } catch {
    // The page is unusable; failures stays null and is reported below.
  }
  const notes = devtools.events.map(describeEvent).filter(Boolean);
  return { page, completeKey, completed, failures, notes, seconds: ((Date.now() - startedAt) / 1000).toFixed(1) };
}

const annotation = (text) => text.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');

function report(result, timeoutSeconds) {
  const failures = Array.isArray(result.failures) ? result.failures : [];
  const ok = result.completed && Array.isArray(result.failures) && failures.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${result.page} (${result.seconds} s, ${failures.length} assertion failure${failures.length === 1 ? '' : 's'})`);
  const problems = [...failures];
  if (!result.completed) problems.push(`the page did not set document.body.dataset.${result.completeKey} within ${timeoutSeconds} s`);
  if (!Array.isArray(result.failures)) problems.push('window.__assertFailures is missing; did the page load at all?');
  for (const problem of problems) console.log(`  FAILED: ${problem}`);
  for (const note of result.notes) console.log(`  ${note}`);
  if (!ok && process.env.GITHUB_ACTIONS === 'true') {
    for (const problem of problems) console.log(`::error file=${result.page}::${annotation(problem)}`);
  }
  return ok;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (typeof WebSocket !== 'function') fail(`Node ${process.versions.node} has no global WebSocket; use Node 22 or newer`);
  if (!fs.existsSync(path.join(ROOT, 'EgelTools.user.js'))) fail(`${path.join(ROOT, 'EgelTools.user.js')} is missing; the smoke pages load ../EgelTools.user.js`);
  for (const page of options.pages) {
    if (!fs.existsSync(path.join(ROOT, page))) fail(`${path.join(ROOT, page)} is missing`);
  }
  const chromeBinary = findChrome(options.chrome);
  const extraChromeArgs = (process.env.EGELTOOLS_CHROME_ARGS || '').split(/\s+/).filter(Boolean);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'egeltools-smoke-'));
  const processes = [];
  let devtools = null;
  const cleanup = async () => {
    if (devtools) devtools.close();
    for (const managed of processes.reverse()) await managed.stop();
    processes.length = 0;
    fs.rmSync(userDataDir, { recursive: true, force: true });
  };
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => { cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143)); });
  }

  let allPassed = false;
  try {
    const httpPort = await freePort();
    const baseUrl = `http://127.0.0.1:${httpPort}`;
    const server = new ManagedProcess(
      'python3 -m http.server',
      process.platform === 'win32' ? 'python' : 'python3',
      ['-m', 'http.server', String(httpPort), '--bind', '127.0.0.1', '--directory', ROOT],
    );
    processes.push(server);
    await waitFor(async () => {
      server.assertAlive();
      return (await httpGet(`${baseUrl}/${options.pages[0]}`)).status === 200;
    }, 20000, `the HTTP server on ${baseUrl}`);

    const chrome = new ManagedProcess('Chrome', chromeBinary, [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--window-size=1280,900',
      ...extraChromeArgs,
      'about:blank',
    ]);
    processes.push(chrome);
    const devToolsPort = await waitFor(() => {
      chrome.assertAlive();
      const portFile = path.join(userDataDir, 'DevToolsActivePort');
      if (!fs.existsSync(portFile)) return 0;
      return Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]) || 0;
    }, 30000, 'Chrome to open its DevTools port');
    const version = JSON.parse((await httpGet(`http://127.0.0.1:${devToolsPort}/json/version`)).body);
    console.log(`${version.Browser} via ${chromeBinary}; Node ${process.versions.node}; serving ${ROOT} at ${baseUrl}`);
    const target = await waitFor(async () => {
      chrome.assertAlive();
      const targets = JSON.parse((await httpGet(`http://127.0.0.1:${devToolsPort}/json/list`)).body);
      return targets.find((candidate) => candidate.type === 'page' && candidate.webSocketDebuggerUrl) || null;
    }, 30000, 'a Chrome page target');
    devtools = await DevTools.connect(target.webSocketDebuggerUrl);
    await devtools.send('Runtime.enable');
    await devtools.send('Page.enable');

    const results = [];
    for (const page of options.pages) {
      results.push(report(await runPage(devtools, baseUrl, page, options.timeoutSeconds * 1000), options.timeoutSeconds));
    }
    allPassed = results.every(Boolean);
    const failedCount = results.filter((ok) => !ok).length;
    console.log(allPassed
      ? `All ${results.length} smoke page${results.length === 1 ? '' : 's'} passed.`
      : `${failedCount} of ${results.length} smoke page${results.length === 1 ? '' : 's'} failed.`);
  } catch (error) {
    console.error(`run-smoke-tests: ${error.message}`);
    for (const managed of processes) {
      if (managed.stderr.trim()) console.error(`--- ${managed.label} stderr ---\n${managed.stderr.trim()}`);
    }
  } finally {
    await cleanup();
  }
  process.exitCode = allPassed ? 0 : 1;
  // Nothing should keep the event loop alive now; the unref'd timer only guards against a stray handle.
  setTimeout(() => process.exit(process.exitCode), 2000).unref();
}

main();
