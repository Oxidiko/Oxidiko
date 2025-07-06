@echo off
REM Oxidiko Git Commit & Push Script

REM check if .git folder exists
if not exist ".git" (
    echo Git repo not initialized. Initializing...
    git init
    git remote add origin https://github.com/Oxidiko/Oxidiko.git
)

REM make sure we’re on main
git checkout -q -B main

REM add all changes
git add .

REM prompt for commit message
set /p msg="Enter commit message: "

REM commit
git commit -m "%msg%"

REM push to origin
git push -u origin main

pause
