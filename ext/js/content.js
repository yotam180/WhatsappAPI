(function() {
	
	// For receiving messages from WhatsApp
	var messageFromClient = function(data) {
		console.log("Received message from client ", data);
		
	};
	
	// Constructing a new messaging DOM element
	var messaging = document.createElement("div");
	messaging.id = "whatsapp_messaging";
	
	// Attaching a listener for messages from WhatsApp
	messaging.addEventListener("whatsapp_message", function(e) {
		messageFromClient(e.detail);
	});
	
	// Injecting the element
	(document.head || document.documentElement).appendChild(messaging);
	
	// For sending messages to WhatsApp
	var clientMessage = function(data) {
		document.getElementById("whatsapp_messaging").dispatchEvent(new CustomEvent("content_message", { "detail": data }));
	};
	
	
	// Loading the API
	var api = document.createElement("script");
	api.src = chrome.extension.getURL("js/api.min.js");
	(document.head || document.documentElement).appendChild(api);
	
	// Loading the WhatsBot script
	var el = document.createElement("script");
	el.src = chrome.extension.getURL("js/whatsbot.js");
	(document.head || document.documentElement).appendChild(el);
	
	
})();