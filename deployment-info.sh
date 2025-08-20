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
