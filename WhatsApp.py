from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from json import loads, dumps

def load_cert(cert_file, driver):

	try:
		with open(cert_file) as f:
			localStorage = f.read()
		ls = loads(localStorage)
	except:
		return False
	
	for k in ls.keys():
		driver.execute_script("localStorage.setItem('" + k + "', " + dumps(ls[k]) + ");")
		
	driver.refresh()
	
	return True
	
def find_barcode(driver):
	try:
		barcode = driver.find_element_by_css_selector("img[alt='Scan me!']")
		return barcode.get_attribute("src")
	except:
		return None
		
def find_avatar(driver):
	try:
		avatar = driver.find_element_by_class_name("avatar-image")
		return avatar.get_attribute("src")
	except:
		return None
	
def check_auth(driver):
	avatar, barcode = None, None
	while (avatar or barcode) == None:
		avatar, barcode = find_avatar(driver), find_barcode(driver)
		
	return barcode == None

def init(cert_file):
	driver = webdriver.Firefox()
	driver.get("https://web.whatsapp.com")

	if check_auth(driver) == False:
		if not load_cert("a.json", driver) or not check_auth(driver):
			while not check_auth(driver):
				pass
			ls = driver.execute_script("return JSON.stringify(localStorage);")
			with open(cert_file, "w") as f:
				f.write(ls)
	
	return check_auth(driver), driver
