'use strict';
// Rascunho independente do DOM e do robô. Editar nunca executa comandos.
window.ProgramDraft = class ProgramDraft {
  #commands = [];
  #maxCommands;
  constructor(maxCommands) {
    if (!Number.isInteger(maxCommands) || maxCommands < 1) throw new RangeError('Limite inválido.');
    this.#maxCommands = maxCommands;
  }
  get status() { return 'DRAFT'; }
  get commands() { return [...this.#commands]; }
  get isFull() { return this.#commands.length >= this.#maxCommands; }
  add(command) {
    if (!['FORWARD', 'BACKWARD', 'TURN_LEFT', 'TURN_RIGHT'].includes(command)) throw new TypeError('Comando desconhecido.');
    if (this.isFull) return false;
    this.#commands.push(command);
    return true;
  }
  remove(index) {
    if (!this.#hasIndex(index)) return false;
    this.#commands.splice(index, 1);
    return true;
  }
  move(index, offset) {
    if (![-1, 1].includes(offset)) return false;
    const destination = index + offset;
    if (!this.#hasIndex(index) || !this.#hasIndex(destination)) return false;
    [this.#commands[index], this.#commands[destination]] = [this.#commands[destination], this.#commands[index]];
    return true;
  }
  #hasIndex(index) {
    return Number.isInteger(index) && index >= 0 && index < this.#commands.length;
  }
};
