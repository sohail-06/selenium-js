#!/bin/bash

set -x

# Load nvm environment for Node.js
export NVM_DIR="$HOME/.nvm"
# This loads nvm bash functions
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# Optional: load nvm bash_completion if exists
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use the right node version
nvm use 20.12.2

# Confirm node and npm paths (for debugging)
which node >> cron-debug.log 2>&1
which npm >> cron-debug.log 2>&1
node -v >> cron-debug.log 2>&1
npm -v >> cron-debug.log 2>&1

cd /Volumes/data/GithubCopilot/selenium-login-project || exit 1

# Run your tests
npm run test >> cron-debug.log 2>&1
