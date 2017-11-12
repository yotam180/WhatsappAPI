from WhatsApp import WhatsAppDriver

whatsapp = WhatsAppDriver("a.json", manual=True)
print whatsapp.is_connected