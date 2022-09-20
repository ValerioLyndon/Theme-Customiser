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
	constructor( ){
		this.parent = document.createElement('div');
		this.parent.className = 'messenger is-hidden';
		document.body.appendChild(this.parent);
		this.messages = document.createElement('div');
		this.messages.className = 'messenger__container';
		this.parent.appendChild(this.messages);
		this.button = document.createElement('div');
		this.button.className = 'messenger__show-button';
		this.parent.appendChild(this.button);
	}

	send( text, type = 'notice', subtext = null, destruct = -1 ){
		this.parent.classList.remove('is-hidden');

		let msg = document.createElement('div'),
			head = document.createElement('b');

		msg.className = 'messenger__message is-visible';
		msg.innerHTML = text;
		head.className = 'messenger__message-header';
		head.textContent = type.toUpperCase();
		msg.prepend(head);

		if( type === 'error' ){
			msg.classList.add('messenger__message--error');
		}
		else if( type === 'warning' ){
			msg.classList.add('messenger__message--warning');
		}

		if( subtext ){
			let sub = document.createElement('i');
			sub.className = 'messenger__message-subtext';
			sub.textContent = subtext;
			msg.appendChild(sub);
		}

		this.messages.appendChild(msg);

		// add animation
		setTimeout(() => {
			msg.classList.remove('is-visible');
		}, 9700);

		// self destruct message
		if( destruct > -1 ){
			setTimeout(() => {
				msg.remove();
				this.hideIfEmpty();
			}, 10000 + destruct);
		}
	}

	warn( msg, code = null ){
		if(code) {
			code = `Code: ${code}`;
		}
		this.send(msg, 'warning', code);
	}

	error( msg, code = null ){
		if(code) {
			code = `Code: ${code}`;
		}
		this.send(msg, 'error', code);
	}

	timeout( msg, destruct = 0 ){
		this.send(msg, 'notice', null, destruct);
	}

	clear( amount = 0 ){
		if( amount > 0 ){	
			while( amount > 0 && this.messages.firstChild ){
				this.messages.removeChild( this.messages.lastChild );
				amount--;
			}
		}
		else {
			this.messages.replaceChildren();
		}

		this.hideIfEmpty();
	}

	hideIfEmpty( ){
		let msgs = this.messages.childNodes;
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

// Capitalises the first letter of every word. To capitalise sentences, set the divider to ".".
function capitalise(str, divider = ' ') {
	let words = str.split(divider);
	
	for(i = 0; i < words.length; i++) {
		let first = words[i].substring(0,1).toUpperCase(),
			theRest = words[i].substring(1);
		words[i] = first + theRest;
	}
	
	str = words.join(divider);
	return str;
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

// Tag variables

var tags = {};

function formatFilters( filters ){
	if( filters instanceof Array ){
		return {'other': filters};
	}
	if( filters instanceof Object ){
		return filters;
	}
	return {};
}

function pushFilter(thisId, tag, category = 'other') {
	if( !tags[category] ){
		tags[category] = [];
	}
	if( !tags[category][tag] ){
		tags[category][tag] = [];
	}
	tags[category][tag].push(thisId);
}

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
class BaseFilters {
	constructor( items, selector = 'ID' ){
		// Variables for all
		this.toggle = document.getElementById('js-tags__button');
		this.toggleCls = 'has-selected';
		this.clearBtn = document.getElementById('js-tags__clear');
		this.items = [...items];

		// Tag Variables
		this.tagContainer = document.getElementById('js-tags__cloud');
		this.buttons = [];
		this.selectedButtons = [];
		this.selectedTags = {};
		this.btnCls = 'is-selected';
		this.itemTagCls = 'is-hidden-by-tag';

		// Other Variables
		this.selector = selector;

		// Create Meta Buttons
		if( this.clearBtn ){
			this.clearBtn.classList.remove('o-hidden');
			this.clearBtn.addEventListener('click', () => {
				this.reset();
			});
		}
	}

	renderTags( tags ){
		this.toggle.classList.remove('o-hidden');

		let tagCategories = Object.entries(tags);
		for( let [category, tags] of tagCategories ){
			let totalInCategory = 0;

			let group = document.createElement('div');
			group.className = 'tag-cloud__group';
			if(category === 'other') {
				group.style.order = 100;
			} else if(category === 'list type') {
				group.style.order = 1;
				group.classList.add('tag-cloud__group--column');
			} else if(category === 'layout') {
				group.style.order = 2;
				group.classList.add('tag-cloud__group--column');
			} else {
				group.style.order = 50;
			}
			this.tagContainer.appendChild(group);

			let header = document.createElement('div');
			if( tagCategories.length > 1 ){
				header.textContent = capitalise(category);
				header.className = 'tag-cloud__header';
				group.appendChild(header);
			}

			// Sort filters ascending
			tags = sortKeys(tags);

			// Create Filter Buttons
			for(let [tag, itemIds] of Object.entries(tags)) {
				let button = document.createElement('button'),
					countEle = document.createElement('span'),
					count = itemIds.length;

				// skip rendering tag if all items match, thus making it useless
				if( count === this.items.length ){
					continue;
				} else {
					totalInCategory++;
				}

				button.textContent = tag;
				button.className = 'tag-cloud__tag';
				button.id = `tag:${tag}`;

				// count of items
				countEle.textContent = count;
				countEle.className = 'tag-cloud__count';
				button.appendChild(countEle);
				group.appendChild(button);

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
				button.addEventListener('click', () => { this.activateTag(button, tag, itemIds); });
			}

			// If category is empty, skip
			if( totalInCategory === 0 ){
				group.remove();
			}
		}
	}

	reset( ){
		this.resetTags();
	}
	resetTags( ){
		query.remove('tags');

		for( let item of this.items ){
			item.classList.remove(this.itemTagCls);
		}

		this.toggle.classList.remove(this.toggleCls);
		for( let btn of this.buttons ){
			btn['btn'].classList.remove('is-disabled', 'is-selected');
			btn['count'].textContent = btn['total'];
		}
		this.selectedButtons = [];
		this.selectedTags = [];
	}

	// ID Formatting
	formatId( id ) {
		return this.selector.replace('ID', id);
	}

	// On button click
	activateTag( button, itemName, itemIds ){
		// Check if already selected and select button if not
		let tagQ = query.get('tags'),
			tagSplit = tagQ ? tagQ.split('&&') : [],
			tagIndex = tagSplit.indexOf(itemName);
		
		let selected = this.selectedButtons.indexOf(button);
		if( selected !== -1 ){
			button.classList.remove(this.btnCls);
			this.selectedButtons.splice(selected, 1);
			delete this.selectedTags[itemName];

			// Remove from URL
			if( tagIndex !== -1 ) {
				tagSplit.splice(tagIndex, 1);
				query.set('tags', tagSplit.join('&&'));
			}
		}
		else {
			this.toggle.classList.add(this.toggleCls);
			button.classList.add(this.btnCls);
			this.selectedButtons.push(button);
			this.selectedTags[itemName] = itemIds;

			// Add to URL
			if( tagIndex === -1 ) {
				tagSplit.push(itemName);
				query.set('tags', tagSplit.join('&&'));
			}
		}

		// If nothing is selected anymore, clear all.
		if( this.selectedButtons.length === 0 ){
			this.resetTags();
			return;
		}
		
		// Calculate new filter based on selected buttons
		let filterCount = {};
		for( let filter of Object.values(this.selectedTags) ){
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
			if( count === Object.keys(this.selectedTags).length ){
				andFilters.push(id);
			}
		}

		// Show matching items
		for( let item of this.items ){
			if( andFilters.includes(item.id) ) {
				item.classList.remove(this.itemTagCls);
			}
			else {
				item.classList.add(this.itemTagCls);
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

// URL class for easy setting and changing of current location.
const query = new class ActiveURLParams {
	constructor( ){
		this.url = new URL(document.location);
		this.params = this.url.searchParams;
		// aliases
		this.remove = this.delete;
		this.add = this.set;
	}

	has( ){
		return this.params.has(...arguments);
	}
	get( ){
		return this.params.get(...arguments);
	}
	getAll( ){
		return this.params.getAll(...arguments);
	}
	entries( ){
		return this.params.entries(...arguments);
	}
	append( ){
		this.params.append(...arguments);
		this.updateUrl();
	}
	set( ){
		this.params.set(...arguments);
		this.updateUrl();
	}
	delete( ){
		this.params.delete(...arguments);
		this.updateUrl();
	}

	updateUrl( ){
		history.replaceState(null, '', this.url.href);
	}
	gotoUrl( ){
		window.location = this.url.href;
	}
};

// VARIABLES

const
	megaUrls = query.getAll('m'),
	collectionUrls = query.getAll('c'),
	themeUrls = query.getAll('t'),
	loader = new loadingScreen(),
	messenger = new messageHandler(),
	jsonVersion = 0.3;



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
		messenger.send('Detected JSON version beyond what is supported by this instance. Attempting to process as normal. If any bugs or failures occur, try using the main instance at valeriolyndon.github.io.');
		console.log('Detected JSON version beyond what is supported by this instance. Attempting to process as normal. If any bugs or failures occur, try updating your fork from the main instance at valeriolyndon.github.io.');
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