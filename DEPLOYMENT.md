# Golf Trip Manager - Deployment Guide

## Overview
This guide will help you deploy the Golf Trip Manager to Siteground hosting using Git while protecting admin functionality from public access.

## Prerequisites
- Siteground hosting account with SSH access
- Git installed locally
- Node.js and npm installed locally

## Security Features
- Admin panel is password-protected in production
- Admin link is hidden from the public dashboard in production
- Server-side rendering for optimal performance and security

## Local Setup

### 1. Environment Configuration
Create a `.env.local` file in your project root:
```bash
# Admin password (change this!)
ADMIN_PASSWORD=your_secure_password_here

# Environment
NODE_ENV=production
```

### 2. Build the Application
```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This will create a production build in the `.next/` directory.

## Git Repository Setup

### 1. Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create Remote Repository
Create a private repository on GitHub/GitLab and add it as remote:
```bash
git remote add origin https://github.com/yourusername/golf-trip-manager.git
git push -u origin main
```

## Siteground Deployment

### 1. SSH Access Setup
- Log into your Siteground control panel
- Go to "Site Tools" > "DevOps" > "Git"
- Enable SSH access if not already enabled

### 2. Connect to Your Server
```bash
ssh username@your-domain.com
```

### 3. Clone Repository
```bash
cd public_html
git clone https://github.com/yourusername/golf-trip-manager.git
cd golf-trip-manager
```

### 4. Build and Start on Server
```bash
# Install Node.js if not available
# You may need to use nvm or contact Siteground support

# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

### 5. Configure Web Server
Create a `.htaccess` file in your public_html directory:
```apache
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "origin-when-cross-origin"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

### 6. Configure Domain and Proxy
In your Siteground control panel:
- Go to "Site Tools" > "Domain" > "Domain Manager"
- Set up a reverse proxy to forward requests to your Node.js application
- Configure the proxy to forward requests to `http://localhost:3000` (or your app port)

## Admin Access

### Production Access
In production, admin access is protected by a password. To access:
1. Navigate to `yourdomain.com/admin/login`
2. Enter the password set in your `ADMIN_PASSWORD` environment variable
3. You'll be redirected to the admin panel

### Development Access
In development mode (`NODE_ENV=development`), admin access is unrestricted.

## Deployment Workflow

### 1. Make Changes Locally
```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin main
```

### 2. Deploy to Server
```bash
# SSH to your server
ssh username@your-domain.com

# Navigate to project directory
cd public_html/golf-trip-manager

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Restart the application
# If using PM2: pm2 restart golf-trip-manager
# If using systemd: sudo systemctl restart golf-trip-manager
# Or kill the process and restart: npm start
```

### 3. Update Web Server (if needed)
If you changed the application port or configuration, update your reverse proxy settings in Siteground control panel.

## Security Considerations

### 1. Admin Password
- Use a strong, unique password
- Change it regularly
- Don't commit the password to Git

### 2. Environment Variables
- Keep sensitive data in environment variables
- Never commit `.env` files to Git
- Use different passwords for development and production

### 3. HTTPS
- Enable SSL certificate in Siteground control panel
- Force HTTPS redirects

### 4. Regular Updates
- Keep dependencies updated
- Monitor for security vulnerabilities

## Troubleshooting

### Build Issues
- Ensure Node.js version is compatible (check `package.json`)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

### Routing Issues
- Ensure `.htaccess` file is in the correct location
- Check that mod_rewrite is enabled on your server
- Verify reverse proxy is configured correctly
- Check that the Node.js application is running on the expected port

### Admin Access Issues
- Verify `ADMIN_PASSWORD` environment variable is set
- Check browser console for JavaScript errors
- Clear browser cache and localStorage

## Backup Strategy

### 1. Data Backup
The application uses localStorage for data storage. Regular backups should include:
- Database exports (if using a database)
- Configuration files
- User data exports

### 2. Code Backup
- Use Git for version control
- Consider using GitHub/GitLab for remote backup
- Keep local copies of important files

## Performance Optimization

### 1. Static Assets
- Images are optimized during build
- CSS and JS are minified
- Static files are cached with appropriate headers

### 2. CDN
Consider using a CDN for static assets to improve global performance.

## Support
For issues specific to Siteground hosting, contact Siteground support. For application-specific issues, check the project documentation or create an issue in the repository.
