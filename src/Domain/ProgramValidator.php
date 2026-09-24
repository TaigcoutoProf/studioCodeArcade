<?php
declare(strict_types=1);

final class ProgramValidator
{
    public static function validate(array $input, array $challenge): array
    {
        if (($input['challengeId'] ?? null) !== $challenge['id'] ||
            ($input['challengeVersion'] ?? null) !== $challenge['version']) {
            throw new InvalidArgumentException('O desafio mudou. Recarregue a página antes de confirmar.');
        }
        $commands = $input['commands'] ?? null;
        if (!is_array($commands) || !array_is_list($commands) || count($commands) < 1 ||
            count($commands) > $challenge['maxCommands']) {
            throw new InvalidArgumentException('Informe entre 1 e ' . $challenge['maxCommands'] . ' comandos.');
        }
        foreach ($commands as $command) {
            if (!in_array($command, ['FORWARD', 'BACKWARD', 'TURN_LEFT', 'TURN_RIGHT'], true)) {
                throw new InvalidArgumentException('O algoritmo contém um comando desconhecido.');
            }
        }
        $key = $input['requestKey'] ?? null;
        if (!is_string($key) || !preg_match('/^[a-zA-Z0-9-]{16,80}$/', $key)) {
            throw new InvalidArgumentException('Identificador da confirmação inválido.');
        }
        // A correção do caminho será avaliada na execução, não na confirmação.
        return $commands;
    }
}
