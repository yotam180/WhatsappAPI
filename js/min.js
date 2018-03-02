(function() {
	var check = function() {
		if (window["Store"]) {
			window["on_load"]();
		}
		else {
			setTimeout(check, 100);
		}
	}
	check();
})();

window.on_load = function() {
	// Here we can do everything we want with Store
}