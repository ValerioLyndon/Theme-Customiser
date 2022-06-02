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

function updateOpts(type, id, defaultValue = undefined) {
	// set values and default value
	let val = undefined;
	if(type === 'options') {
		if(defaultValue === undefined) {
			defaultValue = '';
		}
		val = document.getElementById(id).value;
	} else if(type === 'mods') {
		if(defaultValue === undefined) {
			defaultValue = false;
		}
		val = document.getElementById(id).checked;
	} else {
		return false;
	}

	// disable incompatible mods in the GUI
	if(type === 'mods') {
		let modData = theme['mods'][id];
		if('incompatibilities' in modData) {
			for(incompatibility of modData['incompatibilities']) {
				document.getElementById(incompatibility).disabled = val;
			}
		}
	}

	// delete from options if it matches default, to save space. else it adds the value to the options
	if(val === defaultValue) {
		delete userOpts[type][id];
	}
	else {
		userOpts[type][id] = val;
	}
	console.log(userOpts);
	// send CSS to the rest of the code
	updateCss();
}

function updateCss() {
	let newCss = baseCss;

	// Options
	for(let [id, value] of Object.entries(userOpts['options'])) {
		let optData = theme['options'][id];
		
		if(optData['type'] === 'user_text') {
			// format text to be valid for CSS content statements
			value = `"${value.replaceAll('"', '\\"').replaceAll('\n', '\\a ').replaceAll('\\','\\\\')}"`;
		}
		else if(optData['type'] === 'user_image') {
			if(value === '') {
				value = 'none';
			} else {
				value = `url(${value})`;
			}
		}

		let stringToInsert = optData['string_to_insert'].replace('{{{insert}}}', value);

		newCss = newCss.replace(optData['string_to_replace'], stringToInsert);
	}

	// Mods
	if('mods' in theme) {
		let totalCount = Object.keys(userOpts['mods']).length,
			completeCount = 0;

		if(totalCount === 0) {
			pushCss(newCss);
		} else {
			for(let [id, value] of Object.entries(userOpts['mods'])) {
				let modData = theme['mods'][id];

				// this is such a bad way to do this. Replace this with proper async code please for the love of all that is holy. This may even break with multiple mods. In fact, it probably will.
				// todo: make program cache these results earlier and wait for each fetch before continuing this loop. Right now this is broken.
				fetchLocalFile(modData['location'], (modCss) => {
					completeCount += 1;
					newCss += '\n\n' + modCss;
					if(completeCount === totalCount) {
						pushCss(newCss);
					}
				});
			}
		}
	}
	else {
		pushCss(newCss);
	}
}

function pushCss(css) {
	// Update output
	document.getElementById('js-output').textContent = css;

	// Add notice if necessary
	let notice = document.getElementById('js-output-notice');
	if(css.length > 65535) {
		let excess = css.length - 65535;
		notice.textContent = `This configuration exceeds MyAnimeList's maximum CSS length by ${excess} characters. You will need to shorten this code or host it on an external site to bypass the limit.`;
		// todo: add link to external hosting guide
		notice.classList.remove('o-hidden');
	} else {
		notice.classList.add('o-hidden');
	}

	// Update iframe
	var iframe = document.getElementById('js-frame');
	if (iframe && iframe.contentWindow) {
		iframe.contentWindow.postMessage(css);
	}
}

function validateInput(type, id) {
	console.log('i am here');
	let optData = theme[type][id],
		notice = document.getElementById(`js-${id}-notice`),
		val = document.getElementById(id).value.toLowerCase();
	console.log(optData, notice, val);
	
	if(val.length === 0) {
		return undefined;
	}

	if(optData['type'] === 'user_image') {
		// Consider replacing this with a script that simply loads the image and tests if it loads. Since we're already doing that with the preview anyway it shouldn't be a problem.
		let noticeHTML = 'We detected some warnings. If your image does not display, fix these issues and try again.<ul class="c-notice__list">',
			problems = 0;

		function problem(text) {
			problems += 1;
			noticeHTML += `<li class="c-notice__list-item">${text}</li>`;
		}
		
		if(!val.startsWith('http')) {
			if(val.startsWith('file:///')) {
				problem('URL references a file local to your computer. You must upload the image to an appropriate image hosting service.');
			} else {
				problem('URL string does not contain the HTTP protocol.');
			}
		}
		if(!/(png|jpe?g|gif|webp|svg)(\?.*)?$/.test(val)) {
			problem('Your URL does not appear to link to an image. Make sure that you copied the direct link and not a link to a regular webpage.');
		}
		else if(/svg(\?.*)?$/.test(val)) {
			problem('SVG images will not display on your list while logged out or for other users. Host your CSS on an external website to bypass this.');
		}

		notice.innerHTML = noticeHTML;

		if(problems > 0) {
			notice.classList.remove('o-hidden');
		} else {
			notice.classList.add('o-hidden');
		}
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
		let div = document.createElement('div'),
			head = document.createElement('b'),
			notice = document.createElement('div');

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

			input.addEventListener('input', () => { updateOpts('options', optId, opt['default']); });
		}

		else if(opt['type'] === 'user_image') {
			let input = document.createElement('input');
			input.id = optId;
			input.type = 'url';
			input.value = opt['default'];
			input.placeholder = 'https://example.com/image.jpg';
			input.className = 'option__input';
			div.appendChild(input);

			input.addEventListener('input', () => {
				validateInput('options', optId);
				updateOpts('options', optId, opt['default']);
			});
		}

		notice.id = `js-${optId}-notice`;
		notice.className = 'c-notice o-hidden';
		div.appendChild(notice);

		optionsEle.appendChild(div);
	}
} else {
	optionsEle.remove();
}

var modsEle = document.getElementById('js-mods');

if('mods' in theme) {
	for (const [modId, mod] of Object.entries(theme['mods'])) {
		let div = document.createElement('div'),
			head = document.createElement('b'),
			desc = document.createElement('p'),
			toggle = document.createElement('div');

		toggle.className = 'option__toggle-box';
		toggle.innerHTML = `
			<input id="${modId}" type="checkbox" class="o-hidden" />
			<label class="toggle" for="${modId}">
				<div class="toggle__info">
					You cannot use this with your current configuration due to incompatibilities with other options.
				</div>
			</label>
		`;
		div.appendChild(toggle);

		div.className = 'option';
		head.textContent = mod['name'];
		head.className = 'option__name';
		div.appendChild(head);
		// Todo: change this from innerHTML to markdown or something so you can support third-party design json
		desc.innerHTML = mod['description'];
		desc.className = 'option__desc';
		div.appendChild(desc);

		modsEle.appendChild(div);

		document.getElementById(modId).addEventListener('change', () => { updateOpts('mods', modId); });
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
