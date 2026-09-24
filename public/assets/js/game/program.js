'use strict';
// Rascunho independente do DOM e do robô. Editar nunca executa comandos.
window.ProgramDraft = class ProgramDraft {
  #commands = [];
  #maxCommands;
  #status = 'DRAFT';
  constructor(maxCommands) {
    if (!Number.isInteger(maxCommands) || maxCommands < 1) throw new RangeError('Limite inválido.');
    this.#maxCommands = maxCommands;
  }
  get status() { return this.#status; }
  get commands() { return [...this.#commands]; }
  get isFull() { return this.#commands.length >= this.#maxCommands; }
  add(command) {
    if (this.#status !== 'DRAFT') return false;
    if (!['FORWARD', 'BACKWARD', 'TURN_LEFT', 'TURN_RIGHT'].includes(command)) throw new TypeError('Comando desconhecido.');
    if (this.isFull) return false;
    this.#commands.push(command);
    return true;
  }
  remove(index) {
    if (this.#status !== 'DRAFT') return false;
    if (!this.#hasIndex(index)) return false;
    this.#commands.splice(index, 1);
    return true;
  }
  move(index, offset) {
    if (this.#status !== 'DRAFT') return false;
    if (![-1, 1].includes(offset)) return false;
    const destination = index + offset;
    if (!this.#hasIndex(index) || !this.#hasIndex(destination)) return false;
    [this.#commands[index], this.#commands[destination]] = [this.#commands[destination], this.#commands[index]];
    return true;
  }
  #hasIndex(index) {
    return Number.isInteger(index) && index >= 0 && index < this.#commands.length;
  }
  beginConfirmation() {
    if (this.#status !== 'DRAFT' || this.#commands.length === 0) return false;
    this.#status = 'CONFIRMING';
    return true;
  }
  rejectConfirmation() {
    if (this.#status === 'CONFIRMING') this.#status = 'DRAFT';
  }
  restore(program, challenge) {
    window.validateConfirmedProgram(program, challenge);
    this.#commands = [...program.commands];
    this.#status = 'CONFIRMED';
  }
};

window.validateConfirmedProgram = function (program, challenge) {
  if (!program || program.status !== 'CONFIRMED' || typeof program.id !== 'string' ||
      !/^[a-f0-9]{32}$/.test(program.id) || program.challengeId !== challenge.id ||
      program.challengeVersion !== challenge.version || !Array.isArray(program.commands) ||
      program.commands.length < 1 || program.commands.length > challenge.maxCommands ||
      Array.from(program.commands).some(command => !['FORWARD', 'BACKWARD', 'TURN_LEFT', 'TURN_RIGHT'].includes(command))) {
    throw new Error('O programa recebido não corresponde a este desafio. Recarregue a página.');
  }
};
