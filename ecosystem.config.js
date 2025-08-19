module.exports = {
  apps: [
    {
      name: 'golf-trip-manager',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/your/golf-trip-manager',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
