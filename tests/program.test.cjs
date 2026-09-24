const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['challenge.js', 'program.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'public/assets/js/game', file), 'utf8'), context);
}
const Draft = context.window.ProgramDraft;
const snapshot = draft => Array.from(draft.commands);

test('montar, reorganizar e remover preserva a sequência desejada', () => {
  const draft = new Draft(30);
  for (const command of ['FORWARD', 'BACKWARD', 'TURN_LEFT', 'TURN_RIGHT']) assert.equal(draft.add(command), true);
  assert.equal(draft.move(3, -1), true);
  assert.equal(draft.move(0, 1), true);
  assert.equal(draft.remove(0), true);
  assert.deepEqual(snapshot(draft), ['FORWARD', 'TURN_RIGHT', 'TURN_LEFT']);
  assert.equal(draft.status, 'DRAFT');
});

test('limite de 30 comandos e recuperação após remoção', () => {
  const draft = new Draft(30);
  for (let i = 0; i < 30; i++) assert.equal(draft.add('FORWARD'), true);
  assert.equal(draft.isFull, true);
  assert.equal(draft.add('BACKWARD'), false);
  assert.equal(draft.commands.length, 30);
  draft.remove(14);
  assert.equal(draft.isFull, false);
  assert.equal(draft.add('TURN_RIGHT'), true);
  assert.equal(draft.commands[29], 'TURN_RIGHT');
});

test('limites da sequência e índices inválidos não alteram o rascunho', () => {
  const draft = new Draft(30);
  assert.equal(draft.remove(0), false);
  assert.equal(draft.move(0, 1), false);
  draft.add('FORWARD'); draft.add('BACKWARD');
  for (const [index, offset] of [[0,-1],[1,1],[-1,1],[0,2],[0,0],[0.5,1],['0',1]]) {
    assert.equal(draft.move(index, offset), false);
  }
  for (const index of [-1,2,NaN,0.5,'0']) assert.equal(draft.remove(index), false);
  assert.deepEqual(snapshot(draft), ['FORWARD','BACKWARD']);
});

test('comando inválido é rejeitado sem alterar o programa', () => {
  const draft = new Draft(30);
  for (const command of ['MOTOR_ON', '', null, undefined]) assert.throws(() => draft.add(command));
  assert.deepEqual(snapshot(draft), []);
  for (const limit of [0,-1,1.5,NaN,'30']) assert.throws(() => new Draft(limit));
});

test('cópias e rascunhos independentes não compartilham comandos', () => {
  const first = new Draft(30), second = new Draft(30);
  first.add('FORWARD');
  const copy = first.commands;
  copy[0] = 'BACKWARD'; copy.push('TURN_LEFT');
  assert.deepEqual(snapshot(first), ['FORWARD']);
  assert.deepEqual(snapshot(second), []);
  first.remove(0);
  assert.deepEqual(snapshot(first), []);
});

test('editar o programa preserva posição e orientação do desafio', () => {
  const challenge = context.window.StudioArcade.challenge;
  const before = JSON.stringify(challenge);
  const draft = new Draft(challenge.maxCommands);
  draft.add('FORWARD'); draft.add('TURN_LEFT'); draft.move(1,-1); draft.remove(0);
  assert.equal(JSON.stringify(challenge), before);
  assert.equal(challenge.start.x, 0);
  assert.equal(challenge.start.y, 0);
  assert.equal(challenge.start.direction, 'EAST');
});

test('recursos locais referenciados existem', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  for (const [, resource] of html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) {
    assert.equal(fs.existsSync(path.join(root, 'public', resource)), true, resource);
  }
});
