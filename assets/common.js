class loadingScreen {
	constructor() {
		this.pageContent = document.getElementById('js-content');
		this.parent = document.getElementById('js-loader');
		this.icon = document.getElementById('js-loader-icon');
		this.titleText = document.getElementById('js-loader-text');
		this.subText = document.getElementById('js-loader-subtext');
		this.subText2 = document.getElementById('js-loader-subsubtext');
		this.home = document.getElementById('js-loader-home');
		this.stop = false;
	}

	text(txt) {
		this.titleText.textContent = txt;
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
			this.titleText.textContent = 'Page Failure.';
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
			console.log(`[info] Retrieving cached result for ${path}`);
			resolve(cache);
		}
		else {
			console.log(`[info] Fetching ${path}`);
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
						console.log(`[ERROR] Failed while fetching "${path}". Code: request.status.${request.status}`);
						reject([`Encountered a problem while loading a resource.`, `request.status.${request.status}`]);
					}
				}
			}
			request.onerror = function(e) {
				console.log(`[ERROR] Failed while fetching "${path}". Code: request.error`);
				reject(['Encountered a problem while loading a resource.', 'request.error']);
			}
		}
	});
}

function importPreviousSettings(opts = undefined) {
	if(opts === undefined) {
		let previous = document.getElementById('js-pp-import-code').value;

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
			previous = previous.match(/\^TC{.*?}TC\$/);

			if(previous === null) {
				messenger.error('Import failed, could not interpret your options. Are you sure you input the correct text?', ' regex.match');
				return false;
			}

			previous = previous[0].substr(3, previous[0].length - 6);

			try {
				var previousSettings = JSON.parse(previous);
			} catch(e) {
				console.log(`[ERROR] Failed to parse imported settings JSON: ${e}`);
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

	// Do nothing if on theme page & userSettings are the same.
	if(userSettings & userSettings === previousSettings) {
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

// sorts a dictionary by key
function sortKeys(dict) {
	let keys = Object.keys(dict);
	keys.sort((a,b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	let sorted = {};
	for(let k of keys) {
		sorted[k] = dict[k];
	}

	return sorted;
}

// Tag Functionality & Renderer

/* Adds functional tags to the HTML.
 | 
 | Constructor must be fed:
 | • a NodeList or array of Nodes
 | • a dictionary of filter/ID pairs. Example:
 |   {
 |     "My Tag": [0, 3, 12, 32],
 |     …
 |   }
 | • a string selector with "ID" in place of tag ID. E.x:
 |   "card:ID" or "mod:ID"
 |
 | Also requires two elements in the HTML:
 | • A button with ID 'js-tags__button'
 | • A div with ID 'js-tags__cloud'
 */
class filters {
	constructor( items, filters, selector = 'ID' ){
		// DOM Nodes
		this.toggle = document.getElementById('js-tags__button');
		this.container = document.getElementById('js-tags__cloud');
		this.allItems = [...items];
		this.hiddenItems = []; // Array
		this.visibleItems = [...items]; // Array
		this.buttons = [];
		this.selectedButtons = [];
		this.selectedFilters = {};

		// Class Names
		this.itemCls = 'is-hidden-by-tag';
		this.btnCls = 'is-selected';
		this.toggleCls = 'has-selected';

		// Other Variables
		this.selector = selector;


		// Render HTML
		this.toggle.classList.remove('o-hidden');

		let filterCategories = Object.entries(filters);
		for( let [category, tags] of filterCategories ){
			if( filterCategories.length > 1 ){
				let header = document.createElement('div');
				header.textContent = capitalise(category);
				header.className = 'tag-cloud__header';
				this.container.appendChild(header);
			}

			// Sort filters ascending
			tags = sortKeys(tags);

			// Create HTML
			for(let [tag, itemIds] of Object.entries(tags)) {
				let button = document.createElement('button'),
					countEle = document.createElement('span'),
					count = itemIds.length;

				button.textContent = tag;
				button.className = 'tag-cloud__tag';

				// count of items
				countEle.textContent = count;
				countEle.className = 'tag-cloud__count';
				button.appendChild(countEle);
				this.container.appendChild(button);

				// format Ids
				for( let i = 0; i < itemIds.length; i++ ) {
					itemIds[i] = this.formatId(itemIds[i]);
				}

				this.buttons.push({
					'btn': button,
					'count': countEle,
					'ids': itemIds,
					'total': count
				});

				// Add tag button functions
				button.addEventListener('click', () => { this.activateFilter(button, tag, itemIds); });
			}
		}
	}

	// Show/hide individual items
	show( node ){
		// Remove from hidden
		let hidden = this.hiddenItems.indexOf(node);
		if(hidden !== -1) {
			this.hiddenItems.splice(hidden,1);
		}
		// Show in DOM and add to visible
		node.classList.remove(this.itemCls);
		this.visibleItems.push(node);
	}
	hide( node ){
		// Remove from visible
		let visible = this.visibleItems.indexOf(node);
		if(visible !== -1) {
			this.visibleItems.splice(visible,1);
		}
		// Hide in DOM and add to hidden
		node.classList.add(this.itemCls);
		this.hiddenItems.push(node);
	}

	// Show all items
	showAll( ){
		for( let item of this.hiddenItems ){
			item.classList.remove(this.itemCls);
		}
		for( let btn of this.buttons ){
			btn['btn'].classList.remove('is-disabled');
			btn['count'].textContent = btn['total'];
		}
		this.hiddenItems = [];
		this.visibleItems = [...this.allItems];
	}

	// ID Formatting
	formatId( id ) {
		return this.selector.replace('ID', id);
	}

	// On button click
	activateFilter( button, itemName, itemIds ){
		// Check if already selected and select button if not
		let selected = this.selectedButtons.indexOf(button);
		if( selected !== -1 ){
			button.classList.remove(this.btnCls);
			this.selectedButtons.splice(selected, 1);
			delete this.selectedFilters[itemName];
		}
		else {
			this.toggle.classList.add(this.toggleCls);
			button.classList.add(this.btnCls);
			this.selectedButtons.push(button);
			this.selectedFilters[itemName] = itemIds;
		}

		// If nothing is selected anymore, clear all.
		if( this.selectedButtons.length === 0 ){
			this.toggle.classList.remove(this.toggleCls);
			this.showAll();
			return;
		}
		
		// Calculate new filter based on selected buttons
		let filterCount = {};
		for( let filter of Object.values(this.selectedFilters) ){
			for( let id of filter ){
				if( !Object.keys(filterCount).includes(id) ){
					filterCount[id] = 1;
				} else {
					filterCount[id] += 1;
				}
			}
		}
		let orFilters = Object.keys(filterCount),
			andFilters = [];
		// create AND filter by only adding filters that match all of the selected filters
		for( let [id, count] of Object.entries(filterCount) ){
			if( count === Object.keys(this.selectedFilters).length ){
				andFilters.push(id);
			}
		}

		// Show matching items
		for( let item of this.allItems ){
			if( andFilters.includes(item.id) ) {
				this.show(item);
			}
			else {
				this.hide(item);
			}
		}

		// Update buttons
		for( let btn of this.buttons ){
			let crossover = 0;
			for( let id of andFilters ){
				if( btn['ids'].includes(id) ){
					crossover++;
				}
			}
			btn['count'].textContent = crossover;
			if( crossover === 0 ){
				btn['btn'].classList.add('is-disabled');
			}
		}
	}
}


// VARIABLES

const
	query = (new URL(document.location)).searchParams,
	megaUrls = query.getAll('m'),
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
	loader.text('Updating JSON...');

	var ver = 0;
	if(!('json_version' in json)) {
		ver = 0.1;
	} else {
		ver = json['json_version'];
	}

	// Else, continue to process.
	if(ver > jsonVersion) {
		console.log('Detected JSON version ahead of current release. Processing as normal.');
	}

	else if(ver < jsonVersion) {
		console.log('The loaded JSON has been processed as legacy JSON. This can cause slowdowns or errors. If you are the JSON author, please see the GitHub page for assistance updating.');
		if(ver === 0.1) {
			json = updateToBeta2(json, url, toReturn);
			ver = 0.2;
		}
	}

	// Process as normal once format has been updated
	
	// Process as collection or fetch correct theme from collection
	if(toReturn === 'collection' && 'themes' in json
	|| 'data' in json) {
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
	// If a collection is linked under a theme query, check for valid values
	else if('themes' in json && Object.values(json['themes']).length > 0) {
		let themeUrl = false;
		if(toReturn in json['themes']) {
			themeUrl = json['themes'][toReturn]['url'];
		} else {
			themeUrl = Object.values(json['themes'])[0]['url'];
		}

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
		return 'The linked theme could not be parsed.';
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