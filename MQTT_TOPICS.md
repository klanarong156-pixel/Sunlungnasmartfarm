# SmartFarm V14 MQTT Topics

## Topic Structure

```
smartfarm/
├── sensor/
│   └── {device_id}/
│       ├── temperature
│       ├── humidity
│       ├── soil_moisture
│       ├── light
│       └── rain
├── pump/
│   └── {device_id}/
│       ├── command
│       └── status
├── schedule/
│   └── {schedule_id}/
│       └── trigger
├── device/
│   └── {device_id}/
│       └── status
└── heartbeat
```

---

## Sensor Topics

### smartfarm/sensor/{device_id}/temperature

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** false  
**Frequency:** Every 10 seconds

**Payload:**
```json
{
  "value": 25.5,
  "timestamp": "2024-01-15T10:30:00Z",
  "unit": "°C"
}
```

### smartfarm/sensor/{device_id}/humidity

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** false  
**Frequency:** Every 10 seconds

**Payload:**
```json
{
  "value": 65.0,
  "timestamp": "2024-01-15T10:30:00Z",
  "unit": "%"
}
```

### smartfarm/sensor/{device_id}/soil_moisture

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** false  
**Frequency:** Every 10 seconds

**Payload:**
```json
{
  "value": 45.0,
  "timestamp": "2024-01-15T10:30:00Z",
  "unit": "%"
}
```

### smartfarm/sensor/{device_id}/light

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** false  
**Frequency:** Every 10 seconds

**Payload:**
```json
{
  "value": 800.0,
  "timestamp": "2024-01-15T10:30:00Z",
  "unit": "lux"
}
```

### smartfarm/sensor/{device_id}/rain

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** false  
**Frequency:** Every 10 seconds

**Payload:**
```json
{
  "detected": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Pump Topics

### smartfarm/pump/{device_id}/command

**Direction:** Backend → Device  
**QoS:** 1  
**Retain:** false

**Start Command:**
```json
{
  "action": "start",
  "duration": 300,
  "reason": "manual"
}
```

**Stop Command:**
```json
{
  "action": "stop"
}
```

### smartfarm/pump/{device_id}/status

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** true  
**Frequency:** Every 10 seconds

**Payload:**
```json
{
  "is_running": true,
  "runtime_seconds": 45,
  "total_runtime_seconds": 3600,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Schedule Topics

### smartfarm/schedule/{schedule_id}/trigger

**Direction:** Backend → Device  
**QoS:** 1  
**Retain:** false

**Payload:**
```json
{
  "action": "start",
  "duration": 300,
  "schedule_id": 1,
  "schedule_name": "Morning Watering",
  "timestamp": "2024-01-15T06:00:00Z"
}
```

---

## Device Topics

### smartfarm/device/{device_id}/status

**Direction:** Device → Backend  
**QoS:** 1  
**Retain:** true  
**Frequency:** On connect/disconnect

**Online:**
```json
{
  "status": "online",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "14.0.0",
  "uptime": 86400,
  "free_heap": 45000,
  "rssi": -65
}
```

**Offline (Will message):**
```json
{
  "status": "offline",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Heartbeat Topic

### smartfarm/heartbeat

**Direction:** Device → Backend  
**QoS:** 0  
**Retain:** false  
**Frequency:** Every 30 seconds

**Payload:**
```json
{
  "device_id": "smartfarm_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "free_heap": 45000,
  "rssi": -65,
  "boot_counter": 5
}
```

---

## Notification Topics (Future)

### smartfarm/notification/{device_id}

**Direction:** Backend → Device  
**QoS:** 1  
**Retain:** false

**Payload:**
```json
{
  "type": "warning",
  "title": "Soil Moisture Low",
  "message": "Soil moisture is below threshold",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Telegram Topics (Future)

### smartfarm/telegram/send

**Direction:** Backend → Telegram Service  
**QoS:** 1  
**Retain:** false

**Payload:**
```json
{
  "chat_id": "123456789",
  "message": "Pump started for 5 minutes",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Subscription Patterns

### Backend Subscriptions

```
smartfarm/sensor/+/+              # All sensor data
smartfarm/pump/+/status           # All pump status
smartfarm/device/+/status         # All device status
smartfarm/heartbeat               # Heartbeat
smartfarm/schedule/+/trigger      # Schedule triggers
```

### Device Subscriptions

```
smartfarm/pump/{device_id}/command              # Pump commands
smartfarm/schedule/+/trigger                    # Schedule triggers
smartfarm/device/{device_id}/config             # Configuration updates
```

---

## QoS Levels

- **QoS 0:** At most once (fire and forget)
- **QoS 1:** At least once (acknowledged)
- **QoS 2:** Exactly once (not used)

---

## Retain Flag

- **true:** Message retained on broker
- **false:** Message not retained

Retained messages are useful for:
- Device status (online/offline)
- Pump status
- Last known values

---

## Payload Format

All payloads are JSON format with:
- `timestamp` - ISO8601 format
- `value` - Sensor reading or status
- `unit` - Measurement unit (if applicable)

---

## Example MQTT Flow

### Sensor Reading Flow

1. ESP8266 reads temperature: 25.5°C
2. Publishes to `smartfarm/sensor/smartfarm_001/temperature`
3. Backend receives and stores in database
4. Frontend subscribes to updates via WebSocket or polling

### Pump Control Flow

1. User clicks "Start Pump" in dashboard
2. Backend publishes to `smartfarm/pump/smartfarm_001/command`
3. ESP8266 receives command
4. ESP8266 starts pump for 300 seconds
5. ESP8266 publishes status to `smartfarm/pump/smartfarm_001/status`
6. Backend receives and updates database
7. Frontend updates UI

### Schedule Trigger Flow

1. Backend scheduler detects schedule time
2. Backend publishes to `smartfarm/schedule/{schedule_id}/trigger`
3. ESP8266 receives trigger
4. ESP8266 starts pump for scheduled duration
5. ESP8266 publishes status updates
6. Backend logs the action

---

## Testing MQTT

### Using mosquitto_sub

```bash
# Subscribe to all smartfarm topics
mosquitto_sub -h localhost -u admin -P password -t "smartfarm/#" -v

# Subscribe to specific topic
mosquitto_sub -h localhost -u admin -P password -t "smartfarm/sensor/smartfarm_001/temperature" -v
```

### Using mosquitto_pub

```bash
# Publish test sensor data
mosquitto_pub -h localhost -u admin -P password -t "smartfarm/sensor/smartfarm_001/temperature" -m '{"value":25.5,"timestamp":"2024-01-15T10:30:00Z"}'

# Publish pump command
mosquitto_pub -h localhost -u admin -P password -t "smartfarm/pump/smartfarm_001/command" -m '{"action":"start","duration":300}'
```

---

## Troubleshooting

### No messages received
1. Check MQTT broker is running
2. Verify credentials (username/password)
3. Check topic names (case-sensitive)
4. Verify QoS settings
5. Check firewall rules

### Messages not retained
1. Verify retain flag is set to true
2. Check broker configuration
3. Verify message is published before subscription

### Connection drops
1. Check network connectivity
2. Verify keepalive interval
3. Check broker logs
4. Verify credentials

---

## Performance Considerations

- Publish frequency: 10 seconds for sensors
- Heartbeat frequency: 30 seconds
- Message size: ~100-200 bytes
- Total bandwidth: ~1-2 KB/minute per device
- Suitable for low-bandwidth networks

---

## Security

- Use TLS/SSL for MQTT (port 8883)
- Use strong passwords
- Implement ACL on broker
- Validate all incoming messages
- Sanitize JSON payloads
