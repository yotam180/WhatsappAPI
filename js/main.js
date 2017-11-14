(function() {
	
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
			setTimeout(x => { (callback || Core.nop)({error: err}); }, 1);
		},
		
		/*
		Does nothing.
		*/
		nop: function() {}
		
	};
	
	/*
	API Listener - listens for new events (via messages) and handles them.
	*/
	var Listener = function() {
		
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
			USER_LEAVE_GROUP: []
		};
		
		/*
		Handlers for different message types
		*/
		var handlers = [
			{
				predicate: msg => msg.__x_isNotification && msg.__x_eventType == "i",
				handler: function(msg) {
					var is_join = !!Core.find(Core.group(msg.chat.__x_id).participants, x => x.__x_id == msg.recipients[0]); // If anyone has a better way to implement this one, please help!
					var object = msg.__x_recipients[0];
					var subject = msg.__x_sender;
					var chat = msg.chat.__x_id;
					
					if (is_join) {
						API.listener.ExternalHandlers.USER_JOIN_GROUP.forEach(x => x(object, subject, chat));
					}
					else {
						API.listener.ExternalHandlers.USER_LEAVE_GROUP.forEach(x => x(object, subject, chat));
					}
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
	This is the API, which contains functions, literals, constants and utilities to integrate with WhatsApp Web version.
	*/
	window.API = {
		
		/*
		Exception constants.
		*/
		Error: {
			OK: true,
			USER_NOT_FOUND: "The specified user ID was not found",
			CHAT_NOT_FOUND: "The specified chat ID was not found",
			GROUP_NOT_FOUND: "The specified group metadata ID was not found",
			USER_NOT_IN_GROUP: "The specified user is not a member of the required group"
		},
		
		/*
		Returns the contact ID from a given phone number.
		Only digits in the phone number. Example: "972557267388" and not "(+972) 055-726-7388"
		*/
		findContactId: function(phone_number) {
			var result = null;
			Store.Contact.models.forEach(x => {
				if (x.hasOwnProperty("__x_id") && (x.__x_id.match(/\d+/g) || []).join("") == phone_number) {
					result = x.__x_id;
				}
			});
			return result || null;
		},
		
		/*
		Returns an array of chat ID's that correspond to chats with the parameter in the title.
		For example, calling it with title='John' may return the ID's of the chats: 'John Smith', 'John from the cafeteria', and 'Johnna\'s birthday party 2016'
		*/
		findChatIds: function(title) {
			var result = [];
			Store.Chat.models.forEach(x => {
				if (x.hasOwnProperty("__x_formattedTitle") && ~(x.__x_formattedTitle.indexOf(title))) {
					result.push(x.__x_id);
				}
			});
			return result;
		},
		
		listener: new Listener(),
		
		/*
		Adds a user to a group.
		Parameters:
			user_id - the ID of the user (NOT the phone number)
			group_id - the ID of the group
			callback - to be invoked after the operation finishes
		*/
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
		
		/*
		Removes a user from a group.
		Parameters:
			user_id - the ID of the user (NOT the phone number)
			group_id - the ID of the group
			callback - to be invoked after the operation finishes
		*/
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
		
		/*
		Sets a chat's archived status
		Parameters:
			chat_id - the ID of the conversation
			archive_status - true for archiving, false for unarchiving.
			callback - to be invoked after the operation finishes
		*/
		setChatArchiveStatus: function(chat_id, archive_status, callback) {
			var chat = Core.chat(chat_id);
			if (chat == null) {
				Core.error(API.Error.CHAT_NOT_FOUND, callback);
				return;
			}
			
			chat.setArchive(!!archive_status).then(function() {
				(callback || Core.nop)({status: 200});
			});
		},
		
		/*
		Gets the archive status of a chat
		Parameters:
			chat_id - the ID of the conversation
		Return value:
			bool - true if archived, false if not archived.
			null - if chat was not found
		*/
		getChatArchiveStatus: function(chat_id) {
			var chat = Core.chat(chat_id);
			if (chat == null) {
				return null;
			}
			
			return chat.archive;
		},
		
		/*
		Gets the invite link for a group.
		Parameters:
			group_id - the ID of the group
		Return value:
			string - the invite link
			null - if the group was not found
		*/
		getGroupInviteLink: function(group_id) {
			var group = Core.group(group_id);
			if (group == null) {
				return null;
			}
			
			return group.groupInviteLink;
		},
		
		/*
		Revokes a group's invite link.
		Parameters:
			group_id - the ID of the group
			callback - to be invoked after the operation completes
		*/
		revokeGroupInviteLink: function(group_id, callback) {
			var group = Core.group(group_id);
			if (group == null) {
				Core.error(Core.Error.GROUP_NOT_FOUND, callback);
				return;
			}
			
			group.revokeGroupInvite().then(function(e) {
				(callback || Core.nop)({status: e});
			});
		},
		
		/*
		Sets a user's blocked status
		Parameters:
			user_id - the ID of the user to block/unblock
			blocked_status - true - blocked, false - unblocked
			callback - to be invoked after the operation completes
		*/
		setBlockedStatus: function(user_id, blocked_status, callback) {
			var user = Core.contact(user_id);
			if (user == null) {
				Core.error(API.Error.USER_NOT_FOUND, callback);
				return;
			}
			
			user.setBlock(blocked_status).then(function(e) {
				(callback || Core.nop)({status: e});
			});
		}
		
	};
	
	API.listener.listen();
		
})();