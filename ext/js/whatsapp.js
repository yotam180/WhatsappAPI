/*
Sends a message to the background page (content script -> background page [-> host])
*/
window.serverMessage = function(data) {
	document.getElementById("whatsapp_messaging").dispatchEvent(new CustomEvent("whatsapp_message", { "detail": data }));
};

/*
Receiving messages from the host/background page
*/
window.messageFromServer = function(data) {
	console.log("Received message from server ", data);
};

/*
For the DOM communication between the page and the content script
*/
document.getElementById("whatsapp_messaging").addEventListener("content_message", function(e) {
	messageFromServer(e.detail);
});