@echo off
setlocal
cd /d "%~dp0"
if defined PHP_BIN (set "ARCADE_PHP=%PHP_BIN%") else (set "ARCADE_PHP=C:\xampp\php\php.exe")
if not exist "%ARCADE_PHP%" (
    echo PHP nao encontrado. Instale o XAMPP ou configure PHP_BIN.
    pause
    exit /b 1
)
"%ARCADE_PHP%" database/setup.php --create-database
if errorlevel 1 (
    echo Ative o MySQL no XAMPP e confira config/local.php.
    pause
    exit /b 1
)
if not exist "work\sessions" mkdir "work\sessions"
echo Abra http://127.0.0.1:8088 no navegador.
echo Mantenha esta janela aberta. Use Ctrl+C para encerrar.
"%ARCADE_PHP%" -d "session.save_path=%~dp0work\sessions" -d display_errors=0 -S 127.0.0.1:8088 -t public
if errorlevel 1 pause
