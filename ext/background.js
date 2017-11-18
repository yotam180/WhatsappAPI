chrome.webNavigation.onCompleted.addListener(function(details) {
	
	if (~details.url.indexOf("https://web.whatsapp.com/")) {
		console.log("Injecting");
		chrome.tabs.executeScript(details.tabId, {file: "js/content.js"});
	}
	
});

/*chrome.runtime.onConnect.addListener(function(port) {
	if (port.name != "WhatsBotPort") {
		return;
	}
	
	
});*/