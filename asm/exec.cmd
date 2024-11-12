@echo off
hw
echo.

set errorCode=%ERRORLEVEL%

:: https://www.dostips.com/DtTipsArithmetic.php#toHex
SETLOCAL ENABLEDELAYEDEXPANSION
set /a dec=%errorCode%
set "hex="
set "map=0123456789ABCDEF"
for /L %%N in (1,1,8) do (
    set /a "d=dec&15,dec>>=4"
    for %%D in (!d!) do set "hex=!map:~%%D,1!!hex!"
)

echo exec: exited with code %errorCode%

if NOT %errorCode% == 0 (
  echo.
  err.exe /winerror.h /ntstatus.h %errorCode%
)