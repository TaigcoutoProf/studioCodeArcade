const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
for (const file of ['game/challenge.js', 'game/program.js', 'robot/virtual-robot.js', 'game/confirmation.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/assets/js', file), 'utf8'), context);
}
const { ProgramDraft, VirtualRobot, ConfirmationFlow, StudioArcade } = context.window;
const challenge = StudioArcade.challenge;
const program = { id: 'a'.repeat(32), challengeId: challenge.id, challengeVersion: 1,
  status: 'CONFIRMED', commands: ['FORWARD', 'TURN_RIGHT'], confirmedAt: '2026-09-24T12:00:00Z' };
const result = { program, run: { id: 'b'.repeat(32), robotId: 'BOT-001', status: 'LOADING' } };
const ready = { ...result, run: { ...result.run, status: 'READY_TO_START' } };
function create(overrides = {}) {
  const draft = new ProgramDraft(30);
  program.commands.forEach(command => draft.add(command));
  const robot = new VirtualRobot('BOT-001', challenge);
  const api = { async confirm() { return result; }, async loaded() { return ready; }, ...overrides.api };
  const states = [];
  const flow = new ConfirmationFlow({ draft, challenge, robot, api, createKey: () => 'test-key-1234567890',
    onChange: () => states.push(flow.state), ...overrides });
  return { draft, robot, api, flow, states };
}

test('confirmação salva, bloqueia e carrega sem movimentar o robô', async () => {
  const { flow, draft, robot, states } = create();
  assert.equal(await flow.confirm(), true);
  assert.deepEqual(states, ['CONFIRMING', 'LOADING', 'READY_TO_START']);
  assert.equal(draft.status, 'CONFIRMED');
  assert.equal(draft.add('BACKWARD'), false);
  assert.equal(draft.remove(0), false);
  assert.equal(draft.move(0, 1), false);
  assert.equal(robot.status, 'READY');
  assert.equal(robot.position.x, 0); assert.equal(robot.position.direction, 'EAST');
  assert(Object.isFrozen(robot.program.commands));
  assert.equal(await flow.confirm(), false);
});

test('cliques simultâneos salvam uma vez e edição fica bloqueada durante o envio', async () => {
  let release; let calls = 0;
  const { flow, draft } = create({ api: {
    confirm() { calls++; return new Promise(resolve => { release = resolve; }); },
    async loaded() { return ready; },
  } });
  const pending = flow.confirm();
  assert.equal(await flow.confirm(), false);
  assert.equal(calls, 1); assert.equal(draft.add('BACKWARD'), false);
  release(result); await pending;
  assert.equal(flow.state, 'READY_TO_START');
});

test('sem recibo do servidor, não fica pronto', async () => {
  let release;
  const { flow } = create({ api: { async confirm() { return result; }, loaded() { return new Promise(resolve => { release = resolve; }); } } });
  const pending = flow.confirm();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(flow.state, 'LOADING');
  release(ready); await pending;
  assert.equal(flow.state, 'READY_TO_START');
});

test('falha de conexão mantém chave e algoritmo para repetição idempotente', async () => {
  const requests = [];
  const { flow, draft } = create({ api: {
    async confirm(input) { requests.push(input); if (requests.length === 1) throw new Error('Rede'); return result; },
    async loaded() { return ready; },
  } });
  assert.equal(await flow.confirm(), false);
  assert.equal(flow.state, 'ERROR'); assert.equal(draft.remove(0), false);
  assert.equal(await flow.retry(), true);
  assert.equal(requests[0].requestKey, requests[1].requestKey);
  assert.deepEqual(Array.from(requests[0].commands), Array.from(requests[1].commands));
});

test('validação recusada devolve o rascunho à edição', async () => {
  const { flow, draft } = create({ api: { async confirm() { const error = new Error('Inválido'); error.status = 422; throw error; } } });
  assert.equal(await flow.confirm(), false);
  assert.equal(flow.state, 'PROGRAMMING'); assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.remove(0), true);
});

test('falha no carregamento preserva programa confirmado e permite nova carga', async () => {
  let saves = 0; let loads = 0;
  const robot = { id: 'BOT-001', async load() {
    if (++loads === 1) throw new Error('Carregamento falhou');
    return { programId: program.id, commandCount: program.commands.length };
  } };
  const { flow, draft } = create({ robot, api: { async confirm() { saves++; return result; }, async loaded() { return ready; } } });
  assert.equal(await flow.confirm(), false);
  assert.equal(draft.status, 'CONFIRMED'); assert.equal(flow.state, 'ERROR');
  assert.equal(await flow.retry(), true); assert.equal(saves, 1); assert.equal(loads, 2);
});

test('recibo incompleto ou de outro programa nunca libera prontidão', async () => {
  for (const receipt of [{ programId: program.id, commandCount: 1 }, { programId: 'c'.repeat(32), commandCount: 2 }]) {
    let notified = false;
    const { flow } = create({ robot: { id: 'BOT-001', async load() { return receipt; } },
      api: { async confirm() { return result; }, async loaded() { notified = true; } } });
    assert.equal(await flow.confirm(), false);
    assert.equal(flow.state, 'ERROR'); assert.equal(notified, false);
  }
});

test('recuperar tentativa pronta recarrega o novo simulador antes de ficar pronto', async () => {
  const { flow, robot, states } = create();
  assert.equal(await flow.restore(ready), true);
  assert.deepEqual(states, ['LOADING', 'READY_TO_START']);
  assert.equal(robot.program.id, program.id);
});

test('programa vazio não é enviado e robô rejeita comandos inválidos', async () => {
  const { flow, draft, robot } = create();
  draft.remove(1); draft.remove(0);
  assert.equal(await flow.confirm(), false); assert.equal(flow.state, 'PROGRAMMING');
  await assert.rejects(robot.load({ ...program, commands: ['MOTOR_ON'] }, challenge));
  assert.equal(robot.status, 'ERROR'); assert.equal(robot.program, null);
});

test('falha ao gerar chave não bloqueia a edição', async () => {
  const { flow, draft } = create({ createKey() { throw new Error('Crypto indisponível'); } });
  assert.equal(await flow.confirm(), false);
  assert.equal(draft.status, 'DRAFT');
});
