'use strict';

window.ConfirmationFlow = class ConfirmationFlow {
  #state = 'PROGRAMMING';
  #program = null;
  #run = null;
  #requestKey = null;
  #message = '';
  constructor({ draft, challenge, robot, api, onChange = () => {}, createKey = () => crypto.randomUUID() }) {
    this.draft = draft;
    this.challenge = challenge;
    this.robot = robot;
    this.api = api;
    this.onChange = onChange;
    this.createKey = createKey;
  }
  get state() { return this.#state; }
  get message() { return this.#message; }
  get program() { return this.#program; }
  get run() { return this.#run; }
  #notify(state, message) {
    this.#state = state;
    this.#message = message;
    this.onChange();
  }
  async confirm() {
    if (this.#state !== 'PROGRAMMING' || this.draft.commands.length === 0) return false;
    // A chave é gerada antes de bloquear: falhar aqui não pode prender o editor.
    try { this.#requestKey = this.createKey(); }
    catch { this.#notify('PROGRAMMING', 'Não foi possível iniciar a confirmação. Use localhost ou HTTPS.'); return false; }
    if (!this.draft.beginConfirmation()) return false;
    return this.#save();
  }
  async #save() {
    this.#notify('CONFIRMING', 'Validando e salvando o programa…');
    try {
      const result = await this.api.confirm({
        challengeId: this.challenge.id, challengeVersion: this.challenge.version,
        commands: this.draft.commands, requestKey: this.#requestKey,
      });
      this.#accept(result);
    } catch (error) {
      if (error.status === 422) {
        this.draft.rejectConfirmation();
        this.#notify('PROGRAMMING', error.message);
      } else {
        // Uma resposta perdida pode ter sido salva. Preservar a chave e os
        // comandos permite repetir com segurança sem criar outro programa.
        this.#notify('ERROR', error.message);
      }
      return false;
    }
    return this.#load();
  }
  #accept(result) {
    window.validateConfirmedProgram(result.program, this.challenge);
    if (!result.run || !/^[a-f0-9]{32}$/.test(result.run.id) || result.run.robotId !== this.robot.id) {
      throw new Error('Tentativa ou robô inválido. Recarregue a página.');
    }
    this.draft.restore(result.program, this.challenge);
    this.#program = Object.freeze({ ...result.program, commands: Object.freeze([...result.program.commands]) });
    this.#run = Object.freeze({ ...result.run });
  }
  async restore(result) {
    if (this.#state !== 'PROGRAMMING') return false;
    this.#accept(result);
    // READY salvo não significa que este novo simulador já esteja carregado.
    return this.#load();
  }
  async #load() {
    this.#notify('LOADING', 'Programa salvo e bloqueado. Carregando no robô virtual…');
    try {
      const receipt = await this.robot.load(this.#program, this.challenge);
      if (receipt.programId !== this.#program.id || receipt.commandCount !== this.#program.commands.length) {
        throw new Error('O robô não confirmou todos os comandos. Tente carregar novamente.');
      }
      const result = await this.api.loaded({ runId: this.#run.id, ...receipt });
      if (result.program?.id !== this.#program.id || result.run?.id !== this.#run.id || result.run.status !== 'READY_TO_START') {
        throw new Error('O servidor ainda não confirmou o carregamento. Tente novamente.');
      }
      this.#run = Object.freeze({ ...result.run });
      this.#notify('READY_TO_START', `${this.#program.commands.length} comandos carregados. O robô está pronto e continua na posição inicial.`);
      return true;
    } catch (error) {
      this.#notify('ERROR', error.message);
      return false;
    }
  }
  async retry() {
    if (this.#state !== 'ERROR') return false;
    return this.#program ? this.#load() : this.#save();
  }
};
