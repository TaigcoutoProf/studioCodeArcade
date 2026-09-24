CREATE TABLE IF NOT EXISTS challenges (
    id VARCHAR(64) NOT NULL,
    version INT UNSIGNED NOT NULL,
    definition_json JSON NOT NULL,
    PRIMARY KEY (id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS programs (
    id CHAR(32) NOT NULL PRIMARY KEY,
    owner_id CHAR(64) NOT NULL,
    request_key VARCHAR(80) NOT NULL,
    challenge_id VARCHAR(64) NOT NULL,
    challenge_version INT UNSIGNED NOT NULL,
    commands_json JSON NOT NULL,
    status ENUM('CONFIRMED') NOT NULL DEFAULT 'CONFIRMED',
    confirmed_at DATETIME(6) NOT NULL,
    UNIQUE KEY confirmation_once (owner_id, request_key),
    KEY owner_challenge (owner_id, challenge_id, challenge_version, confirmed_at),
    CONSTRAINT program_challenge FOREIGN KEY (challenge_id, challenge_version) REFERENCES challenges (id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS runs (
    id CHAR(32) NOT NULL PRIMARY KEY,
    program_id CHAR(32) NOT NULL,
    robot_id VARCHAR(32) NOT NULL,
    status ENUM('LOADING', 'READY_TO_START') NOT NULL DEFAULT 'LOADING',
    loaded_at DATETIME(6) NULL,
    UNIQUE KEY one_run_per_program (program_id),
    CONSTRAINT run_program FOREIGN KEY (program_id) REFERENCES programs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
