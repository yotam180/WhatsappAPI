from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from json import loads, dumps

"""
The main class of the API to conenct to WhatsApp Web
"""
class WhatsAppDriver(object):

	# Initiates a connection to WhatsApp Web
	def __init__(self, cert_file, manual = True):
		self.cert_file = cert_file
		
		self.driver = webdriver.Firefox()
		driver = self.driver
		driver.get("https://web.whatsapp.com")

		if check_auth(driver) == False:
			if (not load_cert("a.json", driver) or not check_auth(driver)) and manual:
				while not check_auth(driver):
					pass
				ls = driver.execute_script("return JSON.stringify(localStorage);")
				with open(cert_file, "w") as f:
					f.write(ls)
		
		self.is_connected = check_auth(driver)
		
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