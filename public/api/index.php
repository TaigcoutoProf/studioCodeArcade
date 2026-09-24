<?php
declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

try {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    $methods = ['bootstrap' => 'GET', 'confirm' => 'POST', 'loaded' => 'POST'];
    if (!isset($methods[$action])) reply(404, ['error' => 'Rota não encontrada.']);
    if ($method !== $methods[$action]) {
        header('Allow: ' . $methods[$action]);
        reply(405, ['error' => 'Método não permitido.']);
    }
    ini_set('session.use_strict_mode', '1');
    session_name('studio_arcade_session');
    session_set_cookie_params([
        'httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Strict', 'path' => '/',
    ]);
    if (!session_start()) throw new RuntimeException('Sessão indisponível.');
    $_SESSION['owner'] ??= bin2hex(random_bytes(32));
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
    $owner = $_SESSION['owner'];
    $csrf = $_SESSION['csrf'];
    session_write_close();

    if ($method === 'POST') {
        if (!hash_equals($csrf, $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) reply(403, ['error' => 'Sessão inválida ou expirada. Recarregue a página.']);
        if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
            reply(415, ['error' => 'Envie o programa em JSON.']);
        }
        $raw = file_get_contents('php://input', false, null, 0, 8193);
        if (strlen($raw) > 8192) reply(413, ['error' => 'Programa muito grande.']);
        try { $decoded = json_decode($raw, false, 32, JSON_THROW_ON_ERROR); }
        catch (JsonException $error) { reply(400, ['error' => 'JSON inválido.']); }
        if (!$decoded instanceof stdClass) reply(400, ['error' => 'Informe um objeto JSON.']);
        // Preservar a distinção entre um array de comandos e um objeto com
        // chaves numéricas; decodificação associativa apagaria essa distinção.
        $input = get_object_vars($decoded);
    }

    $config = require __DIR__ . '/../../config/database.php';
    $repository = new GameRepository(Database::connect($config));
    $service = new ConfirmationService($repository);
    if ($action === 'bootstrap') {
        $challenge = $repository->challenge();
        reply(200, ['challenge' => $challenge, 'csrfToken' => $csrf, 'latest' => $repository->latest($owner, $challenge)]);
    }
    if ($action === 'confirm') reply(200, $service->confirm($owner, $input));
    reply(200, $service->loaded($owner, $input));
} catch (InvalidArgumentException $error) {
    reply(422, ['error' => $error->getMessage()]);
} catch (OutOfBoundsException $error) {
    reply(404, ['error' => $error->getMessage()]);
} catch (DomainException $error) {
    reply(409, ['error' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('[StudioArcade] ' . $error->getMessage());
    reply(503, ['error' => 'Não foi possível acessar o servidor ou banco. Verifique a configuração e tente novamente.']);
}
