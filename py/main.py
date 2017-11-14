from WhatsApp import WhatsAppDriver
from selenium import webdriver

#opts = webdriver.ChromeOptions()
#opts.add_argument("headless")
#driver = webdriver.Chrome(chrome_options=opts)
driver = webdriver.Chrome()
whatsapp = WhatsAppDriver("a.json", manual=True, driver=driver)
print whatsapp.is_connected
print whatsapp.find_chats("f")
whatsapp.close()