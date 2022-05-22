// Variables & Functions

var userOpts = {
	'options': {},
	'mods': {}
};

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

function updateOpts(type, id) {
	var val = document.getElementById(id).value;
	userOpts[type][id] = val;
	updateCss();
}

function updateCss() {
	let newCss = baseCss;

	for(let [id, value] of Object.entries(userOpts['options'])) {
		let optData = theme['options'][id];
		
		if(optData['type'] === 'user_text') {
			// format text to be valid for CSS content statements
			value = `"${value.replaceAll('"', '\\"').replaceAll('\n', '\\a ')}"`;
		}
		else if(optData['type'] === 'user_image') {
			value = `url(${value})`;
		}

		let stringToInsert = optData['string_to_insert'].replace('{{{insert}}}', value);

		newCss = newCss.replace(optData['string_to_replace'], stringToInsert);
	}

	pushCss(newCss);
}

function pushCss(css) {
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

if('options' in theme) {
	for (const [optId, opt] of Object.entries(theme['options'])) {
		var div = document.createElement('div'),
			head = document.createElement('b');

		div.className = 'option';
		head.textContent = opt['name'];
		head.className = 'option__name';
		div.appendChild(head);

		if(opt['type'] === 'user_text') {
			let input = document.createElement('textarea');
			input.id = optId;
			input.value = opt['default'];
			input.className = 'option__input option__input--textarea';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOpts('options', optId); });
		}

		else if(opt['type'] === 'user_image') {
			let input = document.createElement('input');
			input.id = optId;
			input.type = 'url';
			input.value = opt['default'];
			input.placeholder = 'https://example.com/image.jpg';
			input.className = 'option__input';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOpts('options', optId); });
		}

		optionsEle.appendChild(div);
	}
} else {
	optionsEle.remove();
}

var modsEle = document.getElementById('js-mods');

if('mods' in theme) {
	for (const [modId, mod] of Object.entries(theme['mods'])) {
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
} else {
	modsEle.remove();
}

// Update preview CSS & remove loader

var baseCss = '';
fetchLocalFile(theme['location'], (css) => {
	baseCss = css;
	pushCss(css);
	pageLoaded();
} );

// if type is user_text, then output should be sanitized for escape characters etc. Newlines replaced by \a. Etc.

// if type is user_image, there should be a front-facing prompt when the user inputs something that doesn't look like an image URL.
