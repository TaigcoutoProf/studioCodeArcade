'use strict';
// Dados do desafio independentes da apresentação. Coordenadas começam em zero.
window.StudioArcade = Object.freeze({
  challenge: Object.freeze({
    id: 'challenge-001', version: 1,
    grid: Object.freeze({ width: 5, height: 3 }),
    start: Object.freeze({ x: 0, y: 0, direction: 'EAST' }),
    goal: Object.freeze({ x: 4, y: 2 }),
    obstacles: Object.freeze([
      Object.freeze({ x: 3, y: 0 }), Object.freeze({ x: 1, y: 1 }),
      Object.freeze({ x: 3, y: 1 }), Object.freeze({ x: 1, y: 2 })
    ]),
    maxCommands: 30
  })
});
