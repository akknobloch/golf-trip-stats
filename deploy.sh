#!/bin/bash

# Golf Trip Manager Deployment Script
# This script helps automate the deployment process

set -e  # Exit on any error

echo "🏌️  Golf Trip Manager - Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Creating template..."
    cat > .env.local << EOF
# Admin password (change this!)
ADMIN_PASSWORD=your_secure_password_here

# Environment
NODE_ENV=production
EOF
    echo "📝 Created .env.local template. Please edit it with your actual password!"
    exit 1
fi

# Check if ADMIN_PASSWORD is set
if ! grep -q "ADMIN_PASSWORD=" .env.local || grep -q "your_secure_password_here" .env.local; then
    echo "❌ Error: Please set a secure ADMIN_PASSWORD in .env.local"
    exit 1
fi

echo "✅ Environment configuration looks good!"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run deploy:clean

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run deploy:build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Error: Build failed - '.next' directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build output: ./.next/"

# Copy .htaccess to public directory
if [ -f "public/.htaccess" ]; then
    echo "📋 .htaccess configuration is ready in public/"
fi

# Show deployment instructions
echo ""
echo "🚀 Deployment Instructions:"
echo "=========================="
echo "1. Upload the entire project to your web server"
echo "2. Set up a reverse proxy to forward requests to your Node.js app"
echo "3. Ensure your domain points to the proxy configuration"
echo "4. Start the application with 'npm start'"
echo "5. Test the application at your domain"
echo ""
echo "🔐 Admin Access:"
echo "==============="
echo "• URL: yourdomain.com/admin/login"
echo "• Password: (set in .env.local)"
echo ""
echo "📝 Next Steps:"
echo "============="
echo "• Test all functionality"
echo "• Check that admin panel is password-protected"
echo "• Verify that admin link is hidden from public dashboard"
echo "• Set up SSL certificate if not already done"

echo ""
echo "🎉 Deployment script completed!"
