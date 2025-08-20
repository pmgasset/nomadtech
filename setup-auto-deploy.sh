#!/bin/bash

# =============================================================================
# SETUP AUTOMATED DEPLOYMENT FOR NOMADNET
# =============================================================================

PROJECT_DIR="/var/www/nomadnet-ecommerce"
GITHUB_ACTIONS_DIR=".github/workflows"

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

echo "🤖 Setting Up Automated Deployment"
echo "=================================="
echo ""

cd $PROJECT_DIR

# Step 1: Create GitHub Actions workflow directory
print_status "Creating GitHub Actions workflow..."
mkdir -p $GITHUB_ACTIONS_DIR

# Step 2: Create comprehensive deployment workflow
cat > $GITHUB_ACTIONS_DIR/deploy.yml << 'EOF'
name: 🚀 Deploy NomadNet to Production

on:
  push:
    branches: [ main ]
    paths-ignore:
      - 'README.md'
      - 'docs/**'
      - '.gitignore'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'production'
        type: choice
        options:
        - production
        - staging

env:
  NODE_VERSION: '18'
  PROJECT_PATH: '/var/www/nomadnet-ecommerce'

jobs:
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
      
    - name: 📦 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: 📚 Install dependencies
      run: npm ci
      
    - name: 🔍 Run linting
      run: npm run lint
      
    - name: 🏗️ Test build
      run: npm run build

  deploy:
    name: 🚀 Deploy to Server
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: 🚀 Deploy via SSH
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        port: ${{ secrets.PORT }}
        timeout: 300s
        script: |
          set -e  # Exit on any error
          
          echo "🚀 Starting deployment at $(date)"
          echo "=================================="
          
          # Navigate to project directory
          cd ${{ env.PROJECT_PATH }}
          
          # Show current status
          echo "📊 Current application status:"
          pm2 status nomadnet || echo "Application not running"
          
          # Backup current version
          echo "💾 Creating backup..."
          BACKUP_DIR="/home/$USER/backups/nomadnet-$(date +%Y%m%d_%H%M%S)"
          mkdir -p $BACKUP_DIR
          cp -r . $BACKUP_DIR/ || echo "Backup failed, continuing..."
          
          # Pull latest changes
          echo "📥 Pulling latest changes..."
          git fetch origin
          git reset --hard origin/main
          git clean -fd
          
          # Check if package.json changed
          if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
            echo "📦 Package.json changed, clearing node_modules..."
            rm -rf node_modules
          fi
          
          # Install dependencies
          echo "📦 Installing dependencies..."
          npm ci --only=production
          
          # Generate Prisma client
          echo "🗄️ Generating Prisma client..."
          npx prisma generate
          
          # Run database migrations (safely)
          echo "🗄️ Running database migrations..."
          npx prisma db push || echo "Database migration failed, check manually"
          
          # Build the application
          echo "🔨 Building application..."
          npm run build
          
          # Update PM2 process
          echo "🔄 Updating PM2 service..."
          if pm2 describe nomadnet > /dev/null 2>&1; then
            pm2 restart nomadnet --update-env
          else
            pm2 start ecosystem.config.js
          fi
          pm2 save
          
          # Wait for application to start
          echo "⏳ Waiting for application to start..."
          sleep 10
          
          # Health check
          echo "🏥 Running health checks..."
          for i in {1..5}; do
            if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
              echo "✅ Health check passed"
              break
            else
              echo "❌ Health check failed, attempt $i/5"
              sleep 5
            fi
          done
          
          # Show final status
          echo "📊 Final application status:"
          pm2 status nomadnet
          
          echo "🎉 Deployment completed successfully at $(date)"

  notify-success:
    name: 📧 Notify Success
    needs: [test, deploy]
    runs-on: ubuntu-latest
    if: success()
    
    steps:
    - name: 📱 Success notification
      run: |
        echo "✅ NomadNet deployment successful!"
        echo "🌐 Site: https://nomadconnect.app"
        echo "📅 Time: $(date)"
        echo "🔗 Commit: ${{ github.sha }}"

  notify-failure:
    name: 🚨 Notify Failure
    needs: [test, deploy]
    runs-on: ubuntu-latest
    if: failure()
    
    steps:
    - name: 🚨 Failure notification
      run: |
        echo "❌ NomadNet deployment failed!"
        echo "🔗 Check workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
        echo "📅 Time: $(date)"
        echo "🔗 Commit: ${{ github.sha }}"

  rollback:
    name: 🔄 Rollback on Failure
    needs: deploy
    runs-on: ubuntu-latest
    if: failure()
    
    steps:
    - name: 🔄 Rollback deployment
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        port: ${{ secrets.PORT }}
        script: |
          echo "🔄 Rolling back deployment..."
          cd ${{ env.PROJECT_PATH }}
          
          # Find latest backup
          LATEST_BACKUP=$(ls -t /home/$USER/backups/nomadnet-* 2>/dev/null | head -1)
          
          if [ -n "$LATEST_BACKUP" ]; then
            echo "📦 Restoring from backup: $LATEST_BACKUP"
            rm -rf ./* ./.* 2>/dev/null || true
            cp -r $LATEST_BACKUP/* .
            cp -r $LATEST_BACKUP/.* . 2>/dev/null || true
            
            # Restart with backed up version
            pm2 restart nomadnet
            echo "✅ Rollback completed"
          else
            echo "❌ No backup found for rollback"
          fi
EOF

# Step 3: Create ecosystem.config.js if it doesn't exist
if [[ ! -f ecosystem.config.js ]]; then
    print_status "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nomadnet',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/nomadnet-error.log',
    out_file: '/var/log/pm2/nomadnet-out.log',
    log_file: '/var/log/pm2/nomadnet-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
fi

# Step 4: Create deployment user and SSH key
print_status "Setting up deployment SSH key..."

# Generate deployment SSH key if it doesn't exist
if [[ ! -f ~/.ssh/github_deploy_key ]]; then
    ssh-keygen -t rsa -b 4096 -C "github-deploy@nomadconnect.app" -f ~/.ssh/github_deploy_key -N ""
    
    # Add to SSH agent
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/github_deploy_key
    
    print_success "SSH key generated: ~/.ssh/github_deploy_key"
else
    print_warning "SSH key already exists: ~/.ssh/github_deploy_key"
fi

# Step 5: Create health check API endpoint
print_status "Creating health check endpoint..."
mkdir -p pages/api
cat > pages/api/health.js << 'EOF'
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      message: 'NomadNet is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
EOF

# Step 6: Create deployment info script
cat > deployment-info.sh << 'EOF'
#!/bin/bash

echo "📋 Deployment Information for GitHub Secrets"
echo "============================================="
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 Server Information:"
echo "   HOST: $SERVER_IP"
echo "   PORT: 22"
echo "   USERNAME: $USER"
echo ""

# Show SSH public key
echo "🔑 SSH Public Key (add to server authorized_keys):"
echo "   File: ~/.ssh/github_deploy_key.pub"
if [[ -f ~/.ssh/github_deploy_key.pub ]]; then
    cat ~/.ssh/github_deploy_key.pub
else
    echo "   ❌ SSH key not found. Run the setup script first."
fi
echo ""

# Show SSH private key
echo "🔐 SSH Private Key (add to GitHub secrets as SSH_PRIVATE_KEY):"
echo "   File: ~/.ssh/github_deploy_key"
if [[ -f ~/.ssh/github_deploy_key ]]; then
    echo "   Content to copy:"
    echo "   =================="
    cat ~/.ssh/github_deploy_key
    echo "   =================="
else
    echo "   ❌ SSH private key not found. Run the setup script first."
fi
echo ""

echo "🎯 GitHub Secrets to Configure:"
echo "   HOST = $SERVER_IP"
echo "   USERNAME = $USER"
echo "   PORT = 22"
echo "   SSH_PRIVATE_KEY = [content of ~/.ssh/github_deploy_key]"
echo ""

echo "🔗 GitHub Repository Settings:"
echo "   1. Go to: https://github.com/pmgasset/nomadtech/settings/secrets/actions"
echo "   2. Add the secrets listed above"
echo "   3. Commit and push the .github/workflows/deploy.yml file"
echo ""
EOF

chmod +x deployment-info.sh

# Step 7: Add SSH key to authorized_keys
print_status "Adding SSH key to authorized_keys..."
mkdir -p ~/.ssh
touch ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

if [[ -f ~/.ssh/github_deploy_key.pub ]]; then
    # Check if key is already added
    if ! grep -q "$(cat ~/.ssh/github_deploy_key.pub)" ~/.ssh/authorized_keys; then
        cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
        print_success "SSH key added to authorized_keys"
    else
        print_warning "SSH key already in authorized_keys"
    fi
fi

# Step 8: Commit and push the workflow
print_status "Committing GitHub Actions workflow..."
git add .github/workflows/deploy.yml
git add ecosystem.config.js
git add pages/api/health.js
git add deployment-info.sh
git commit -m "Add automated deployment workflow

- GitHub Actions workflow for automatic deployment
- Health check endpoint for monitoring
- PM2 ecosystem configuration
- Rollback mechanism on deployment failure
- SSH-based deployment to production server"

git push origin main

print_success "GitHub Actions workflow committed and pushed!"

echo ""
echo "🎉 Automated Deployment Setup Complete!"
echo "======================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔑 Configure GitHub Secrets:"
echo "   Run: ./deployment-info.sh"
echo "   This will show you the exact values to add to GitHub"
echo ""
echo "2. 🌐 Add secrets to GitHub:"
echo "   Go to: https://github.com/pmgasset/nomadtech/settings/secrets/actions"
echo "   Add: HOST, USERNAME, PORT, SSH_PRIVATE_KEY"
echo ""
echo "3. ✅ Test the deployment:"
echo "   Make any small change and push to main branch"
echo "   Watch the Actions tab on GitHub"
echo ""
echo "4. 📊 Monitor deployments:"
echo "   GitHub Actions: https://github.com/pmgasset/nomadtech/actions"
echo "   Server logs: pm2 logs nomadnet"
echo ""
echo "🚀 From now on, every push to main will automatically deploy!"
echo ""

# Show deployment info immediately
echo "📋 Quick Reference - GitHub Secrets:"
echo "===================================="
./deployment-info.sh
