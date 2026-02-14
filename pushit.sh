#!/bin/bash

# Oxidiko Git Commit & Push Script

# Check if .git folder exists
if [ ! -d ".git" ]; then
    echo "Git repo not initialized. Initializing..."
    git init
    git remote add origin https://github.com/Oxidiko/Oxidiko.git
fi

# Make sure we’re on main
git checkout -q -B main

# Add all changes
git add .

# Prompt for commit message
read -p "Enter commit message: " msg

# Commit
git commit -m "$msg"

# Push to origin
git push -u origin main

echo "Done."
