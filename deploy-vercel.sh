#!/bin/bash

# Golf Trip Manager - Vercel Deployment Script
echo "🚀 Deploying Golf Trip Manager to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your application should now be live on Vercel!"
echo ""
echo "📝 Next steps:"
echo "1. Set up environment variables in Vercel dashboard:"
echo "   - ADMIN_PASSWORD=your_secure_password"
echo "   - NODE_ENV=production"
echo "2. Configure your custom domain (optional)"
echo "3. Test the admin panel at yourdomain.com/admin/login"
