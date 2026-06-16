module.exports = {
  apps: [
    {
      name: 'muarrix',
      script: 'server.js',
      cwd: '/var/www/muarrix.kiut.uz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        TRUST_PROXY: '1',
      },
      error_file: '/var/log/pm2/muarrix-error.log',
      out_file: '/var/log/pm2/muarrix-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
