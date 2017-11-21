(function() {
	
	window.serverMessage = function(data) {
		document.getElementById("whatsapp_messaging").dispatchEvent(new CustomEvent("whatsapp_message", { "detail": data }));
	};
	
	var handlers = {
		"update_text": function(d) {
			document.getElementById("text_msg").innerHTML = d.text;
		}
	};
	
	window.messageFromServer = function(data) {
		console.log("Received message from server ", data);
		handlers[data.type](data);
	};
	
	document.getElementById("whatsapp_messaging").addEventListener("content_message", function(e) {
		messageFromServer(e.detail);
	});
	
	function showControlMessage() {
		var m = document.createElement('div');
		m.id = "whatsapp_control_message";
		m.innerHTML = `<style>@-webkit-keyframes xopen { 0% {height: 90%; width: 100%;} 100% {height: 100%; width: 100%;} } </style><div style="height: 100%; width: 100%; background-color: rgba(0, 204, 0, 0.2); z-index: 1000; position: fixed; text-align: center; vertical-align: middle; -webkit-animation: xopen 1s;"></div>`;
		document.body.appendChild(m)
		setTimeout(() => { 
			m.children[1].innerHTML = "<br/><br/><br/><br/><div style='margin: auto; width: 80%; padding: 30px; border-radius: 5px; background-color: white;'><div id='text_msg'>WhatsApp is being controlled by WhatsBot&trade;</div><br/><br/><a id='cancel_bot' href='#'>Stop bot action</a></div>"; 
			document.getElementById("cancel_bot").addEventListener("click", stop_bot);
		}, 1);
	}
	
	function removeControlMessage() {
		var m = document.getElementById("whatsapp_control_message");
		m.remove();
	}
	
	function stop_bot() {
		serverMessage({type: "stop"});
		removeControlMessage();
	}
		
	
	
	
	API.ready().then(function() {
		showControlMessage();
		serverMessage({type: "start"});
	});
})();