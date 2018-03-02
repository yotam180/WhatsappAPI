import WhatsBot

def onMessage(wa, msg):
    print(msg)

def onConnected(wa, addr):
    print(addr)

a = WhatsBot.WhatsappBot(onMessage, onConnected)
a.start()

raw_input()
n = a.send_message("972547885798@c.us", "Test message from Python")
print "Sent message"
raw_input()

a.stop()