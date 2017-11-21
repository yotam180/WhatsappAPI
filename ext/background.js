var ws = null;

chrome.webNavigation.onCompleted.addListener(function(details) {
	
	if (~details.url.indexOf("https://web.whatsapp.com/")) {
		console.log("Injecting");
		bot_working = true;
		if (ws) {
			ws.onclose = null;
			ws.close();
			ws = null;
		}
		chrome.tabs.executeScript(details.tabId, {file: "js/content.js"});
	}
	
});

var whatsapp_tab_id = -1;
var bot_working = true;
function clientMessage(data) {
	chrome.tabs.sendMessage(whatsapp_tab_id, data);
}

var handlers = {
	"start": function(msg) {
		clientMessage({type: "update_text", text: "Trying to connect to WhatsBot&trade; host"});
		ws = new WebSocket("ws://localhost:8054/");
		ws.onmessage = function(d) {
			var m = JSON.parse(d.data);
			if (bot_working && m.type == "cmd") {
				clientMessage(m);
			}
		};
		ws.onopen = function() {
			clientMessage({type: "update_text", text: "Connected to WhatsBot&trade; host"});
		};
		ws.onclose = function() {
			clientMessage({type: "update_text", text: "The connection to WhatsBot&trade; host has ended."});
			setTimeout(function() {
				if (bot_working)
					handlers["start"]();
			}, 5000);
		};
	},
	"stop": function(msg) {
		bot_working = false;
	},
	"response": function(msg) {
		ws.send(JSON.stringify(msg));
	}
}

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (sender.tab) {
		// From content script
		console.log("Background page received: ", request, sender);
		if (request.type == "start") {
			whatsapp_tab_id = sender.tab.id;
		}
		handlers[request.type](request);
	}
});

