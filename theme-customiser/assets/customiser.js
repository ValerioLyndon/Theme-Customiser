// Variables & Functions

// this sucks and should be changed to async/await or something. For now, it uses a callback function because it's easier
function fetchLocalFile(path, callback) {
	var request = new XMLHttpRequest(),
		result = false;
	request.open("GET", path, true);
	request.send(null);
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				console.log('request successful');
				var result = request.responseText;
				callback(result);
				return result;
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
}

function updateCss(css) {
	var iframe = document.getElementById('preview');
	if (iframe && iframe.contentWindow) {
		iframe.contentWindow.postMessage(css);
	}
}



// Main program

// look, this sucks and is not dynamic at all but it does what I want it to right now. I know this is the dumbest way ever to do this and I could use URLSearchParams or something.
try {
	selectedTheme = location.search.split('=')[1].toLowerCase();
}
catch {
	// redirect the user or change the page here to present them with options of the themes
	console.log('400 bad request');
}

if(!(selectedTheme in data)) {
	// redirect the user or change the page here to present them with options of the themes
	console.log('400 bad request');
}

theme = data[selectedTheme];

// Basic page content

document.querySelector('.js-title').textContent = theme['name'];

// Update preview CSS - todo

var baseCss = '';
fetchLocalFile(theme['location'], (temp) => { baseCss = temp; updateCss(temp); } );

// Remove loader

document.querySelector('.js-content').classList.add('loaded');

var loader = document.querySelector('.js-loader');
loader.classList.add('hidden');
setTimeout(function(){
	loader.remove();
}, 1500)

// if type is user_text, then output should be sanitized for escape characters etc. Newlines replaced by \a. Etc.

// if type is user_image, there should be a front-facing prompt when the user inputs something that doesn't look like an image URL.
