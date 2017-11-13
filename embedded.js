window.sendMessageToNumber = function(contactnum, message) {
    var chat = null;
    Store.Chat.models.forEach(x => { 
        if (x.__x_id.match(/\d+/g).join("") == contactnum) {
            chat = x;
        }
    });
	if (chat != null) {
		chat.sendMessage(message);
		return chat.__x_id;
    }
	return null;
};

window.getContactInfo = function(contactnum) {
    var chat = null;
    Store.Contact.models.forEach(x => { 
        if ((x.hasOwnProperty("__x_id") && x.__x_id.match(/\d+/g) || []).join("") == contactnum) {
            chat = x;
        }
    });
    return JSON.stringify({
        name: chat.__x_formattedName,
        short_name: chat.__x_formattedShortName,
        is_me: chat.__x_isMe,
        is_contant: chat.__x_isMyContact,
        is_user: chat.__x_isUser
    });
};

window.getChats = function(contactnum) {
    var chats = [];
    Store.Chat.models.forEach(x => { 
        if (x.hasOwnProperty("__x_formattedTitle") && ~x.__x_formattedTitle.indexOf(contactnum)) {
            chats.push(x.__x_id);
        }
    });
    return JSON.stringify(chats);
};