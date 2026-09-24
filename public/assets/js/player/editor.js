'use strict';
(() => {
  let maxCommands = window.StudioArcade.challenge.maxCommands;
  let draft = null;
  let flow = null;
  let booting = false;
  const api = new window.GameApi();
  const labels = { FORWARD: 'Avançar', BACKWARD: 'Recuar', TURN_LEFT: 'Virar à esquerda', TURN_RIGHT: 'Virar à direita' };
  const icons = { FORWARD: '↑', BACKWARD: '↓', TURN_LEFT: '↶', TURN_RIGHT: '↷' };
  const list = document.getElementById('program-list');
  const empty = document.getElementById('empty-program');
  const count = document.getElementById('command-count');
  const feedback = document.getElementById('editor-feedback');
  const confirmButton = document.getElementById('confirm-program');
  const retryButton = document.getElementById('retry-confirmation');
  const flowFeedback = document.getElementById('confirmation-feedback');
  const programStatus = document.getElementById('program-status');
  const robotStatus = document.getElementById('robot-status');
  const progress = document.getElementById('confirmation-progress');
  const summary = document.getElementById('confirmed-summary');
  const palette = [...document.querySelectorAll('[data-command]')];
  function actionButton(text, action, index, label, disabled) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `step-action ${action}`;
    button.textContent = text;
    button.dataset.action = action;
    button.dataset.index = index;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.disabled = disabled;
    return button;
  }
  function render() {
    if (!draft) return;
    const commands = draft.commands;
    const locked = flow.state !== 'PROGRAMMING' || draft.status !== 'DRAFT';
    list.replaceChildren();
    empty.hidden = commands.length > 0;
    count.textContent = `${commands.length} / ${maxCommands}`;
    count.setAttribute('aria-label', `${commands.length} de ${maxCommands} comandos`);
    palette.forEach(button => { button.disabled = locked || draft.isFull; });
    commands.forEach((command, index) => {
      const item = document.createElement('li');
      item.className = 'program-step';
      const number = document.createElement('span');
      number.className = 'step-number';
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'step-name';
      name.textContent = `${icons[command]} ${labels[command]}`;
      const actions = document.createElement('div');
      actions.className = 'step-actions';
      actions.append(
        actionButton('↑', 'up', index, `Subir comando ${index + 1}: ${labels[command]}`, locked || index === 0),
        actionButton('↓', 'down', index, `Descer comando ${index + 1}: ${labels[command]}`, locked || index === commands.length - 1),
        actionButton('×', 'remove', index, `Remover comando ${index + 1}: ${labels[command]}`, locked)
      );
      item.append(number, name, actions);
      list.append(item);
    });
    confirmButton.disabled = locked || commands.length === 0;
    confirmButton.hidden = draft.status === 'CONFIRMED';
    retryButton.hidden = flow.state !== 'ERROR';
    retryButton.disabled = false;
    retryButton.textContent = flow.program ? 'Tentar carregar novamente' : 'Tentar confirmar novamente';
    programStatus.textContent = { DRAFT: 'Rascunho', CONFIRMING: 'Confirmando', CONFIRMED: 'Bloqueado' }[draft.status];
    robotStatus.textContent = flow.state === 'READY_TO_START' ? 'Pronto' :
      flow.robot.status === 'ERROR' ? 'Falha no carregamento' :
      flow.robot.status === 'READY' ? 'Carregado · aguardando confirmação' : 'Aguardando programa';
    progress.textContent = {
      PROGRAMMING: '1. Montar algoritmo', CONFIRMING: '2. Validar e salvar',
      LOADING: '3. Carregar programa', READY_TO_START: '4. Pronto para a próxima etapa', ERROR: 'Ação pendente',
    }[flow.state];
    flowFeedback.textContent = flow.message || 'Confirme quando terminar. A sequência será salva e bloqueada para edição.';
    flowFeedback.classList.toggle('has-error', flow.state === 'ERROR');
    summary.hidden = !flow.program;
    if (flow.program) summary.textContent = `Programa ${flow.program.id.slice(0, 8)} · salvo no banco · ${commands.length} comandos`;
  }
  palette.forEach(button => button.addEventListener('click', () => {
    if (!draft || flow.state !== 'PROGRAMMING') return;
    const command = button.dataset.command;
    if (!draft.add(command)) return;
    render();
    feedback.textContent = draft.isFull
      ? `Limite de ${maxCommands} comandos atingido. Remova um comando para adicionar outro.`
      : `${labels[command]} adicionado na posição ${draft.commands.length}.`;
    if (draft.isFull) list.lastElementChild.querySelector('[data-action="remove"]').focus();
  }));
  list.addEventListener('click', event => {
    if (!draft || flow.state !== 'PROGRAMMING') return;
    const button = event.target.closest('button[data-action]');
    if (!button || !list.contains(button) || button.disabled) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    const label = labels[draft.commands[index]];
    let focusIndex = index;
    if (action === 'remove') {
      if (!draft.remove(index)) return;
      focusIndex = Math.min(index, draft.commands.length - 1);
      feedback.textContent = `${label} removido. ${draft.commands.length} comandos no rascunho.`;
    } else {
      const offset = action === 'up' ? -1 : 1;
      if (!draft.move(index, offset)) return;
      focusIndex = index + offset;
      feedback.textContent = `${label} movido para a posição ${focusIndex + 1}.`;
    }
    render();
    const row = list.children[focusIndex];
    if (!row) { palette[0].focus(); return; }
    const preferred = row.querySelector(`[data-action="${action}"]`);
    (preferred.disabled ? row.querySelector('button:not(:disabled)') : preferred).focus();
  });
  confirmButton.addEventListener('click', async () => {
    if (!flow) return;
    feedback.textContent = '';
    await flow.confirm();
    if (!retryButton.hidden) retryButton.focus();
    else flowFeedback.focus();
  });
  retryButton.addEventListener('click', async () => {
    if (!flow) { await boot(); return; }
    await flow.retry();
    if (retryButton.hidden) flowFeedback.focus();
  });
  async function boot() {
    if (booting) return;
    booting = true;
    palette.forEach(button => { button.disabled = true; });
    confirmButton.disabled = true;
    retryButton.hidden = true;
    progress.textContent = 'Conectando ao desafio…';
    try {
      const data = await api.bootstrap();
      maxCommands = data.challenge.maxCommands;
      draft = new window.ProgramDraft(maxCommands);
      const robot = new window.VirtualRobot('BOT-001', data.challenge);
      flow = new window.ConfirmationFlow({ draft, challenge: data.challenge, robot, api, onChange: render });
      window.renderBoard(data.challenge);
      if (data.latest) await flow.restore(data.latest);
      else render();
    } catch (error) {
      flow = null;
      draft = null;
      palette.forEach(button => { button.disabled = true; });
      confirmButton.disabled = true;
      flowFeedback.textContent = error.message;
      flowFeedback.classList.add('has-error');
      progress.textContent = 'Conexão indisponível';
      retryButton.hidden = false;
      retryButton.textContent = 'Reconectar';
    } finally { booting = false; }
  }
  boot();
})();
