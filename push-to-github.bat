@echo off
echo ========================================
echo Pushing Money Muling Detection to GitHub
echo ========================================
echo.

REM Initialize git if not already done
if not exist .git (
    echo Initializing git repository...
    git init
    echo.
)

REM Configure git user (if not already set)
echo Checking git configuration...
git config user.name || git config --global user.name "Your Name"
git config user.email || git config --global user.email "your.email@example.com"
echo.

REM Add all files
echo Adding files to git...
git add .
echo.

REM Commit changes
echo Committing changes...
git commit -m "Initial commit: Money Muling Detection System"
echo.

REM Check if remote exists
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo IMPORTANT: Set your GitHub repository URL
    echo ========================================
    echo.
    echo Run this command with YOUR repository URL:
    echo git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    echo.
    echo Then run:
    echo git branch -M main
    echo git push -u origin main
    echo.
) else (
    echo.
    echo Pushing to GitHub...
    git branch -M main
    git push -u origin main
    echo.
    echo Done! Check your GitHub repository.
)

pause
