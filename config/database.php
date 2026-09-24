<?php
declare(strict_types=1);

// Valores locais do XAMPP. Em produção, configure variáveis de ambiente
// ou copie local.example.php para local.php (ignorado pelo Git).
$config = [
    'host' => getenv('DB_HOST') ?: '127.0.0.1',
    'port' => getenv('DB_PORT') ?: '3306',
    'name' => getenv('DB_NAME') ?: 'studio_code_arcade',
    'user' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '',
];
if (is_file(__DIR__ . '/local.php')) {
    $config = array_replace($config, require __DIR__ . '/local.php');
}
// Ambiente explícito tem precedência, inclusive para isolar o banco dos testes.
foreach (['host' => 'DB_HOST', 'port' => 'DB_PORT', 'name' => 'DB_NAME', 'user' => 'DB_USER', 'password' => 'DB_PASSWORD'] as $key => $variable) {
    if (getenv($variable) !== false) $config[$key] = getenv($variable);
}
return $config;
