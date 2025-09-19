module.exports = {
  apps: [{
    name: "binblur-oms-frontend",
    script: "npm",
    args: "run start:prod",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "2024M",
    env: {
      NODE_ENV: "production"
    },
    error_file: "/home/binblurdev/.pm2/logs/binblur-oms-frontend-error.log",
    out_file: "/home/binblurdev/.pm2/logs/binblur-oms-frontend-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }],
  deploy: {
    production: {
      user: "binblurdev",
      host: "15.164.66.87",
      ref: "origin/main",
      repo: "git@github.com:BinblurIT/binblur-oms-frontend.git",
      path: "/home/binblurdev/binblur-oms-frontend",
      "post-deploy": "npm install && npm run build && pm2 restart binblurfront.config.js"
    }
  }
};
