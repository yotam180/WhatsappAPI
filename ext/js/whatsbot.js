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
	
	function showControlMessage() {
		m = document.createElement('div');
		m.innerHTML = `<style>@-webkit-keyframes xopen { 0% {height: 0; width: 90%;} 100% {height: 5%; width: 100%;} } </style><div style="height: 5%; width: 100%; background-color: rgba(0, 204, 0, 0.4); z-index: 1000; position: fixed; text-align: center; vertical-align: middle; -webkit-animation: xopen 1s;"></div>`;
		document.body.appendChild(m)
		setTimeout(() => { m.children[1].innerHTML = "<br/>WhatsApp is being controlled by WhatsBot&trade;"; }, 1000)
	}
		
	
	
	
	API.ready().then(function() {
		showControlMessage();
	});
})();