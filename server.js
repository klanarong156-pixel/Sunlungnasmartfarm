
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// realtime cache
let latest = {};

mqttClient.on('connect', () => {
    mqttClient.subscribe('farm/#');
});

mqttClient.on('message', (topic, msg) => {
    latest[topic] = msg.toString();

    wss.clients.forEach(c => {
        if (c.readyState === 1) {
            c.send(JSON.stringify({ topic, data: msg.toString() }));
        }
    });
});

// API
app.get('/state', (req,res)=>res.json(latest));

// websocket
wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type:'init', data: latest }));
});

server.listen(3000, () => console.log('SMART FARM PLATFORM RUNNING'));
