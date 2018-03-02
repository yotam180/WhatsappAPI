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
	
	callback: function(cid, obj) {
		console.log("Callback", cid, obj);
	}
	
};

window.on_load = function() {
	// Here we can do everything we want with Store
}

COMMANDS = {
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
			Core.callback(callback_id, {"status": "success"});
		});
		
		if (res["_value"]) {
			return {"status": "undeterminate", "data": res._value.message};
		}
		return {"status": "pending", "callback": callback_id};
	}
}