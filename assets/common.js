class loadingScreen {
	constructor() {
		this.pageContent = document.getElementById('js-content');
		this.parent = document.getElementById('js-loader');
		this.icon = document.getElementById('js-loader-icon');
		this.text = document.getElementById('js-loader-text');
		this.subText = document.getElementById('js-loader-subtext');
		this.subText2 = document.getElementById('js-loader-subsubtext');
		this.home = document.getElementById('js-loader-home');
		this.stop = false;
	}

	loaded() {
		this.pageContent.classList.add('is-loaded');
		this.parent.classList.add('is-hidden');
		var that = this;
		setTimeout(function() {
			that.parent.classList.add('o-hidden');
		}, 1500)
	}

	failed(reason_array) {
		// only runs once
		if(!this.stop) {
			this.icon.className = 'loading-screen__cross';
			this.text.textContent = 'Page Failure.';
			this.subText.textContent = reason_array[0];
			this.subText2.classList.remove('o-hidden');
			this.subText2.textContent = `Code: ${reason_array[1]}`;
			this.home.classList.remove('o-hidden');
			this.stop = true;
			return new Error(reason_array[1]);
		}
	}
}

class messageHandler {
	constructor() {
		this.parent = document.getElementById('js-messenger');
	}

	send(text, type = 'notice', subtext = null, destruct = -1) {
		this.parent.classList.remove('is-hidden');

		let msg = document.createElement('div'),
			head = document.createElement('b');

		msg.className = 'messenger__message js-message';
		msg.innerHTML = text;
		head.className = 'messenger__message-header';
		head.textContent = type.toUpperCase();
		msg.prepend(head);

		if(type === 'error') {
			msg.classList.add('messenger__message--error');
		}
		else if(type === 'warning') {
			msg.classList.add('messenger__message--warning');
		}

		if(subtext) {
			let sub = document.createElement('i');
			sub.className = 'messenger__message-subtext';
			sub.textContent = subtext;
			msg.appendChild(sub);
		}

		this.parent.appendChild(msg);

		if(destruct > -1) {
			setTimeout(() => {
				msg.remove();
				this.hideIfEmpty();
			}, 10000 + destruct);
		}
	}

	warn(msg, code = null) {
		if(code) {
			code = `Code: ${code}`;
		}
		this.send(msg, 'warning', code);
	}

	error(msg, code = null) {
		if(code) {
			code = `Code: ${code}`;
		}
		this.send(msg, 'error', code);
	}

	timeout(msg, destruct = 0) {
		this.send(msg, 'notice', null, destruct);
	}

	clear(amount = 0) {
		let msgs = this.parent.getElementsByClassName('js-message');
		if(amount > 0) {
			for(let i = 0; i < msgs.length && i < amount; i++) {
				msgs[i].remove();
			}
		} else {
			for(let msg of msgs) {
				msg.remove();
			}
		}
		this.hideIfEmpty();
	}

	hideIfEmpty() {
		let msgs = this.parent.getElementsByClassName('js-message');
		if(msgs.length === 0) {
			this.parent.classList.add('is-hidden');
		}
	}
}

function fetchFile(path, cacheResult = true) {
	return new Promise((resolve, reject) => {
		// Checks if item has previously been fetched and returns the cached result if so
		let cache = sessionStorage.getItem(path);

		if(cacheResult && cache) {
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
						if(cacheResult) {
							sessionStorage.setItem(path, request.responseText);
						}
						resolve(request.responseText);
					} else {
						console.log(`[FetchFile] Failed while fetching "${path}". Code: request.status.${request.status}`);
						reject([`Encountered a problem while loading a resource.`, `request.status.${request.status}`]);
					}
				}
			}
			request.onerror = function(e) {
				console.log(`[FetchFile] Failed while fetching "${path}". Code: request.error`);
				reject(['Encountered a problem while loading a resource.', 'request.error']);
			}
		}
	});
}

function importPreviousSettings(opts = undefined) {
	if(opts === undefined) {
		let previous = document.getElementById('js-import-code').value;

		// Skip if empty string or does not contain formatting.
		if(previous.trim().length === 0) {
			messenger.timeout('Please enter your settings into the text field and try again.');
			return false;
		}

		if(previous.indexOf('{') === -1) {
			messenger.error('Import failed, your text does not appear to contain any settings. Please input a valid settings object.');
			return false;
		}

		// previous input should be either:
		// * a raw JSON object
		// * random text that includes the ^TC{}TC$ text format with stringifed json userSettings inside the curly braces. 
		
		// Try to parse as JSON, if it fails then process as normal string.
		try {
			var previousSettings = JSON.parse(previous.trim());
		}
		catch {
			previous = previous.match(/\^TC{.*?}}TC\$/);

			if(previous === null) {
				messenger.error('Import failed, could not interpret your options. Are you sure you input the correct text?', ' regex.match');
				return false;
			}

			previous = previous[0].substr(3, previous[0].length - 6);

			try {
				var previousSettings = JSON.parse(previous);
			} catch(e) {
				console.log(`[importPreviousSettings] Error during JSON.parse: ${e}`);
				messenger.error('Import failed, could not interpret your options. Are you sure you copied and pasted all the settings?', 'json.parse');
				return false;
			}
		}
	} else {
		var previousSettings = opts;
	}

	localStorage.setItem('tcUserSettingsImported', JSON.stringify(previousSettings));
	
	// Redirect without asking if on the browse page.
	if(!window.location.pathname.startsWith('/theme')) {
		localStorage.setItem('tcImport', true);
		window.location = `./theme?q=${previousSettings['theme']}&t=${previousSettings['data']}`;
	}

	// Do nothing if userSettings are the same.
	if(userSettings === previousSettings) {
		messenger.warn('Nothing imported. Settings exactly match the current page.');
		return null;
	}
    
	// If theme or data is wrong, offer to redirect or to try importing anyway.
	else if(userSettings['theme'] !== previousSettings['theme'] || userSettings['data'] !== previousSettings['data']) {
		let msg = 'There is a mismatch between your imported settings and the current page. Redirect to the page indicated in your import?',
			choices = {
				'Yes': {'value': 'redirect', 'type': 'suggested'},
				'No, apply settings here.': {'value': 'ignore'},
				'No, do nothing.': {'value': 'dismiss'}
			};
		
		confirm(msg, choices)
		.then((choice) => {
			if(choice === 'redirect') {
				localStorage.setItem('tcImport', true);
				window.location = `./theme?q=${previousSettings['theme']}&t=${previousSettings['data']}`;
			} else if(choice === 'ignore') {
				applySettings(previousSettings);
				return true;
			} else {
				localStorage.removeItem('tcImport');
				messenger.timeout('Action aborted.');
			}
		});

		return false;
	}
	applySettings(previousSettings);
	messenger.timeout('Settings import complete.');
	return true;
}

function toggleEle(selector, btn = false, set = undefined) {
	let ele = document.querySelector(selector),
		cls = 'is-hidden',
		btnCls = 'is-active';
	if(set === true) {
		ele.classList.add(cls);
		if(btn) { btn.classList.add(btnCls); }
	} else if(set === false) {
		ele.classList.remove(cls);
		if(btn) { btn.classList.remove(btnCls); }
	} else {
		ele.classList.toggle(cls);
		if(btn) { btn.classList.toggle(btnCls); }
	}
}



// VARIABLES

const
	query = (new URL(document.location)).searchParams,
	collectionUrls = query.getAll('c'),
	themeUrls = query.getAll('t'),
	loader = new loadingScreen(),
	messenger = new messageHandler(),
	jsonVersion = 0.2;



// LEGACY JSON MANAGEMENT
// Detect and Manage legacy JSON versions and URL parameters.

let path = window.location.pathname,
	dataUrls = query.getAll('data');

// Check for legacy JSON and process as needed
async function processJson(json, url, toReturn) {
	var ver = 0;
	if(!('json_version' in json)) {
		ver = 0.1;
	} else {
		ver = json['json_version'];
	}

	// Process as normal if version is good
	if(ver === jsonVersion) {
		// Process as collection or fetch correct theme from collection
		if(toReturn === 'collection' && 'themes' in json
		|| toReturn === 'theme' && 'data' in json) {
			// Convert legacy dictionary to array
			if('themes' in json && !Array.isArray(json['themes'])) {
				let arrayThemes = [];
				for(let t of Object.values(json['themes'])) {
					arrayThemes.push(t);
				}
				json['themes'] = arrayThemes;
			}
			return json;
		}
		else if('themes' in json && toReturn in json['themes']) {
			let themeUrl = json['themes'][toReturn]['url'];
			if(themeUrl) {
				return fetchFile(themeUrl)
				.then((result) => {
					let themeJson = '';
					try {
						themeJson = JSON.parse(result);
					} catch {
						themeJson = false;
					}
					return themeJson;
				})
				.catch(() => {
					return false;
				});
			}
		}
		else {
			return 'The linked theme lacks a "data" or a "themes" entry.';
		}
	}

	// Else, continue to process.
	else if(ver > jsonVersion) {
		messenger.warn('Detected JSON version ahead of current release. Processing as normal.');
		return json;
	}

	else {
		messenger.warn('The loaded JSON has been processed as legacy JSON. This can cause slowdowns or errors. If you are the JSON author, please see the GitHub page for assistance updating.');
		if(ver === 0.1) {
			return updateToBeta2(json, url, toReturn);
		}
	}
}


// json v0.0 > v0.1

// Redirect from browse page to theme page if a theme is specified
let themeQuery = query.get('q') || query.get('theme')
if(path !== '/theme' && themeQuery && dataUrls.length > 0) {
	window.location = `./theme?q=${themeQuery}&c=${dataUrls.join('&c=')}`;
	throw new Error();
}


// json v0.1 > v0.2

if(dataUrls.length > 0) {
	let modifiedQuery = new URLSearchParams();
	// Transform data into collections
	for(let [key, val] of query.entries()) {
		if(key === 'data') {
			key = 'c';
		}
		modifiedQuery.append(key, val);
	}
	// Redirect
	window.location = `${window.location.href.split('?')[0]}?${modifiedQuery.toString()}`;
	throw new Error();
}

function updateToBeta2(json, url, toReturn) {
	if(toReturn === 'collection') {
		let newJson = {
			'themes': []
		};
		for(let [themeId, theme] of Object.entries(json)) {
			theme['url'] = url + '&q=' + themeId;
			newJson['themes'].push(theme);
		}
		return newJson;
	}
	else {
		if(toReturn in json) {
			return { 'data': json[toReturn] };
		} else {
			return false;
		}
	}

}