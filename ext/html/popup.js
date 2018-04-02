window.onload = function() {
	document.getElementById("verspan").innerHTML = chrome.runtime.getManifest().version;
};