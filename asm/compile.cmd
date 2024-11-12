@echo off
cls
prompt ^>$S
:: prompt $s
set path=C:\NASM\;%path%
set path=C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.40.33807\bin\Hostx64\x86\;%path%
@echo on

nasm -f win32 -gcv8 hw.asm
:: link /subsystem:console /nodefaultlib /entry:main hw.obj "C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\um\x86\kernel32.lib"
link /subsystem:console /nodefaultlib /entry:main /debug /pdb:hw.pdb hw.obj "C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\um\x86\kernel32.lib" "C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\ucrt\x86\ucrt.lib"

@echo off
prompt
@echo on