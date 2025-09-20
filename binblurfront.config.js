module.exports = {
  apps: [{
    name: "shop-oms-frontend",
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
    error_file: "/home/shopdev/.pm2/logs/shop-oms-frontend-error.log",
    out_file: "/home/shopdev/.pm2/logs/shop-oms-frontend-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }],
  deploy: {
    production: {
      user: "shopdev",
      host: "15.164.66.87",
      ref: "origin/main",
      repo: "git@github.com:BinblurIT/shop-oms-frontend.git",
      path: "/home/shopdev/shop-oms-frontend",
      "post-deploy": "npm install && npm run build && pm2 restart shopfront.config.js"
    }
  }
};
