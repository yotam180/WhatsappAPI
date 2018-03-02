import WhatsBot

def onMessage(wa, msg):
    print(msg)

def onConnected(wa, addr):
    print(addr)

a = WhatsBot.WhatsappBot(onMessage, onConnected)
a.start()

raw_input()
a.send_message("972547885798@c.us", "Test message from Python")
raw_input()

a.stop()