<?php
declare(strict_types=1);

final class GameRepository
{
    public function __construct(private PDO $pdo) {}

    public function challenge(): array
    {
        $stmt = $this->pdo->prepare('SELECT definition_json FROM challenges WHERE id = ? ORDER BY version DESC LIMIT 1');
        $stmt->execute(['challenge-001']);
        $value = $stmt->fetchColumn();
        if ($value === false) throw new RuntimeException('Desafio não configurado.');
        return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
    }

    private function find(string $filter, array $values): ?array
    {
        $stmt = $this->pdo->prepare('SELECT p.*, r.id AS run_id, r.robot_id, r.status AS run_status
            FROM programs p JOIN runs r ON r.program_id = p.id WHERE ' . $filter . ' LIMIT 1');
        $stmt->execute($values);
        $row = $stmt->fetch();
        if (!$row) return null;
        return [
            'program' => [
                'id' => $row['id'], 'challengeId' => $row['challenge_id'],
                'challengeVersion' => (int) $row['challenge_version'], 'status' => $row['status'],
                'commands' => json_decode($row['commands_json'], true, 512, JSON_THROW_ON_ERROR),
                'confirmedAt' => str_replace(' ', 'T', $row['confirmed_at']) . 'Z',
            ],
            'run' => ['id' => $row['run_id'], 'robotId' => $row['robot_id'], 'status' => $row['run_status']],
        ];
    }

    public function latest(string $owner, array $challenge): ?array
    {
        return $this->find('p.owner_id = ? AND p.challenge_id = ? AND p.challenge_version = ? ORDER BY p.confirmed_at DESC',
            [$owner, $challenge['id'], $challenge['version']]);
    }

    public function byRequest(string $owner, string $key): ?array
    {
        return $this->find('p.owner_id = ? AND p.request_key = ?', [$owner, $key]);
    }

    public function byRun(string $owner, string $id): ?array
    {
        return $this->find('p.owner_id = ? AND r.id = ?', [$owner, $id]);
    }

    public function save(string $owner, string $key, array $challenge, array $commands): array
    {
        $programId = bin2hex(random_bytes(16));
        $runId = bin2hex(random_bytes(16));
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('INSERT INTO programs
                (id, owner_id, request_key, challenge_id, challenge_version, commands_json, confirmed_at)
                VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(6))');
            $stmt->execute([$programId, $owner, $key, $challenge['id'], $challenge['version'], json_encode($commands, JSON_THROW_ON_ERROR)]);
            $stmt = $this->pdo->prepare('INSERT INTO runs (id, program_id, robot_id) VALUES (?, ?, ?)');
            $stmt->execute([$runId, $programId, 'BOT-001']);
            $this->pdo->commit();
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            // A restrição única protege também contra duas requisições simultâneas.
            if ($error instanceof PDOException && (int) ($error->errorInfo[1] ?? 0) === 1062) {
                $existing = $this->byRequest($owner, $key);
                if ($existing !== null) return $existing;
            }
            throw $error;
        }
        return $this->byRun($owner, $runId);
    }

    public function markLoaded(string $owner, string $id): array
    {
        $stmt = $this->pdo->prepare("UPDATE runs r JOIN programs p ON p.id = r.program_id
            SET r.status = 'READY_TO_START', r.loaded_at = COALESCE(r.loaded_at, UTC_TIMESTAMP(6))
            WHERE r.id = ? AND p.owner_id = ?");
        $stmt->execute([$id, $owner]);
        return $this->byRun($owner, $id);
    }
}
