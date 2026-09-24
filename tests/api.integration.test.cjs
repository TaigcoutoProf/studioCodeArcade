const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');

test('API real PHP + MySQL: confirmação, isolamento, validação, repetição e prontidão', { timeout: 40000 }, async () => {
  const root = path.join(__dirname, '..');
  const php = process.env.PHP_BIN || 'php';
  const dbName = 'studio_code_arcade_test_' + randomBytes(6).toString('hex');
  const env = { ...process.env, DB_NAME: dbName };
  const sessionPath = path.join(root, 'work', dbName);
  fs.mkdirSync(sessionPath, { recursive: true });
  let server;
  function phpRun(args) {
    const result = spawnSync(php, args, { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
    return result.stdout.trim();
  }
  try {
    phpRun(['database/setup.php', '--create-database']);
    const probe = net.createServer();
    probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    server = spawn(php, ['-d', `session.save_path=${sessionPath}`, '-d', 'display_errors=0', '-S', `127.0.0.1:${port}`, '-t', 'public'],
      { cwd: root, env, stdio: ['ignore', 'ignore', 'pipe'] });
    let serverLog = ''; server.stderr.on('data', chunk => { serverLog += chunk; });
    server.on('error', error => { serverLog += error.message; });
    const base = `http://127.0.0.1:${port}/api/index.php?action=`;
    let response;
    for (let attempt = 0; attempt < 80; attempt++) {
      try { response = await fetch(base + 'bootstrap'); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    assert(response, serverLog);
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const first = await response.json();
    assert.equal(first.latest, null);
    async function request(action, body, options = {}) {
      const res = await fetch(base + action, {
        method: body ? 'POST' : 'GET',
        headers: { Cookie: cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': first.csrfToken, ...options.headers },
        body: body ? JSON.stringify(body) : undefined, ...options,
      });
      return { status: res.status, data: await res.json() };
    }
    const input = { challengeId: first.challenge.id, challengeVersion: first.challenge.version,
      commands: ['FORWARD', 'TURN_RIGHT'], requestKey: 'test-request-1234567890' };
    for (const bad of [[], ['MOTOR_ON'], Array(31).fill('FORWARD'), { 0: 'FORWARD' }, ['FORWARD', 2]]) {
      assert.equal((await request('confirm', { ...input, commands: bad })).status, 422);
    }
    assert.equal((await request('confirm', { ...input, challengeVersion: 99 })).status, 422);
    assert.equal((await request('confirm', input, { headers: { Cookie: cookie, 'Content-Type': 'application/json' } })).status, 403);
    assert.equal((await request('confirm')).status, 405);
    assert.equal((await request('confirm', input, { method: 'PUT' })).status, 405);
    const confirmed = await request('confirm', input);
    assert.equal(confirmed.status, 200);
    assert.equal(confirmed.data.program.status, 'CONFIRMED');
    assert.equal(confirmed.data.run.status, 'LOADING');
    assert.deepEqual(confirmed.data.program.commands, input.commands);
    const repeats = await Promise.all([request('confirm', input), request('confirm', input)]);
    for (const repeat of repeats) assert.equal(repeat.data.program.id, confirmed.data.program.id);
    assert.equal((await request('confirm', { ...input, commands: ['BACKWARD'] })).status, 409);
    const boot = await request('bootstrap');
    assert.equal(boot.data.latest.program.id, confirmed.data.program.id);
    const receipt = { runId: confirmed.data.run.id, programId: confirmed.data.program.id, commandCount: 2 };
    assert.equal((await request('loaded', { ...receipt, commandCount: 1 })).status, 422);
    assert.equal((await request('loaded', { ...receipt, programId: 'c'.repeat(32) })).status, 422);
    assert.equal((await request('bootstrap')).data.latest.run.status, 'LOADING');
    const strangerResponse = await fetch(base + 'bootstrap');
    const strangerCookie = strangerResponse.headers.get('set-cookie').split(';')[0];
    const stranger = await strangerResponse.json();
    assert.equal(stranger.latest, null);
    assert.equal((await request('loaded', receipt, { headers: {
      Cookie: strangerCookie, 'Content-Type': 'application/json', 'X-CSRF-Token': stranger.csrfToken,
    } })).status, 404);
    assert.equal((await request('loaded', receipt)).data.run.status, 'READY_TO_START');
    assert.equal((await request('loaded', receipt)).status, 200);
    assert.equal((await request('bootstrap')).data.latest.run.status, 'READY_TO_START');
    const counts = phpRun(['-r', "require 'src/bootstrap.php'; $c=require 'config/database.php'; $p=Database::connect($c); echo $p->query('SELECT COUNT(*) FROM programs')->fetchColumn().':'.$p->query('SELECT COUNT(*) FROM runs')->fetchColumn();"]);
    assert.equal(counts, '1:1');
    // Arquivos internos nunca devem ser servidos com public/ como raiz.
    assert.equal((await fetch(`http://127.0.0.1:${port}/config/database.php`)).status, 404);
  } finally {
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit'); server.kill(); await exited;
    }
    // Só remover o banco efêmero criado por este teste, nunca o banco da aplicação.
    phpRun(['-r', "require 'src/bootstrap.php'; $c=require 'config/database.php'; if (!preg_match('/^studio_code_arcade_test_[a-f0-9]{12}$/', $c['name'])) exit(2); Database::connect($c,false)->exec('DROP DATABASE IF EXISTS `'.$c['name'].'`');"]);
  }
});
