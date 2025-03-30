#!/bin/bash

# Deployment Script for Max-AI (JARVIS Upgrade)

# Configuration
REPO_URL="https://github.com/anaslari23/max-ai.git"
DEPLOY_DIR="/path/to/your/deployment/directory"
ENV_FILE="$DEPLOY_DIR/.env"
BRANCH="main"  # Change to your preferred branch

# Security Check
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Create deployment directory if not exists
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Clone or Pull Updates
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "Updating repository..."
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone $REPO_URL .
fi

# Environment Setup
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    touch $ENV_FILE
    echo "OPENAI_API_KEY=your_api_key_here" >> $ENV_FILE
    echo "WEATHER_API_KEY=your_key_here" >> $ENV_FILE
    chmod 600 $ENV_FILE
fi

# Install Dependencies
echo "Installing requirements..."
pip3 install -r requirements.txt

# Apply Database Migrations (if any)
if [ -f "database/migrations" ]; then
    echo "Applying database migrations..."
    python3 manage.py migrate  # Modify for your framework
fi

# Restart Services
echo "Restarting services..."
systemctl restart max-ai.service  # Modify for your service manager

# Cleanup
echo "Cleaning up..."
apt-get autoremove -y
apt-get clean

echo "Deployment complete! Check system status with: systemctl status max-ai.service"
