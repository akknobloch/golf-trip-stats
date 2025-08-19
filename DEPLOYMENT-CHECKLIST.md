# Golf Trip Manager - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Created `.env.local` file with secure admin password
- [ ] Set `NODE_ENV=production`
- [ ] Verified all environment variables are set

### ✅ Code Preparation
- [ ] All changes committed to Git
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Admin authentication is working
- [ ] Admin link is hidden in production

### ✅ Server Preparation
- [ ] Node.js installed (version 18+)
- [ ] Git access configured
- [ ] SSH access working
- [ ] Domain DNS configured
- [ ] SSL certificate installed (recommended)

## Deployment Steps

### 1. Initial Setup
- [ ] Clone repository to server
- [ ] Install dependencies (`npm install`)
- [ ] Copy environment file
- [ ] Build application (`npm run build`)
- [ ] Test build locally

### 2. Process Management
- [ ] Install PM2: `npm install -g pm2`
- [ ] Update `ecosystem.config.js` with correct paths
- [ ] Start application: `pm2 start ecosystem.config.js`
- [ ] Save PM2 configuration: `pm2 save`
- [ ] Set up PM2 startup: `pm2 startup`

### 3. Web Server Configuration
- [ ] Configure reverse proxy in Siteground
- [ ] Point domain to proxy configuration
- [ ] Test domain access
- [ ] Verify HTTPS redirects (if applicable)

### 4. Security Verification
- [ ] Admin panel requires password
- [ ] Admin link not visible on public dashboard
- [ ] Sensitive files not accessible via web
- [ ] Environment variables not exposed
- [ ] HTTPS working correctly

### 5. Functionality Testing
- [ ] Public dashboard loads correctly
- [ ] Player details pages work
- [ ] Trip details pages work
- [ ] Course details pages work
- [ ] Admin panel accessible with password
- [ ] Data management functions work

## Post-Deployment

### ✅ Monitoring
- [ ] Set up application monitoring
- [ ] Configure error logging
- [ ] Set up uptime monitoring
- [ ] Monitor server resources

### ✅ Backup
- [ ] Set up regular backups
- [ ] Test backup restoration
- [ ] Document backup procedures

### ✅ Maintenance
- [ ] Schedule regular updates
- [ ] Monitor for security updates
- [ ] Plan for data migrations

## Troubleshooting

### Common Issues
- **Build fails**: Check Node.js version and dependencies
- **Admin access issues**: Verify environment variables
- **Routing problems**: Check reverse proxy configuration
- **Performance issues**: Monitor server resources and optimize

### Emergency Contacts
- Siteground Support: [Your support contact]
- Application Issues: [Your contact info]
- Server Issues: [Your server admin contact]

## Notes
- Keep deployment credentials secure
- Document any custom configurations
- Test thoroughly before going live
- Have a rollback plan ready
