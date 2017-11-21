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
	
	setTimeout(function() {
		ws.send(JSON.stringify({type: "cmd", cmd: "send_message_to_num", msg_id: "1ab8374f", args: {number: "972503472393", message: "Test message from Python"}}));
	}, 5000);
});

console.log("A");