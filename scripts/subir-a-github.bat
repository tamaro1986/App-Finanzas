@echo off
REM ============================================================================
REM SCRIPT AUTOMATIZADO PARA SUBIR CAMBIOS A GITHUB
REM ============================================================================
REM Este script sube automáticamente todos los cambios a GitHub
REM ============================================================================

echo.
echo ========================================
echo  SUBIENDO CAMBIOS A GITHUB
echo ========================================
echo.

REM Verificar que .env no se suba
echo [1/4] Verificando que .env este protegido...
git check-ignore .env
if %errorlevel% equ 0 (
    echo ✓ .env esta protegido en .gitignore
) else (
    echo ✗ ADVERTENCIA: .env NO esta en .gitignore
    echo Presiona Ctrl+C para cancelar o cualquier tecla para continuar
    pause
)

echo.
echo [2/4] Verificando estado de Git...
git status --short

echo.
echo [3/4] Verificando commit...
git log --oneline -1

echo.
echo [4/4] Subiendo a GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  ✓ CAMBIOS SUBIDOS EXITOSAMENTE
    echo ========================================
    echo.
    echo Puedes verificar en:
    echo https://github.com/tamaro1986/App-Finanzas
    echo.
) else (
    echo.
    echo ========================================
    echo  ✗ ERROR AL SUBIR CAMBIOS
    echo ========================================
    echo.
    echo Posibles causas:
    echo 1. No hay conexion a internet
    echo 2. Necesitas autenticarte en GitHub
    echo 3. La rama principal se llama 'master' en lugar de 'main'
    echo.
    echo Intenta manualmente:
    echo   git push origin main
    echo O si tu rama es 'master':
    echo   git push origin master
    echo.
)

pause
