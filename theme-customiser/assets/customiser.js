// Variables & Functions

var theme = {
	'name': 'Clarity'
}

// look, this sucks and is not dynamic at all but it does what I want it to right now. I know this is the dumbest way ever to do this and I could use URLSearchParams or something.
try {
	selectedTheme = location.search.split('=')[1].toLowerCase();
}
catch {
	// redirect the user or change the page here to present them with options of the themes
	console.log('400 bad request')
}

var themes = {
	'clarity': {
		'location': '../Clarity Theme/Theme.json',
		'mods_location': '../Clarity Theme/'
	}
}

if(!(selectedTheme in themes)) {
	// redirect the user or change the page here to present them with options of the themes
	console.log('400 bad request')
}

// this sucks and should be changed to async/await or something. For now, it uses a callback function because it's easier
function parseLocalJson(path, callback) {
	var request = new XMLHttpRequest(),
		result = false;
	request.open("GET", path, true);
	request.onload = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				console.log('request successful');
				var result = JSON.parse(request.responseText);
				callback(result);
			} else {
				console.log(request.statusText);
				var result = false;
			}
		}
	}
	request.onerror = function(e) {
		console.log(request.statusText);
		var result = false;
	}
	request.send(null);

	return result;
}

function initialisePage(theme) {
	// Basic page content

	document.querySelector('.js-title').textContent = theme['name'];

	// Remove loader.

	document.querySelector('.js-content').classList.add('loaded');

	var loader = document.querySelector('.js-loader');
	loader.classList.add('hidden');
	setTimeout(function(){
		loader.remove();
	}, 1500)
}

// Parses theme json and begins page setup
parseLocalJson(themes[selectedTheme]['location'], initialisePage);



// if type is user_text, then output should be sanitized for escape characters etc. Newlines replaced by \a. Etc.

// if type is user_image, there should be a front-facing prompt when the user inputs something that doesn't look like an image URL.
