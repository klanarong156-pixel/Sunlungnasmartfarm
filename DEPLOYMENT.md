# SmartFarm V14 Deployment Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- SQLite3
- MQTT Broker (Mosquitto or HiveMQ)
- Arduino IDE (for ESP8266)
- Linux/Unix server (Ubuntu 20.04+ recommended)
- Domain name (optional)
- SSL certificate (for HTTPS)

## Backend Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install SQLite
sudo apt install -y sqlite3

# Install MQTT Broker
sudo apt install -y mosquitto mosquitto-clients

# Create application directory
sudo mkdir -p /opt/smartfarm
sudo chown $USER:$USER /opt/smartfarm
cd /opt/smartfarm
```

### 2. Deploy Backend

```bash
# Clone or copy backend files
cp -r backend /opt/smartfarm/

cd /opt/smartfarm/backend

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env

# Edit .env with production settings
nano .env
```

### 3. Configure Environment

Edit `/opt/smartfarm/backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Database
DB_PATH=/opt/smartfarm/data/smartfarm.db

# JWT
JWT_SECRET=your_very_secure_random_key_here
JWT_EXPIRY=7d

# MQTT
MQTT_BROKER=localhost:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=your_mqtt_password

# Weather
WEATHER_LATITUDE=13.7563
WEATHER_LONGITUDE=100.5018

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Create Systemd Service

Create `/etc/systemd/system/smartfarm-backend.service`:

```ini
[Unit]
Description=SmartFarm V14 Backend
After=network.target

[Service]
Type=simple
User=smartfarm
WorkingDirectory=/opt/smartfarm/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/smartfarm/backend.log
StandardError=append:/var/log/smartfarm/backend.log

[Install]
WantedBy=multi-user.target
```

### 5. Setup User and Permissions

```bash
# Create smartfarm user
sudo useradd -r -s /bin/bash smartfarm

# Create data and log directories
sudo mkdir -p /opt/smartfarm/data /var/log/smartfarm
sudo chown smartfarm:smartfarm /opt/smartfarm/data /var/log/smartfarm

# Set permissions
sudo chmod 755 /opt/smartfarm/backend
sudo chown -R smartfarm:smartfarm /opt/smartfarm/backend
```

### 6. Start Service

```bash
# Enable and start service
sudo systemctl enable smartfarm-backend
sudo systemctl start smartfarm-backend

# Check status
sudo systemctl status smartfarm-backend

# View logs
sudo journalctl -u smartfarm-backend -f
```

## Frontend Deployment

### 1. Build Frontend

```bash
cd /opt/smartfarm/frontend

# Copy frontend files to web directory
sudo mkdir -p /var/www/smartfarm
sudo cp -r . /var/www/smartfarm/
sudo chown -R www-data:www-data /var/www/smartfarm
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/smartfarm`:

```nginx
upstream smartfarm_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Root directory
    root /var/www/smartfarm;
    index index.html;
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://smartfarm_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Manifest
    location /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### 3. Enable Nginx Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smartfarm /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## MQTT Broker Setup

### 1. Configure Mosquitto

Edit `/etc/mosquitto/mosquitto.conf`:

```conf
# Port
port 1883

# WebSocket
listener 9001
protocol websockets

# Persistence
persistence true
persistence_location /var/lib/mosquitto/

# Password file
password_file /etc/mosquitto/passwd

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_dest syslog
log_type all
```

### 2. Create User

```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd admin

# Set permissions
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 600 /etc/mosquitto/passwd
```

### 3. Start Service

```bash
# Enable and start
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Check status
sudo systemctl status mosquitto
```

## Database Initialization

```bash
# Create database
cd /opt/smartfarm/backend
sqlite3 /opt/smartfarm/data/smartfarm.db < src/database/schema.sql

# Verify
sqlite3 /opt/smartfarm/data/smartfarm.db ".tables"
```

## Monitoring and Maintenance

### 1. Log Rotation

Create `/etc/logrotate.d/smartfarm`:

```
/var/log/smartfarm/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 smartfarm smartfarm
    sharedscripts
    postrotate
        systemctl reload smartfarm-backend > /dev/null 2>&1 || true
    endscript
}
```

### 2. Backup

```bash
#!/bin/bash
# Backup script

BACKUP_DIR="/opt/smartfarm/backups"
DB_PATH="/opt/smartfarm/data/smartfarm.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
sqlite3 $DB_PATH ".dump" | gzip > $BACKUP_DIR/smartfarm_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/smartfarm_$DATE.sql.gz"
```

Schedule with cron:

```bash
# Add to crontab
0 2 * * * /opt/smartfarm/backup.sh
```

### 3. Monitoring

```bash
# Check service status
sudo systemctl status smartfarm-backend

# View recent logs
sudo journalctl -u smartfarm-backend -n 50

# Check disk usage
df -h /opt/smartfarm

# Check database size
du -h /opt/smartfarm/data/smartfarm.db
```

## ESP8266 Firmware Deployment

### 1. Arduino IDE Setup

1. Install Arduino IDE
2. Add ESP8266 board manager URL:
   - File → Preferences
   - Add: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Install ESP8266 package: Tools → Board Manager

### 2. Install Libraries

- PubSubClient (MQTT)
- ArduinoJson
- WiFiManager

### 3. Configure Firmware

Edit `firmware/smartfarm.ino`:

```cpp
#define MQTT_BROKER "your_server_ip"
#define MQTT_USERNAME "admin"
#define MQTT_PASSWORD "your_password"
```

### 4. Upload

1. Select Board: Generic ESP8266 Module
2. Select Port: /dev/ttyUSB0 (or your port)
3. Click Upload

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u smartfarm-backend -n 100

# Check port
sudo lsof -i :3000

# Check permissions
ls -la /opt/smartfarm/backend
```

### MQTT connection fails

```bash
# Test MQTT broker
mosquitto_pub -h localhost -u admin -P password -t "test" -m "hello"

# Check broker logs
sudo journalctl -u mosquitto -n 50
```

### Frontend not loading

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Check permissions
ls -la /var/www/smartfarm
```

## Performance Tuning

### 1. Node.js

```bash
# Increase file descriptors
ulimit -n 65536

# Set in systemd service
LimitNOFILE=65536
```

### 2. Database

```bash
# Optimize SQLite
sqlite3 /opt/smartfarm/data/smartfarm.db "PRAGMA optimize;"
```

### 3. Nginx

```nginx
# Connection pooling
upstream smartfarm_backend {
    keepalive 32;
}

# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Enable HTTPS with valid certificate
- [ ] Configure firewall rules
- [ ] Setup regular backups
- [ ] Enable MQTT authentication
- [ ] Setup rate limiting
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Setup monitoring and alerts
- [ ] Keep dependencies updated
- [ ] Setup fail2ban for brute force protection

## Scaling

For larger deployments:

1. **Load Balancing:** Use HAProxy or Nginx
2. **Database:** Consider PostgreSQL
3. **Cache:** Add Redis for caching
4. **Message Queue:** Use RabbitMQ for heavy loads
5. **Containerization:** Use Docker and Kubernetes

## Support

For issues and questions:
- Check logs: `/var/log/smartfarm/`
- Review API documentation: `docs/API.md`
- Check MQTT topics: `docs/MQTT_TOPICS.md`
