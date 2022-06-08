// GENERIC VARIABLES & FUNCTIONS

var query = (new URL(document.location)).searchParams,
	dataJson = query.get('data'),
	selectedTheme = query.get('theme').toLowerCase(),
	theme = '',
	data = null;

if(dataJson === null) {
	dataJson = './assets/data.json';
}

// Setup some basic variables
var baseCss = '';

var userOpts = {
	'theme': selectedTheme,
	'data': dataJson,
	'options': {},
	'mods': {}
};

function fetchFile(path) {
	return new Promise((resolve, reject) => {
		// Checks if item has previously been fetched and returns the cached result if so
		let cache = sessionStorage.getItem(path);
		if(cache) {
			console.log(`[fetchFile] Retrieving cached result for ${path}`);
			resolve(cache);
		}
		
		else {
			console.log(`[fetchFile] Fetching ${path}`);
			var request = new XMLHttpRequest();
			request.open("GET", path, true);
			request.send(null);
			request.onreadystatechange = function() {
				if (request.readyState === 4) {
					if (request.status === 200) {
						// Cache result on success and then return it
						sessionStorage.setItem(path, request.responseText);
						resolve(request.responseText);
					} else {
						reject(['Encountered a problem while loading a resource.', `request.status.${request.status}`]);
					}
				}
			}
			request.onerror = function(e) {
				reject(['Encountered a problem while loading a resource.', 'request.error']);
			}
		}
	});
}

class loadingScreen {
	constructor() {
		this.pageContent = document.getElementById('js-content');
		this.parent = document.getElementById('js-loader');
		this.icon = document.getElementById('js-loader-icon');
		this.text = document.getElementById('js-loader-text');
		this.subText = document.getElementById('js-loader-subtext');
		this.subText2 = document.getElementById('js-loader-subsubtext');
	}

	loaded() {
		this.pageContent.classList.add('loaded');
		this.parent.classList.add('hidden');
		var that = this;
		setTimeout(function() {
			that.parent.classList.add('o-hidden');
		}, 1500)
	}

	failed(reason_array) {
		this.icon.className = 'loading-screen__cross';
		this.text.textContent = 'Page Failure.';
		this.subText.textContent = reason_array[0];
		this.subText2.classList.remove('o-hidden');
		this.subText2.textContent = `Code: ${reason_array[1]}`;
	}
}
var loader = new loadingScreen();

function updateOption(type, id, defaultValue = undefined) {
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

	// send CSS to the rest of the code
	updateCss();
}

function updateCss() {
	let newCss = baseCss;

	// Encode options at top

	newCss = '/* Theme Customiser Preset\nhttps://github.com/ValerioLyndon/Theme-Customiser\n^TC' + JSON.stringify(userOpts) + 'TC$*/\n\n' + baseCss;

	// Options
	for(let [id, value] of Object.entries(userOpts['options'])) {
		let optData = theme['options'][id];
		
		if(optData['type'] === 'css_content_value') {
			// format text to be valid for CSS content statements
			value = `"${value.replaceAll('"', '\\"').replaceAll('\n', '\\a ').replaceAll('\\','\\\\')}"`;
		}
		else if(optData['type'] === 'image_url') {
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
	function extendCss(extension, location = 'bottom') {
		if(location === 'top') {
			newCss = extension + '\n\n' + newCss;
		} else if(location === 'import') {
			if(/@\\*import/i.test(newCss)) {
				newCss = newCss.replace(/([\s\S]*@\\*import.+?;)/i, '$1\n' + extension);
			} else {
				newCss = extension + '\n\n' + newCss;
			}
		} else {
			newCss = newCss + '\n\n' + extension;
		}
	}
	
	if('mods' in theme) {
		let totalCount = Object.keys(userOpts['mods']).length;

		if(totalCount === 0) {
			pushCss(newCss);
		} else {
			(async () => {
				for(let [id, value] of Object.entries(userOpts['mods'])) {
					let modData = theme['mods'][id];

					for(let [location, resource] of Object.entries(modData['css'])) {
						if(resource.startsWith('http')) {
							try {
								var modCss = await fetchFile(resource);
							} catch (failure) {
								console.log(failure);
							}
						} else {
							var modCss = resource;
						}

						extendCss(modCss, location);
					}

				}

				pushCss(newCss);
			})();
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
	let optData = theme[type][id],
		notice = document.getElementById(`js-${id}-notice`),
		val = document.getElementById(id).value.toLowerCase();
	
	if(val.length === 0) {
		notice.classList.add('o-hidden');
		return undefined;
	}

	if(optData['type'] === 'image_url') {
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



// MAIN PROGRAM

function renderHtml() {
	// Setup basic page structure and add event listeners

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

			if(opt['type'] === 'css_content_value') {
				let input = document.createElement('textarea');
				input.id = optId;
				input.value = opt['default'];
				input.className = 'option__input option__input--textarea';
				input.placeholder = 'Your text here.';
				div.appendChild(input);

				input.addEventListener('input', () => { updateOption('options', optId, opt['default']); });
			}

			else if(opt['type'] === 'image_url') {
				let input = document.createElement('input');
				input.id = optId;
				input.type = 'url';
				input.value = opt['default'];
				input.placeholder = 'https://example.com/image.jpg';
				input.className = 'option__input';
				div.appendChild(input);

				input.addEventListener('input', () => {
					validateInput('options', optId);
					updateOption('options', optId, opt['default']);
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
			desc.innerHTML = 'description' in mod ? mod['description'] : '';
			desc.className = 'option__desc';
			div.appendChild(desc);

			modsEle.appendChild(div);

			document.getElementById(modId).addEventListener('change', () => { updateOption('mods', modId); });
		}
	} else {
		modsEle.remove();
	}
}

// Add functionality to some parts of the page

function importPreviousOpts(opts = undefined) {
	if(opts === undefined) {
		let previous = document.getElementById('js-import-code').value;

		// previous input should be any amount of text that also includes the ^TC{}TC$ text format with stringifed json useropts inside the curly braces. 
		// process previous CSS/input, removing everything except the json.
		previous = previous.match(/\^TC{.*?}}TC\$/);

		if(previous.length === 0) {
			// todo: these return values are unused. Please use them to create a user-facing notice
			return [false, ['Import failed, could not interpret your options. Are you sure your input contains valid options?', 'regex.match']];
		}

		previous = previous[0].substr(3, previous[0].length - 6);

		try {
			var previousOpts = JSON.parse(previous);
		} catch {
			// todo: these return values are unused. Please use them to create a user-facing notice
			return [false, ['Import failed, could not interpret your options.', 'json.parse']];
		}
	} else {
		var previousOpts = opts;
	}

	// Redirect user if they are on the wrong theme.

	if(userOpts['theme'] !== previousOpts['theme'] | userOpts['data'] !== previousOpts['data']) {
		// todo: OFFER to redirect instead of auto-redirecting. Can't be bothered to do this yet as I have not made modal creation easy.

		// do not use alert it's horrible
		alert('You are on the wrong theme page for the imported settings. Redirecting to the correct theme page.');

		localStorage.setItem('tcUserOptsImported', JSON.stringify(previousOpts));
		window.location = `./?theme=${previousOpts['theme']}&data=${previousOpts['data']}&import=1`;
	}

	// set current options to match
	userOpts = previousOpts;
	
	// update HTML to match new options
	let toUpdate = Object.assign({}, userOpts['options'], userOpts['mods']);
	for([id, val] of Object.entries(toUpdate)) {
		let ele = document.getElementById(id);
		if(ele.type === 'checkbox') {
			document.getElementById(id).checked = val;
		} else {
			document.getElementById(id).value = val;
		}
	}

	updateCss();
	return true;
}

document.getElementById('js-import-button').addEventListener('click', () => { importPreviousOpts(); });

// Updates preview CSS & removes loader

function finalSetup() {
	let fetchThemeCss = fetchFile(theme['location']);

	fetchThemeCss.then((css) => {
		// Update Preview
		baseCss = css;
		
	
		// Import settings if requested by URL

		if(query.get('import')) {
			let opts = localStorage.getItem('tcUserOptsImported');
			if(opts === null) {
				console.log('failed to import options');
				// todo: alert user of error here.
			} else {
				try {
					opts = JSON.parse(opts);
				} catch {
					console.log('failed to import options json stringify');
					// todo: alert user of error here.
				}
				// importpreviousopts will call updateCss and pushCss
				importPreviousOpts(opts);
			}
		}

		else {
			pushCss(css);
		}

		// Remove Loader
		loader.loaded();
	});

	fetchThemeCss.catch((reason) => {
		loader.failed(reason);
	});
}

// INITIALISE PAGE

let fetchData = fetchFile(dataJson);

fetchData.then((json) => {
	// Get theme info via json
	try {
		data = JSON.parse(json);
	} catch {
		loader.failed(['Encountered a problem while parsing a resource.', 'json.parse']);
	}

	// Get theme info & redirect if problematic
	if(theme === null || !(selectedTheme in data)) {
		window.location = '?';
	} else {
		theme = data[selectedTheme];
	}

	renderHtml();
	finalSetup();
});

fetchData.catch((reason) => {
	loader.failed(reason);
});