/*
ws is our websocket connection to the WhatsBot host.
When null - we are not connected. It is initialized in handlers["start"]
*/
var ws = null;

/*
Injecting the content script into the WhatsApp webpage and reseting the connection settings to the host.
*/
chrome.webNavigation.onCompleted.addListener(function(details) {
	
	if (~details.url.indexOf("https://web.whatsapp.com/")) {
		console.log("Injecting");
		
		// Updating the work status to `true` (we want the default behaviour to be our bot working)
		bot_working = true;
		
		// Closing the previously created connection and creating a new one.
		if (ws) {
			ws.onclose = null;
			ws.close();
			ws = null;
		}
		
		// Injecting the content script into the page.
		chrome.tabs.executeScript(details.tabId, {file: "js/content.js"});
	}
	
});

/*
This variable is responsible for keeping track of the active WhatsApp tab.
It is updated once the tab communicates with the background page (sends a type:start request)
*/
var whatsapp_tab_id = -1;

/*
This boolean determines if the bot is working or not. If not, messages won't be passed around from the webpage to the host and vice-versa.
*/
var bot_working = true;

/*
Passes a message to the client (dict-obj)
Full journey from here - to content script, then to the webpage through the DOM
*/
function clientMessage(data) {
	chrome.tabs.sendMessage(whatsapp_tab_id, data);
}

/*
Handlers for messages incoming from the webpage (through the content script)
*/
var handlers = {
	/*
	Starting a new WhatsApp session - creating a new websocket connection to the host,
	initializing everything and sending a "connected" text back to the webpage.
	*/
	"start": function(msg) {
		
		// Sending information to the webpage.
		clientMessage({type: "update_text", text: "Trying to connect to WhatsBot&trade; host"});
		
		// Initializing a new websocket connection
		ws = new WebSocket("ws://localhost:8054/");
		
		function onmsg(m) {
			if (bot_working && ws) {
				clientMessage(m);
			}
		}
		
		// Listening to incoming messages from the host
		ws.onmessage = function(d) {
			if (d.data.constructor.name == "Blob") {
				var reader = new FileReader();
				reader.onload = function() {
					onmsg(JSON.parse(reader.result));
				}
				reader.readAsText(d.data);
			}
			else {
				var m = JSON.parse(d.data);
				onmsg(m);
			}
			
		};
		
		// When the connection is opened, sending more info to the webpage
		ws.onopen = function() {
			clientMessage({type: "update_text", text: "Connected to WhatsBot&trade; host"});
		};
		
		// When the connection is closed, sending info to the webpage and trying to reconnect.
		ws.onclose = function() {
			clientMessage({type: "update_text", text: "The connection to WhatsBot&trade; host has ended."});
			setTimeout(function() {
				if (bot_working)
					handlers["start"]();
			}, 5000);
		};
	},
	
	/*
	Stopping the connection - marking the bot_working to `false` and closing the websocket connection.
	*/
	"stop": function(msg) {
		bot_working = false;
		
		// Closing the websocket
		if (ws) {
			ws.onclose = null;
			ws.close();
			ws = null;
		}
	},
	
	/*
	Passing a response to a command from the webpage to the host.
	*/
	"response": function(msg) {
		ws.send(JSON.stringify(msg));
	},
	
	/*
	Passing a callback to a command from the webpage to the host.
	*/
	"callback": function(msg) {
		ws.send(JSON.stringify(msg));
	},
	
	/*
	Passing a message to a command from the webpage to the host.
	*/
	"event": function(msg) {
		ws.send(JSON.stringify(msg));
	},
}

/*
Listening to messages from the content script (webpage -> content script -> *backgrund page* -> host)
*/
chrome.runtime.onMessage.addListener(function(request, sender) {
	if (sender.tab) {
		// From content script
		console.log("Background page received: ", request, sender);
		
		// Updating the whatsapp_tab_id if required
		if (request.type == "start") {
			whatsapp_tab_id = sender.tab.id;
		}
		
		// Firing the correct handler
		handlers[request.type](request);
	}
});

