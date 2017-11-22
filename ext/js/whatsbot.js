(function() {
	
	/*
	Sends a message to the background page (content script -> background page [-> host])
	*/
	window.serverMessage = function(data) {
		document.getElementById("whatsapp_messaging").dispatchEvent(new CustomEvent("whatsapp_message", { "detail": data }));
	};
	
	/*
	Handlers for messages coming from the background page or from the host
	*/
	var handlers = {
		
		/*
		For updating the text alert
		*/
		"update_text": function(d) {
			document.getElementById("text_msg").innerHTML = d.text;
		},
		
		/*
		For executing a command request from the host.
		Should return a response for each command.
		*/
		"cmd": function(d) {
			({
				"send_message_to_num": function(d) {
					API.sendTextMessage(API.findContactId(d.args.number), d.args.message, function(e) {
						serverMessage({type: "response", msg_id: d.msg_id, args: e});
					});
				},
				"retrieve_contacts": function(d) {
					if (d.args.number.constructor.name == "Array") {
						var result = {};
						for (var i = 0; i < d.args.number.length; i++) {
							var contact = Core.contact(API.findContactId(d.args.number[i]));
							if (contact)
								result[d.args.number[i]] = contact.all;
						}
						serverMessage({type: "response", msg_id: d.msg_id, args: {result: result}})
					}
					else {
						var result;
						var contact = Core.contact(API.findContactId(d.args.number));
						if (contact)
							result = contact.all;
						serverMessage({type: "response", msg_id: d.msg_id, args: {result: result}});
					}
				},
				"retrieve_chat_id": function(d) { // Not working - need to check
					var query = API.findChatIds(d.args.title);
					var result = [];
					for (var i = 0; i < query.length; i++) {
						result.push(Core.chat(query[i]));
					}
					serverMessage({type: "response", msg_id: d.msg_id, args: {result: result}});
				}
			})[d.cmd](d);
		}
	};
	
	/*
	Receiving messages from the host/background page
	*/
	window.messageFromServer = function(data) {
		console.log("Received message from server ", data);
		handlers[data.type](data);
	};
	
	/*
	For the DOM communication between the page and the content script
	*/
	document.getElementById("whatsapp_messaging").addEventListener("content_message", function(e) {
		messageFromServer(e.detail);
	});
	
	/*
	For showing the blocking alert and status message on the page
	*/
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
	
	/*
	For removing the blocking alert and status message on the page
	*/
	function removeControlMessage() {
		var m = document.getElementById("whatsapp_control_message");
		m.remove();
	}
	
	/*
	Sending a signal to the background page to stop the connection to the host
	*/
	function stop_bot() {
		serverMessage({type: "stop"});
		removeControlMessage();
	}
		
	/*
	Listening to the `ready` event of the API.
	*/
	API.ready().then(function() {
		showControlMessage();
		serverMessage({type: "start"});
	});
})();