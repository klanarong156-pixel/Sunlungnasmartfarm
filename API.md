# SmartFarm V14 API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints (except `/auth/login`) require JWT token in Authorization header:

```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### POST /auth/login

Login with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@smartfarm.local",
    "role": "admin"
  }
}
```

### POST /auth/logout

Logout and invalidate token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/refresh

Refresh JWT token.

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/profile

Get current user profile.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@smartfarm.local",
    "role": "admin",
    "full_name": "Administrator",
    "last_login": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /auth/profile

Update user profile.

**Request:**
```json
{
  "full_name": "New Name",
  "email": "newemail@smartfarm.local"
}
```

### POST /auth/change-password

Change user password.

**Request:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

---

## Sensor Endpoints

### GET /sensors

Get all sensors.

**Response:**
```json
{
  "success": true,
  "sensors": [
    {
      "id": 1,
      "device_id": "smartfarm_001",
      "sensor_type": "temperature",
      "name": "Indoor Temperature",
      "unit": "°C",
      "min_value": 0,
      "max_value": 50,
      "last_value": 25.5,
      "last_update": "2024-01-15T10:30:00Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /sensors/:id

Get sensor details.

**Response:**
```json
{
  "success": true,
  "sensor": {
    "id": 1,
    "device_id": "smartfarm_001",
    "sensor_type": "temperature",
    "name": "Indoor Temperature",
    "unit": "°C",
    "last_value": 25.5,
    "last_update": "2024-01-15T10:30:00Z"
  }
}
```

### POST /sensors

Create new sensor (Operator+).

**Request:**
```json
{
  "device_id": "smartfarm_001",
  "sensor_type": "temperature",
  "name": "Indoor Temperature",
  "unit": "°C",
  "min_value": 0,
  "max_value": 50
}
```

### PUT /sensors/:id

Update sensor (Operator+).

**Request:**
```json
{
  "name": "Updated Name",
  "is_active": true
}
```

### DELETE /sensors/:id

Delete sensor (Operator+).

### POST /sensors/:id/data

Record sensor data (No auth required for IoT devices).

**Request:**
```json
{
  "value": 25.5
}
```

### GET /sensors/:id/history

Get sensor history.

**Query Parameters:**
- `startDate` - Start date (ISO8601)
- `endDate` - End date (ISO8601)
- `limit` - Maximum records (default: 1000)

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "value": 25.5,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /sensors/:id/statistics

Get sensor statistics.

**Query Parameters:**
- `days` - Number of days (default: 7)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "count": 100,
    "average": 24.5,
    "minimum": 20.0,
    "maximum": 30.0,
    "stddev": 2.5
  }
}
```

### GET /sensors/realtime/status

Get all sensors real-time status.

---

## Pump Endpoints

### GET /pumps

Get all pumps.

### GET /pumps/:id

Get pump details.

### POST /pumps

Create new pump (Operator+).

**Request:**
```json
{
  "device_id": "smartfarm_001",
  "name": "Main Pump",
  "relay_pin": 5
}
```

### PUT /pumps/:id

Update pump (Operator+).

### DELETE /pumps/:id

Delete pump (Operator+).

### POST /pumps/:id/start

Start pump manually (Operator+).

**Request:**
```json
{
  "duration_seconds": 300
}
```

### POST /pumps/:id/stop

Stop pump manually (Operator+).

### GET /pumps/:id/history

Get pump history.

**Query Parameters:**
- `startDate` - Start date
- `endDate` - End date
- `limit` - Maximum records (default: 500)

### GET /pumps/:id/statistics

Get pump statistics.

**Query Parameters:**
- `days` - Number of days (default: 7)

### GET /pumps/realtime/status

Get all pumps real-time status.

---

## Schedule Endpoints

### GET /schedules

Get all schedules.

### GET /schedules/:id

Get schedule details.

### POST /schedules

Create new schedule (Operator+).

**Request:**
```json
{
  "pump_id": 1,
  "name": "Morning Watering",
  "start_time": "06:00",
  "duration_seconds": 300,
  "days_of_week": "monday,tuesday,wednesday,thursday,friday",
  "rain_skip": true,
  "holiday_mode": false
}
```

### PUT /schedules/:id

Update schedule (Operator+).

### DELETE /schedules/:id

Delete schedule (Operator+).

### POST /schedules/:id/enable

Enable schedule (Operator+).

### POST /schedules/:id/disable

Disable schedule (Operator+).

### POST /schedules/:id/pause

Pause schedule (Operator+).

### POST /schedules/:id/resume

Resume schedule (Operator+).

### POST /schedules/:id/duplicate

Duplicate schedule (Operator+).

### GET /schedules/pump/:pumpId

Get schedules for specific pump.

---

## Weather Endpoints

### GET /weather/current

Get current weather.

**Query Parameters:**
- `latitude` - Latitude (default: from settings)
- `longitude` - Longitude (default: from settings)

**Response:**
```json
{
  "success": true,
  "weather": {
    "temperature": 25.5,
    "humidity": 65,
    "weatherCode": 0,
    "description": "Clear sky",
    "windSpeed": 5.2,
    "cloudCover": 10,
    "rain": 0,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### GET /weather/forecast

Get weather forecast.

**Query Parameters:**
- `latitude` - Latitude
- `longitude` - Longitude
- `days` - Number of days (default: 7)

### GET /weather/settings

Get weather settings.

### PUT /weather/settings

Update weather settings (Admin+).

**Request:**
```json
{
  "latitude": 13.7563,
  "longitude": 100.5018,
  "cache_minutes": 30
}
```

### GET /weather/offline

Get offline weather data (cached).

---

## Settings Endpoints

### GET /settings

Get all settings.

### GET /settings/:key

Get specific setting.

### PUT /settings/:key

Update setting (Admin+).

**Request:**
```json
{
  "value": "new_value",
  "type": "string",
  "description": "Setting description"
}
```

### POST /settings/batch

Update multiple settings (Admin+).

**Request:**
```json
{
  "settings": [
    {
      "key": "farm_name",
      "value": "My Farm",
      "type": "string"
    }
  ]
}
```

### DELETE /settings/:key

Delete setting (Admin+).

### GET /settings/system/info

Get system information.

**Response:**
```json
{
  "success": true,
  "system": {
    "uptime": 86400,
    "memory": {
      "heapUsed": 45,
      "heapTotal": 256,
      "external": 10
    },
    "database": {
      "sensor_count": 5,
      "pump_count": 2,
      "schedule_count": 10,
      "user_count": 3,
      "log_count": 1000
    }
  }
}
```

### GET /settings/farm/info

Get farm information.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "status": 400
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token",
  "status": 401
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required",
  "status": 403
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "status": 404
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "status": 429
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "status": 500
}
```

---

## Rate Limiting

- Window: 15 minutes (900,000 ms)
- Max requests: 100 per window
- Returns 429 when limit exceeded

## Pagination

Not implemented yet. Use `limit` parameter for result limiting.

## Sorting

Not implemented yet. Results are returned in default order.

## Filtering

Use query parameters for filtering (sensor_type, is_active, etc.)

---

## Versioning

Current API Version: **v1**

Future versions will be available at `/api/v2`, `/api/v3`, etc.

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Authentication with JWT
- Sensors, Pumps, Schedules management
- Weather integration
- Settings management
