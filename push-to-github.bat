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

REM Check if remote exists and is not the placeholder
git remote get-url origin 2>nul | findstr /C:"your-username" /C:"your-repo" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Set your GitHub repository URL first
    echo ========================================
    echo.
    echo 1. Create a new repo at https://github.com/new
    echo 2. Run this with YOUR username and repo name:
    echo    git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    echo.
    echo 3. Run this script again to push.
    echo.
    goto :eof
)
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo IMPORTANT: Add your GitHub repository
    echo ========================================
    echo.
    echo Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    echo Then run this script again.
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
