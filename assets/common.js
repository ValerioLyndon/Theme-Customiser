'use strict';

// Utility Functions

function inObj( object, string ) {
	return Object.keys(object).includes(string);
}

function isString( variable ){
	return typeof variable === 'string';
}
function isNumber( variable ){
	return typeof variable === 'number';
}
function isInt( variable ){
	return isNumber(variable) && !variable.toString().includes('.');
}
function isFloat( variable ){
	return isNumber(variable) && variable.toString().includes('.');
}
function isBool( variable ){
	return typeof variable === 'boolean';
}
function isArray( variable ){
	return variable instanceof Array;
}
function isDict( variable ){
	return variable instanceof Object && variable?.toString() === '[object Object]';
}

function parseBool( variable ){
	return isBool(variable) ? variable : variable === 'true' ? true : variable === 'false' ? false : variable;
}

function isValidUrl( string ){
	return /^https?:\/\//.test(string) || string.startsWith('mailto:');
}

class LoadingScreen {
	constructor( ){
		this.stop = false;
		
		this.loader = document.createElement('div');
		this.loader.className = 'loading-screen';
		this.icon = document.createElement('div');
		this.icon.className = 'loading-screen__spinner';
		this.title = document.createElement('h1');
		this.title.className = 'loading-screen__item loading-screen__title';
		this.title.text = 'Loading...';
		this.messages = document.createElement('div');
		this.messages.className = 'loading-screen__message-boxes';

		this.loader.append(this.icon, this.title);
		document.body.append(this.loader);
	}

	text( txt ){
		this.title.textContent = txt;
		this.log(txt, false);
	}

	log( msg, toBrowser = true, html = false){
		let paragraph = document.createElement('div');
		if( html ){
			paragraph.className = 'loading-screen__message';
			paragraph.innerHTML = msg;
		}
		else {
			paragraph.className = 'loading-screen__message o-pre-wrap';
			paragraph.textContent = msg;
		}
		this.messages.appendChild(paragraph);
		if( toBrowser ){
			console.log(msg);
		}
	}

	logJsonError( msg, json, error, url = 'unknown' ){
		console.log(error);
		let eStr = error.toString();
		try {
			let lines = json.split('\n');
			let errorReason = eStr.match(/JSON\.parse:(.*?)at line [0-9]/)[1].trim();
			let errorInfo = eStr.match(/line ([0-9]*) column ([0-9]*)/);
			let errorLine = errorInfo[1] - 2;
			let errorChar = errorInfo[2] - 2;

			this.log(`${msg}
			<table class="table">
				<tbody>
					<tr>
						<td class="table__label-cell">Faulty Collection URL: </td>
						<td>${url}</td>
					</tr>
					<tr>
						<td class="table__label-cell">Reason for error: </td>
						<td>${errorReason}</td>
					</tr>
					<tr>
						<td class="table__label-cell">Location of error: </td>
						<td>${errorInfo[0]}</td>
					</tr>
					<tr>
						<td class="table__label-cell">Line in question: </td>
						<td class="o-pre-wrap">${lines[errorLine]}</td>
					</tr>
				</tbody>
			</table>
			`, false, true);
		}
		catch {
			this.log(`[ERROR] Failed to parse JSON of collection URL: "${url}"\n\tError text: ${error}`);
		}
	}

	loaded( ){
		document.getElementById('js-content').classList.add('is-loaded');
		this.loader.classList.add('is-hidden');
		var that = this;
		setTimeout(() => {
			that.loader.classList.add('o-hidden');
		}, 1500)
	}

	failed( reason_array ){
		this.log(reason_array[0]);
		this.log(`Bailing out with code "${reason_array[1]}".`);
		// only runs once
		if( !this.stop ){
			this.icon.className = 'loading-screen__cross';
			this.title.textContent = 'Something broke!';

			let description = document.createElement('p');
			description.className = 'loading-screen__item loading-screen__description';
			description.textContent = reason_array[0];
			let link = document.createElement('a');
			link.className = 'loading-screen__item hyperlink';
			link.href = './';
			link.textContent = 'Back to main page.';
			let logs = document.createElement('div');
			logs.className = 'loading-screen__console is-hidden';
			let logHeader = document.createElement('div');
			logHeader.className = 'loading-screen__console-header';
			logHeader.textContent = 'Timeline';
			let copyLogs = document.createElement('button');
			copyLogs.className = 'loading-screen__console-button button js-swappable-text';
			copyLogs.innerHTML =
				`<div class="swappable-text">
					<div class="swappable-text__text">
						Copy Logs
						<br />
						Copied.
					</div>
				</div>`;
			let openLogs = document.createElement('a');
			openLogs.className = 'loading-screen__item hyperlink';
			openLogs.textContent = 'Open logs.';
			this.logs = document.getElementById('js-loader-console');

			copyLogs.addEventListener('click', ()=>{
				navigator.clipboard.writeText(this.messages.outerText);
			});
			openLogs.addEventListener('click', ()=>{
				toggleEle(logs);
			});

			logHeader.append(copyLogs);
			logs.append(logHeader, this.messages);
			this.loader.append(description, link, openLogs, logs);

			this.stop = true;
			return new Error(reason_array[1]);
		}
	}
}

class MessageHandler {
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

		let msg = document.createElement('div');
		let head = document.createElement('b');

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
		if( code ){
			code = `Code: ${code}`;
		}
		this.send(msg, 'warning', code);
	}

	error( msg, code = null ){
		if( code ){
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
		if( msgs.length === 0 ){
			this.parent.classList.add('is-hidden');
		}
	}
}

// Renders a confirmation popup with custom text and optionally custom buttons if provided a dictionary. 
function userConfirm( msg, options = {'Yes': {'value': true, 'type': 'suggested'}, 'No': {'value': false}} ){
	return new Promise((resolve) => {
		let modal = document.createElement('div');
		let modalInner = document.createElement('div');
		let modalExit = document.createElement('div');
		let modalContent = document.createElement('div');
		let header = document.createElement('h4');
		let blurb = document.createElement('p');

		modal.className = 'popup';
		modal.id = 'js-confirmation';
		modalInner.className = 'popup__inner';
		modalExit.className = 'popup__invisibutton';
		modalExit.addEventListener('click', ()=>{ toggleEle('#js-confirmation') });
		modalContent.className = 'popup__content popup__content--narrow';
		header.className = 'popup__header';
		header.textContent = 'Confirm action.';
		blurb.className = 'popup__paragraph';
		blurb.textContent = msg;

		modal.appendChild(modalInner);
		modalInner.appendChild(modalExit);
		modalInner.appendChild(modalContent);
		modalContent.appendChild(header);
		modalContent.appendChild(blurb);

		// Render buttons based off of the input dictionary

		function complete( returnValue ){
			resolve(returnValue);
			modal.remove();
		}

		for( let [label, details] of Object.entries(options) ){
			let btn = document.createElement('button');
			btn.className = 'button';
			if( details.type === 'suggested' ){
				btn.classList.add('butted--highlighted');
			}
			else if( details.type === 'danger' ){
				btn.classList.add('button--danger');
			}
			btn.textContent = label;
			btn.addEventListener('click', ()=>{complete(details.value)});
			modalContent.appendChild(btn);
		}

		modalExit.addEventListener('click', ()=>{complete(false)});

		document.body.appendChild(modal);
	});
}

// Information popup that can be positioned anywhere on the page. Useful for a variety of circumstances.
class DynamicPopup {
	constructor( ){
		this.element = document.createElement('div');
		this.element.className = 'dynamic-popup';
		document.body.appendChild(this.element);
		// Prevent "this" from being hijacked by other code
		this.hide = this.hide.bind(this);
	}

	// target should either be an HTML element or an array of [x, y] coords.
	show( target, alignment = 'left' ){
		// Setup variables
		let x = 0;
		let y = 0;
		let targetW = 0;
		let targetH = 0;
		let popW = this.element.getBoundingClientRect().width;
		let popH = this.element.getBoundingClientRect().height;
		let maxW = window.innerWidth;
		let maxH = window.innerHeight;

		if( target instanceof Element || target instanceof HTMLElement ){
			let bounds = target.getBoundingClientRect();
			x = bounds.left;
			y = bounds.top;
			targetW = bounds.width;
			targetH = bounds.height;
			
		}
		else if( target instanceof Array ){
			x = target[0];
			y = target[1];
		}
		else {
			return false;
		}

		// Calculate position

		if( alignment === 'left' ){
			x = x + targetW + 12;
			y = y + targetH/2 - popH/2;
			this.element.classList.add('left');
			this.element.classList.remove('top', 'bottom', 'right');
		}
		else if( alignment === 'right' ){
			x = x - (targetW + 12) - popW;
			y = y + targetH/2 - popH/2;
			this.element.classList.add('right');
			this.element.classList.remove('top', 'bottom', 'left');
		}
		else if( alignment === 'top' ){
			x = x + (targetW / 2) - (popW / 2);
			y = y + targetH + 12;
			this.element.classList.add('top');
			this.element.classList.remove('left', 'bottom', 'right');
		}
		else if( alignment === 'bottom' ){
			x = x + (targetW / 2) - (popW / 2);
			y = y - 100;
			console.log('[warn] DynamicPopup top alignment is not supported yet');
			this.element.classList.add('bottom');
			this.element.classList.remove('top', 'left', 'right');
		}
		else if( alignment === 'none' ){
			x = x - (popW / 2);
			y = y - (popH / 2);
			this.element.classList.remove('top', 'left', 'right', 'bottom');
		}

		// Stay within window bounds

		if( x + popW > maxW ){
			x = maxW - popW;
		}
		else if( x < 0 ){
			x = 0;
		}

		if( y + popH > maxH ){
			y = maxH - popH;
		}
		else if( y < 0 ){
			y = 0;
		}

		// Set attributes

		this.element.style.left = `${x}px`;
		this.element.style.top = `${y}px`;
		this.element.classList.add('is-visible');
	}

	hide( ){
		this.element.classList.remove('is-visible');
	}

	destruct( ){
		this.element.remove();
	}
}

class InfoPopup extends DynamicPopup {
	constructor( ){
		super();
		this.element.classList.add('dynamic-popup__info');
	}

	text( txt = '' ){
		this.element.innerHTML = txt;
	}
}

// Fetches and returns resources.
// If cacheResult is true, the result is stored and later fetched from localStorage.
async function fetchFile( path, cacheResult = true ){
	let cache = sessionStorage.getItem(path);
	if( cacheResult && cache ){
		console.log(`[info] Retrieving cached result for ${path}`);
		return cache;
	}

	console.log(`[info] Fetching ${path}`);
	try {
		const response = await fetch(path);
		if( !response.ok ){
			throw new Error(`Status ${response.status}`);
		}
		const text = await response.text();

		if( cacheResult ){
			sessionStorage.setItem(path, text);
		}
		return text;
	}
	catch( error ){
		loader.log(`[ERROR] Failed while fetching "${path}".\n${error}`, true);
		return ['Encountered a problem while loading a resource.', 'request.error'];
	}
}

function importPreviousSettings( opts = undefined ){
	if( opts === undefined ){
		let previous = document.getElementById('js-pp-import-code').value;

		// Skip if empty string or does not contain formatting.
		if( previous.trim().length === 0 ){
			messenger.timeout('Please enter your settings into the text field and try again.');
			return false;
		}

		if( previous.indexOf('{') === -1 ){
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

			if( previous === null ){
				messenger.error('Import failed, could not interpret your options. Are you sure you input the correct text?', ' regex.match');
				return false;
			}

			previous = previous[0].substr(3, previous[0].length - 6);

			try {
				var previousSettings = JSON.parse(previous);
			}
			catch(e){
				console.log(`[ERROR] Failed to parse imported settings JSON: ${e}`);
				messenger.error('Import failed, could not interpret your options. Are you sure you copied and pasted all the settings?', 'json.parse');
				return false;
			}
		}
	}
	else {
		var previousSettings = opts;
	}

	localStorage.setItem('tcUserSettingsImported', JSON.stringify(previousSettings));
	
	// Redirect without asking if on the browse page.
	if( !window.location.pathname.endsWith('/theme') ){
		localStorage.setItem('tcImport', true);
		window.location = `./theme?q=${previousSettings.theme}&t=${previousSettings.data}`;
	}

	// Do nothing if on theme page & userSettings are the same.
	if( userSettings & userSettings === previousSettings ){
		messenger.warn('Nothing imported. Settings exactly match the current page.');
		return null;
	}
    
	// If theme or data is wrong, offer to redirect or to try importing anyway.
	else if( userSettings.theme !== previousSettings.theme || userSettings.data !== previousSettings.data ){
		let msg = 'There is a mismatch between your imported settings and the current page. Redirect to the page indicated in your import?';
		let choices = {
			'Yes': {'value': 'redirect', 'type': 'suggested'},
			'No, apply settings here.': {'value': 'ignore'},
			'No, do nothing.': {'value': 'dismiss'}
		};
		
		userConfirm(msg, choices)
		.then((choice) => {
			if( choice === 'redirect' ){
				localStorage.setItem('tcImport', true);
				window.location = `./theme?q=${previousSettings.theme}&t=${previousSettings.data}`;
			}
			else if( choice === 'ignore' ){
				localStorage.removeItem('tcImport');
				applySettings(previousSettings);
				return true;
			}
			else {
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

function toggleEle( element, visible = undefined, btn = false ){
	let ele = typeof element === 'string' ? document.querySelector(element) : element;
	let hiddenCls = 'is-hidden';
	let btnSelCls = 'button-highlighted';

	if( visible === true ){
		ele.classList.remove(hiddenCls);
		if( btn ){ btn.classList.remove(btnSelCls); }
		return true;
	}
	else if( visible === false ){
		ele.classList.add(hiddenCls);
		if( btn ){ btn.classList.add(btnSelCls); }
		return false;
	}
	else {
		ele.classList.toggle(hiddenCls);
		if( btn ){ btn.classList.toggle(btnSelCls); }
		return !(ele.classList.contains(hiddenCls));
	}
}

// Capitalises the first letter of every word. To capitalise sentences, set the divider to ".".
function capitalise( str, divider = ' ' ){
	let words = str.split(divider);
	
	words.forEach((word, index) => {
		let firstChar = word.substring(0,1).toUpperCase();
		let otherChars = word.substring(1);
		words[index] = firstChar + otherChars;
	});
	
	str = words.join(divider);
	return str;
}

// sorts a dictionary by key
function sortKeys( dict ){
	let keys = Object.keys(dict);
	keys.sort((a,b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	let sorted = {};
	for( let k of keys ){
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

function pushFilter( thisId, tag, category = 'other' ){
	if( !tags[category] ){
		tags[category] = {};
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
	constructor( items, selector = 'ID', saveToUrl = false ){
		// Variables for all
		this.toggle = document.getElementById('js-tags__button') || document.createElement('button');
		this.toggleCls = 'has-selected';
		this.clearBtn = document.getElementById('js-tags__clear');
		this.items = [...items];
		this.saveToUrl = saveToUrl;

		// Tag Variables
		this.tagContainer = document.getElementById('js-tags__cloud');
		this.buttons = [];
		this.selectedButtons = [];
		this.selectedTags = {};
		this.btnSelCls = 'is-selected';
		this.btnHideCls = 'is-disabled';
		this.itemTagCls = 'is-hidden-by-tag';

		// Other Variables
		this.selector = selector;

		// Create Meta Buttons
		if( this.clearBtn ){
			this.clearBtn.addEventListener('click', () => {
				this.reset();
			});
		}
	}

	initialiseTags( tags ){
		this.toggle.classList.remove('o-hidden');
		if( this.clearBtn ){
			this.clearBtn.classList.remove('o-hidden');
		}

		let tagCategories = Object.entries(tags);
		for( let [category, tags] of tagCategories ){
			let totalInCategory = 0;

			let group = document.createElement('div');
			group.className = 'tag-cloud__group';

			if( category === 'other' ){
				group.style.order = 15;
			}
			else if( category === 'list type' ){
				group.style.order = 1;
			}
			else if( category === 'layout' ){
				group.style.order = 2;
			}
			else if( category === 'author' ){
				group.style.order = 3;
			}
			else if( category === 'release state' ){
				group.style.order = 4;
			}
			else {
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
			for( let [tag, itemIds] of Object.entries(tags) ){
				let button = document.createElement('button');
				let countEle = document.createElement('span');
				let count = itemIds.length;

				// skip rendering tag if all items match, thus making it useless
				if( count === this.items.length ){
					continue;
				}
				else {
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
				for( let i = 0; i < itemIds.length; i++ ){
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

		// Activate any previously active items
		let previousTags = query.get('tags');
		if( previousTags ){
			let splitTags = previousTags.split('&&');
			for( let tag of splitTags ){
				document.getElementById(`tag:${tag}`).dispatchEvent( new Event('click') );
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
			btn.btn.classList.remove(this.btnHideCls, this.btnSelCls);
			btn.count.textContent = btn.total;
		}
		this.selectedButtons = [];
		this.selectedTags = [];
	}

	// ID Formatting
	formatId( id ){
		return this.selector.replace('ID', id);
	}

	// On button click
	activateTag( button, itemName, itemIds ){
		// Check if already selected and select button if not
		let tagQ = query.get('tags');
		let tagSplit = tagQ ? tagQ.split('&&') : [];
		let tagIndex = tagSplit.indexOf(itemName);
		
		let selected = this.selectedButtons.indexOf(button);
		if( selected !== -1 ){
			button.classList.remove(this.btnSelCls);
			this.selectedButtons.splice(selected, 1);
			delete this.selectedTags[itemName];

			// Remove from URL
			if( tagIndex !== -1 ){
				tagSplit.splice(tagIndex, 1);
				if( this.saveToUrl ) {
					query.set('tags', tagSplit.join('&&'));
				}
			}
		}
		else {
			this.toggle.classList.add(this.toggleCls);
			button.classList.add(this.btnSelCls);
			this.selectedButtons.push(button);
			this.selectedTags[itemName] = itemIds;

			// Add to URL
			if( tagIndex === -1 ){
				tagSplit.push(itemName);
				if( this.saveToUrl ) {
					query.set('tags', tagSplit.join('&&'));
				}
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
				}
				else {
					filterCount[id] += 1;
				}
			}
		}
		let orFilters = Object.keys(filterCount);
		let andFilters = [];
		// create AND filter by only adding filters that match all of the selected filters
		for( let [id, count] of Object.entries(filterCount) ){
			if( count === Object.keys(this.selectedTags).length ){
				andFilters.push(id);
			}
		}

		// Show matching items
		for( let item of this.items ){
			if( andFilters.includes(item.id) ){
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
				if( btn.ids.includes(id) ){
					crossover++;
				}
			}
			btn.count.textContent = crossover;
			if( crossover === 0 ){
				btn.btn.classList.add(this.btnHideCls);
			}
			else {
				btn.btn.classList.remove(this.btnHideCls);
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

const loader = new LoadingScreen();
const messenger = new MessageHandler();
// Get all the potential combinations of data JSON URLs for fetching later
const megaUrls = query.getAll('m');
const collectionUrls = query.getAll('c');
const themeUrls = query.getAll('t');
// Define current application version to process all theme & collection JSON.
const jsonVersion = 0.4;

loader.log('Page initialised.', false);



// LEGACY JSON MANAGEMENT
// Detect and Manage legacy JSON versions and URL parameters.

let path = window.location.pathname;
let dataUrls = query.getAll('data');

// Check for legacy JSON and process as needed
function processJson( json, url, toReturn ){
	return new Promise((resolve, reject) => {
		let processed;
		loader.text('Updating JSON...');

		var ver = 0;
		if( !("json_version" in json) || isNaN(parseFloat(json.json_version)) ){
			ver = 0.1;
		}
		else {
			ver = parseFloat(json.json_version);
		}

		// Else, continue to process.
		if( ver > jsonVersion ){
			messenger.send('Detected JSON version beyond what is supported by this instance. Attempting to process as normal. If any bugs or failures occur, try using the main instance at valeriolyndon.github.io.');
			console.log('Detected JSON version beyond what is supported by this instance. Attempting to process as normal. If any bugs or failures occur, try updating your fork from the main instance at valeriolyndon.github.io.');
		}

		else if( ver < jsonVersion ){
			console.log('The loaded JSON has been processed as legacy JSON. This can *potentially* cause errors or slowdowns. If you are the JSON author and encounter an issue, please see the GitHub page for assistance updating.');
			if( ver <= 0.1 ){
				json = updateToBeta3(json, url, toReturn);
				ver = 0.3;
				// skips from 0.2 to 0.3 because current code can handle both the same.
				// the version change from .2 to .3 was because it would break older version of the Customiser
			}
			if( ver <= 0.3 ){
				json = updateToBeta4(json);
				ver = 0.4;
			}
		}

		// Process as normal once format has been updated
		
		// Process as collection or fetch correct theme from collection
		if(toReturn === 'collection' && 'themes' in json
		|| 'data' in json){
			// Convert legacy dictionary to array
			if( json.themes && !Array.isArray(json.themes) ){
				let arrayThemes = [];
				for( let t of Object.values(json.themes) ){
					arrayThemes.push(t);
				}
				json.themes = arrayThemes;
			}
			try {
				processed = normaliseJson(json);
			}
			catch(e) {
				loader.log(e, true);
				reject(['Data failed validation.', 'json.invalid']);
			}
		}
		// If a collection is linked under a theme query, check for valid values
		// This code is legacy leftovers from v0 that sadly is still needed
		else if( 'themes' in json && Object.values(json.themes).length > 0 ){
			let themeUrl = false;
			if( json.themes[toReturn] ){
				themeUrl = json.themes[toReturn]['url'];
			}
			else {
				themeUrl = Object.values(json.themes)[0]['url'];
			}

			if( themeUrl ){
				fetchFile(themeUrl)
				.then((result) => {
					try {
						processed = JSON.parse(result);
					}
					catch {
						reject(['Encountered a problem while parsing theme information.', 'invalid.name']);
						return;
					}
				})
				.catch(() => {
					reject(['Failed to fetch legacy theme URL. If you\'re visiting the correct URL, ask the theme maintainer for help.', 'faulty.legacy']);
					return;
				});
			}
		}
		else {
			loader.log('[ERROR] Failed to parse JSON due to lack of useable key. CODE: lacking.data');
			reject(['The linked theme could not be parsed.', 'lacking.data']);
			return;
		}
		resolve(processed);
	});
}


// json validation
const permissive = true; 

function normaliseJson( json ){
	if( 'data' in json ){
		if( 'name' in json.data && !isString(json.data.name) ){
			throw new Error(`"name" value must be a string.`);
		}
		if( !('name' in json.data) ){
			json.data.name = 'Untitled';
		}
		
		if( 'author' in json.data && !isString(json.data.author) ){
			throw new Error(`"author" value must be a string.`);
		}
		if( !('author' in json.data) ){
			json.data.author = 'Unknown Author';
		}
		
		if( 'author_url' in json.data ){
			if( !isString(json.data.author_url) ){
				throw new Error(`"author_url" value must be a string.`);
			}
			if(  !isValidUrl(json.data.author_url) ){
				console.log(`"author_url" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
				delete json.data.author_url;
			}
		} 
		
		if( 'help' in json.data ){
			if( !isString(json.data.help) ){
				throw new Error(`"help" value must be a string.`);
			}
			if( !isValidUrl(json.data.help) ){
				console.log(`"help" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
				delete json.data.help;
			}
		} 
		
		if( 'sponsor' in json.data ){
			if( !isString(json.data.sponsor) ){
				throw new Error(`"sponsor" value must be a string.`);
			}
			if( !isValidUrl(json.data.sponsor) ){
				console.log(`"sponsor" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
				delete json.data.sponsor;
			}
		} 
		
		if( 'css' in json.data && !isString(json.data.css) ){
			throw new Error(`"css" value must be a string (url or CSS).`);
		}
		
		if( 'type' in json.data && !(['modern','classic'].includes(json.data.type)) ){
			throw new Error(`"type" value is unrecognised.`);
		}
		if( !('type' in json.data) ){
			console.log('no list type specified, assuming modern');
			json.data.type = 'modern';
		}
		
		if( 'supports' in json.data ){
			if( !(typeof json.data.supports instanceof Array) ){
				throw new Error(`"supports" value must be an array.`);
			}
			if( json.data.supports.find(str=>['animelist','mangalist'].includes(str)) === undefined ){
				throw new Error(`"supports" value is unrecognised.`);
			}
		}
		if( !('supports' in json.data ) ){
			json.data.supports = ['animelist', 'mangalist'];
		}

		if( 'options' in json.data ){
			json.data.options = normaliseOptions( json.data.options );
		}

		if( 'mods' in json.data ){
			if( !isDict(json.data.mods) || Object.values(json.data.mods).find(mod=>!isDict(mod)) !== undefined ){
				throw new Error(`"mods" value must be a dictionary of dictionaries.`);
			}
			for( let [id, mod] of Object.entries(json.data.mods) ){
				// TODO
			}
		}

		if( 'flags' in json.data && (!isArray(json.data.flags) || json.data.flags.find(flag=>!isString(flag)) !== undefined) ){
			throw new Error(`"flags" value must be an array of strings.`);
		}

		if( 'preview' in json.data ){
			if( !isDict(json.data.preview) ){
				throw new Error(`"preview" value must be a dictionary.`);
			}
			json.data.preview = normaliseDisplay(json.data.preview);
		}
		else {
			json.data.preview = {};
		}

		json.data = normaliseDisplay(json.data);

		// autofill empty preview keys
		for( let [key, val] of Object.entries(json.data) ){
			if( !inObj(json.data.preview, key) ){
				json.data.preview[key] = val;
			}
		}
	}

	return json;
}

function normaliseDisplay( display ){
	if( 'cover' in display ){
		if( permissive ){
			display.cover = parseBool(display.cover);
		}
		if( !isBool(display.cover) ){
			throw new Error(`"cover" value must be a boolean.`);
		}
	}
	
	if( 'background' in display ){
		if( permissive ){
			display.background = parseBool(display.background);
		}
		if( !isBool(display.background) ){
			throw new Error(`"background" value must be a boolean.`);
		}
	}
		
	if( 'style' in display ){
		if( !isArray(display.style) || display.style.length === 0 ){
			throw new Error(`"style" value must be an array of integers and cannot be empty.`);
		}
		if( permissive ){
			display.style.map(num=>parseInt(num));
		}
		if( display.style.find(num=>!isInt(num)) !== undefined ){
			throw new Error(`"style" value must be an array of integers and cannot be empty.`);
		}
	}
	
	if( 'category' in display ){
		if( !isArray(display.category) ){
			throw new Error(`"category" value must be an array.`);
		}
		if( permissive ){
			display.category = display.category.map(cat=>parseInt(cat));
		}
		if( display.category.find(cat=>!isInt(cat) || !([1,2,3,4,6,7].includes(cat))) !== undefined ){
			throw new Error(`"category" array values must be any of: 1,2,3,4,6,7.`);
		}
	}

	if( 'columns' in display ){
		// add default columns mode
		display.columns.mode = 'mode' in display.columns ? display.columns.mode : 'whitelist';
		if( !isDict(display.columns) ){
			throw new Error(`"columns" value must be a dictionary.`);
		}
		if( !isString(display.columns.mode) || !(['whitelist','greylist','blacklist'].includes(display.columns.mode)) ){
			throw new Error('"mode" value must be one of: "whitelist", "greylist", "blacklist".');
		}
		if( !('animelist' in display.columns) && !('mangalist' in display.columns) ){
			throw new Error('"columns" key requires an "animelist" key, "mangalist" key, or both.');
		}
		if( 'animelist' in display.columns ){
;			display.columns.animelist = normaliseColumns(display.columns.animelist);
		}
		if( 'mangalist' in display.columns ){
;			display.columns.mangalist = normaliseColumns(display.columns.mangalist);
		}
	}
	return display;
}

function normaliseColumns( columns ){
	if( !isDict(columns) ){
		throw new Error('"anime/mangalist" "columns" key must be a dictionary of booleans.');
	}
	if( permissive ){
		for( let [key, val] of Object.entries(columns) ){
			columns[key] = parseBool(val);
		}
	}
	if( Object.values(columns).find(col=>!isBool(col)) !== undefined ){
		throw new Error('"anime/mangalist" "columns" key must be a dictionary of booleans.');
	}
	return columns;
}

function normaliseOptions( options ){
	for( let [id, opt] of Object.entries(options) ){
		if( 'name' in opt && !isString(opt.name) ){
			throw new Error(`Option "${id}": "name" value must be a string.`);
		}

		if( 'description' in opt && !isString(opt.description) ){
			throw new Error(`Option "${id}": "description" value must be a string.`);
		}

		if( !('type' in opt) ){
			throw new Error(`Option "${id}": missing "type" key.`);
		}
		if( typeof opt.type !== 'string' ){
			throw new Error(`Option "${id}": "type" value must be a string.`);
		}
		let typeSplit = opt.type.split('/');
		if( !(['text', 'textarea', 'color', 'range', 'toggle', 'select'].includes(typeSplit[0])) ){
			throw new Error(`Option "${id}": "type" value is unrecognised.`);
		}
		if( typeSplit[0].startsWith('text/') && !(['content', 'image_url', 'size', 'value', 'url_fragment'].includes(typeSplit[1])) ){
			throw new Error(`Option "${id}": "type" qualifier value is unrecognised.`);
		}
		// TODO: color type validations

		if( opt.type !== 'range' && ('min' in opt || 'max' in opt || 'step' in opt) ){
			console.log(`Option "${id}": a "min", "max", or "step" key was ignored as the "type" value is not "range".`)
		}

		if( 'replacements' in opt ){
			opt.replacements = normaliseReplacements(opt.replacements, id, opt.type);
		}
		
		if( opt.type === 'select' ){
			if( 'replacements' in opt ){
				console.log(`Option "${id}": "replacements" key was ignored as the "type" value is "select". Use the "selections" key.`)
			}
			if( !('selections' in opt) ){
				throw new Error(`Option "${id}": "select" type options require a "selections" key.`);
			}
			if( !isDict(opt.selections) || Object.values(opt.selections).find(sel=>!isDict(sel)) !== undefined ){
				throw new Error(`Option "${id}": "selections" value must be a dictionary of dictionaries.`);
			}
			if( Object.values(opt.selections).find(sel=>!('label' in sel) || !isString(sel.label)) !== undefined ){
				throw new Error(`Option "${id}": "selections" values must contain a "label" key with a string value.`);
			}
			Object.values(opt.selections).map(sel=>{
				if( 'replacements' in sel ){
					sel.replacements = normaliseReplacements(sel.replacements, id, opt.type);
				}
				return sel;
			});
		}

		if( 'default' in opt ){
			if( opt.type === 'toggle' ){
				if( permissive ){
					opt.default = parseBool(opt.default);
				}
				if( typeof opt.default !== 'boolean' ){
					throw new Error(`Option "${id}": "default" value must be a boolean when "type" value is "toggle".`);
				}
			}
			if( opt.type === 'range' ){
				if( permissive ){
					opt.default = parseFloat(opt.default);
				}
				if( typeof opt.default !== 'number' ){
					throw new Error(`Option "${id}": "default" value must be a number when "type" value is "range".`);
				}
			}
			if( opt.type === 'select' && !(Object.keys(opt.selections).includes(opt.default)) ){
				throw new Error(`Option "${id}": "default" value must match one of your "selections" keys.`);
			}
		}
		// add some fallback default values when it's not defined
		else if( opt.type === 'toggle' ) {
			opt.default = false;
		}
		else if( opt.type === 'color' ) {
			opt.default = '#d8d8d8';
		}
		else if( opt.type.startsWith('text') ) {
			opt.default = '';
		}

		options[id] = opt;
	}
	return options;
}

function normaliseReplacements( replacements, id, type ){
	if( !(replacements instanceof Array) || replacements.find(repl=>!(repl instanceof Array)) !== undefined ){
		throw new Error(`Option "${id}": "replacements" value must be an array of arrays.`);
	}
	if( type === 'toggle' && replacements.find(repl=>repl.length !== 3) !== undefined ){
		throw new Error(`Option "${id}": "replacements" set must contain 3 strings when "type" value is "toggle".`);
	}
	if( type !== 'toggle' && replacements.find(repl=>repl.length !== 2) ){
		throw new Error(`Option "${id}": "replacement" set must contain 2 strings.`);
	}
	return replacements;
}


// json v0.0 > v0.1

// Redirect from browse page to theme page if a theme is specified
let themeQuery = query.get('q') || query.get('theme')
if( !path.endsWith('/theme') && themeQuery && dataUrls.length > 0 ){
	window.location = `./theme?q=${themeQuery}&c=${dataUrls.join('&c=')}`;
	throw new Error();
}


// json v0.1 > v0.2

if( dataUrls.length > 0 ){
	let modifiedQuery = new URLSearchParams();
	// Transform data into collections
	for( let [key, val] of query.entries() ){
		if( key === 'data' ){
			key = 'c';
		}
		modifiedQuery.append(key, val);
	}
	// Redirect
	window.location = `${window.location.href.split('?')[0]}?${modifiedQuery.toString()}`;
	throw new Error();
}

function updateToBeta3( json, url, toReturn ){
	if( toReturn === 'collection' ){
		let newJson = {
			'themes': []
		};
		for( let [themeId, theme] of Object.entries(json) ){
			theme.url = url + '&q=' + themeId;
			newJson.themes.push(theme);
		}
		return newJson;
	}
	else {
		if( toReturn in json ){
			return { 'data': json[toReturn] };
		}
		if( Object.keys(json).length > 0 ){
			return {
				'json_version': 0.3,
				'data': Object.values(json)[0]
			};
		}
		else {
			return false;
		}
	}
}

function updateToBeta4( json ){
	json.json_version = 0.4;
	if( inObj(json,'data') && inObj(json.data,'category') ){
		json.data.category = [json.data.category];
	}
	return json;
}


// Tutorial Function
// accepts an array of functions that will be executred in chronological order.
// For example:
// [
//    () => { console.log('step1') },
//    () => { console.log('step2') }
// ]
// The last step should always be a clean-up step. If you don't have any clean-up requirements, just put a blank function there.
// If any step returns false, it will be skipped.
function startTutorial( steps ){
	document.body.classList.add('is-not-scrollable');
	let path = query.url.pathname;

	let overlay = document.createElement('div');
	overlay.className = 'tutorial';
	document.body.appendChild(overlay);

	let progress = document.createElement('div');
	let progressMax = steps.length - 2;
	progress.className = 'tutorial__progress';
	overlay.appendChild(progress);

	let dismiss = document.createElement('a');
	dismiss.className = 'tutorial__dismiss hyperlink';
	dismiss.addEventListener('click', () => {
		steps[steps.length-1]();
		finish();
	});
	dismiss.textContent = 'Dismiss';
	overlay.appendChild(dismiss);

	let position = 0;
	function proceed( e ){
		if( e && e.target && e.target === dismiss ){
			return;
		}

		// set tutorial html
		let percent = (position) / progressMax * 100;
		progress.setAttribute('style', `--progress: ${percent}%`);

		// execute step
		let outcome = false;
		if( typeof steps[position] === 'function' ){
			outcome = steps[position]();
		}

		// continue loop or finish up
		if( position >= steps.length-1 ){
			finish();
		}
		position++;

		if( outcome === false ){
			proceed();
		}
	}

	function finish( ){
		overlay.classList.add('is-hidden');
		localStorage.setItem(`tutorial-${path}`, true);
		document.body.classList.remove('is-not-scrollable');
	}

	overlay.addEventListener('click', proceed);
	
	if( localStorage.getItem(`tutorial-${path}`) ){
		finish();
		return false;
	}
	else {
		proceed();
	}
}

