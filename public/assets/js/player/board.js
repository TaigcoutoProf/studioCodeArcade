'use strict';
window.renderBoard = function (challenge) {
  const board = document.getElementById('board');
  board.replaceChildren();
  const arrows = { NORTH: '↑', EAST: '→', SOUTH: '↓', WEST: '←' };
  board.style.setProperty('--columns', challenge.grid.width);
  for (let y = 0; y < challenge.grid.height; y += 1) {
    for (let x = 0; x < challenge.grid.width; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('aria-hidden', 'true');
      if (challenge.obstacles.some(position => position.x === x && position.y === y)) {
        cell.classList.add('obstacle');
        cell.innerHTML = '<span class="wall">▧</span>';
      } else if (challenge.start.x === x && challenge.start.y === y) {
        cell.classList.add('start');
        const robot = document.createElement('span');
        robot.className = 'robot';
        robot.textContent = arrows[challenge.start.direction];
        cell.append(robot);
      } else if (challenge.goal.x === x && challenge.goal.y === y) {
        cell.classList.add('goal');
        cell.innerHTML = '<span class="target">◎</span>';
      } else {
        const marker = document.createElement('span');
        marker.className = 'coordinate';
        marker.textContent = `${x + 1} · ${y + 1}`;
        cell.append(marker);
      }
      board.append(cell);
    }
  }
};
window.renderBoard(window.StudioArcade.challenge);
