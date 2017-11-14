(function() {
	
	window.Core = {
	
		group: function(_id) {
			let result = null;
			Store.GroupMetadata.models.forEach(x => {
				if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
					result = x;
				}
			});
			return result;
		},
		
		contact: function(_id) {
			let result = null;
			Store.Contact.models.forEach(x => {
				if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
					result = x;
				}
			});
			return result;
		},
		
		chat: function(_id) {
			let result = null;
			Store.Chat.models.forEach(x => {
				if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
					result = x;
				}
			});
			return result;
		},
		
		find: function(collection, predicate) {
			let result = null;
			collection.forEach(x => {
				if (predicate(x)) {
					result = x;
				}
			});
			return result;
		},
		
		error: function(err, callback) {
			setTimeout(x => { (callback || Core.nop)({error: err}); }, 1);
		},
		
		nop: function() {}
		
	};
	
	window.API = {
		
		Error: {
			OK: true,
			USER_NOT_FOUND: "The specified user ID was not found",
			CHAT_NOT_FOUND: "The specified chat ID was not found",
			GROUP_NOT_FOUND: "The specified group metadata ID was not found",
			USER_NOT_IN_GROUP: "The specified user is not a member of the required group"
		},
		
		findContactId: function(phone_number) {
			var result = null;
			Store.Contact.models.forEach(x => {
				if (x.hasOwnProperty("__x_id") && (x.__x_id.match(/\d+/g) || []).join("") == phone_number) {
					result = x.__x_id;
				}
			});
			return result || null;
		},
		
		findChatIds: function(title) {
			var result = [];
			Store.Chat.models.forEach(x => {
				if (x.hasOwnProperty("__x_formattedTitle") && ~(x.__x_formattedTitle.indexOf(title))) {
					result.push(x.__x_id);
				}
			});
			return result;
		},
		
		addUserToGroup: function(user_id, group_id, callback) {
			var group = Core.group(group_id);
			var user = Core.contact(user_id);
			
			if (group == null) {
				Core.error(API.Error.GROUP_NOT_FOUND, callback);
				return;
			}
			if (user == null) {
				Core.error(API.Error.USER_NOT_FOUND, callback);
				return;
			}
			
			group.participants.addParticipant(user).then(callback);
		},
		
		removeUserFromGroup: function(user_id, group_id, callback) {
			var group = Core.group(group_id);
			if (group == null) {
				Core.error(API.Error.GROUP_NOT_FOUND, callback);
				return;
			}
			
			var user = Core.find(group.participants, x => x.hasOwnProperty("__x_id") && x.__x_id == user_id);
			if (user == null) {
				Core.error(API.Error.USER_NOT_IN_GROUP, callback || Core.nop);
				return;
			}
			
			group.participants.removeParticipant(user).then(callback);
		},
		
		setChatArchiveStatus: function(chat_id, archive_status, callback) {
			var chat = Core.chat(chat_id);
			if (chat == null) {
				Core.error(API.Error.CHAT_NOT_FOUND, callback);
				return;
			}
			
			chat.setArchive(archive_status).then(function() {
				(callback || Core.nop)({status: 200});
			});
		},
		
		getChatArchiveStatus: function(chat_id) {
			var chat = Core.chat(chat_id);
			if (chat == null) {
				return null;
			}
			
			return chat.archive;
		}
		
	};
	
})();


// Not used anymore. When all transported to the new API, will be deleted
/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
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

*/