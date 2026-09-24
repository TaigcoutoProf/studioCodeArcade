<?php
declare(strict_types=1);

final class ConfirmationService
{
    public function __construct(private GameRepository $repository) {}

    public function confirm(string $owner, array $input): array
    {
        $challenge = $this->repository->challenge();
        $commands = ProgramValidator::validate($input, $challenge);
        $result = $this->repository->byRequest($owner, $input['requestKey'])
            ?? $this->repository->save($owner, $input['requestKey'], $challenge, $commands);
        if ($result['program']['commands'] !== $commands ||
            $result['program']['challengeId'] !== $challenge['id'] ||
            $result['program']['challengeVersion'] !== $challenge['version']) {
            throw new DomainException('Essa confirmação já foi usada para outro algoritmo.');
        }
        return $result;
    }

    public function loaded(string $owner, array $input): array
    {
        $id = $input['runId'] ?? '';
        if (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/', $id)) throw new InvalidArgumentException('Tentativa inválida.');
        $result = $this->repository->byRun($owner, $id);
        if ($result === null) throw new OutOfBoundsException('Tentativa não encontrada nesta sessão.');
        if (($input['programId'] ?? null) !== $result['program']['id'] ||
            ($input['commandCount'] ?? null) !== count($result['program']['commands'])) {
            throw new InvalidArgumentException('O robô não confirmou o programa completo.');
        }
        return $this->repository->markLoaded($owner, $id);
    }
}
