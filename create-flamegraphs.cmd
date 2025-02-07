for %%F in (*.spf) do (
  perl I:\Fun\sus.exe-tools\FlameGraph\flamegraph.pl %%F > %%~nF.svg
)