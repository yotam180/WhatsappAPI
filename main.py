from WhatsApp import WhatsAppDriver

whatsapp = WhatsAppDriver("a.json", manual=False)
print whatsapp.is_connected