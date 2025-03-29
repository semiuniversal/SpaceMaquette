@echo off
REM Start both test watchers simultaneously

start cmd /k "cd /d %~dp0\..\space-maquette-frontend\space-maquette-ui && npm run test:watch"
start cmd /k "cd /d %~dp0\..\space-maquette-frontend\space-maquette-server && npm run test:watch" 