@echo off
chcp 65001 >nul
title INSTALADOR OFICIAL CENTRAL DGS - DIGITAL SUPPLY
color 0A

echo =======================================================================
echo               DIGITAL SUPPLY - COMUNIDADE OFICIAL DGS
echo                INSTALADOR AUTOMÁTICO - CENTRAL DGS v2.2.0
echo =======================================================================
echo.
echo Olá Aluno! Este assistente vai preparar a Central DGS no seu computador.
echo Tudo será configurado de forma 100%% automática dentro de C:\Central_DGS.
echo Um atalho oficial será criado na sua Área de Trabalho.
echo.

:: 1. Desbloqueia arquivos baixados da internet (remove restrições de zona Windows)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Recurse -ErrorAction SilentlyContinue | Unblock-File" >nul 2>&1

:: 2. Determina diretório de instalação
set "INSTALL_DIR=C:\Central_DGS"
mkdir "%INSTALL_DIR%" >nul 2>&1
if not exist "%INSTALL_DIR%" (
    set "INSTALL_DIR=%LOCALAPPDATA%\Central_DGS"
    mkdir "%INSTALL_DIR%" >nul 2>&1
)

echo [Destino da Instalação]: %INSTALL_DIR%
echo.

:: 3. Baixa e extrai o pacote Core da Central DGS
echo [1/5] Baixando arquivos essenciais da Central DGS v2.2.0...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$zip = Join-Path '%INSTALL_DIR%' 'temp_core.zip'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://digitalsupply.pro/downloads/Central_DGS_Core.zip', $zip); Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory($zip, '%INSTALL_DIR%'); Remove-Item $zip -Force -ErrorAction SilentlyContinue"

if not exist "%INSTALL_DIR%\run.py" (
    echo [!] Tentando baixar pacote de contingência...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$zip = Join-Path '%INSTALL_DIR%' 'temp_core.zip'; (New-Object Net.WebClient).DownloadFile('https://digitalsupply.pro/downloads/Central_DGS_Patch.zip', $zip); Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory($zip, '%INSTALL_DIR%'); Remove-Item $zip -Force -ErrorAction SilentlyContinue"
)

echo [+] Arquivos essenciais instalados em %INSTALL_DIR%!
echo.

:: 4. Verifica / Instala Python
echo [2/5] Verificando instalação do Python 3 no Windows...
set "PYTHON_CMD="
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
    goto :PYTHON_READY
)
py -3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py -3"
    goto :PYTHON_READY
)

echo [!] Python não encontrado. Instalando automaticamente pelo Windows Package Manager...
winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
    goto :PYTHON_READY
)

echo.
echo [ATENÇÃO] Por favor instale o Python 3.12 ou superior em:
echo https://www.python.org/downloads/
echo Lembre-se de marcar a opção: [X] "Add python.exe to PATH"
pause
exit /b 1

:PYTHON_READY
echo [+] Python pronto:
%PYTHON_CMD% --version
echo.

:: 5. Cria Ambiente Virtual .venv
echo [3/5] Criando ambiente virtual isolado (.venv)...
cd /d "%INSTALL_DIR%"
if not exist ".venv" (
    %PYTHON_CMD% -m venv .venv
)
set "ENV_PYTHON=%INSTALL_DIR%\.venv\Scripts\python.exe"
if not exist "%ENV_PYTHON%" (
    set "ENV_PYTHON=%PYTHON_CMD%"
)

:: 6. Instala Bibliotecas
echo [4/5] Instalando dependências e bibliotecas necessárias...
"%ENV_PYTHON%" -m pip install --upgrade pip --quiet
"%ENV_PYTHON%" -m pip install -r requirements.txt
if exist "%INSTALL_DIR%\.venv\Scripts\playwright.exe" (
    "%INSTALL_DIR%\.venv\Scripts\playwright.exe" install chromium
) else (
    "%ENV_PYTHON%" -m playwright install chromium
)
echo [+] Bibliotecas e navegador de automação instalados com sucesso!
echo.

:: 7. Cria Atalho na Área de Trabalho
echo [5/5] Criando atalho oficial na Área de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'Central DGS.lnk')); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%INSTALL_DIR%\INICIAR_CENTRAL_DGS.vbs\"'; $s.WorkingDirectory = '%INSTALL_DIR%'; if (Test-Path '%INSTALL_DIR%\frontend\static\icon.ico') { $s.IconLocation = '%INSTALL_DIR%\frontend\static\icon.ico,0' }; $s.Save()"
echo [+] Atalho 'Central DGS' criado na Área de Trabalho!
echo.

echo =======================================================================
echo            PARABÉNS! INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo =======================================================================
echo A Central DGS já está pronta para uso no seu computador.
echo Você pode abri-la agora ou através do ícone na sua Área de Trabalho.
echo.
echo Iniciando Central DGS...
start "" wscript.exe "%INSTALL_DIR%\INICIAR_CENTRAL_DGS.vbs"
timeout /t 3 >nul
exit /b 0
