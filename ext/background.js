chrome.webNavigation.onCompleted.addListener(function(details) {
	
	if (~details.url.indexOf("https://web.whatsapp.com/")) {
		console.log("Injecting");
		chrome.tabs.executeScript(details.tabId, {file: "js/content.js"});
	}
	
});

var whatsapp_tab_id = -1;

function clientMessage(data) {
	chrome.tabs.sendMessage(whatsapp_tab_id, data);
}

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (sender.tab) {
		// From content script
		console.log("Background page received: ", request, sender);
		if (request.type == "start") {
			whatsapp_tab_id = sender.tab.id;
		}
	}
});