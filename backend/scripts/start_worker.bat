@echo off
REM Start the Huey worker for background task processing
REM This worker processes the continuous re-evaluation tasks

echo Starting NeuroChain Huey Worker...

cd /d "%~dp0\.."

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "kenv\Scripts\activate.bat" (
    call kenv\Scripts\activate.bat
)

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Start Huey consumer
REM -w: number of worker threads (adjust based on your needs)
REM -k: worker type (thread, process, or greenlet)
REM -l: log file location
REM -v: verbose logging

huey_consumer app.tasks.workers.huey -w 4 -k thread -l logs/huey.log -v

echo Huey worker stopped.
pause
