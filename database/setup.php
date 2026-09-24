<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../src/bootstrap.php';
$config = require __DIR__ . '/../config/database.php';
try {
    if (in_array('--create-database', $argv, true)) {
        $pdo = Database::connect($config, false);
        $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . $config['name'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }
    $pdo = Database::connect($config);
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    foreach (explode(';', $schema) as $statement) {
        if (trim($statement) !== '') $pdo->exec($statement);
    }
    echo 'Banco preparado: ' . $config['name'] . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, 'Não foi possível preparar o banco: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}
