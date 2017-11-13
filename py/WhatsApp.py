from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from json import loads, dumps

"""
The main class of the API to conenct to WhatsApp Web
"""
class WhatsAppDriver(object):

	# Initiates a connection to WhatsApp Web
	def __init__(self, cert_file, driver = None, manual = True, external = False):
		self.cert_file = cert_file
		
		if driver != None:
			self.driver = driver
		else:
			self.driver = webdriver.Firefox()
		driver = self.driver
		driver.get("https://web.whatsapp.com")

		if check_auth(driver) == False:
			if (not load_cert("a.json", driver) or not check_auth(driver)) and manual:
				if external:
					wait_login(driver)
				else:
					while not check_auth(driver):
						pass
				ls = driver.execute_script("return JSON.stringify(localStorage);")
				with open(cert_file, "w") as f:
					f.write(ls)
		
		with open("embedded.js") as f:
			driver.execute_script(f.read())
		self.is_connected = check_auth(driver)
		
	def send_message(self, number, message):
		return self.driver.execute_script("return sendMessageToNumber(" + dumps(number) + ", " + dumps(message) + ");")
		
	def get_contact_info(self, number):
		return loads(self.driver.execute_script("return getContactInfo(" + dumps(number) + ");"))
	
	def find_chats(self, title):
		return loads(self.driver.execute_script("return getChats(" + dumps(title) + ");"))
	
	def close(self):
		self.driver.close()
		
"""
Loads a localStorage object from file and embeds it into a WhatsApp web. Then refreshes the web session
"""
def load_cert(cert_file, driver, refresh=True):
	try:
		with open(cert_file) as f:
			localStorage = f.read()
		ls = loads(localStorage)
	except:
		return False
	
	for k in ls.keys():
		driver.execute_script("localStorage.setItem('" + k + "', " + dumps(ls[k]) + ");")
		
	if refresh:
		driver.refresh()
	
	return True

"""
Finds the barcode object in the page and returns its source (data:// url)
If not present, returns None
"""
def find_barcode(driver):
	try:
		barcode = driver.find_element_by_css_selector("img[alt='Scan me!']")
		return barcode.get_attribute("src")
	except:
		return None

"""
Finds the barcode object in the page and returns its source (whatsapp cdn url)
If not present, returns None
"""		
def find_avatar(driver):
	try:
		avatar = driver.find_element_by_class_name("avatar-image")
		return avatar.get_attribute("src")
	except:
		return None

"""
Determines if a WhatsApp Web page is authenticated or not.
True - connected
False - requires login
"""
def check_auth(driver):
	avatar, barcode = None, None
	while (avatar or barcode) == None:
		avatar, barcode = find_avatar(driver), find_barcode(driver)
		
	return barcode == None

def barcode_html(url, driver):
	try:
		with open("barcode.html") as f:
			html = f.read().replace("{0}", url)
		driver.execute_script("document.body.innerHTML = " + dumps(html) + ";");
	except:
		return
	
"""
Opens the barcode in a new browser window and waits for the user to scan it
"""
def wait_login(driver):
	print "Waiting for login"
	login_page = webdriver.Firefox()
	login_page.get("data:text/html;charset=utf-8," + "<html></html>")
	
	b = find_barcode(driver)
	barcode_html(b, login_page)
	
	print "Opened barcode"
	
	while not check_auth(driver):
		if b != find_barcode(driver):
			b = find_barcode(driver)
			barcode_html(b, login_page)
			
	login_page.close()