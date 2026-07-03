
const ws = new WebSocket("ws://localhost:3000");

ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if(msg.topic && msg.topic.includes("sensor")) {
        document.getElementById("sensor").innerText = msg.data;
    }

    if(msg.topic && msg.topic.includes("pump")) {
        document.getElementById("pump").innerText = msg.data;
    }
};
