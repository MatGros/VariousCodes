@echo off
REM ============================================================================
REM Script de lancement DimCable MGS-05
REM Double-cliquez sur ce fichier pour ouvrir l'application
REM ============================================================================

echo.
echo ========================================
echo  DimCable MGS-05
echo  Dimensionnement de Cables Electriques
echo ========================================
echo.
echo Ouverture de l'application...
echo.

REM Ouvrir le fichier HTML avec le navigateur par défaut
start "" "dimcable.html"

REM Attendre 2 secondes avant de fermer
timeout /t 2 /nobreak >nul

exit
