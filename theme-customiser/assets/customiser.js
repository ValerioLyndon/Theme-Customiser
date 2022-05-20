// Variables & Functions

var userOpts = {};

var loader = document.getElementById('js-loader'),
	loaderIcon = document.getElementById('js-loader-icon'),
	loaderText = document.getElementById('js-loader-text'),
	loaderSubText = document.getElementById('js-loader-subtext');

// this sucks and should be changed to async/await or something. For now, it uses a callback function because it's easier
function fetchLocalFile(path, callback) {
	var request = new XMLHttpRequest(),
		result = false;
	request.open("GET", path, true);
	request.send(null);
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				callback(request.responseText);
			} else {
				pageFailed('Encountered a problem while loading a local resource.', 'http');
			}
		}
	}
	request.onerror = function(e) {
		console.log(request.statusText);
		pageFailed('Encountered a problem while loading a local resource.', 'onerror');
	}
}

function updateCss(css) {
	// Update output
	document.getElementById('js-output').textContent = css;

	// Update iframe
	var iframe = document.getElementById('js-frame');
	if (iframe && iframe.contentWindow) {
		iframe.contentWindow.postMessage(css);
	}
}

function pageFailed(msg = 'Encountered an undefined error.', code = false) {
	loaderIcon.className = 'loading-screen__cross';
	loaderText.textContent = 'Page Failure.';
	loaderSubText.innerHTML = msg;
	if(code) {
		var loaderCode = document.createElement('div');
		loaderCode.className = 'loading-screen__subtext';
		loaderCode.textContent = `Code: ${code}`;
		loader.appendChild(loaderCode);
	}
}

function pageLoaded() {
	document.getElementById('js-content').classList.add('loaded');

	loader.classList.add('hidden');
	setTimeout(function(){
		loader.remove();
	}, 1500)
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

document.getElementById('js-title').textContent = theme['name'];

var optionsEle = document.getElementById('js-options');

for (opt of theme['options']) {
	var div = document.createElement('div'),
		head = document.createElement('b');

	div.className = 'option';
	head.textContent = opt['name'];
	head.className = 'option__name';
	div.appendChild(head);

	if(opt['type'] === 'user_text') {
		var input = document.createElement('textarea');
		input.value = opt['default'];
		input.className = 'option__input option__input--textarea';
		div.appendChild(input);
	}

	else if(opt['type'] === 'user_image') {
		var input = document.createElement('input');
		input.type = 'url';
		input.value = opt['default'];
		input.className = 'option__input';
		div.appendChild(input);
	}

	optionsEle.appendChild(div);
}

var modsEle = document.getElementById('js-mods');

for (mod of theme['mods']) {
	var div = document.createElement('div'),
		head = document.createElement('b'),
		desc = document.createElement('p');

	div.className = 'option';
	head.textContent = mod['name'];
	div.appendChild(head);
	desc.textContent = mod['description'];
	div.appendChild(desc);

	modsEle.appendChild(div);
}

// Update preview CSS

var baseCss = '';
fetchLocalFile(theme['location'], (temp) => { baseCss = temp; updateCss(temp); } );

// Remove loader

pageLoaded();

// if type is user_text, then output should be sanitized for escape characters etc. Newlines replaced by \a. Etc.

// if type is user_image, there should be a front-facing prompt when the user inputs something that doesn't look like an image URL.
