/*
API Listener - listens for new events (via messages) and handles them.
*/
var Listener = function() {
	
	var self = this;
	
	this.ExternalHandlers = {
		
		/*
		Parameters:
			1. The user that joined
			2. The user that added them (undefined if they used a link? Should be checked)
			3. The chat the user was added to
		*/
		USER_JOIN_GROUP: [],
		
		/*
		Parameters:
			1. The user that was removed
			2. The user that removed them (undefined if they used a link? Should be checked)
			3. The chat the user was removed from
		*/
		USER_LEAVE_GROUP: [],
		
		/*
		Parameters:
			1. The group ID
			2. The user that changed the title
			3. The new title
			4. The subject type (should be 'subject')
		*/
		GROUP_SUBJECT_CHANGE: [],
		
		/*
		Parameters:
			1. Sender of the message
			2. Chat the message was sent at
			3. Parsed Msg object
		*/
		MESSAGE_RECEIVED: []
	};
	
	/*
	Handlers for different message types
	*/
	var handlers = [
		/*
		User join / leave group.
		*/
		{
			predicate: msg => msg.__x_isNotification && msg.__x_eventType == "i" && msg.__x_type == "gp2",
			handler: function(msg) {
				var is_join = Core.chat(msg.chat.__x_id).isGroup && !!Core.find(Core.group(msg.chat.__x_id).participants, x => msg.recipients && x.__x_id == msg.recipients[0]); // If anyone has a better way to implement this one, please help!
				var object = msg.__x_recipients[0];
				var subject = msg.__x_sender;
				var chat = msg.chat.__x_id;
				
				if (is_join) {
					self.ExternalHandlers.USER_JOIN_GROUP.forEach(x => x(object, subject, chat));
				}
				else {
					self.ExternalHandlers.USER_LEAVE_GROUP.forEach(x => x(object, subject, chat));
				}
			}
		},
		/*
		Group subject change.
		*/
		{
			predicate: msg => msg.__x_isNotification && msg.__x_eventType == "n",
			handler: function(msg) {
				var chat = msg.__x_to;
				var changer = msg.__x_sender;
				var new_title = msg.__x_body;
				var subtype = msg.__x_subtype;
				self.ExternalHandlers.GROUP_SUBJECT_CHANGE.forEach(x => x(chat, changer, new_title, subtype));
			}
		},
		/*
		Message received
		*/
		{
			predicate: msg => msg.__x_isUserCreatedType && !msg.__x_isNotification && !msg.__x_isSentByMe,
			handler: function(msg) {
				var sender = msg.__x_sender;
				var chat = msg.__x_from;
				self.ExternalHandlers.MESSAGE_RECEIVED.forEach(x => x(sender, chat, msg));
			}
		}
	];
	
	/*
	Handles a new incoming message
	*/
	var handle_msg = function(msg) {
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].predicate(msg)) {
				handlers[i].handler(msg);
				console.log("Firing handler " + i);
				return;
			}
		}
		console.log("No suitable handlers were found for ", msg);
	};
	
	/*
	Goes through messages and filters new ones out. Then calls handle_msg on the newly created ones.
	*/
	var check_update = function() {
		Store.Msg.models.forEach(model => {
			if (model.__x_isNewMsg) {
				model.__x_isNewMsg = false;
				handle_msg(model);
			}
		});
	};
	
	/*
	Clears previously created listeners and starts a new one.
	*/
	this.listen = function() {
		if (window.API_LISTENER_TOKEN) {
			clearInterval(window.API_LISTENER_TOKEN);
		}
		
		window.API_LISTENER_TOKEN = setInterval(check_update, 10);
	};
	
};

/*
The core scripts of the API. Currently is public through `window` but will be hidden in production mode.
*/
window.Core = {
	
	/*
	Returns a WhatsApp GroupMetadata object from a given group id.
	*/
	group: function(_id) {
		let result = null;
		Store.GroupMetadata.models.forEach(x => {
			if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
				result = x;
			}
		});
		return result;
	},
	
	/*
	Returns a WhatsApp Contact object from a given contact id.
	*/
	contact: function(_id) {
		let result = null;
		Store.Contact.models.forEach(x => {
			if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
				result = x;
			}
		});
		return result;
	},
	
	/*
	Returns a WhatsApp Chat object from a given chat id.
	*/
	chat: function(_id) {
		let result = null;
		Store.Chat.models.forEach(x => {
			if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
				result = x;
			}
		});
		return result;
	},
	
	/*
	Returns a WhatsApp Msg object from a given serialized messsage id
	*/
	msg: function(_id) {
		let result = null;
		Store.Msg.models.forEach(x => {
			if (x.hasOwnProperty("__x_id") && x.__x_id._serialized == _id) {
				result = x;
			}
		});
		return result;
	},
	
	/*
	Returns the element of a collection that satisfies a predicate condition.
	*/
	find: function(collection, predicate) {
		let result = null;
		collection.forEach(x => {
			if (predicate(x)) {
				result = x;
			}
		});
		return result;
	},
	
	/*
	Calls a callback with an error object.
	*/
	error: function(err, callback) {
		return {"status": "error", "error": msg};
	},
	
	/*
	Does nothing.
	*/
	nop: function() {},
	
	strip_chat: function(x) {
		m = {...x}
		delete m.mirror;
		delete m.msgs;
		delete m.collection;
		delete m._listeningTo;
		delete m.__x_mute;
		delete m._events;
		return m;
	},
	
	strip_contact: function(x) {
		m = {...x}
		delete m._events;
		delete m.collection;
		delete m.mirror;
		return m;
	},
	
	strip_msg: function(x) {
		m = {...x}
		delete m.collection;
		delete m.mirror;
		delete m.labels;
		delete m.__x_chat;
		delete m.__x_msgChunk;
		delete m.__x_senderObj;
		delete m._events;
		delete m._listeningTo;
		return m;
	},
	
	callback: function(cid, mid, obj) {
		serverMessage({type: "callback", mid: mid, payload: obj});
	},
	
};

window.COMMANDS = {
	/*
	Updates the text of the control panel
	*/
	"update_text": function(args) {
		document.getElementById("text_msg").innerHTML = args.text;
		return null;
	},
	
	/*
	Returns chat objects by title matching
	*/
	"find_chats": function(args) {
		if (!args["title"]) {
			return Core.error("No 'title' parameter provided");
		}
		var title = args.title;
		
		var res = [];
		Store.Chat.models.forEach(x => {
			if (x.hasOwnProperty("__x_formattedTitle") &&
				~x.__x_formattedTitle.indexOf(title)) {
					res.push(Core.strip_chat(x));
				}
		});
		
		return {"status": "success", "data": res};
	},
	
	/*
	Returns the contact object by phone number
	*/
	"find_contact": function(args) {
		if (!args["phone"]) {
			return Core.error("No 'phone' parameter provided");
		}
		var phone = args.phone;
		
		var res = null;
		Store.Contact.models.forEach(x => {
			if (x.hasOwnProperty("__x_id") &&
				(x.__x_id.match(/\d+/g) || []).join("") == phone)
			{
				res = Core.strip_contact(x);
			}
		});
		
		return {"status" : "success", "data": res}
	},
	
	/*
	Adds a contact to a group, based on their id
	*/
	"add_user_to_group": function(args) {
		if (!args["user_id"]) {
			return Core.error("No 'user_id' parameter provided");
		}
		var user_id = args.user_id;
		
		if (!args["group_id"]) {
			return Core.error("No 'group_id' parameter provided");
		}
		var group_id = args.group_id;
		
		var group = Core.group(group_id);
		var user = Core.contact(user_id);
		
		if (group == null) {
			return Core.error("The group ID could not be found");
		}
		
		if (user == null) {
			return Core.error("The user ID could not be found");
		}
		
		let callback_id = Math.round(Math.random() * 1e17);
		var res = group.participants.addParticipant(user).then(function() {
			Core.callback(callback_id, args.mid, {"status": "success"});
		});
		
		if (res["_value"]) {
			return {"status": "undeterminate", "data": res._value.message};
		}
		return {"status": "pending", "callback": callback_id};
	},
	
	/*
	Sends a text message in a given chat.
	*/
	"send_message": function(args) {
		if (!args["chat_id"]) {
			return Core.error("No 'chat_id' parameter provided");
		}
		var chat_id = args.chat_id;
		
		if (!args["body"]) {
			return Core.error("No 'body' parameter provided");
		}
		var body = args.body;
		
		var chat = Core.chat(chat_id);
		if (chat == null) {
			return Core.error("Could not find the chat ID");
		}
		
		let callback_id = args.mid;
		var res = chat.sendMessage(body).then(function(e) {
			Core.callback(callback_id, args.mid, {"status": "success"});
		});
		
		if (res["_value"]) {
			return {"status": "undeterminate", "data": res._value.message};
		}
		return {"status": "pending", "callback": callback_id};
	}
};

// ######################################################################################################################################################

(function() {
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
		//console.log("Received message from server ", data);
		if (data.hasOwnProperty("type")) {
			result = COMMANDS[data.type](data);
			if (result) {
				serverMessage({type: "response", mid: data.mid, payload: result});
			}
		}
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
	
	
	window.on_load = function() {
		
		window.listener = new Listener();
		listener.listen();

		listener.ExternalHandlers.MESSAGE_RECEIVED.push(function(sender, chat, msg) {
			console.log("MESSAGEIN", msg);
			serverMessage(JSON.parse(JSON.stringify({type: "event", payload: {type: "message_received", sender: sender, chat: chat, message: Core.strip_msg(msg)}})));
		});
		
		showControlMessage();
		serverMessage({"type": "start"});
	}
	
	(function() {
		var check = function() {
			if (window["Store"]) {
				window["on_load"]();
			}
			else {
				setTimeout(check, 100);
			}
		}
		check();
	})();
})();