const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8054 });

wss.on("connection", function(ws) {
	
	ws.on("message", function(data) {
		console.log(data);
	});
	
	ws.send(JSON.stringify({type: "connection", status: "connected"}));
	console.log("connected");
	
	ws.on("close", function() {
		console.log("Connection closed");
	});
});

console.log("A");