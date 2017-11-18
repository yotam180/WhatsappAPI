(function() {
	
	window.serverMessage = function(data) {
		document.getElementById("whatsapp_messaging").dispatchEvent(new CustomEvent("whatsapp_message", { "detail": data }));
	};
	
	window.messageFromServer = function(data) {
		console.log("Received message from server ", data);
	};
	
	document.getElementById("whatsapp_messaging").addEventListener("content_message", function(e) {
		messageFromServer(e.detail);
	});
})();