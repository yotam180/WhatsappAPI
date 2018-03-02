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

window.on_load = function() {
	// Here we can do everything we want with Store
}

function err(msg) {
	return {"status": "error", "error": msg};
}

function strip_chat(x) {
	m = {...x}
	delete m.mirror;
	delete m.msgs;
	delete m.collection;
	delete m._listeningTo;
	delete m.__x_mute;
	delete m._events;
	return m;
}

function strip_contact(x) {
	m = {...x}
	delete m._events;
	delete m.collection;
	delete m.mirror;
	return m;
}

COMMANDS = {
	/*
	Returns chat objects by title matching
	*/
	"find_chats": function(args) {
		if (!args["title"]) {
			return err("No 'title' parameter provided");
		}
		var title = args.title;
		
		var res = [];
		Store.Chat.models.forEach(x => {
			if (x.hasOwnProperty("__x_formattedTitle") &&
				~x.__x_formattedTitle.indexOf(title)) {
					res.push(strip_chat(x));
				}
		});
		
		return {"status": "success", "data": res};
	},
	
	/*
	Returns the contact object by phone number
	*/
	"find_contact": function(args) {
		if (!args["phone"]) {
			return err("No 'phone' parameter provided");
		}
		var phone = args.phone;
		
		var res = null;
		Store.Contact.models.forEach(x => {
			if (x.hasOwnProperty("__x_id") &&
				(x.__x_id.match(/\d+/g) || []).join("") == phone)
			{
				res = strip_contact(x);
			}
		});
		
		return {"status" : "success", "data": res}
	}
}