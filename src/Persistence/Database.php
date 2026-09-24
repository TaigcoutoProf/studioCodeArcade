<?php
declare(strict_types=1);

final class Database
{
    public static function connect(array $config, bool $selectDatabase = true): PDO
    {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $config['name'])) {
            throw new InvalidArgumentException('Nome de banco inválido.');
        }
        $dsn = 'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';charset=utf8mb4';
        if ($selectDatabase) $dsn .= ';dbname=' . $config['name'];
        return new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
}
