/**
This is only a demo for establishing a websocket connection from the so-called 'host' to the webpage (through the background page & content script)
When the extension side is more developed, I'll get to writing the communication protocol documentation and to making some host modules for Python, JS, C# (maybe?)
**/

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
	
	ws.send(JSON.stringify({type: "cmd", cmd: "retrieve_chat_id", msg_id: "12345", args: {title: "Liszt"}}));
});

console.log("A");