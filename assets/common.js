'use strict';

// DEFAULT FUNCTION REPLACEMENTS
// To speed up coding and piss off everyone that reads this code who wonders why the fuck I didn't just use default functions.

function create( tagStr, content ){
	// Use regex to split strings and find matches of format tag#id.class[attr=value]
	let matches = tagStr.match(/^([a-zA-Z]+)(#[^.]+)?(\.[^[]+)*(\[.+])*/);

	// tag
	if( !matches || !matches[1] ){
		return false;
	}
	let node = document.createElement(matches[1]);
	// id
	if( matches[2] ){
		node.id = matches[2];
	}
	// class
	if( matches[3] ){
		let classes = matches[3].substr(1).split('.');
		node.classList.add(...classes);
	}
	// attributes
	if( matches[4] ){
		let attributes = matches[4].matchAll(/\[([^=]+)="([^\]]+)"\]/g);
		for( let [match, attr, value] of attributes ){
			node.setAttribute(attr, value);
		}
	}

	// content accepts a string, node, or array of strings/nodes and appends them all to the node
	if( content && content instanceof Array ){
		for( let item of content ){
			node.append(item);
		}
	}
	else if( content ){
		node.append(content);
	}

	return node;
}

// Utility Functions

function inObj( object, string ) {
	return getKeys(object).includes(string);
}
function getKeys( object ){
	return isArray(object) ? object : Object.keys(object);
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
	return isValidHttp(string) || string.startsWith('mailto:');
}
function isValidHttp( string ){
	return /^https?:\/\//.test(string);
}

class LoadingScreen {
	constructor( ){
		this.pageContent = document.getElementById('js-content');

		this.loader = create('div.loading-screen');
		this.infoArea = create('div.loading-screen__info-area');
		this.loader.append(this.infoArea);
		this.linkArea = create('div.loading-screen__link-area.is-hidden');
		this.infoArea.append(this.linkArea);

		this.icon = create('div.loading-screen__icon.loading-screen__spinner');
		this.infoArea.prepend(this.icon);
		this.titleText = create('div.loading-screen__text', 'Loading...');
		this.infoArea.prepend(this.titleText);
		this.linkArea.append(create('a.loading-screen__hyperlink.hyperlink[href="./"]', 'Home.'));
		this.linkArea.append(create('a.loading-screen__hyperlink.hyperlink[href="https://github.com/ValerioLyndon/Theme-Customiser"]', 'GitHub.'));

		let copyLogs = create(`button.loading-screen__console-button.button[type="button"][data-success-text="Copied!"]`,
			create('div.swappable-text',
				create('div.swappable-text__text',
					['Copy Logs', create('br'), create('span')]
				)
			)
		);
		copyLogs.addEventListener('click', () => {
			let that = this;
			swapText(copyLogs, async()=>{return copy(that.messages.outerText)});
		});
		this.messages = create('div.loading-screen__message-boxes');
		this.console = create('div.loading-screen__console.o-hidden', [
			create('div.loading-screen__console-header',
				['Timeline', copyLogs]
			),
			this.messages
		]);
		this.loader.append(this.console);

		document.body.append(this.loader);
		this.stop = false;
		this.isLoaded = false;

		// unhide link area shortly if the page is still loading.
		setTimeout(()=>{
			if( this.isLoaded === false ){
				this.linkArea.classList.remove('is-hidden');
			}
		}, 4200);
		
		// add fallback in case something goes very wrong and it's infinitely spinning.
		// this can result in false positives, but this.loaded() can still be run so
		// it would only visually be weird as it would fail before succeeding.
		setTimeout(()=>{
			if( this.isLoaded === false ){
				this.failed(new Error('The page is taking a long time to load. If you see any errors in the timeline, it is safe to assume the page will not load. If no errors have occurred, then the page may still load eventually.', {cause: 'timeout'}));
			}
		}, 30000); 
	}

	text( txt ){
		this.titleText.textContent = txt;
		this.log(txt, false);
	}

	log( msg, toBrowser = true, html = false){
		let paragraph = document.createElement('div');
		if( html ){
			paragraph.className = 'loading-screen__message';
			paragraph.insertAdjacentHTML('beforeend', msg);
		}
		else {
			paragraph.className = 'loading-screen__message o-pre-wrap';
			paragraph.textContent = msg;
		}
		let time = `${performance.now()}`;
		let timestamp = `${(time.substring(0, time.length-3) || '0').padStart(3, '0')}.${time.substring(time.length-3)} `;
		paragraph.insertAdjacentElement('afterbegin', create(`div.loading-screen__message-timestamp`, timestamp));
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
			console.log(`[ERROR] Failed to parse JSON of collection URL: "${url}".\n\tError text:\n${error}`);
			this.log(`[ERROR] Failed to parse JSON of collection URL: "${url}". Error text: <p class="loading-screen__message-quote">${error}</p>`, false, true);
		}
	}

	loaded( ){
		this.pageContent.classList.add('is-loaded');
		this.loader.classList.add('is-hidden');
		setTimeout(() => {
			this.loader.classList.add('o-hidden');
		}, 1500);
		this.isLoaded = true;
	}

	failed( err ){
		this.pageContent.classList.remove('is-loaded');
		this.loader.classList.remove('is-hidden');
		this.log(err.message);
		if( err.cause !== undefined ){
			this.log(`Bailing out with code "${err.cause}".`);
		}
		else {
			this.log(`Bailing out.`);
		}
		// only runs once
		if( !this.stop ){
			document.getElementsByTagName('title')[0].textContent = `Theme Customiser - an error occured`;
			this.console.classList.remove('o-hidden');
			this.infoArea.style.width = '100%';
			this.icon.className = 'loading-screen__icon loading-screen__cross';
			this.titleText.textContent = 'Page Failure.';
			this.infoArea.insertBefore(create('div.loading-screen__subtext', err.message), this.linkArea);
			this.infoArea.insertBefore(create('div.loading-screen__subtext', `Code: ${err.cause}`), this.linkArea);

			let report = create(`a.loading-screen__hyperlink.hyperlink`, 'Report this issue.');
			let formattedMessages = this.messages.outerText.replaceAll('\n','%0A').replaceAll('\t','%09');
			report.href = `https://github.com/ValerioLyndon/Theme-Customiser/issues/new/?title=Page%20Failure%20-%20please%20insert%20a%20summary&labels=bug&body=I%20encountered%20a page%20failure.%0A%0AURL%20of%20the%20page:%20${window.location.href}%0A%0AHere%20are%20the%20logs:%0A\`\`\`%0A${formattedMessages}%0A\`\`\``;
			this.linkArea.append(report);

			this.stop = true;
			umami.track('exception', {
				'description': err.message,
				'error_code': err.cause
			});
			return err;
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
				btn.classList.add('button--highlighted');
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
				umami.track('settings_imported');
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
	umami.track('settings_imported');
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

/* Text animation for buttons. Requires a specific DOM layout:
	<button onclick="swapText(this)">
		<div class="swappable-text">
			<div class="swappable-text__text">
				default text
				<br />
				on animation text
			</div>
		</div>
	</button>
*/
function swapText( ele ){
	let toSwap = ele.querySelector('.swappable-text');
	
	toSwap.classList.add('is-swapped');
	setTimeout(() => {
		toSwap.classList.remove('is-swapped')
	}, 666);
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
async function processJson( json, url, toReturn ){
	loader.text('Processing JSON...');
	if( url !== '' ){
		loader.log(`... from ${url} ...`);
	}

	json = updateJson(json);

	// Process as normal once format has been updated
	
	// Process as collection or fetch correct theme from collection
	if( (toReturn === 'collection' && 'themes' in json) || 'data' in json ){
		// Convert legacy dictionary to array
		if( 'themes' in json && !isArray(json.themes) ){
			json.themes = Object.values(json.themes);
		}
		try {
			json = Validate.json(json);
		}
		catch(e) {
			loader.log(e, true);
			throw new Error('Data failed validation.', {cause:'json.invalid'});
		}
	}
	// If a collection is linked under a theme query, check for valid values
	// This code is legacy leftovers from v0 that sadly is still needed
	else if( 'themes' in json && Object.values(json.themes).length > 0 ){
		let themeUrl = false;
		if( toReturn in json.themes && 'url' in json.themes[toReturn] ){
			themeUrl = json.themes[toReturn]['url'];
		}
		else if( 'url' in json.themes[0] ){
			themeUrl = Object.values(json.themes)[0]['url'];
		}
		else {
			throw new Error(['Failed to fetch legacy theme URL. If you\'re visiting the correct URL, ask the theme maintainer for help.', 'faulty.legacy.url']);
		}

		themeUrls.push(themeUrl);
		if( userSettings ){
			userSettings.data = themeUrl;
		}
		query.delete('c');
		query.delete('q');
		query.append('t', themeUrl);

		let theme;
		try {
			theme = await fetchFile(themeUrl);
		}
		catch {
			throw new Error('Failed to fetch legacy theme URL. If you\'re visiting the correct URL, ask the theme maintainer for help.', {cause:'faulty.legacy'});
		}
		try {
			json = JSON.parse(theme);
		}
		catch {
			throw new Error('Encountered a problem while parsing theme information.', {cause:'processjson.parse'});
		}
	}
	else {
		loader.log('[ERROR] Failed to parse JSON due to lack of useable key. CODE: lacking.data');
		throw new Error('The linked theme could not be parsed.', {cause:'lacking.data'});
	}
	try {
		return Validate.json(json);
	}
	catch(e) {
		loader.log(e, true);
		throw new Error('Data failed validation.', {cause:'json.invalid'});
	}
}

function updateJson( json, logs = true ){
	var ver = 0;
	if( !("json_version" in json) || isNaN(parseFloat(json.json_version)) ){
		ver = 0.1;
	}
	else {
		ver = parseFloat(json.json_version);
	}

	if( ver > jsonVersion && logs ){
		messenger.send('Detected JSON version beyond what is supported by this instance. Attempting to process as normal. If any bugs or failures occur, try using the main instance at valeriolyndon.github.io.');
		console.log('Detected JSON version beyond what is supported by this instance. Attempting to process as normal. If any bugs or failures occur, try updating your fork from the main instance at valeriolyndon.github.io.');
	}
	else if( ver < jsonVersion ){
		if( logs ){
			console.log('The loaded JSON has been processed as legacy JSON. This can *potentially* cause errors or slowdowns. If you are the JSON author and encounter an issue, please see the GitHub page for assistance updating.');
		}
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

	return json;
}



// json validation class. takes JSON arguments and corrects issues, logs warnings, or errors on fatal issues
class Validate {
	// if true, will correct malformed json and allow minor issues with warnings
	// if false, will error on any issue no matter how small
	static permissive = true;

	static hasAll( object, keys ){
		object = getKeys(object);
		return keys.find(key=>!object.includes(key)) === undefined;
	}

	static hasOne( object, keys ){
		object = getKeys(object);
		return keys.find(key=>object.includes(key)) !== undefined;
	}

	static warnOnUnrecognised( object, validKeys ){
		for( let key of getKeys(object) ){
			if( !validKeys.includes(key) ){
				Validate.nonFatalError(`"${key}" is not a recognised key.`);
			}
		}
	}

	static nonFatalError( message, errorMessage ){
		if( Validate.permissive ){
			console.log(message);
		}
		else {
			throw new Error(errorMessage ? errorMessage : message);
		}
	}

	static json( json ){
		if( !Validate.hasOne(json, ['themes','data','collections']) ){
			throw new Error(`JSON has no readable data. Add a "data", "themes", or "collections" key.`);
		}
		Validate.warnOnUnrecognised(json, ['json_version','themes','data','collections']);

		if( !isNumber(json.json_version) ){
			throw new Error(`"json_version" must be an integer or float value.`);
		}

		if( 'collections' in json && (!isArray(json.collections) || json.collections.find(str=>!isString(str)||!isValidHttp(str)) !== undefined) ){
			throw new Error(`"collections" key must be an array of *valid* URL strings.`);
		}

		if( 'themes' in json ){
			if( !isArray(json.themes) || Object.values(json.themes).find(theme=>!isDict(theme)) !== undefined ){
				throw new Error(`"themes" value must be an array of dictionaries.`);
			}
			for( let i = 0; i < json.themes.length; i++ ){
				let theme = json.themes[i];
				
				try {
					Validate.warnOnUnrecognised(theme, ['name','author','type','url','image','date','date_added','tags','flags','supports']);
					theme = Validate.theme(theme);
				}
				catch( e ){
					e.message = `Theme "${theme?.name}": ${e.message}`;
					throw e;
				}

				if( !Validate.hasAll(theme, ['url']) ){
					Validate.nonFatalError(`Theme "${theme?.name}": "url" key is required.`);
					json.themes.splice(i,1);
					continue;
				}

				for( let key of ['image','url'] ){
					if( key in theme ){
						if( !isString(theme[key]) ){
							throw new Error(`Theme "${theme?.name}": "${key}" value must be a string.`);
						}
						if( !isValidHttp(theme[key]) ){
							throw new Error(`Theme "${theme?.name}": "${key}" value must be an http protocol URL.`);
						}
					}
				}

				const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
				for( let key of ['date','date_added'] ){
					if( key in theme && !isString(theme[key]) ){
						throw new Error(`Theme "${theme?.name}": "${key}" value must be a string.`);
					}
					if( key in theme && !dateRegex.test(theme[key]) ){
						throw new Error(`Theme "${theme?.name}": "${key}" value must be formatted as "YYYY-MM-DD".`);
					}
				}

				if( 'tags' in theme ){
					theme.tags = Validate.tags(theme.tags);
				}

				if( 'flags' in theme ){
					if( !isArray(theme.flags) || theme.flags.find(flag=>!isString(flag)) !== undefined ){
						throw new Error(`Theme "${theme?.name}": "flags" value must be an array of strings.`);
					}
					if( !this.permissive && theme.flags.find(flag=>!(['beta','alpha'].includes(flag))) !== undefined ){
						throw new Error(`Theme "${theme?.name}": "flags" value is unrecognised. Must be any of "beta", "alpha".`);
					}
				}
			}
		}

		if( 'data' in json ){
			Validate.warnOnUnrecognised(json.data, ['name','author','author_url','type','css','supports','help','sponsor','columns','cover','background','style','category','preview','options','mods','flags']);

			json.data = Validate.theme(json.data);
			
			if( 'author_url' in json.data ){
				if( !isString(json.data.author_url) ){
					throw new Error(`"author_url" value must be a string.`);
				}
				if( !isValidUrl(json.data.author_url) ){
					if( this.permissive ){
						console.log(`"author_url" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
						delete json.data.author_url;
					}
					else {
						throw new Error('"author_url" key must be a valid URL of protocol "http" or "mailto".');
					}
				}
			}
			
			if( 'help' in json.data ){
				if( !isString(json.data.help) ){
					throw new Error(`"help" value must be a string.`);
				}
				if( !isValidUrl(json.data.help) ){
					if( this.permissive ){
						console.log(`"help" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
						delete json.data.help;
					}
					else {
						throw new Error('"help" key must be a valid URL of protocol "http" or "mailto".');
					}
				}
			} 
			
			if( 'sponsor' in json.data ){
				if( !isString(json.data.sponsor) ){
					throw new Error(`"sponsor" value must be a string.`);
				}
				if( !isValidUrl(json.data.sponsor) ){
					if( this.permissive ){
						console.log(`"sponsor" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
						delete json.data.sponsor;
					}
					else {
						throw new Error('"sponsor" key must be a valid URL of protocol "http" or "mailto".');
					}
				}
			}
			
			if( 'css' in json.data && !isString(json.data.css) ){
				throw new Error(`"css" value must be a string (url or CSS).`);
			}

			if( 'options' in json.data ){
				json.data.options = Validate.options(json.data.options);
			}

			if( 'mods' in json.data ){
				if( !isDict(json.data.mods) || Object.values(json.data.mods).find(mod=>!isDict(mod)) !== undefined ){
					throw new Error(`"mods" value must be a dictionary of dictionaries.`);
				}
				for( let [id, mod] of Object.entries(json.data.mods) ){
					try {
						Validate.warnOnUnrecognised(mod, ["name","description","css","url","requires","conflicts","options","tags","flags"]);
					}
					catch( e ){
						e.message = `Mod "${id}": ${e.message}`;
						throw e;
					}

					if( 'name' in mod && !isString(mod.name) ){
						throw new Error(`Mod "${id}": "name" value must be a string.`);
					}
					if( !('name' in mod) ){
						mod.name = 'Untitled';
					}

					if( 'description' in mod && !isString(mod.description) ){
						throw new Error(`Mod "${id}": "description" value must be a string.`);
					}

					if( 'css' in mod ){
						if( !isDict(mod.css) || Object.values(mod.css).find(css=>!isString(css)) !== undefined ){
							throw new Error(`Mod "${id}": "css" value must be a dictionary of strings.`);
						}
						if( !this.permissive && Object.keys(mod.css).find(key=>!(['import','top','bottom'].includes(key))) !== undefined ){
							throw new Error(`Mod "${id}": "css" value is unrecognised. Must be one of "bottom", "top", "import".`);
						}
					}

					if( 'url' in mod ){
						if( !isString(mod.url) ){
							throw new Error(`Mod "${id}": "url" value must be a string.`);
						}
						if( !isValidUrl(mod.url) ){
							if( this.permissive ){
								console.log(`Mod "${id}": "url" key was ignored due to an invalid value. Value must start with "https://" or "mailto:".`);
								delete mod.url;
							}
							else {
								throw new Error('Mod "${id}": "url" key must be a valid URL of protocol "http" or "mailto".');
							}
						}
					}

					for( let key of ['requires','conflicts'] ){
						if( key in mod ){
							if( !isArray(mod[key]) || mod[key].find(reference=>!isString(reference)) !== undefined ){
								throw new Error(`Mod "${id}": "${key}" value must be an array of mod ID strings.`);
							}
							if( mod[key].find(reference=>!(Object.keys(json.data.mods).includes(reference))) ){
								throw new Error(`Mod "${id}": "${key}" string must match one of your mod keys.`);
							}
						}
					}

					if( 'options' in mod ){
						mod.options = Validate.options(mod.options);
					}

					if( 'tags' in mod ){
						try {
							mod.tags = Validate.tags(mod.tags);
						}
						catch( e ){
							e.message = `Mod "${id}": ${e.message}`;
							throw e;
						}
					}

					if( 'flags' in mod ){
						if( !isArray(mod.flags) || mod.flags.find(flag=>!isString(flag)) !== undefined ){
							throw new Error(`Mod "${id}": "flags" value must be an array of strings.`);
						}
						if( !this.permissive && mod.flags.find(flag=>!(['hidden'].includes(flag))) !== undefined ){
							throw new Error(`Mod "${id}": "flags" value is unrecognised. Must be ["hidden"].`)
						}
					}
				}
			}

			if( 'flags' in json.data ){
				if( !isArray(json.data.flags) || json.data.flags.find(flag=>!isString(flag)) !== undefined ){
					throw new Error(`"flags" value must be an array of strings.`);
				}
				if( !this.permissive && json.data.flags.find(flag=>!(['beta','alpha'].includes(flag))) !== undefined ){
					throw new Error(`"flags" value is unrecognised. Must be any of "beta", "alpha".`);
				}
			}

			if( 'preview' in json.data ){
				if( !isDict(json.data.preview) ){
					throw new Error(`"preview" value must be a dictionary.`);
				}
				json.data.preview = Validate.display(json.data.preview);
			}
			else {
				json.data.preview = {};
			}

			json.data = Validate.display(json.data);

			// autofill empty preview keys
			for( let [key, val] of Object.entries(json.data) ){
				if( ['cover','background','style','category','columns'].includes(key) && !inObj(json.data.preview, key) ){
					json.data.preview[key] = val;
				}
			}
		}

		return json;
	}

	// common keys shared between collection themes and theme pages
	static theme( theme ){
		for( let key of ['name','author'] ){
			if( key in theme && !isString(theme[key]) ){
				throw new Error(`"${key}" value must be a string.`);
			}
		}
		if( !('name' in theme) ){
			theme.name = 'Untitled';
		}
		if( !('author' in theme) ){
			theme.name = 'Unknown';
		}

		if( 'type' in theme && !(['modern','classic'].includes(theme.type)) ){
			throw new Error(`"type" value is unrecognised. Must be "modern" or "classic".`);
		}
		if( !('type' in theme) ){
			console.log(`no list type specified, assuming modern`);
			theme.type = 'modern';
		}
		
		if( 'supports' in theme ){
			if( !isArray(theme.supports) ){
				throw new Error(`"supports" value must be an array.`);
			}
			if( theme.supports.find(str=>['animelist','mangalist'].includes(str)) === undefined ){
				throw new Error(`"supports" value is unrecognised.`);
			}
		}
		if( !('supports' in theme) ){
			theme.supports = ['animelist', 'mangalist'];
		}
				
		return theme;
	}

	static tags( tags ){
		if( isArray(tags) ){
			tags = {'other': tags};
		}
		if( !isDict(tags) ){
			throw new Error(`"tags" value must be either an array of strings or a dictionary of arrays of keys.`)
		}

		for( let group of Object.values(tags) ){
			if( group.find(tag=>!isString(tag)) !== undefined ){
				throw new Error(`tags inside the "tags" key must be strings.`);
			}
		}
		
		if( Object.values(tags).find(group=>group.find(tag=>!isString(tag)) !== undefined) !== undefined ){
			throw new Error(`tags inside the "tags" key must be strings.`);
		}

		return tags;
	}

	static display( display ){
		const boolean_keys = ['cover', 'background'];
		for( let key of boolean_keys ){
			if( key in display ){
				if( this.permissive ){
					display[key] = parseBool(display[key]);
				}
				if( !isBool(display[key]) ){
					throw new Error(`"${key}" value must be a boolean.`);
				}
			}
		}

		const url_keys = ['cover_url', 'background_url'];
		for( let key of url_keys ){
			if( key in display ){
				if( !isString(display[key]) ){
					throw new Error(`"${key}" value must be a string.`);
				}
				if( !isValidHttp(display[key]) ){
					throw new Error(`"${key}" string values must be a valid URL of protocol "http".`);
				}
			}
		}
			
		if( 'style' in display ){
			if( !isArray(display.style) || display.style.length === 0 ){
				throw new Error(`"style" value must be an array of integers and cannot be empty.`);
			}
			if( this.permissive ){
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
			if( this.permissive ){
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
				display.columns.animelist = Validate.columns(display.columns.animelist);
			}
			if( 'mangalist' in display.columns ){
				display.columns.mangalist = Validate.columns(display.columns.mangalist);
			}
		}
		return display;
	}

	static columns( columns ){
		if( !isDict(columns) ){
			throw new Error('"anime/mangalist" "columns" key must be a dictionary.');
		}
		if( this.permissive ){
			for( let [key, val] of Object.entries(columns) ){
				columns[key] = val === null || val === 'null' ? null : parseBool(val);
			}
		}
		if( Object.values(columns).find(col=>!isBool(col) && col !== null) !== undefined ){
			throw new Error('"anime/mangalist" "columns" key must be a dictionary of booleans or null values.');
		}
		return columns;
	}

	static options( options ){
		if( !isDict(options) || Object.values(options).find(opt=>!isDict(opt)) !== undefined ){
			throw new Error('"options" value must be a dictionary of dictionaries');
		}

		for( let [id, opt] of Object.entries(options) ){
			try {
				Validate.warnOnUnrecognised(opt, ['name','description','type','replacements','selections','default','min','max','step']);
			}
			catch( e ){
				e.message = `Option "${id}": ${e.message}`;
				throw e;
			}

			if( 'name' in opt && !isString(opt.name) ){
				throw new Error(`Option "${id}": "name" value must be a string.`);
			}

			if( 'description' in opt && !isString(opt.description) ){
				throw new Error(`Option "${id}": "description" value must be a string.`);
			}

			if( !('type' in opt) ){
				throw new Error(`Option "${id}": missing "type" key.`);
			}
			if( !isString(opt.type) ){
				throw new Error(`Option "${id}": "type" value must be a string.`);
			}
			const typeCore = opt.type.split('/')[0];
			const typeQualifier = opt.type.split('/')[1];
			const typeSubQual = opt.type.split('/')[2];
			if( !(['text', 'textarea', 'color', 'range', 'toggle', 'select'].includes(typeCore)) ){
				throw new Error(`Option "${id}": "type" value is unrecognised.`);
			}
			if( typeCore === 'text' && typeQualifier !== undefined && !(['content', 'image_url', 'size', 'value', 'url_fragment'].includes(typeQualifier)) ){
				throw new Error(`Option "${id}": "type" qualifier value is unrecognised.`);
			}
			if( typeCore === 'color' && typeQualifier !== undefined ){
				if( !(['insert'].includes(typeQualifier)) ){
					throw new Error(`Option "${id}": "type" qualifier value is unrecognised. Must be "insert".`);
				}
				if( typeSubQual !== undefined && typeSubQual.split('&').find(sub=>!(['hsl','hex','rgb','strip_alpha'].includes(sub))) !== undefined ){
					throw new Error(`Option "${id}": "type" sub-qualifier value is unrecognised. Must be "hsl" "hex", "rgb", or "strip_alpha".`);
				}
			}

			if( typeCore !== 'range' && ('min' in opt || 'max' in opt || 'step' in opt) ){
				Validate.nonFatalError(
					`Option "${id}": a "min", "max", or "step" key was ignored as the "type" value is not "range".`,
					`Option "${id}": "min", "max", and "step" keys can only be used when the "type" value is "range".`
				);
			}
			if( typeCore === 'range' ){
				for( let key of ['min','max','step'] ){
					if( key in opt && !isNumber(opt[key]) ){
						throw new Error(`Option "${id}": "${key}" value must be a number. Be sure you aren't accidentally typing a string (double-quoted text).`);
					}
				}
				
				let difference = 100;
				let min = 0;
				let max = 100;
				let step = 1;

				if( 'step' in opt && opt.step < 1 ){
					difference = 1;
				}

				if( 'min' in opt && 'max' in opt ){
					min = opt.min;
					max = opt.max;
				}
				else if( 'min' in entryData ){
					min = opt.min;
					max = opt.min + difference;
				}
				else if( 'max' in entryData ){
					max = opt.max;
					min = opt.max - difference;
				}
				
				if( 'step' in opt ){
					step = opt.step;
				}
				else if( max - min <= 10 ){
					step = 0.1;
					step = 0.1;
				}

				opt.min = min;
				opt.max = max;
				opt.step = step;
			}

			if( 'replacements' in opt ){
				opt.replacements = Validate.replacements(opt.replacements, id, typeCore);
			}
			else if( typeCore !== 'select' ){
				throw new Error(`Option "${id}": "replacements" key is required for type "${typeCore}".`);
			}

			if( typeCore === 'select' ){
				if( 'replacements' in opt ){
					Validate.nonFatalError(
						`Option "${id}": "replacements" key was ignored as the "type" value is "select". Use the "selections" key instead.`,
						`Option "${id}": "replacements" key cannot be used when "type" value is "select". Use the "selections" key instead.`
					);
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
					try {
						Validate.warnOnUnrecognised(getKeys(sel), ['label','replacements']);
					}
					catch( e ){
						e.message = `Option "${id}" selections: ${e.message}`;
						throw e;
					}
					if( 'replacements' in sel ){
						sel.replacements = Validate.replacements(sel.replacements, id, typeCore);
					}
					return sel;
				});
			}

			if( 'default' in opt ){
				if( typeCore === 'toggle' ){
					if( this.permissive ){
						opt.default = parseBool(opt.default);
					}
					if( !isBool(opt.default) ){
						throw new Error(`Option "${id}": "default" value must be a boolean when "type" value is "toggle".`);
					}
				}
				if( typeCore === 'range' ){
					if( this.permissive ){
						opt.default = parseFloat(opt.default);
					}
					if( !isNumber(opt.default) ){
						throw new Error(`Option "${id}": "default" value must be a number when "type" value is "range".`);
					}
				}
				if( typeCore === 'select' && !(Object.keys(opt.selections).includes(opt.default)) ){
					throw new Error(`Option "${id}": "default" value must match one of your "selections" keys.`);
				}
			}
			// add some fallback default values when it's not defined
			else if( typeCore === 'toggle' ) {
				opt.default = false;
			}
			else if( typeCore === 'color' ) {
				opt.default = '#d8d8d8';
			}
			else if( typeCore.startsWith('range') ) {
				opt.default = (opt.max - opt.min) / 2 + opt.min;
			}
			else if( typeCore.startsWith('text') ) {
				opt.default = '';
			}

			options[id] = opt;
		}
		return options;
	}

	static replacements( replacements, id, typeCore ){
		if( !isArray(replacements) ){
			throw new Error(`Option "${id}": "replacements" value must be an array.`);
		}
		if( replacements.find(repl=>!isArray(repl)) !== undefined ){
			if( this.permissive && replacements.find(repl=>!isString(repl)) === undefined ){
				console.log(`Option "${id}": "replacements" value must be an array of arrays. Encase your strings inside a second array to fix this error.`);
				replacements = [replacements];
			}
			else {
				throw new Error(`Option "${id}": "replacements" value must be an array of arrays.`);
			}
		}
		if( replacements.length === 0 ){
			if( this.permissive ){
				console.log(`Option "${id}": replacements must have at least one set.`);
				replacements = typeCore === 'toggle' ? [['','','']] : [['','']];
			}
			else {
				throw new Error(`Option "${id}": "replacements" value must have at least one set.`);
			}
		}
		if( typeCore === 'toggle' && replacements.find(repl=>repl.length !== 3) !== undefined ){
			throw new Error(`Option "${id}": "replacements" set must contain 3 strings when "type" value is "toggle".`);
		}
		if( typeCore !== 'toggle' && replacements.find(repl=>repl.length !== 2) !== undefined ){
			throw new Error(`Option "${id}": "replacements" set must contain 2 strings.`);
		}
		if( replacements.find(repl=>repl[0].length === 0) !== undefined ){
			Validate.nonFatalError(
				`Option "${id}": the first string of a "replacements" set cannot be empty.`,
				`Option "${id}": the first string of a "replacements" set cannot be empty.`
			);
		}
		return replacements;
	}
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
// accepts an array of functions that will be executed in chronological order.
// For example:
// [
//    () => { console.log('step1') },
//    () => { console.log('step2') }
// ]
// The last step should always be a clean-up step. If you don't have any clean-up requirements, just put a blank function there.
// You should initiate the class with steps and then initiate it via tutorial.start()
// You can move around the tutorial by using tutorial.proceed(stepnum)
class Tutorial {
	constructor( welcomeText = 'the tutorial', steps ){
		this.steps = steps.length > 0 ? steps : [];
		this.storageKey = `tutorial-${query.url.pathname}`;
		this.position = 0;
		this.length = this.steps.length - 1;
		this.percent = ()=>this.position / this.length * 100;
		
		// setup DOM
		this.root = document.createElement('div');
		this.root.className = 'tutorial';

		let info = document.createElement('div');
		info.className = 'tutorial__info';

		let split = document.createElement('div');
		split.className = 'tutorial__split';

		let text = document.createElement('div');
		this.stepText = document.createElement('span');
		this.stepText.textContent = '0';
		text.append('Tutorial — Step ', this.stepText, ` of ${this.length}`);

		let dismiss = document.createElement('a');
		dismiss.className = 'hyperlink';
		dismiss.addEventListener('click', () => {
			this.finish();
		});
		dismiss.textContent = 'Skip Tutorial';
		
		this.progress = document.createElement('div');
		this.progress.className = 'tutorial__progress';

		this.welcome = document.createElement('div');
		this.welcome.className = 'tutorial__welcome';
		this.welcome.textContent = `Welcome to ${welcomeText}! Click anywhere to continue, or click "Skip Tutorial" at any time to exit.`;

		this.root.append(info);
		info.append(split, this.progress, this.welcome);
		split.append(text, dismiss);
	}

	start(  ){
		if( localStorage.getItem(this.storageKey) ){
			return false;
		}
		umami.track('tutorial_begin', {
			'page': location.pathname
		});

		// setup DOM
		this.root.setAttribute('style', '--offset: calc(24px + -50vh - 50%)');
		document.body.appendChild(this.root);
		document.body.classList.add('is-not-scrollable');
		this.welcome.setAttribute('style', `--height: ${this.welcome.getBoundingClientRect().height}px`);
		this.root.addEventListener('click', ()=>{
			this.welcome.classList.add('is-hidden');
			this.root.removeAttribute('style');
			this.proceed();
			this.root.addEventListener('click', ()=>{ this.proceed(); });
		}, {once : true});
	}

	proceed( newPosition ){
		this.position = isInt(newPosition) ? newPosition : this.position+1;
		// clear any existing highlights
		this.resetHighlight();
		// update DOM
		this.progress.setAttribute('style', `--progress: ${this.percent()}%`);
		this.stepText.textContent = this.position;

		// execute step
		this.steps[this.position-1]();

		// continue loop or finish up
		if( this.position >= this.steps.length ){
			this.finish();
		}
	}

	finish( ){
		// perform cleanup function if it hasn't been done yet
		if( this.position !== this.length ){
			umami.track('tutorial_dismiss', {
				'dismissed_at_step': this.position,
				'dismissed_at_percent': this.percent(),
				'page': location.pathname
			});
			this.proceed(this.length);
		}
		else {
			umami.track('tutorial_complete', {
				'page': location.pathname
			});
		}
		// remember it's finished
		localStorage.setItem(this.storageKey, true);
		// cleanup DOM
		this.root.classList.add('is-hidden');
		document.body.classList.remove('is-not-scrollable');
	}

	resetHighlight( ){
		this.root.style.cssText = '';
	}

	highlightCircle( x, y, size = 75 ){
		this.root.style.mask = `radial-gradient(circle ${size}px at ${x}px ${y}px, transparent calc(100% - 5px), black)`;
	}

	highlightBlock( left, top, right, bottom, blur = 5 ){
		this.root.style.maskImage = `
			linear-gradient(90deg,
				#000        ${left-blur}px,
				#0004       ${left}px
			),
			linear-gradient(180deg,
				#000        ${top-blur}px,
				transparent ${top}px
			),
			linear-gradient(270deg,
				#000        calc(100% - ${right+blur}px),
				transparent calc(100% - ${right}px)
			),
			linear-gradient(0deg,
				#000        calc(100% - ${bottom+blur}px),
				transparent calc(100% - ${bottom}px)
			)
		`;
	}

	highlightElement( ...elements ){
		let pos = {};
		if( elements.length === 1 ){
			pos = elements[0].getBoundingClientRect();
		}
		else {
			pos = elements.reduce((previous, current)=>{
				console.log(previous,current);
				previous = previous instanceof HTMLElement ? previous.getBoundingClientRect() : previous;
				current = current.getBoundingClientRect();
				console.log(previous,current);
				return {
					'left': current.left < previous.left ? current.left : previous.left, 
					'top': current.top < previous.top ? current.top : previous.top,
					'right': current.right > previous.right ? current.right : previous.right,
					'bottom': current.bottom > previous.bottom ? current.bottom : previous.bottom
				};
			});
		}
		this.highlightBlock(pos.left, pos.top, pos.right, pos.bottom);
	}
}

// Add swappable text functions

async function swapText( btn, funcToRun ){
	let toSwap = btn.lastElementChild;
	let textField = btn.lastElementChild.lastElementChild.lastElementChild;
	let successText = btn.getAttribute('data-success-text') || 'Success';
	let failText = btn.getAttribute('data-failure-text') || 'Failed';
	let genericText = btn.getAttribute('data-generic-text') || '';
	
	let funcResult = await funcToRun();
	if( funcResult === true ){
		textField.textContent = successText;
	}
	else if( !funcResult === false ){
		textField.textContent = failText;
	}
	else {
		textField.textContent = genericText;
	}
	
	toSwap.classList.add('is-swapped');
	setTimeout(() => {
		toSwap.classList.remove('is-swapped');
	}, 666);
}

async function copy( textToCopy ){
	try {
		navigator.clipboard.writeText(textToCopy);
		return true;
	}
	catch {
		return false;
	}
}

// Analytics disclaimer

function createPopup( id, htmlContent ){
	document.body.insertAdjacentHTML(
		'beforeend',
		`<div class="popup is-hidden" id="${id}">
			<div class="popup__inner">
				<div class="popup__invisibutton" onclick="toggleEle('#${id}')"></div>
				<div class="popup__content js-anchor">
					${htmlContent}
				</div>
			</div>
		</div>`
	)
}

createPopup(
	'js-pp-analytics',
	`<h4 class="popup__header">Analytics information.</h4>
	
	<p class="popup__paragraph">
		This project collects basic user information and logs certain interactions with page elements.
	</p>

	<b class="popup__sub-header">
		Why?
	</b>
	<p class="popup__paragraph">
		This information is collected with the intention of improving the themes, theme options, and the Customiser itself. This would be achieved by prioritising features or themes that are used often and removing or toning down features that are annoying.
	</p>

	<b class="popup__sub-header">
		What information is collected and why?
	</b>
	<p class="popup__paragraph">
		Information is collected using an unmodified version of <a class="hyperlink" href="https://umami.is">umami</a>. You can see all tracked statistics by visiting: <a href="https://analytics.noziro.ca/share/akHveyW4h7LRmDZD" class="hyperlink">this page</a>.
	</p>
	<p class="popup__paragraph">
		Page interactions include:
	</p>
	<ul>
		<li>tutorial interactions (so that it can be tamed if it becomes annoying)</li>
		<li>theme installs (to know how many people actually use the website and what themes are popular)</li>
		<li>theme setting import/exports (to see if this feature even gets used)</li>
		<li>page crashes (for obvious reasons)</li>
	</ul>
	<p class="popup__paragraph">
		For a full list of page interaction events, search the publicly available code on GitHub for "umami" and you will find all of them.
	</p>

	<b class="popup__sub-header">
		Can I stop you from collecting my information?
	</b>
	<p class="popup__paragraph">
		To prevent your data being recorded, the best way is to install either the uBlock Origin or uMatrix browser extensions and use them to block my analytics subdomain (analytics.noziro.ca), but I'd appreciate not blocking my entire website.
	</p>
	<p class="popup__paragraph">
		Alternatively, please complain to me about this by visiting the <a href="https://github.com/ValerioLyndon/Theme-Customiser/issues" class="hyperlink" onclick="gtag('event', 'visit_issues', {'where': 'analytics_disclaimer'})">GitHub</a> page and opening an issue about it (unless one has already been made). I am open to removing the analytics entirely if some people care, otherwise I will continue until it's no longer helpful to me.
	</p>`
)