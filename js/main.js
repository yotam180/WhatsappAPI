window.WhatsAPI = {

	getGroupMetadata: function(_id) {
		var c = null;
		Store.GroupMetadata.models.forEach(x => { 
			if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
				c = x;
			}
		});
		return c;
	},

	getContact: function(contactnum) {
		var c = null;
		Store.Contact.models.forEach(x => { 
			if ((x.hasOwnProperty("__x_id") && x.__x_id.match(/\d+/g) || []).join("") == contactnum) {
				c = x;
			}
		});
		return c;
	},
	
	getChat: function(contactnum) {
		var c = null;
		Store.Chat.models.forEach(x => { 
			if (x.hasOwnProperty("__x_id") && x.__x_id == contactnum) {
				c = x;
			}
		});
		return c;
	},

	getChats: function(title) {
		var chats = [];
		Store.Chat.models.forEach(x => { 
			if (x.hasOwnProperty("__x_formattedTitle") && ~x.__x_formattedTitle.indexOf(title)) {
				chats.push(x.__x_id);
			}
		});
		return chats;
	},
	
	addUserToGroup: function(user, group) {
		group.participants.addParticipant(user);
	},
	
	sendMessageToUser: function(user, message) {
		user.sendMessage(message);
	},
	
	sendMessageToNumber: function(number, message) {
		var contact = WhatsAPI.getChat(number);
		if (contact) {
			contact.sendMessage(message);
			return true;
		}
		return false;
	},
	
	setChatToArchive: function(chat, archive) {
		chat.setArchive(archive);
	},
	
	setArchive: function(chat_id, archive) {
		chat = WhatsAPI.getChat(chat_id);
		if (chat) {
			chat.setArchive(archive);
			return true;
		}
		return false;
	},
	
	setUserBlock: function(user, block) {
		user.setBlock(block);
	},
	
	setBlock: function(user_id, block) {
		var user = WhatsAPI.getContact(user_id);
		if (user) {
			user.setBlock(block);
			return true;
		}
		return false;
	}

}
