# SmartFarm V15 Premium - Deployment Guide

## Prerequisites

- Node.js 18+ 
- MQTT Broker (Mosquitto or equivalent)
- SQLite3 or PostgreSQL
- Docker (optional)
- Linux/macOS or Windows WSL2

---

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

---

## Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up -d
```

### Option 2: Systemd (Linux)

```bash
sudo systemctl start smartfarm
sudo systemctl enable smartfarm
```

### Option 3: Manual Node.js

```bash
npm install --production
NODE_ENV=production npm start
```

---

## Configuration

Set environment variables in `.env`:

```env
NODE_ENV=production
PORT=3000
MQTT_BROKER_URL=ws://localhost:9001
JWT_SECRET=your-secure-secret
DB_PATH=./data/smartfarm.db
CORS_ORIGIN=https://yourdomain.com
```

---

## MQTT Setup

```bash
# Start Mosquitto
mosquitto -c /etc/mosquitto/mosquitto.conf
```

---

## Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## SSL Certificate (Let's Encrypt)

```bash
certbot certonly --nginx -d yourdomain.com
```

---

## Backup & Monitoring

```bash
# Backup database
sqlite3 data/smartfarm.db ".backup './backup-$(date +%Y%m%d).db'"

# View logs
tail -f logs/smartfarm.log
```

For detailed deployment instructions, see [V15_UPGRADE_GUIDE.md](V15_UPGRADE_GUIDE.md).

**Version:** 15.0.0 | **Last Updated:** July 2, 2026
