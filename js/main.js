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
						API.listener.ExternalHandlers.USER_JOIN_GROUP.forEach(x => x(object, subject, chat));
					}
					else {
						API.listener.ExternalHandlers.USER_LEAVE_GROUP.forEach(x => x(object, subject, chat));
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
					API.listener.ExternalHandlers.GROUP_SUBJECT_CHANGE.forEach(x => x(chat, changer, new_title, subtype));
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
					var message = msg.__x_id._serialized;
					console.log(msg);
					API.listener.ExternalHandlers.MESSAGE_RECEIVED.forEach(x => x(sender, chat, API.parseMsgObject(msg)));
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
		},
		
		/*
		Sends a text message in a given chat.
		Parameters:
			chat_id - the chat to send a message to.
			message_text - the plain text of the message.
			callback - to be invoked after the operation completes
		*/
		sendTextMessage: function(chat_id, message_text, callback) {
			var chat = Core.chat(chat_id);
			if (chat == null) {
				Core.error(API.Error.CHAT_NOT_FOUND, callback)
				return;
			}
			
			chat.sendMessage(message_text).then(function(e) {
				(callback || Core.nop)({status: e});
			});
		},
		
		/*
		Creates a new group.
		Parameters:
			group_subject - the title of the newly created group
			participants - an array of ids of users to add to the group
			callback - to be invoked after the operation completes
		
		Needs further testing
		*/
		createGroup: function(group_subject, participants, callback) {
			var p = [];
			for (var x = 0; x < participants.length; x++)
			{
				p.push(Core.contact(participants[x]));
			}
			
			Store.Chat.createGroup(group_subject, null, null, p, undefined).then(callback);
		},
		
		/*
		Retrieves contact info for a certain id
		Parameters:
			user_id - the id of the user to look for
		Return value:
			object - the details
			null - if the user was not found
		*/
		getContactInfo: function(user_id) {
			var contact = Core.contact(user_id);
			if (contact == null || !contact["all"]) {
				return null;
			}
			
			return contact.all;
		},
		
		/*
		Retrieves message info for a certain id
		Parameters:
			message_id - the id of the message to look for
		Return value:
			object - the details
			null - if the message was not found in any chat
		*/
		getMessageInfo: function(message_id) {
			return Core.find(Store.Msg.models, x => x.__x_id._serialized == message_id);
		},
		
		/*
		Returns a list of all contact IDs.
		Return Value:
			array - the array of strings containing the IDs of the clients.
		*/
		getContactList: function() {
			var result = [];
			Store.Contact.models.forEach(x => { result.push(x.__x_id); });
			return result;
		},
		
		/*
		Sends contact(s) to a chat.
		Parameters: 
			chat_id - the ID of the chat to write the contacts to
			contacts - the contact / array of contacts to send
			callback - to be incoked after the operation completes
			
		Needs further testing.
		*/
		sendContactMessage: function(chat_id, contacts, callback) {
			if (contacts.constructor != Array) {
				contacts = [contacts];
			}
			
			var chat = Core.chat(chat_id);
			if (chat == null) {
				Core.error(API.Error.CHAT_NOT_FOUND, callback);
				return;
			}
			
			var toSend = [];
			contacts.forEach(x => {
				var c = Core.contact(x);
				if (c != null) {
					toSend.push(c);
				}
			});
			
			if (!!toSend.length) {
				Core.error(API.Error.USER_NOT_FOUND, callback);
				return;
			}
			
			chat.sendContactList(toSend).then(callback);
		},
		
		/*
		    Send the other side "<you> is typing..."
			chat_id - the chat id
		*/
		sendTyping: function(chat_id) {
            var chat = Core.chat(chat_id);
            if (chat == null) {
                return API.Error.CHAT_NOT_FOUND;
            }
            
            chat.markComposing();
		},
		
		/*
		    Send the other side "<you> is recording audio..."
			chat_id - the chat id
		*/
		sendRecording: function(chat_id) {
            var chat = Core.chat(chat_id);
            if (chat == null) {
                return API.Error.CHAT_NOT_FOUND;
            }
            
            chat.markRecording();
		},
		
		/*
		    Hides the "<you> is recording audio..." to the other side
			chat_id - the chat id
		*/
		sendStopRecording: function(chat_id) {
            var chat = Core.chat(chat_id);
            if (chat == null) {
                return API.Error.CHAT_NOT_FOUND;
            }
            
            chat.markPaused();
		},
		
		/*
		Minimizes a message object to a JSON convertable object for sending over network (smaller size than a huge Msg object)
		Parameters:
			msg_object - the message object to convert to JSON compatible type
		*/
		parseMsgObject: function(msg_object) {
			var m = msg_object.all;
			if (msg_object["__x__quotedMsgObj"]) {
				m.quotedMsg = API.parseMsgObject(Core.msg(msg_object.__x__quotedMsgObj.__x_id._serialized));
			}
			m.chat = m.chat.all;
			delete m.msgChunk;
			return m;
		},
		
		/*
		Emoji constants
		*/
		Emoji: {
			SMILING_FACE_WITH_HALO: "😇",
			HUSHED_FACE: "😯",
			CONFUSED_FACE: "😕",
			FROWNING_FACE: "☹",
			WORRIED_FACE: "😟",
			NEUTRAL_FACE: "😐",
			DISAPPOINTED_FACE: "😞",
			PENSIVE_FACE: "😔",
			RELIEVED_FACE: "😌",
			UNAMUSED_FACE: "😒",
			PERSEVERING_FACE: "😣",
			CONFOUNDED_FACE: "😖",
			TIRED_FACE: "😫",
			WEARY_FACE: "😩",
			FACE_WITH_LOOK_OF_TRIUMPH: "😤",
			POUTING_FACE: "😡",
			ANGRY_FACE: "😠",
			DROOLING_FACE: "🤤",
			ROLLING_ON_THE_FLOOR_LAUGHING: "🤣",
			LYING_FACE: "🤥",
			FACE_WITH_COWBOY_HAT: "🤠",
			NAUSEATED_FACE: "🤢",
			CLOWN_FACE: "🤡",
			PILE_OF_POO: "💩",
			IMP: "👿",
			SMILING_FACE_WITH_HORNS: "😈",
			JAPANESE_GOBLIN: "👺",
			JAPANESE_OGRE_NAMAHAGE: "👹",
			GHOST: "👻",
			SKULL: "💀",
			SKULL_AND_CROSSBONES: "☠",
			ALIEN: "👽",
			SMILING_CAT_FACE_WITH_OPEN_MOUTH: "😺",
			GRINNING_CAT_FACE_WITH_SMILING_EYES: "😸",
			CAT_FACE_WITH_WRY_SMILE: "😼",
			KISSING_CAT_FACE_WITH_CLOSED_EYES: "😽",
			SMILING_CAT_FACE_WITH_HEART_EYES: "😻",
			WEARY_CAT_FACE: "🙀",
			POUTING_CAT_FACE: "😾",
			CRYING_CAT_FACE: "😿",
			CAT_FACE_WITH_TEARS_OF_JOY: "😹",
			CLAPPING_HANDS: "👏",
			THUMBS_UP_SIGN: "👍",
			THUMBS_DOWN_SIGN: "👎",
			FISTED_HAND_SIGN: "👊",
			RAISED_FIST: "✊",
			UP_POINTING_INDEX: "☝",
			VICTORY_HAND: "✌",
			RAISED_HAND: "✋",
			RAISED_HAND_WITH_FINGERS_SPLAYED: "🖐",
			OK_HAND_SIGN: "👌",
			GRINNING_FACE: "😀",
			SMILING_FACE_WITH_OPEN_MOUTH: "😃",
			SMILING_FACE_WITH_OPEN_MOUTH_AND_SMILING_EYES: "😄",
			SMILING_FACE_WITH_OPEN_MOUTH_AND_CLOSED_EYES: "😆",
			WINKING_FACE: "😉",
			SMILING_FACE_WITH_SMILING_EYES: "😊",
			SLIGHTLY_SMILING_FACE: "🙂",
			SMILING_FACE: "☺",
			FLUSHED_FACE: "😳",
			GRINNING_FACE_WITH_SMILING_EYES: "😁",
			GRIMACING_FACE: "😬",
			SMIRKING_FACE: "😏",
			UPSIDE_DOWN_FACE: "🙃",
			SMILING_FACE_WITH_HEART_EYES: "😍",
			ANGUISHED_FACE: "😧",
			DIZZY_FACE: "😵",
			ASTONISHED_FACE: "😲",
			FROWNING_FACE_WITH_OPEN_MOUTH: "😦",
			FACE_WITH_MEDICAL_MASK: "😷",
			FACE_SCREAMING_IN_FEAR: "😱",
			FEARFUL_FACE: "😨",
			LOUDLY_CRYING_FACE: "😭",
			FACE_WITH_OPEN_MOUTH_AND_COLD_SWEAT: "😰",
			CRYING_FACE: "😢",
			DISAPPOINTED_BUT_RELIEVED_FACE: "😥",
			FACE_WITH_COLD_SWEAT: "😓",
			SMILING_FACE_WITH_OPEN_MOUTH_AND_COLD_SWEAT: "😅",
			FACE_WITH_TEARS_OF_JOY: "😂",
			SLEEPY_FACE: "😪",
			FACE_THROWING_A_KISS: "😘",
			KISSING_FACE: "😗",
			KISSING_FACE_WITH_SMILING_EYES: "😙",
			KISSING_FACE_WITH_CLOSED_EYES: "😚",
			FACE_WITHOUT_MOUTH: "😶",
			FACE_WITH_OPEN_MOUTH: "😮",
			FACE_WITH_ROLLING_EYES: "🙄",
			THINKING_FACE: "🤔",
			EXPRESSIONLESS_FACE: "😑",
			ZIPPER_MOUTH_FACE: "🤐",
			FACE_WITH_THERMOMETER: "🤒",
			SLEEPING_FACE: "😴",
			FACE_SAVOURING_DELICIOUS_FOOD: "😋",
			FACE_WITH_STUCK_OUT_TONGUE_AND_WINKING_EYE: "😜",
			FACE_WITH_STUCK_OUT_TONGUE: "😛",
			FACE_WITH_STUCK_OUT_TONGUE_AND_TIGHTLY_CLOSED_EYES: "😝",
			MONEY_MOUTH_FACE: "🤑",
			NERD_FACE: "🤓",
			SMILING_FACE_WITH_SUNGLASSES: "😎",
			HUGGING_FACE: "🤗",
			BACK_OF_HAND_POINTING_TO_THE_LEFT: "👈",
			BACK_OF_HAND_POINTING_TO_THE_RIGHT: "👉",
			WAVING_HAND_SIGN: "👋",
			SIGN_OF_THE_HORNS: "🤘",
			REVERSED_HAND_WITH_MIDDLE_FINGER_EXTENDED: "🖕",
			OPEN_HANDS_SIGN: "👐",
			TENSE_BICEPS: "💪",
			PERSON_RAISING_BOTH_HANDS_IN_CELEBRATION: "🙌",
			PERSON_WITH_FOLDED_HANDS: "🙏",
			RAISED_HAND_WITH_PART_BETWEEN_MIDDLE_AND_RING_FINGERS: "🖖",
			WRITING_HAND: "✍",
			NAIL_POLISH: "💅",
			MOUTH: "👄",
			TONGUE: "👅",
			FOOTPRINTS: "👣",
			EAR: "👂",
			NOSE: "👃",
			EYES: "👀",
			EYE: "👁",
			SILHOUETTE_OF_TWO_BUSTS: "👥",
			BABY: "👶",
			PRINCESS: "👸",
			PERSON_BOWING_DEEPLY: "🙇",
			FACE_WITH_NO_GOOD_GESTURE: "🙅",
			FACE_WITH_OK_GESTURE: "🙆",
			INFORMATION_DESK_PERSON: "💁",
			HAPPY_PERSON_RAISING_ONE_HAND: "🙋",
			PERSON_SHRUGS: "🤷",
			POUTING_PERSON: "🙎",
			FROWNING_PERSON: "🙍",
			DANCING: "💃",
			MAN_AND_WOMAN_HOLDING_HANDS: "👫",
			TWO_WOMEN_HOLDING_HANDS: "👭",
			COUPLE_WITH_HEART: "💑",
			KISS: "💏",
			WOMEN_WITH_BUNNY_EARS: "👯",
			BIKINI: "👙",
			KISS_MARK: "💋",
			HIGH_HEELED_SHOE: "👠",
			TOP_HAT: "🎩",
			CROWN: "👑",
			RING: "💍"
		}
		
	};
	
	API.listener.listen();
		
})();