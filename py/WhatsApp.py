JS_CODE = """(function(){window.Core={group:function(a){var b=null;Store.GroupMetadata.models.forEach(function(c){c.hasOwnProperty("__x_id")&&c.__x_id==a&&(b=c)});return b},contact:function(a){var b=null;Store.Contact.models.forEach(function(c){c.hasOwnProperty("__x_id")&&c.__x_id==a&&(b=c)});return b},chat:function(a){var b=null;Store.Chat.models.forEach(function(c){c.hasOwnProperty("__x_id")&&c.__x_id==a&&(b=c)});return b},msg:function(a){var b=null;Store.Msg.models.forEach(function(c){c.hasOwnProperty("__x_id")&&
c.__x_id._serialized==a&&(b=c)});return b},find:function(a,b){var c=null;a.forEach(function(a){b(a)&&(c=a)});return c},error:function(a,b){setTimeout(function(c){(b||Core.nop)({error:a})},1)},nop:function(){}};window.API={Error:{OK:!0,USER_NOT_FOUND:"The specified user ID was not found",CHAT_NOT_FOUND:"The specified chat ID was not found",GROUP_NOT_FOUND:"The specified group metadata ID was not found",USER_NOT_IN_GROUP:"The specified user is not a member of the required group"},findContactId:function(a){var b=
null;Store.Contact.models.forEach(function(c){c.hasOwnProperty("__x_id")&&(c.__x_id.match(/\d+/g)||[]).join("")==a&&(b=c.__x_id)});return b||null},findChatIds:function(a){var b=[];Store.Chat.models.forEach(function(c){c.hasOwnProperty("__x_formattedTitle")&&~c.__x_formattedTitle.indexOf(a)&&b.push(c.__x_id)});return b},listener:new function(){this.ExternalHandlers={USER_JOIN_GROUP:[],USER_LEAVE_GROUP:[],GROUP_SUBJECT_CHANGE:[],MESSAGE_RECEIVED:[]};var a=[{predicate:function(a){return a.__x_isNotification&&
"i"==a.__x_eventType&&"gp2"==a.__x_type},handler:function(a){var c=Core.chat(a.chat.__x_id).isGroup&&!!Core.find(Core.group(a.chat.__x_id).participants,function(c){return a.recipients&&c.__x_id==a.recipients[0]}),b=a.__x_recipients[0],e=a.__x_sender,f=a.chat.__x_id;c?API.listener.ExternalHandlers.USER_JOIN_GROUP.forEach(function(a){return a(b,e,f)}):API.listener.ExternalHandlers.USER_LEAVE_GROUP.forEach(function(a){return a(b,e,f)})}},{predicate:function(a){return a.__x_isNotification&&"n"==a.__x_eventType},
handler:function(a){var c=a.__x_to,b=a.__x_sender,e=a.__x_body,f=a.__x_subtype;API.listener.ExternalHandlers.GROUP_SUBJECT_CHANGE.forEach(function(a){return a(c,b,e,f)})}},{predicate:function(a){return a.__x_isUserCreatedType&&!a.__x_isNotification&&!a.__x_isSentByMe},handler:function(a){var b=a.__x_sender,c=a.__x_from;console.log(a);API.listener.ExternalHandlers.MESSAGE_RECEIVED.forEach(function(d){return d(b,c,API.parseMsgObject(a))})}}],b=function(){Store.Msg.models.forEach(function(b){if(b.__x_isNewMsg){b.__x_isNewMsg=
!1;a:{for(var c=0;c<a.length;c++)if(a[c].predicate(b)){a[c].handler(b);console.log("Firing handler "+c);break a}console.log("No suitable handlers were found for ",b)}}})};this.listen=function(){window.API_LISTENER_TOKEN&&clearInterval(window.API_LISTENER_TOKEN);window.API_LISTENER_TOKEN=setInterval(b,10)}},addUserToGroup:function(a,b,c){b=Core.group(b);a=Core.contact(a);null==b?Core.error(API.Error.GROUP_NOT_FOUND,c):null==a?Core.error(API.Error.USER_NOT_FOUND,c):b.participants.addParticipant(a).then(c)},
removeUserFromGroup:function(a,b,c){b=Core.group(b);if(null==b)Core.error(API.Error.GROUP_NOT_FOUND,c);else{var d=Core.find(b.participants,function(b){return b.hasOwnProperty("__x_id")&&b.__x_id==a});null==d?Core.error(API.Error.USER_NOT_IN_GROUP,c||Core.nop):b.participants.removeParticipant(d).then(c)}},setChatArchiveStatus:function(a,b,c){a=Core.chat(a);null==a?Core.error(API.Error.CHAT_NOT_FOUND,c):a.setArchive(!!b).then(function(){(c||Core.nop)({status:200})})},getChatArchiveStatus:function(a){a=
Core.chat(a);return null==a?null:a.archive},getGroupInviteLink:function(a){a=Core.group(a);return null==a?null:a.groupInviteLink},revokeGroupInviteLink:function(a,b){var c=Core.group(a);null==c?Core.error(Core.Error.GROUP_NOT_FOUND,b):c.revokeGroupInvite().then(function(a){(b||Core.nop)({status:a})})},setBlockedStatus:function(a,b,c){a=Core.contact(a);null==a?Core.error(API.Error.USER_NOT_FOUND,c):a.setBlock(b).then(function(a){(c||Core.nop)({status:a})})},sendTextMessage:function(a,b,c){a=Core.chat(a);
null==a?Core.error(API.Error.CHAT_NOT_FOUND,c):a.sendMessage(b).then(function(a){(c||Core.nop)({status:a})})},createGroup:function(a,b,c){for(var d=[],g=0;g<b.length;g++)d.push(Core.contact(b[g]));Store.Chat.createGroup(a,null,null,d,void 0).then(c)},getContactInfo:function(a){a=Core.contact(a);return null!=a&&a.all?a.all:null},getMessageInfo:function(a){return Core.find(Store.Msg.models,function(b){return b.__x_id._serialized==a})},getContactList:function(){var a=[];Store.Contact.models.forEach(function(b){a.push(b.__x_id)});
return a},sendContactMessage:function(a,b,c){b.constructor!=Array&&(b=[b]);a=Core.chat(a);if(null==a)Core.error(API.Error.CHAT_NOT_FOUND,c);else{var d=[];b.forEach(function(a){a=Core.contact(a);null!=a&&d.push(a)});d.length?Core.error(API.Error.USER_NOT_FOUND,c):a.sendContactList(d).then(c)}},sendTyping:function(a){a=Core.chat(a);if(null==a)return API.Error.CHAT_NOT_FOUND;a.markComposing()},sendRecording:function(a){a=Core.chat(a);if(null==a)return API.Error.CHAT_NOT_FOUND;a.markRecording()},sendStopRecording:function(a){a=
Core.chat(a);if(null==a)return API.Error.CHAT_NOT_FOUND;a.markPaused()},parseMsgObject:function(a){var b=a.all;a.__x__quotedMsgObj&&(b.quotedMsg=API.parseMsgObject(Core.msg(a.__x__quotedMsgObj.__x_id._serialized)));b.chat=b.chat.all;delete b.msgChunk;return b},ready:function(){return new Promise(function(a,b){var c=setInterval(function(){0<document.getElementsByClassName("avatar-image").length&&(clearInterval(c),a())},10)})}};API.listener.listen()})();"""

try:
	from selenium import webdriver
	from selenium.webdriver.common.keys import Keys
except ImportError:
	try:
		from os import system
		system("pip install selenium")
		from selenium import webdriver
		from selenium.webdriver.common.keys import Keys
	except ImportError:
		print "An error occured while trying to install Selenium WebDriver :("
		exit()

from json import loads, dumps
		
class WhatsApp(object):
	
	def __init__(self):
		session = self.load_session()
		driver = (self.connect_session(session) or self.new_session()) if session else self.new_session()
		
		
		
	def load_session(self):
		try:
			with open("session.json", "r") as f:
				return loads(f.read())
		except:
			return None
	
	def connect_session(self, session):
		try:
			driver = webdriver.Remote(command_executor=session["url"], desired_capabilities={})
			driver.session_id = session["session_id"]
			return driver
		except:
			return None
			
	def new_session(self):
		driver = webdriver.Chrome()
		driver.get("https://web.whatsapp.com/")
		with open("session.json", "w") as f:
			f.write(dumps({"url": driver.command_executor._url, "session_id": driver.session_id}))
		return driver