window.onload = function() {
	document.getElementById("savebtn").onclick = function() {
		chrome.storage.local.set({"wa_codefile": document.getElementById("file_select").files[0].mozFullPath}, function() {
			document.getElementById("savebtn").value = "Saved!";
		});
	};	
}