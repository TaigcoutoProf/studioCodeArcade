'use strict';
(() => {
  const maxCommands = window.StudioArcade.challenge.maxCommands;
  const draft = new window.ProgramDraft(maxCommands);
  const labels = { FORWARD: 'Avançar', BACKWARD: 'Recuar', TURN_LEFT: 'Virar à esquerda', TURN_RIGHT: 'Virar à direita' };
  const icons = { FORWARD: '↑', BACKWARD: '↓', TURN_LEFT: '↶', TURN_RIGHT: '↷' };
  const list = document.getElementById('program-list');
  const empty = document.getElementById('empty-program');
  const count = document.getElementById('command-count');
  const feedback = document.getElementById('editor-feedback');
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
    const commands = draft.commands;
    list.replaceChildren();
    empty.hidden = commands.length > 0;
    count.textContent = `${commands.length} / ${maxCommands}`;
    count.setAttribute('aria-label', `${commands.length} de ${maxCommands} comandos`);
    palette.forEach(button => { button.disabled = draft.isFull; });
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
        actionButton('↑', 'up', index, `Subir comando ${index + 1}: ${labels[command]}`, index === 0),
        actionButton('↓', 'down', index, `Descer comando ${index + 1}: ${labels[command]}`, index === commands.length - 1),
        actionButton('×', 'remove', index, `Remover comando ${index + 1}: ${labels[command]}`, false)
      );
      item.append(number, name, actions);
      list.append(item);
    });
  }
  palette.forEach(button => button.addEventListener('click', () => {
    const command = button.dataset.command;
    if (!draft.add(command)) return;
    render();
    feedback.textContent = draft.isFull
      ? `Limite de ${maxCommands} comandos atingido. Remova um comando para adicionar outro.`
      : `${labels[command]} adicionado na posição ${draft.commands.length}.`;
    if (draft.isFull) list.lastElementChild.querySelector('[data-action="remove"]').focus();
  }));
  list.addEventListener('click', event => {
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
  render();
})();
