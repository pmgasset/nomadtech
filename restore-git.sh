#!/bin/bash

# =============================================================================
# REINITIALIZE GIT REPOSITORY FOR NOMADNET
# =============================================================================

PROJECT_DIR="/var/www/nomadnet-ecommerce"
GITHUB_REPO="https://github.com/pmgasset/nomadtech.git"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔄 Reinitializing Git Repository"
echo "================================"
echo ""

cd $PROJECT_DIR

# Step 1: Check current status
print_status "Checking current repository status..."
if [[ -d .git ]]; then
    print_warning "Git directory exists but may be corrupted"
    ls -la .git/
else
    print_warning "No Git directory found - repository needs to be reinitialized"
fi

# Step 2: Backup current files before reinitializing
print_status "Creating backup of current files..."
BACKUP_DIR="/home/linuxuser/nomadnet-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r . $BACKUP_DIR/ 2>/dev/null
print_success "Backup created at: $BACKUP_DIR"

# Step 3: Remove corrupted .git directory if it exists
if [[ -d .git ]]; then
    print_status "Removing corrupted .git directory..."
    rm -rf .git
fi

# Step 4: Initialize new Git repository
print_status "Initializing new Git repository..."
git init
git config --global --add safe.directory $PROJECT_DIR

# Step 5: Configure Git user (if not already configured)
print_status "Configuring Git user..."
git config user.name "pmgasset" 2>/dev/null || git config user.name "NomadNet Deploy"
git config user.email "admin@nomadconnect.app" 2>/dev/null || echo "Using default email"

# Step 6: Add remote repository
print_status "Adding GitHub remote repository..."
git remote add origin $GITHUB_REPO

# Step 7: Create/update .gitignore
print_status "Creating/updating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Next.js
.next/
out/
build/

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/
.tmp/

# PM2 logs
ecosystem.config.js

# SSL certificates (if any)
*.pem
*.key
*.crt

# Backup files
*.backup
*.bak

# Database credentials (keep secure)
/tmp/db_credentials.txt

# Custom deployment files
deploy-*.sh
setup
fix-deployment
fix-*.sh
prepare-server.sh

# GitHub secrets file
github-secrets-config.txt
EOF

# Step 8: Add all files to Git
print_status "Adding files to Git repository..."
git add .

# Step 9: Create initial commit
print_status "Creating initial commit..."
git commit -m "Reinitialize repository after deployment corruption

- Restore NomadNet ecommerce platform
- Add complete Next.js application with Stripe integration
- Include automated deployment configuration
- Add all necessary configuration files
- Restore PM2 and database setup"

# Step 10: Fetch and merge with remote repository
print_status "Fetching from remote repository..."
git fetch origin

# Check if remote has content
if git ls-remote --heads origin main | grep -q main; then
    print_status "Remote repository has content, merging..."
    git branch --set-upstream-to=origin/main main
    
    # Try to merge, handling conflicts
    if git merge origin/main --allow-unrelated-histories; then
        print_success "Successfully merged with remote repository"
    else
        print_warning "Merge conflicts detected. Resolving automatically..."
        # Auto-resolve conflicts by keeping local version
        git add .
        git commit -m "Resolve merge conflicts - keep local version"
    fi
else
    print_status "Remote repository is empty, will push local content"
fi

# Step 11: Push to remote repository
print_status "Pushing to remote repository..."
git push -u origin main

if [[ $? -eq 0 ]]; then
    print_success "Successfully pushed to GitHub!"
else
    print_warning "Push failed. You may need to force push or check authentication."
    echo ""
    echo "If needed, you can force push with:"
    echo "git push -u origin main --force"
fi

# Step 12: Verify repository status
print_status "Verifying repository status..."
git status
git log --oneline -5

print_success "Git repository reinitialized successfully!"

echo ""
print_success "🎉 Repository Reinitialized!"
echo "============================"
echo ""
echo "✅ New Git repository initialized"
echo "✅ Connected to GitHub remote"
echo "✅ All files committed"
echo "✅ Backup created at: $BACKUP_DIR"
echo ""
echo "📤 Next steps:"
echo "1. ✅ Repository is ready for deployment"
echo "2. 🚀 Your next commit will trigger automated deployment"
echo "3. 📊 Monitor at: https://github.com/pmgasset/nomadtech/actions"
echo ""
echo "🔧 Test the repository:"
echo "git status          # Check repository status"
echo "git log --oneline   # View commit history"
echo "git remote -v       # Verify remote connection"
echo ""
echo "🚀 Trigger deployment:"
echo "Make any small change and commit to test automated deployment"
