module.exports = {
  apps: [
    {
      name: 'nomadnet-ecommerce',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/nomadnet-ecommerce',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/nomadnet-ecommerce/error.log',
      out_file: '/var/log/nomadnet-ecommerce/out.log',
      log_file: '/var/log/nomadnet-ecommerce/combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
    },
  ],
};
