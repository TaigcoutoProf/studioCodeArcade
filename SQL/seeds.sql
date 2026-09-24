INSERT IGNORE INTO challenges (id, version, definition_json) VALUES (
    'challenge-001', 1,
    '{"id":"challenge-001","version":1,"grid":{"width":5,"height":3},"start":{"x":0,"y":0,"direction":"EAST"},"goal":{"x":4,"y":2},"obstacles":[{"x":3,"y":0},{"x":1,"y":1},{"x":3,"y":1},{"x":1,"y":2}],"maxCommands":30}'
);
