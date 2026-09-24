'use strict';

// Contrato mínimo do executor: carregar uma cópia completa e devolver recibo.
// O milestone 3 não executa movimentos.
window.VirtualRobot = class VirtualRobot {
  #status = 'AVAILABLE';
  #program = null;
  #position;
  constructor(id, challenge) {
    this.id = id;
    this.#position = Object.freeze({ ...challenge.start });
  }
  get status() { return this.#status; }
  get program() { return this.#program; }
  get position() { return { ...this.#position }; }
  async load(program, challenge) {
    try {
      window.validateConfirmedProgram(program, challenge);
      this.#program = Object.freeze({ ...program, commands: Object.freeze([...program.commands]) });
      this.#position = Object.freeze({ ...challenge.start });
      this.#status = 'READY';
      return Object.freeze({ programId: program.id, commandCount: program.commands.length });
    } catch (error) {
      this.#program = null;
      this.#status = 'ERROR';
      throw error;
    }
  }
};
