'use strict';

// ================
// COMMON FUNCTIONS
// ================

// See common.js for the primary DynamicPopup class and the InfoPopup class.
// InfoPopup is used for generic dialogues, PickerPopup is used for the colour picker.

const info = new InfoPopup;

class PickerPopup extends DynamicPopup {
	constructor( ){
		super();
		this.element.classList.add('dynamic-popup--picker');

		this.frame = document.createElement('iframe');
		this.frame.src = './picker/index.html';
		this.frame.className = 'dynamic-popup__frame';
		this.element.append(this.frame);

		this.close = document.createElement('button');
		this.close.className = 'dynamic-popup__close';
		this.close.insertAdjacentHTML('beforeend', `<i class="fa-solid fa-close"></i>`)
		this.close.addEventListener('click', () => {
			this.focus(false);
		});
		this.element.append(this.close);

		this.focusedElement = null;
		this.focusedSelector = '';
	}

	post( msg ){
		this.frame.contentWindow.postMessage(msg);
	}

	focus( selector ){
		if( selector === undefined ){
			return this.focusedSelector;
		}
		if( selector === false ){
			this.focusedElement = null;
			this.focusedSelector = '';
			this.hide();
		}
		else {
			this.focusedElement = document.getElementById(selector);
			this.focusedSelector = selector;
			this.show(this.focusedElement);
		}
	}
}
const picker = new PickerPopup;

// Function for the slider button to hide or show the sidebar

function sidebarToggleHide(  ){
	let slider = document.getElementById('js-toggle-drawer');
	let sidebar = document.getElementById('js-sidebar');

	slider.classList.toggle('is-active');
	sidebar.classList.toggle('is-aside');
}

// Class to create smoothly-expanding areas.
class Expando {
	constructor( child, limit = 100, attrs = {} ){
		this.attrs = {};
		this.attrs.subtle = 'subtle' in attrs ? attrs.subtle : false;
		this.attrs.margin = 'margin' in attrs ? attrs.margin : 0;

		this.expanded = false;
		this.limit = parseInt(limit);
		this.btnHtmlCollapsed = `<i class="fa-solid fa-caret-down" aria-hidden="true"></i> See more...`;
		this.btnHtmlExpanded = `<i class="fa-solid fa-caret-up" aria-hidden="true"></i> See less.`;

		this.root = document.createElement('div');
		this.root.className = 'expando';
		this.root.setAttribute('style', `--margin: ${attrs.margin}px`);

		// Place child inside of expando
		child.replaceWith(this.root);
		this.root.append(child);

		// calculate height if already in DOM, or wait for later if not
		
		Expando.uncalculated.push(this);
	}

	calculate( ){
		if( !document.body.contains(this.root) ){
			return false;
		}

		// don't bother making it an expando unless it's more than 25 over the limit, because the expando buttons themselves add 25 pixels extra
		if( this.root.scrollHeight < (this.limit + 25) ){
			//TODO: this should return false *before* swapping out the expando parent ideally, but due to how the CSS works we have to do it after.
			this.root.classList.add('is-innert');
			return true;
		}

		this.root.style.height = `${this.limit}px`;
		this.btn = document.createElement('button');
		this.btn.className = 'expando__button';
		this.btn.innerHTML = this.btnHtmlCollapsed;
		this.btn.addEventListener('click', ()=>{ this.toggle(); });
		if( this.attrs.subtle === true ){
			this.btn.classList.add('expando__button--subtle');
		}

		this.root.append(this.btn);
		return true;
	}

	toggle( ){
		let animTiming = {
			duration: 300 + this.root.scrollHeight / 3,
			iterations: 1,
			easing: 'ease'
		};

		if( this.expanded ){
			this.expanded = false;
			let animFrames = [
				{ height: `${this.root.scrollHeight}px` },
				{ height: `${this.limit}px` }
			];
			this.root.style.height = `${this.limit}px`;
			this.root.style.paddingBottom = `0px`;
			this.root.classList.remove('is-expanded');
			this.root.animate(animFrames, animTiming);
			this.btn.innerHTML = this.btnHtmlCollapsed;
		}
		else {
			this.expanded = true;
			let animFrames = [
				{ height: `${this.limit}px`},
				{ height: `${this.root.scrollHeight + 25}px`,
				  paddingBottom: '25px' }
			];
			this.root.style.height = `auto`;
			this.root.style.paddingBottom = `25px`;
			this.root.classList.add('is-expanded');
			this.root.animate(animFrames, animTiming);
			this.btn.innerHTML = this.btnHtmlExpanded;
		}
	}

	// method to calculate all expandos right before page load. This is done because scrollHeigh is always 0 until the elements are in the DOM
	static uncalculated = [];
	static calculateAll( ){
		for( let i = 0; i < Expando.uncalculated.length; i++ ){
			if( Expando.uncalculated[i].calculate() ){
				Expando.uncalculated.shift();
				i--;
			}
		}
	}
}

// Creates and returns an HTML DOM element containing processed BB Code
class BB {
	static sanitise( text ){
		// Sanitise input from HTML characters
		let dummy = document.createElement('div');
		dummy.textContent = text;
		return dummy.innerHTML
	}

	// Functions to convert BB text to HTML
	// Each function gets passed a fullmatch and respective capture group arguments from the regexes

	static bold( fullmatch, captureGroup ){
		return '<b class="bb-bold">'+captureGroup+'</b>';
	}

	static italic( fullmatch, captureGroup ){
		return '<i class="bb-italic">'+captureGroup+'</i>';
	}

	static underline( fullmatch, captureGroup ){
		return '<span style="text-decoration:underline;" class="bb-underline">'+captureGroup+'</span>';
	}

	static strike( fullmatch, captureGroup ){
		return '<span style="text-decoration:line-through;" class="bb-strike">'+captureGroup+'</span>';
	}
    
	static link( fullmatch, captureGroup1, captureGroup2 ){
		return '<a href="'+captureGroup1.substr(1)+'" target="_blank" class="hyperlink">'+captureGroup2+'</a>';
	}

	static list( fullmatch, captureGroup1, captureGroup2 ){
		let contents = captureGroup2.replaceAll('[*]', '</li><li class="bb-list-item">');
		contents = contents.replace(/l>.*?<\/li>/, 'l>');
		
		let ol = '<ol class="bb-list bb-list--ordered">'+contents+'</li></ol>';
		let ul = '<ul class="bb-list">'+contents+'</li></ul>';

		if( typeof captureGroup1 !== 'undefined' ){
			if( captureGroup1 === '=0' || captureGroup1 === '' ){
				return ul;
			}
			else if( captureGroup1 === '=1' || captureGroup1 === '' ){
				return ol;
			}
		}
		return ul;
	}

	// BB Tags Array Sets. Each array contains:
	// - a regex to find matches
	// - a string or function reference to handle the conversion of that match from text to HTML
	static tags = [
		[/(?<plaintext>\n)/ig, '<br>'],
		[/\[b\](?<plaintext>(?:(?!\[b\]).)*?)\[\/b\]/ig, BB.bold],
		[/\[i\](?<plaintext>(?:(?!\[i\]).)*?)\[\/i\]/ig, BB.italic],
		[/\[u\](?<plaintext>(?:(?!\[u\]).)*?)\[\/u\]/ig, BB.underline],
		[/\[s\](?<plaintext>(?:(?!\[s\]).)*?)\[\/s\]/ig, BB.strike],
		[/\[url(=.*?)\](?<plaintext>(?:(?!\[url\]).)*?)\[\/url\]/ig, BB.link],
		[/\[list(=.*?){0,1}\](?<plaintext>(?:(?!\[list\]).)*?)\[\/list\]/ig, BB.list]
	];

	static strip( text ){
		text = BB.sanitise(text);

		// Convert BBCode using patterns defined above.
		for( let bb of BB.tags ){
			text = text.replaceAll(bb[0], "$<plaintext>").replaceAll('[*]', ' • ');
		}

		return text
	}

	static create( text ){
		text = BB.sanitise(text);

		// Convert BBCode using patterns defined above.
		for( let bb of BB.tags ){
			text = text.replaceAll(bb[0], bb[1]);
		}

		// Create HTML & return
		let parent = document.createElement('p');
		parent.classList.add('bb');
		parent.innerHTML = text;
		return parent;
	}

}

function stripBB( text ){
	
}

// Determines if a string is CSS or a URL to fetch. If a URL, fetches then returns the contents for use in CSS. 
async function returnCss( string ){
	if( isValidHttp(string) ){
		try {
			return await fetchFile(string);
		}
		catch(e) {
			messenger.error(`Failed while fetching "${string}".\n${e.message}`);
			return string;
		}
	}
	return string;
}

// Updates the userSettings with the option's value.
// If funcConfig.forceValue is set then the mod will be updated to match this value. If not, the value will be read from the HTML
// Accepted values for funcConfig:
// 'parentModId' // Default none
// 'forceValue' // Default none
function updateOption( optId, funcConfig = {} ){
	try {
		// set values and default value
		let htmlId = funcConfig.parentModId ? `mod:${funcConfig.parentModId}:${optId}` : `opt:${optId}`;
		let input = document.getElementById(htmlId);
		let val = funcConfig.forceValue;

		let optData;
		if( funcConfig.parentModId !== undefined ){
			optData = theme.mods[funcConfig.parentModId].options[optId];
		}
		else {
			optData = theme.options[optId];
		}

		if( val === undefined ){
			if( input.type === 'checkbox' ){
				val = input.checked;
			}
			else {
				val = input.value;
			}
		}

		// Add to userSettings unless matches default value
		if( val === optData.default || optData.type === 'range' && val === '' ){
			if( funcConfig.parentModId ){
				delete userSettings.mods[funcConfig.parentModId][optId];
			}
			else {
				delete userSettings.options[optId];
			}
		}
		else {
			// Update HTML if necessary
			if( funcConfig.forceValue !== undefined ){
				if( input.type === 'checkbox' ){
					input.checked = val;
				}
				else {
					input.value = val;
				}
			}

			if( funcConfig.parentModId ){
				userSettings.mods[funcConfig.parentModId][optId] = val;
			}
			else {
				userSettings.options[optId] = val;
			}
		}

		return true;
	}
	catch( e ){
		console.log(`[ERROR] Unexpected error on updateOption "${optId}": ${e}`);
		return false;
	}
}

// Updates the userSettings with the mod's value.
// If funcConfig.forceValue is set then the mod will be updated to match this value. If not, the value will be read from the HTML
// Accepted values for funcConfig:
// 'skipOptions' // Default off/false
// 'forceValue' // Default none
function updateMod( modId, funcConfig = {} ){
	try {
		let toggle = document.getElementById(`mod:${modId}`);
		let val = toggle.checked;
		let mod = theme.mods[modId];

		if( funcConfig.forceValue !== undefined ){
			val = funcConfig.forceValue;
		}

		// Enable required mods
		if( mod.requires ){
			for( let requirement of mod.requires ){
				if( requirement in theme.mods ){
					if( val ){
						if( !currentRequirements[requirement] ){
							currentRequirements[requirement] = {};
						}
						currentRequirements[requirement][modId] = mod.name;
					}
					else {
						delete currentRequirements[requirement][modId];
					}

					// todo: do this using js classes or something that won't fall apart the moment you change the DOM
					let check = document.getElementById(`mod:${requirement}`);
					let requiredToggle = check.nextElementSibling;
					
					if( Object.keys(currentRequirements[requirement]).length === 0 ){
						delete userSettings.mods[requirement];
						check.disabled = false;
						check.checked = false;
						requiredToggle.classList.remove('is-forced', 'has-info');
						// this clone node/remove BS is required to make sure that the unique anonymous function added as a listener gets removed 
						requiredToggle.parentElement.append(requiredToggle.cloneNode(true));
						requiredToggle.remove();
					}
					else {
						userSettings.mods[requirement] = true;
						check.disabled = true;
						check.checked = true;
						requiredToggle.classList.add('is-forced', 'has-info');
						requiredToggle.addEventListener('mouseenter', () => {
							let names = Object.values(currentRequirements[requirement]);
							info.text(`This mod is required by one of your other choices. To change, disable "${names.join('" and "')}".`);
							info.show(requiredToggle);
						});
						requiredToggle.addEventListener('mouseleave', info.hide);
					}
				}
				else {
					messenger.warn(`Failed to set "${requirement}" requirement of mod "${modId}". This usually indicates a problem with the theme JSON. Does the mod "${requirement}" exist?`);
				}
			}
		}
		
		// Disable incompatible mods
		if( mod.conflicts ){
			for( let conflict of mod.conflicts ){
				if( conflict in theme.mods ){
					if( val ){
						if( !currentConflicts[conflict] ){
							currentConflicts[conflict] = {};
						}
						currentConflicts[conflict][modId] = mod.name;
					}
					else {
						delete currentConflicts[conflict][modId];
					}

					// todo: do this using js classes or something that won't fall apart the moment you change the DOM
					let check = document.getElementById(`mod:${conflict}`);
					let conflictToggle = check.nextElementSibling;
					
					if( Object.keys(currentConflicts[conflict]).length === 0 ){
						check.disabled = false;
						check.checked = false;
						conflictToggle.classList.remove('is-disabled', 'has-info');
						// this clone node/remove BS is required to make sure that the unique anonymous function added as a listener gets removed 
						conflictToggle.parentElement.append(conflictToggle.cloneNode(true));
						conflictToggle.remove();
					}
					else {
						check.disabled = true;
						check.checked = false;
						conflictToggle.classList.add('is-disabled', 'has-info');
						conflictToggle.addEventListener('mouseenter', () => {
							let names = Object.values(currentConflicts[conflict]);
							info.text(`This mod is incompatible with one of your choices. To use, disable "${names.join('" and "')}".`);
							info.show(conflictToggle);
						});
						conflictToggle.addEventListener('mouseleave', info.hide);
					}
				}
				else {
					messenger.warn(`Failed to set the "${conflict}" conflict of mod "${modId}". This usually indicates a problem with the theme JSON. Does the mod "${conflict}" exist?`);
				}
			}
		}

		// Mod enabled
		if( val === true ){
			document.getElementById(`mod-parent:${modId}`).classList.add('is-enabled');

			// Update HTML if necessary
			if( funcConfig.forceValue !== undefined ){
				toggle.checked = val;
			}

			userSettings.mods[modId] = {};

			// Update options if it has any before calling CSS
			if( mod.options && !funcConfig.skipOptions ){
				for( let [optId, opt] of Object.entries(mod.options) ){
					updateOption(optId, {'parentModId': modId});
				}
			}
		}

		// Mod disabled
		else {
			document.getElementById(`mod-parent:${modId}`).classList.remove('is-enabled');
			
			// Remove from userSettings
			delete userSettings.mods[modId];
		}

		return true;
	}
	catch( e ){
		console.log(`[ERROR] Unexpected error on updateMod "${modId}": ${e}`);
		return false;
	}
}

// Used to force a change in settings.
// Confirms all settings are correct, applies them to the HTML, then calls updateCss()
function applySettings( settings = false ){
	// resets all HTML before applying new settings.
	document.getElementById('js-theme').reset();
	for( let entry of document.querySelectorAll('.entry.is-enabled') ){
		entry.classList.remove('is-enabled');
	}
	for( let check of document.querySelectorAll('.entry input') ){
		check.disabled = false;
	}
	for( let toggle of document.querySelectorAll('.toggle') ){
		toggle.classList.remove('is-disabled', 'is-forced', 'has-info');
	}
	for( let swatch of document.getElementsByClassName('js-swatch') ){
		swatch.style.backgroundColor = '';
		swatch.style.backgroundColor = swatch.getAttribute('value');
	}

	// Updates variables to match new settings
	currentRequirements = {};
	currentConflicts = {};
	if( settings ){
		if( settings.options ){
			userSettings.options = settings.options;
		}
		else {
			userSettings.options = {};
		}
		if( settings.mods ){
			userSettings.mods = settings.mods;
		}
		else {
			userSettings.mods = {};
		}
	}
	
	// update HTML to match new options
	let errors = [];
	for( let [optId, val] of Object.entries(userSettings.options) ){
		if( !updateOption(optId, {'forceValue': val}) ){
			delete userSettings.options[optId];
			errors.push(`opt:<b>${optId}</b>`);
		}
		else if( theme.options[optId].type === 'range' ){
			document.getElementById(`opt:${optId}-range`).value = val;
		}
		else if( theme.options[optId].type.startsWith('color') ){
			document.getElementById(`opt:${optId}-colour`).style.backgroundColor = val;
		}
	}
	for( let [modId, modOpts] of Object.entries(userSettings.mods) ){
		if( !updateMod(modId, {'forceValue': true, 'skipOptions': true}) ){
			delete userSettings.mods[modId];
			errors.push(`mod:<b>${modId}</b>`);
			continue;
		}
		
		for( let [optId, optVal] of Object.entries(modOpts) ){
			if( !updateOption(optId, {'parentModId': modId, 'forceValue': optVal}) ){
				delete userSettings.mods[modId][optId];
				errors.push(`opt:<b>${optId}</b><i> of mod:${modId}</i>`);
			}
			else if( theme.mods[modId].options[optId].type === 'range' ){
				document.getElementById(`mod:${modId}:${optId}-range`).value = optVal;
			}
			else if( theme.mods[modId].options[optId].type.startsWith('color') ){
				document.getElementById(`mod:${modId}:${optId}-colour`).style.backgroundColor = optVal;
			}
		}
	}

	// Report errors
	if( errors.length > 0 ){
		console.log(`[ERROR] Could not import settings for some mods or options: ${errors.join(', ').replaceAll(/<.*?>/g,'')}. Did the JSON change since this theme was customised?`);
		messenger.error(`Could not import settings for some mods or options. The skipped items were:<br />• ${errors.join('<br />• ')}.`);
	}

	updateCss();
}

// Processes all options & mods in the userSettings and creates CSS.
// It then applies the CSS to the output textarea & preview iframe
async function updateCss(  ){
	let storageString = {'date': Date.now(), 'settings': userSettings};
	localStorage.setItem(`theme:${userSettings.data}`, JSON.stringify(storageString));

	let newCss = baseCss;
	
	function extendCss( extension, location = 'bottom' ){
		if( location === 'top' ){
			newCss = extension + '\n\n' + newCss;
		}
		else if( location === 'import' ){
			if( /@\\*import/i.test(newCss) ){
				newCss = newCss.replace(/([\s\S]*@\\*import.+?;)/i, '$1\n' + extension);
			}
			else {
				newCss = extension + '\n\n' + newCss;
			}
		}
		else {
			newCss = newCss + '\n\n' + extension;
		}
	}

	var userInserts = {};

	function replacementString( length = 5 ){
		let result = '';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		for( let i = 0; i < length; i++ ){
			if( i % 2 === 0 ){
				result += '~';
			}
			result += characters.charAt(Math.random() * 
		charactersLength);
		}
		result += '~';
		// Start over if string already exists
		if( userInserts[replacementString] !== undefined ){
			result = replacementString(length);
		}
		return result;
	}

	async function applyOptionToCss( css, optData, insert ){
		let split = optData.type.split('/');
		let type = split[0];
		let qualifier = split[1];
		let subQualifier = split[2];

		// Process user input as called for by the qualifier
		if( qualifier === 'content' ){
			// formats text to be valid for CSS content statements
			insert = '"' + insert.replaceAll('\\','\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\a ') + '"';
		}
		else if( qualifier === 'image_url' ){
			if( insert === '' || insert === 'none' ){
				insert = 'none';
			}
			else {
				insert = `url(${insert})`;
			}
		}
		else if( qualifier === 'url_fragment' ){
			insert = encodeURIComponent(insert.trim());
		}
		else if( type === 'color' && qualifier === 'insert' ){
			try {
				insert = insert.split('(')[1].split(')')[0];
			}
			catch {
				console.log(`[WARN] Failed to process "insert" type of option "${optData.name}" due to missing parentheses.`);
			}
			if( subQualifier.includes('strip_alpha') ){
				let arr = insert.split(',');
				if( arr.length > 3 ){
					arr.pop();
				}
				insert = arr.join(',');
			}
		}

		if( type === 'select' ){
			var replacements = 'replacements' in optData.selections[insert] ? optData.selections[insert].replacements : [];
		}
		else {
			var replacements = optData.replacements;
		}

		for( let set of replacements ){
			// Choose the correct replacement set based on whether the toggle is on or off
			let find = set[0];
			let replace = (insert === true) ? set[2] : set[1];

			// Fetch external CSS if necessary
			replace = await returnCss(replace);

			// Add a random string to CSS and user input to dictionary.
			// String will be replaced by user input later.
			// This prevents input accidentally getting over-ridden by other replacements
			if( type !== 'select' && type !== 'toggle' ){
				let str = replacementString(10);
				userInserts[str] = insert;
				replace = replace.replaceAll('{{{insert}}}', str);
			}

			// Use RegExp if called for
			if( find.startsWith('RegExp') ){
				find = new RegExp(find.substr(7), 'g');
			}

			css = css.replaceAll(find, replace);
		}

		return css;
	}

	// Sort any items in array1 that are also in array2 to have the exact same order
	function sortArrayToMatch( array1, array2 ){
		return array1.sort((a, b) => {
			let aIndex = array2.indexOf(a);
			let bIndex = array2.indexOf(b);
			
			// if unique to this array, do nothing.
			if( aIndex === -1 || bIndex === -1 ){
				return 0;
			}
			
			// elsewise, match the order of the original 
			return aIndex - bIndex;
		});
	}

	// Options
	// Sort options before to match the order of the JSON to prevent issues with incorrectly layered mods
	if( userSettings?.options && theme?.options ){
		let sortedOptIds = sortArrayToMatch(Object.keys(userSettings.options), Object.keys(theme.options));
		for( let optId of sortedOptIds ){
			newCss = await applyOptionToCss(newCss, theme.options[optId], userSettings.options[optId]);
		}
	}

	// Mods
	if( theme?.mods && Object.keys(userSettings?.mods).length > 0 ){
		// Sort mods before to match the order of the JSON to prevent issues with incorrectly layered mods
		let sortedModIds = sortArrayToMatch(Object.keys(userSettings.mods), Object.keys(theme.mods));

		for( let modId of sortedModIds ){
			let modData = theme.mods[modId];
			if( !modData.css ){
				modData.css = {'bottom': ''};
			}
			for( let [location, resource] of Object.entries(modData.css) ){
				try {
					var modCss = await returnCss(resource);
				}
				catch( err ){
					console.log(`[ERROR] Failed applying CSS of mod ${modId}: ${err.message}`);
					messenger.error(`Failed to return CSS for mod "${modId}". Try waiting 30s then disabling and re-enabling the mod. If this continues to happen, check with the author if the listed resource still exists.`, err.cause ? err.cause : 'returnCss');
				}
				
				let globalOpts = [];
				if( 'options' in modData ){
					// Sort options before to match the order of the JSON to prevent issues with incorrectly layered mods
					let sortedOptIds = sortArrayToMatch(Object.keys(userSettings.mods[modId]), Object.keys(theme.mods[modId].options));

					for( let optId of sortedOptIds ){
						let optData = modData.options[optId];
						if( optData.flags?.includes('global') ){
							globalOpts.push([optData, val]);
						}
						else {
							modCss = await applyOptionToCss(modCss, optData, userSettings.mods[modId][optId]);
						}
					}
				}

				extendCss(modCss, location);

				for( let opt of globalOpts ){
					newCss = await applyOptionToCss(newCss, ...opt);
				}
			}
		}
	}

	// Process user inserts after all other code has been added.
	// This prevents unexpected behaviour with user inserts that match other replacements.

	for( let [find, replace] of Object.entries(userInserts) ){
		newCss = newCss.replaceAll(find,replace);
	}

	// Encode options & sanitise any CSS character

	let tempSettings = structuredClone(userSettings);
	if( Object.keys(tempSettings.mods).length === 0 ){
		delete tempSettings.mods;
	}
	if( Object.keys(tempSettings.options).length === 0 ){
		delete tempSettings.options;
	}
	let settingsStr = JSON.stringify(tempSettings).replaceAll('*/','*\\/').replaceAll('/*','\\/*');
	// Update export textareas
	document.getElementById('js-export-code').textContent = settingsStr;
	// Place options at top
	let cssWithSettings = '/* Theme Customiser Settings\nhttps://github.com/ValerioLyndon/Theme-Customiser\n^TC' + settingsStr + 'TC$*/\n\n' + newCss;

	// Add settings if there is room and add over-length notice if necessary
	
	let notice = document.getElementById('js-output-notice');
	if( newCss.length < 65535 && cssWithSettings.length > 65535 ){
		let spare = 65535 - newCss.length;
		notice.innerHTML = `This configuration is close to exceeding MyAnimeList's maximum CSS length. The customiser settings area has been removed to make space and you now have ${spare} characters remaining. If you need help bypassing the limit, see <a class="hyperlink" href="https://myanimelist.net/forum/?topicid=1911384" target="_blank">this guide</a>.`;
		notice.classList.add('info-box--warn');
		notice.classList.remove('o-hidden', 'info-box--error');
	}
	else if( newCss.length > 65535 ){
		let excess = newCss.length - 65535;
		notice.innerHTML = `This configuration exceeds MyAnimeList's maximum CSS length by ${excess} characters. You will need to <a class="hyperlink" href="https://www.toptal.com/developers/cssminifier" target="_blank">shorten this code</a> or <a class="hyperlink" href="https://myanimelist.net/forum/?topicid=1911384" target="_blank">host it on an external site to bypass the limit</a>.`;
		notice.classList.add('info-box--error');
		notice.classList.remove('o-hidden', 'info-box--warn');
	}
	else {
		notice.classList.add('o-hidden');
		newCss = cssWithSettings;
	}

	// Update code textarea
	document.getElementById('js-output').textContent = newCss;

	// Update iframe
	postToPreview(['css', newCss]);
}

// Used as an eventListener on certain user inputs and activated on change.
// Validates user input depending on option type and warns user of problems. 
// "htmlId" should be a valid HTML ID to select the option with.
// "type" is the full option type string: "type/qualifier/subqualifier" 
function validateInput( htmlId, type ){
	let notice = document.getElementById(`${htmlId}-notice`);
	let noticeHTML = '';
	let val = document.getElementById(htmlId).value.toLowerCase();
	let problems = 0;
	let qualifier = type.split('/')[1];
	
	if( val.length === 0 ){
		notice.classList.add('o-hidden');
		return undefined;
	}

	if( qualifier === 'image_url' ){
		// Consider replacing this with a script that simply loads the image and tests if it loads. Since we're already doing that with the preview anyway it shouldn't be a problem.
		noticeHTML = 'We detected some warnings. If your image does not display, fix these issues and try again.<ul class="info-box__list">';

		function problem( text ){
			problems += 1;
			noticeHTML += `<li class="info-box__list-item">${text}</li>`;
		}

		if( val !== 'none' && val.length > 0 ){
			if( !val.startsWith('http') ){
				if( val.startsWith('file:///') ){
					problem('URL references a file local to your computer. You must upload the image to an appropriate image hosting service.');
				}
				else {
					problem('URL string does not contain the HTTP protocol.');
				}
			}
			if( !/(png|jpe?g|gif|webp|svg)(\?.*)?$/.test(val) ){
				problem('Your URL does not appear to link to an image. Make sure that you copied the direct link and not a link to a regular webpage.');
			}
			else if( /svg(\?.*)?$/.test(val) ){
				problem('SVG images will not display on your list while logged out or for other users. Host your CSS on an external website to bypass this.');
			}
		}
	}

	else if( qualifier === 'size' ){
		problems += 1;
		for( let unit of ['px','%','em','rem','vh','vmax','vmin','vw','ch','cm','mm','Q','in','pc','pt','ex'] ){
			if( val.endsWith(unit) ){
				problems -= 1;
			}
		}
		if( val.startsWith('calc(') && val.endsWith(')') ){
			problems = 0;
		}
		if( problems > 0 ){
			noticeHTML = 'Did not detect a length unit. All CSS sizes must end in a length unit such as "px", "%", "vw", or otherwise. For help creating valid CSS colours, see <a class="hyperlink" href="https://css-tricks.com/the-lengths-of-css/">this guide</a>.';
		}
	}
	
	if( problems > 0 ){
		notice.innerHTML = noticeHTML;
		notice.classList.remove('o-hidden');
		return false;
	}
	else {
		notice.classList.add('o-hidden');
		return true;
	}
}

function resetSettings(  ){
	userConfirm('Wipe your currently selected settings and start from scratch?', {'Yes': {'value': true, 'type': 'danger'}, 'No': {'value': false}})
	.then((choice) => {
		if( choice ){
			userSettings.options = {};
			userSettings.mods = {};
			applySettings(userSettings);
			messenger.timeout('Settings reset to default.');
		}
	});
}

function clearCache(  ){
	userConfirm('Clear all cached data? This can be useful if the customiser is pulling out-of-date CSS or something seems broken, but normally this should never be needed.')
	.then((choice) => {
		if( choice ){
			sessionStorage.clear();
			localStorage.removeItem('tcImport');
			messenger.send('Customiser cache cleared. There may still be issues with the browser cache. To avoid any such issues, please force-reload the page by using Ctrl+F5, Ctrl+Shift+R, or hold Ctrl while clicking the reload button.');
		}
	});
}

// colorToSet is defined whenever a user clicks on a "color" type option and activates the colour picker.
var colorToSet = null;

// We then listen for messages from the colour picker and apply the colour picker value onto the HTML.
window.addEventListener(
	"message",
	function( event ){
		if( event.origin === window.location.origin ){
			var push = event.data || event.message;
			var type = push[0];
			var content = push[1];

			if( type === 'color' ){
				if( colorToSet !== null ){
					colorToSet.html.style.backgroundColor = content;
					colorToSet.input.value = content;
					colorToSet.input.dispatchEvent(new Event('input'));
				}
				else {
					console.log('[WARN] Received request to change colour, but no option is currently selected.');
				}
			}
			else if( type === 'json' ){
				processJson(content, '', 'theme')
				.then((processedJson) => {
					theme = processedJson.data;
					userSettings.theme = theme.name;
					pageSetup();
				})
				.catch((err) => {
					loader.failed(err);
					throw null;
				});
			}
			else {
				console.log('[ERROR] Malformed request sent to customiser.js. No action taken.')
			}
		}
	},
	false
);

function sidebarChangeDepth( force ){
	let wrapper = document.querySelector('.js-sidebar-wrapper');
	if( force === true || wrapper.style.translate === '' ){
		wrapper.style.translate = 'calc(var(--sidebar-width) * -1)';
	}
	else {
		wrapper.style.translate = '';
	}
}

function resetSecondSidebar( ){
	let sidebar = document.querySelector('.js-sidebar-2');
	sidebar.innerHTML = '';
}

function viewMod( modId ){
	let entry = theme['mods'][modId];

	sidebarChangeDepth(true);
	
	let sidebar = document.querySelector('.js-sidebar-2');
	let buttonSection = document.createElement('div');
	buttonSection.className = 'sidebar__section sidebar__section--top';
	let optSection = document.createElement('div');
	optSection.className = 'sidebar__section sidebar__section--no-border';

	let nameHeader = document.createElement('h2');
	nameHeader.className = "sidebar__header";
	nameHeader.textContent = entry.name;
	let modDesc = BB.create(entry.description);
	let optHeader = document.createElement('h3');
	optHeader.className = 'sidebar__header';
	optHeader.textContent = 'Change mod options';
	optSection.append(nameHeader, modDesc, optHeader);

	for( let opt of Object.entries(entry.options) ){
		let renderedOpt = renderCustomisation('option', opt, entry);
		if( renderedOpt ){
			optSection.append(renderedOpt);
		}
	}

	let backBtn = document.createElement('button');
	backBtn.className = 'button';
	backBtn.textContent = 'Back';
	backBtn.addEventListener('click', ()=>{
		sidebarChangeDepth(false);
		resetSecondSidebar();
	});
	buttonSection.append(backBtn);

	sidebar.append(buttonSection, optSection);
	Expando.calculateAll();
}



// ONE-TIME SETUP & PAGE SETUP

// Setup preview Window early to allow it time to load.
var preview = document.getElementById('js-preview');
var iframe = document.createElement('iframe');
iframe.className = 'preview__window';
// Once both of these are true, the loader gets removed.
var iframeLoaded = false;
var pageLoaded = false;
// If trying to communicate with the iframe too early, they get placed inside this variable.
var toPost = [];

// Checks if iframe is loaded and adds to backlog if not.
function postToPreview( msg ){
	if( iframeLoaded ){
		iframe.contentWindow.postMessage(msg);
		return true;
	}
	toPost.push(msg);
	return false;
}

// Once loaded, the aformentioned messages get processed inside this eventlistener. 
iframe.addEventListener('load', () => {
	iframeLoaded = true;
	if( toPost.length > 0 ){
		console.log(`[info] Posting ${toPost.length} backlogged messages.`);
		for( let msg of toPost ){
			postToPreview(msg);
		}
	}
	if( pageLoaded === true ){
		loader.loaded();
		startThemeTutorial();
	}
});

// Define a few variables to be sure they are available to all functions.
var theme, json, baseCss;
// This keeps track of any mod tags, which are entered via the pushFilter() function from common.js
// It is then used to render the Filter section.
var tags = {};
// These variables track the current required or conflicting mods, based off of other enabled mods.
var currentRequirements = {};
var currentConflicts = {};
// userSettings keeps track of the currently selected options on the page.
// It is used, saved, and output in various locations.
var userSettings = {
	'data': themeUrls[0],
	'options': {},
	'mods': {}
};

// If page is in 'dynamic' dev mode, it awaits a message via window.addEventListener. Else proceeds via URL.
if( !query.get('dynamic') ) {
	// Get the theme's JSON URL from the query parameters.

	let fetchUrl = themeUrls[0];

	// Legacy URL processing from JSON 0.1
	let selectedTheme = query.get('q') || query.get('theme') || 'theme';
	if( themeUrls.length === 0 && collectionUrls.length > 0 ){
		fetchUrl = collectionUrls[0];
	}
	// Back to regular URL processing
	else if( themeUrls.length === 0 ){
		loader.failed(new Error('No theme was specified in the URL. Did you follow a broken link?', {cause:'select'}));
		throw new Error('select');
	}

	// Fetch and process the theme URL, beginning the page setup pipeline.

	loader.text('Fetching theme...');

	fetchFile(fetchUrl, false)
	.then((json) => {
		try {
			json = JSON.parse(json);
		}
		catch( e ){
			loader.logJsonError(`[ERROR] Failed to parse theme JSON.`, json, e, fetchUrl);
			loader.failed(new Error('Encountered a problem while parsing theme information.', {cause:'json.parse'}));
			throw new Error('json.parse');
		}

		processJson(json, themeUrls[0], selectedTheme ? selectedTheme : 'theme')
		.then((processedJson) => {
			theme = processedJson.data;
			userSettings.theme = selectedTheme === 'theme' ? theme.name : selectedTheme;
			pageSetup();
		})
		.catch((err) => {
			loader.failed(err);
			throw null;
		});
	})
	.catch((err) => {
		loader.failed(err);
		throw null;
	});
}

// This function:
// Sets up basic HTML structure
// Adds functionality to page elements
// Updates preview CSS
// Removes loader
function pageSetup( ){
	loader.text('Rendering page...');

	// Set preview to correct type and add iframe to page
	let framePath = `./preview/${theme.type}/`;
	if( theme.supports.length === 1 && theme.supports[0] === 'mangalist' ){
		//framePath += 'mangalist.html';
		console.log('[info] Detected mangalist only, but manga preview is not yet supported.');
		framePath += 'animelist.html';
	}
	else {
		framePath += 'animelist.html';
	}
	iframe.src = framePath;
	preview.appendChild(iframe);

	// Basic theme information / HTML changes
	document.getElementsByTagName('title')[0].textContent = `Theme Customiser - ${theme.name}`;
	document.getElementById('js-title').textContent = theme.name;
	const authorEle = document.querySelector('.js-author');
	authorEle.textContent = theme.author;
	if( 'author_url' in theme ){
		authorEle.href = theme.author_url;
		authorEle.target = '_blank';
		authorEle.classList.add('hyperlink');
	}

	// Theme flags
	if( theme.flags ){
		let tags = document.querySelectorAll('.js-theme-tag');
		let notice = document.querySelector('.js-theme-wip');
		if( theme.flags.includes('beta') ){
			tags[0].textContent = 'BETA';
			tags[0].classList.remove('o-hidden');
			notice.classList.remove('o-hidden');
		}
		else if( theme.flags.includes('alpha') ){
			tags[0].textContent = 'ALPHA';
			tags[0].classList.remove('o-hidden');
			notice.classList.remove('o-hidden');
		}
	}

	// Options & Mods

	let optionsEle = document.querySelector('.js-options-anchor');
	if( theme.options ){
		for( const opt of Object.entries(theme.options) ){
			let renderedOpt = renderCustomisation('option', opt);
			if( renderedOpt ){
				optionsEle.appendChild(renderedOpt);
			}
		}
	}
	else {
		document.querySelector('.js-options-deletion-point').remove();
	}

	let mods = [];
	let modsEle = document.querySelector('.js-mods-anchor');
	if( theme.mods ){
		for( const mod of Object.entries(theme.mods) ){
			let renderedMod = renderCustomisation('mod', mod);
			if( renderedMod ){
				mods.push(renderedMod);
				modsEle.appendChild(renderedMod);
			}
		}
	}
	else {
		document.querySelector('.js-mods-deletion-point').remove();
	}

	// Tag links
	if( Object.entries(tags).length > 0 && Object.entries(theme.mods).length > 3 ){
		var filter = new BaseFilters(mods, 'mod-parent:ID');
		filter.initialiseTags(tags);
	}

	// Back link
	let back = document.getElementById('js-back');
	let backUrl = `./?`;
	if( collectionUrls.length > 0 ){
		backUrl += `&c=${collectionUrls.join('&c=')}`;
	}
	if( megaUrls.length > 0 ){
		backUrl += `&m=${megaUrls.join('&m=')}`;
	}
	backUrl = backUrl.replace('?&', '?');
	back.href = backUrl;

	// Sponsor Link
	if( theme.sponsor ){
		let sponsor = document.getElementById('js-sponsor');
		sponsor.classList.remove('o-hidden');
		sponsor.href = theme.sponsor;
	}

	// Help links
	if( theme.help ){
		let help = document.getElementsByClassName('js-help');
		let helpLinks = document.getElementsByClassName('js-help-href');

		for( let ele of help ){
			ele.classList.remove('o-hidden');
		}
		for( let link of helpLinks ){
			link.href = theme.help;
		}
	}

	// Theme config - variables & functions

	let configList = document.getElementById('js-theme-config');
	let configNotice = document.getElementById('js-intended-config');

	var baseColumns = {
			'animelist': ['Numbers', 'Score', 'Type', 'Episodes', 'Rating', 'Start/End Dates', 'Total Days Watched', 'Storage', 'Tags', 'Priority', 'Genre', 'Demographics', 'Notes', 'Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors', 'MAL Score', 'Score Diff.', 'Popularity'],
			'mangalist': ['Numbers', 'Score', 'Type', 'Chapters', 'Volumes', 'Start/End Dates', 'Total Days Read', 'Retail Manga', 'Tags', 'Priority', 'Genres', 'Demographics', 'Notes', 'Image', 'Published Dates', 'Magazine', 'MAL Score', 'Score Diff.', 'Popularity']
		};

	function processColumns( mode, todo, listType ){
		let columns = {};
		let base = baseColumns[listType];

		for( let col of base ){
			if( Object.keys(todo).includes(col) ){
				columns[col] = todo[col];
			}
			else if( mode === 'whitelist' ){
				columns[col] = false;
			}
			else if( mode === 'blacklist' ){
				columns[col] = true;
			}
			else if( mode === 'greylist' ){
				columns[col] = null;
			}
		}
		
		return columns;
	}

	// Check for listType support

	if( theme.supports?.length === 1 ){
		let type = theme.supports[0];
		configNotice.classList.remove('o-hidden');
		let typeHtml = document.createElement('div');
		typeHtml.className = 'popup__section';
		typeHtml.innerHTML = `
			<h5 class="popup__sub-header">List type.</h5>
			<p class="popup__paragraph">This theme was designed only for <b>${type}s</b>. Use on ${type === 'animelist' ? 'mangalist' : 'animelist'}s may have unexpected results.</p>
		`;
		configList.appendChild(typeHtml);
	}
	else {
		theme.supports = ['animelist','mangalist'];
	}

	// Set recommended category

	if( theme.category ){
		configNotice.classList.remove('o-hidden');

		let categoryDict = {
			7: '"Show All"',
			1: '"Watching" or "Reading"',
			2: '"Completed"',
			3: '"On-Hold"',
			4: '"Dropped"',
			6: '"Plan to Watch" or "Plan to Read"'
		}

		let categories = 'a specific starting category, but an error occured! Please try out the options until one looks good';
		if( theme.category.length > 3){
			let inverted = Object.keys(categoryDict)
							.filter(id=>theme.category.find(id2=>parseInt(id) === parseInt(id2)) === undefined)
							.map(id=>categoryDict[id]);
			categories = `any starting category that <b>isn't</b> ${inverted.join(' or ')}`;
		}
		else if( theme.category.length === 1 ){
			categories = 'the starting category ' + categoryDict[theme.category[0]];
		}
		else {
			categories = 'one of these starting categories: ';
			theme.category.forEach((id, index)=>{
				let joiner = index+1 === theme.category.length ? ', or ' : ', ';
				let text = index === 0 ? categoryDict[id] : joiner + categoryDict[id];
				categories += text;
			});
		}

		// recommended config
		let categoryConfigHtml = document.createElement('div');
		categoryConfigHtml.className = 'popup__section';
		categoryConfigHtml.innerHTML = `
			<h5 class="popup__sub-header">Starting category.</h5>
			<p class="popup__paragraph">This theme recommends ${categories}. You can set this in your <a class="hyperlink" href="https://myanimelist.net/editprofile.php?go=listpreferences" target="_blank">list preferences</a> by finding the "Default Status Selected" dropdown menus.</p>
		`;
		configList.appendChild(categoryConfigHtml);
	}

	// Set recommended theme columns

	if( theme.columns ){
		configNotice.classList.remove('o-hidden');

		let columnsHtml = document.createElement('div');
		columnsHtml.className = 'popup__section';
		columnsHtml.innerHTML = `
			<h5 class="popup__sub-header">List columns.</h5>
			<p class="popup__paragraph">You can set your list columns to match in your <a class="hyperlink" href="https://myanimelist.net/editprofile.php?go=listpreferences" target="_blank">list preferences</a>.</p>
		`;
		configList.appendChild(columnsHtml);

		let mode = theme.columns.mode ? theme.columns.mode : 'whitelist';

		// Do actual stuff here
		var columnsContainer = document.createElement('div');
		columnsContainer.className = 'columns';

		function renderColumns( columns, listType ){
			let typeWrapper = document.createElement('div');
			let glue = document.createElement('div');
			let classic = document.createElement('div');
			let modern = document.createElement('div');
			
			typeWrapper.className = 'columns__wrapper';
			glue.className = 'columns__glue';
			classic.className = 'columns__split';
			modern.className = 'columns__split';

			typeWrapper.innerHTML = `<b class="columns__header">${listType[0].toUpperCase()}${listType.substr(1)} Columns</b>`;
			typeWrapper.appendChild(glue);
			glue.appendChild(classic);
			if( theme.type === 'modern' ){
				glue.appendChild(modern);
				classic.innerHTML = `<b class="columns__split-header">Common</b>`;
				modern.innerHTML = `<b class="columns__split-header">Modern Only</b>`;
			}

			for( let [name, value] of Object.entries(columns) ){
				let col = document.createElement('div');
				col.className = 'columns__item';
				col.innerHTML = `
					<label class="columns__check"></label>
					<span class="columns__name">${name}</span>
				`;
				
				let check = col.getElementsByTagName('label')[0];
				
				if( value === true ){
					check.classList.add('columns__check--checked');
					col.title = 'This column should be enabled.';
				}
				else if( value === false ){
					col.title = 'This column should be disabled.';
				}
				else if( value === null ){
					check.classList.add('columns__check--optional');
					col.title = 'This column is optional.';
				}

				if( ['Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors', 'Published Dates', 'Magazine', 'MAL Score', 'Score Diff.', 'Popularity'].includes(name) ){
					modern.appendChild(col);
				}
				else {
					classic.appendChild(col);
				}
			}
			columnsContainer.appendChild(typeWrapper);
		}

		for( let listType of theme.supports ){
			if( theme.columns[listType] ){
				let tempcolumns = processColumns(mode, theme.columns[listType], listType);
				renderColumns(tempcolumns, listType);
			}
		}

		// Add legend

		let columnsLegend = document.createElement('div');
		columnsLegend.className = 'columns__legend'
		columnsLegend.innerHTML = `
			<b class="columns__header">Legend</b>
			<div class="columns__legend-list">
				<div class="columns__item" title="This column should be enabled.">
					<label class="columns__check columns__check--checked"></label>
					<span class="columns__name">Enabled</span>
				</div>
				<div class="columns__item" title="This column is optional.">
					<label class="columns__check columns__check--optional"></label>
					<span class="columns__name">Optional</span>
				</div>
				<div class="columns__item" title="This column should be disabled.">
					<label class="columns__check"></label>
					<span class="columns__name">Disabled</span>
				</div>
			</div>
		`;
		columnsContainer.appendChild(columnsLegend);

		columnsHtml.appendChild(columnsContainer);
	}

	// Set recommended installation steps

	let coverHtml = document.getElementById('js-install-cover');
	let backgroundHtml = document.getElementById('js-install-background');
	let coverCheck = document.getElementById('js-preview__cover');
	let coverField = document.getElementById('js-preview__cover-url');
	let backgroundField = document.getElementById('js-preview__background-url');

	if( theme.type === 'classic' ){
		coverHtml.remove();
		backgroundHtml.remove();
		coverField.parentNode.remove();
		backgroundField.parentNode.remove();
		coverCheck.parentNode.remove();
	}
	else {
		let hasCustomInstall = false;
		let customInstallTexts = [];

		if( theme.style ){
			hasCustomInstall = true;

			let styleDict = {
					1: 'Default Theme',
					2: 'White',
					3: 'White Blue',
					4: 'White Green',
					5: 'White Red',
					6: 'White Yellow',
					7: 'Dark Blue',
					8: 'Dark Green',
					9: 'Dark Pink',
					10: 'Dark Red'
				},
				styleNum = theme.style[0],
				styleName = styleDict[styleNum];
			
			customInstallTexts.push(`Use only with the "<b>${styleName}</b>" style.`);

			// change install instructions to match
			let installStep = document.getElementById('js-install-style');
			installStep.innerHTML = `
				<p class="popup__paragraph">Find and activate the ${styleName} style. Save your changes, then click on the style to open its page.</p>
				<a class="dummy-theme-unit" target="_blank" href="https://myanimelist.net/ownlist/style/theme/${styleNum}">
					<div class="dummy-theme-unit__name">${styleName}</div>
					<img src="./images/style-${styleNum}.png" class="dummy-theme-unit__image" />
					<div class="dummy-theme-unit__selection">
						<label class="dummy-theme-unit__label">
							<input type="radio" class="dummy-theme-unit__radio" checked="checked" />
							Anime
						</label>
						<label class="dummy-theme-unit__label">
							<input type="radio" class="dummy-theme-unit__radio" checked="checked" />
							Manga
						</label>
					</div>
				</a>
				<p class="info-box">This theme requires the use of this specific style. Use of other styles may cause colour issues.</p>
			`;
		}

		if( 'cover' in theme ){
			// toggle button
			let toggle = coverCheck.nextElementSibling;
			let val = true;

			if( theme.cover ){
				toggle.classList.add('is-forced', 'has-info');
			}
			else {
				val = false;
				toggle.classList.add('is-disabled', 'has-info');
			}
			coverCheck.checked = val;
			coverCheck.disabled = true;
			toggle.removeAttribute('onclick');
			toggle.addEventListener('mouseenter', () => {
				info.text('This option is not editable due to the recommended theme settings.');
				info.show(toggle);
			});
			toggle.addEventListener('mouseleave', info.hide);

			// installation steps
			hasCustomInstall = true;

			let choice = theme.cover === true ? 'Yes' : 'No';
			let extraConfig = '';
			let extraInstall = '';

			if( choice === 'Yes' ){
				extraConfig = `Be sure to upload an image by using the "Browse..." button.`;
			}
			if( 'cover_url' in theme ){
				extraConfig += ` Use <a class="hyperlink" href="${theme.cover_url}" target="_blank">this image</a>.`;
				extraInstall += ` This theme recommends <a class="hyperlink" href="${theme.cover_url}" target="_blank">this image</a>.`;
			}
			
			customInstallTexts.push(`Set the "Show cover image" option to "<b>${choice}</b>".${extraConfig}`);
			coverHtml.innerHTML = `
				<p class="popup__paragraph">
					In the sidebar, find the "Cover Image" area. Click to expand it if necessary. Set the "Show cover image" option to "<b>${choice}</b>".${extraInstall}
				</p>
			`;

			
		}
		else {
			coverHtml.remove();
		}

		if( 'background' in theme ){
			hasCustomInstall = true;

			let choice = theme.background === true ? 'Yes' : 'No';
			let extraConfig = '';
			let extraInstall = '';

			if( choice === 'Yes' ){
				extraConfig = `Be sure to upload an image by using the "Browse..." button.`;
			}
			if( 'background_url' in theme ){
				extraConfig += ` Use <a class="hyperlink" href="${theme.background_url}" target="_blank">this image</a>.`;
				extraInstall += ` This theme recommends <a class="hyperlink" href="${theme.background_url}" target="_blank">this image</a>.`;
			}
			
			customInstallTexts.push(`Set the "Show background image" option to "<b>${choice}</b>".${extraConfig}`);
			backgroundHtml.innerHTML = `
				<p class="popup__paragraph">
					In the sidebar, find the "Background Image" area. Click to expand it if necessary. Set the "Show background image" option to "<b>${choice}</b>".${extraInstall}
				</p>
			`;
		}
		else {
			backgroundHtml.remove();
		}

		if( hasCustomInstall ){
			configNotice.classList.remove('o-hidden');
			let installHtml = document.createElement('div');
			installHtml.className = 'popup__section';
			installHtml.innerHTML = `
				<h5 class="popup__sub-header">Installation steps.</h5>
				<p class="popup__paragraph">
					This theme has extra installation specifications. Please take these actions during install:<br />
					• ${customInstallTexts.join('<br />• ')}<br />
					<br />
					If you don't know how to apply these changes, please follow the <a class="hyperlink js-installation-btn">installation guide</a> for detailed instructions.</p>
			`;
			configList.appendChild(installHtml);
		}
	}

	// Set preview options and post to preview iframe

	// Cover
	if( 'cover' in theme.preview ){
		// change toggle value unless it was already changed by regular settings
		if( coverCheck.disabled === false ){
			coverCheck.checked = theme.preview.cover;
		}
		postToPreview(['cover', theme.preview.cover]);
	}
	if( 'background' in theme.preview ){
		postToPreview(['background', theme.preview.background]);
	}
	if( 'cover_url' in theme.preview ){
		coverField.value = theme.preview.cover_url;
		postToPreview(['cover_url', theme.preview.cover_url]);
	}
	if( 'background_url' in theme.preview ){
		backgroundField.value = theme.preview.background_url;
		postToPreview(['background_url', theme.preview.background_url]);
	}
	// disable background by default because most themes look better without it.
	else if( theme.preview?.background !== true && theme.type === 'modern' ) {
		postToPreview(['background_url', false]);
	}

	// Category
	if( 'category' in theme.preview ){
		postToPreview(['category', theme.preview.category[0]])
	}
	
	// Style
	if( 'style' in theme.preview ){
		postToPreview(['style', theme.preview.style[0]]);
	}

	// Columns

	var tempcolumns = {};
	let mode = 'whitelist';
	let tempListType = theme.supports[0];
	if( 'columns' in theme.preview ){
		mode = theme.preview.columns.mode;
		tempcolumns = theme.preview.columns;
	}
	else {
		// Set random columns if they aren't set
		tempcolumns = {
			'animelist': {
				'Score': true,
				'Episodes': true,
				'Image': true
			},
			'mangalist': {
				'Score': true,
				'Chapters': true,
				'Volumes': true,
				'Image': true
			}
		};
		for( let col of baseColumns[tempListType] ){
			if( Object.keys(tempcolumns[tempListType]).length > 8 ){
				break;
			}

			if( !Object.keys(tempcolumns[tempListType]).includes(col) && Math.round(Math.random()) === 1 ){
				tempcolumns[tempListType][col] = true;
			}
		}
	}

	// process columns and update iframe
	let columns = processColumns(mode, tempcolumns[tempListType], tempListType);
	postToPreview(['columns', columns]);

	// Add classic list functions

	let installBtns = document.getElementsByClassName('js-installation-btn');
	for( let btn of installBtns ){
		if( theme.type === 'classic' ){
			btn.addEventListener('click', () => { toggleEle('#js-pp-installation-classic') });
			btn.textContent = 'How do I install classic lists?';
		}
		else {
			btn.addEventListener('click', () => { toggleEle('#js-pp-installation-modern') });
		}
	}

	// Add expando functions

	let needsExpando = document.getElementsByClassName('js-make-expando');
	for( let ele of needsExpando ){
		new Expando(ele, ele.dataset.expandoLimit, {'margin': ele.dataset.expandoMargin});
	}
	Expando.calculateAll();

	// Add swappable text functions

	let swaps = document.getElementsByClassName('js-swappable-text');

	function swapText(  ){
		let toSwap = this.querySelector('.swappable-text');
		
		toSwap.classList.add('is-swapped');
		setTimeout(() => {
			toSwap.classList.remove('is-swapped')
		}, 666);
	}

	for( let swap of swaps ){
		swap.addEventListener('click', swapText.bind(swap));
	}

	loader.text('Fetching CSS...');

	// Get theme CSS
	returnCss('css' in theme ? theme.css : '')
	.then((css) => {
		// Update Preview
		baseCss = css;
	
		// Import settings if requested by storage
		if( localStorage.getItem('tcImport') ){
			let tempSettings = localStorage.getItem('tcUserSettingsImported');
			if( tempSettings === null ){
				messenger.error('Failed to import options. If you initiated this operation, please report this issue.', 'localstorage.getitem');
			}
			else {
				try {
					tempSettings = JSON.parse(tempSettings);
				}
				catch( e ){
					console.log(`[ERROR] Failed to parse imported settings: ${e}`);
					messenger.error('Failed to import options. Could not parse settings.', 'json.parse');
				}
				// importPreviousSettings will call updateCss
				if( importPreviousSettings(tempSettings) ){
					localStorage.removeItem('tcImport');
				}
			} 
		}

		// Clear any previous theme settings that are older than 4 hours (14,400,000ms).
		for( let i = 0; i < localStorage.length; i++ ){
			let key = localStorage.key(i);

			if( key.startsWith('theme:') ){
				let data = JSON.parse(localStorage.getItem(key));
				if( Date.now() - data.date > 14400000 ){
					localStorage.removeItem(key);
				}
			}
		}

		// Apply previous settings if they exist.
		let settingsStorage = localStorage.getItem(`theme:${userSettings.data}`);
		if( settingsStorage ){
			let storage = JSON.parse(settingsStorage);
			applySettings(storage.settings);
		}

		// Push to iframe as normal if no import present
		else {
			updateCss();
		}

		pageLoaded = true;

		// Remove Loader if iframe has loaded, else wait until iframe calls function.
		if( iframeLoaded ){
			loader.loaded();
			startThemeTutorial();
		}
		else {
			loader.text('Loading preview...');
			console.log('[info] Awaiting preview before completing page load.');
		}
	})
	.catch((err) => {
		loader.failed(err);
		throw null;
	});
}

// Render mods and options and returns the DOM element. Used inside pageSetup()
function renderCustomisation( entryType, entry, parentEntry = [undefined, undefined]){
	let entryId = entry[0];
	let entryData = entry[1];
	let parentId = parentEntry[0];

	// Setup basic HTML

	let div = document.createElement('div');
	let head = document.createElement('div');
	let headLeft = document.createElement('b');
	let headRight = document.createElement('div');
	let desc = document.createElement('div');
	let expando = new Expando(desc, 100, {subtle: true, margin: 16});

	div.className = 'entry';
	head.className = 'entry__head';
	headLeft.textContent = entryData.name;
	headLeft.className = 'entry__name';
	headRight.className = 'entry__action-box';
	desc.className = 'entry__desc';

	// Add HTML as necessary

	head.append(headLeft);
	head.append(headRight);
	div.append(head);
	if( entryData.description ){
		div.append(expando.root);
	}

	// Option & Mod Specific HTML

	if( entryType === 'option' ){
		div.classList.add('is-option');

		let htmlId = parentId ? `mod:${parentId}:${entryId}` : `opt:${entryId}`;

		let inputRow = document.createElement('div');
		inputRow.className = 'entry__inputs';
		div.append(inputRow);

		let split = entryData.type.split('/');
		let type = split[0];
		let qualifier = split[1];
		let subQualifier = split[2];

		// Description
		
		desc.append(BB.create(entryData.description));

		// Help Links

		let helpLink = document.createElement('a');
		helpLink.className = 'entry__help hyperlink';
		helpLink.target = "_blank";
		head.appendChild(helpLink);

		// Type-specific Option HTML & Functions

		let input = document.createElement('input');
		input.placeholder = 'Your text here.';
		input.className = 'input';

		// Text-based Options

		if( type.startsWith('text') ){
			input.type = 'text';
			if( type === 'textarea' ){
				input = document.createElement('textarea');
				input.className = 'input entry__textarea input--textarea';
				input.innerHTML = entryData.default;
			}
			input.value = entryData.default;

			if( qualifier === 'value' ){
				input.placeholder = 'Your value here.';
				
				// Add help link to Mozilla docs for CSS properties
				if( subQualifier ){
					helpLink.innerHTML = ' Valid Inputs <i class="fa-solid fa-circle-info"></i>';
					helpLink.href = `https://developer.mozilla.org/en-US/docs/Web/CSS/${subQualifier}#values`
				}
			}
			else if( qualifier === 'size' ){
				input.placeholder = 'Your size here. e.x 200px, 33%, 20vw, etc.';
				input.addEventListener('input', () => { validateInput(htmlId, entryData.type); });
			}
			else if( qualifier === 'image_url' ){
				input.type = 'url';
				input.placeholder = 'https://example.com/image.jpg';

				helpLink.innerHTML = 'Tips & Help <i class="fa-solid fa-circle-question"></i>';
				helpLink.href = 'https://github.com/ValerioLyndon/MAL-Public-List-Designs/wiki/Image-Hosting-Tips';

				input.addEventListener('input', () => { validateInput(htmlId, entryData.type); });
			}
		}

		// Colour Options

		else if( type === 'color' ){
			input.classList.add('o-hidden');

			// Add a colour preview
			var swatch = document.createElement('div');
			swatch.className = 'entry__colour js-swatch';
			inputRow.appendChild(swatch);

			swatch.setAttribute('value', entryData.default);
			input.value = entryData.default;
			swatch.style.backgroundColor = entryData.default;

			let toReturn = 'rgb';
			if( subQualifier && subQualifier.includes('hsl') ){
				toReturn = 'hsl';
			}
			else if( subQualifier && subQualifier.includes('hex') ){
				toReturn = 'hex';
			}

			swatch.id = `${htmlId}-colour`;
			swatch.addEventListener('click', () => {
				colorToSet = {
					'html': swatch,
					'input': input
				};

				if( picker.focus() === `${htmlId}-colour` ){
					picker.focus(false);
				}
				else {
					picker.focus(`${htmlId}-colour`);
					picker.post(['color', input.value]);
					picker.post(['return', toReturn])
				}
			});

			if( subQualifier && subQualifier.includes('strip_alpha') ){
				swatch.classList.add('entry__colour--strip-alpha')
				let icon = document.createElement('small');
				icon.className = 'entry__info';
				icon.innerHTML = `
					<i class="fa-solid fa-ban"></i>
					Alpha
				`;
				inputRow.appendChild(icon);
				icon.addEventListener('mouseenter', () => {
					info.text('This option does not support transparency. Changing it will have no effect.');
					info.show(icon, 'left');
				});
				icon.addEventListener('mouseleave', info.hide);
			}
		}

		// Range Options

		else if( type === 'range' ){
			input.classList.add('input--small');
			input.type = 'number';
			input.addEventListener('input', () => {
				range.value = input.value;
			});
			input.placeholder = '#';
			
			let range = document.createElement('input');
			range.type = 'range';
			range.id = `${htmlId}-range`;
			range.className = 'range';
			range.setAttribute('value', entryData.default);
			range.addEventListener('input', () => {
				input.value = range.value;
				updateOption(entryId, {'parentModId': parentId});
				updateCss();
			});

			inputRow.appendChild(range);
			input.setAttribute('min', entryData.min);
			range.setAttribute('min', entryData.min);
			input.setAttribute('max', entryData.max);
			range.setAttribute('max', entryData.max);
			input.setAttribute('step', entryData.step);
			range.setAttribute('step', entryData.step);
		}

		// Toggle Options

		else if( type === 'toggle' ){
			input.type = 'checkbox';
			input.id = htmlId;
			input.className = 'o-hidden';
			headRight.innerHTML = `
				<label class="toggle" for="${htmlId}"></label>
			`;
		}

		// Select Options

		else if( type === 'select' ){
			input = document.createElement('select');
			input.className = 'select entry__select';

			// Add selections
			for( let [selectKey, selectData] of Object.entries(entryData.selections) ){
				let selectOption = document.createElement('option');
				selectOption.value = selectKey;
				selectOption.textContent = selectData.label;
				if( selectKey === entryData.default ){
					selectOption.selected = true;
				}
				input.append(selectOption);
			}
		}

		// Add functionality to all the options & finalise type-specific features

		if( type === 'toggle' && entryData.default == true ){
			input.setAttribute('checked', 'checked');
		}
		else if( !(type === 'toggle') ){
			input.setAttribute('value', entryData.default);
		}

		input.addEventListener('input', () => {
			updateOption(entryId, {'parentModId': parentId});
			updateCss();
		});

		input.id = htmlId;
		if( type === 'toggle' ){
			headRight.prepend(input);
		}
		else {
			inputRow.appendChild(input);
		}

		// Add reset button

		if( type !== 'select' && type !== 'toggle' ){
			let reset = document.createElement('button');
			reset.type = 'button';
			reset.className = 'button entry__reset has-info';
			reset.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
			inputRow.appendChild(reset);
			
			reset.addEventListener('click', () => {
				let resetVal = input.getAttribute('value');
				input.value = resetVal;
				input.dispatchEvent(new Event('input'));
				if( type === 'color' ){
					swatch.style.backgroundColor = resetVal;
					if( picker.focus() === htmlId ){
						picker.post(['color', resetVal]);
					}
				}
			});
			reset.addEventListener('mouseenter', () => {
				info.text('Reset this option to default.');
				info.show(reset, 'top');
			});
			reset.addEventListener('mouseleave', info.hide);
		}

		// Add notice

		let notice = document.createElement('p');
		notice.id = `${htmlId}-notice`;
		notice.className = 'info-box info-box--indented info-box--error o-hidden';
		div.appendChild(notice);
	}

	else if( entryType === 'mod' ){
		div.classList.add('is-mod');

		let htmlId = `mod:${entryId}`;

		headLeft.classList.add('entry__name--emphasised');

		// Basic Mod HTML & Functions

		div.id = `mod-parent:${entryId}`;
		
		desc.append(BB.strip(entryData.description));

		if( entryData.url ){
			let link = document.createElement('a');
			link.className = 'entry__external-link js-info';
			link.addEventListener('mouseenter', () => {
				info.text('This mod has linked an external resource or guide for you to install. Unless otherwise instructed, these should be installed <b>after</b> you install the main theme.');
				info.show(link);
			});
			link.addEventListener('mouseleave', info.hide);
			link.href = entryData.url;
			link.target = "_blank";
			link.innerHTML = `
				<i class="entry__external-link-icon fa-solid fa-arrow-up-right-from-square"></i>
			`;
			headRight.appendChild(link);
		}
		else if( entryData.css || entryData.options && Object.keys(entryData.options).length > 0 ){
			let toggle = document.createElement('input');
			toggle.type = 'checkbox';
			toggle.id = htmlId;
			toggle.className = 'o-hidden';
			headRight.innerHTML = `
				<label class="toggle" for="${htmlId}"></label>
			`;
			toggle.addEventListener('change', () => {
				updateMod(entryId);
				updateCss();
			});
			headRight.prepend(toggle);
		}

		// Mod Flags

		if( entryData.flags?.includes('hidden') ){
			div.classList.add('o-hidden');
			// skips tags on hidden items to prevent weird item counts on the GUI
			delete entryData.tags;
		}

		// Add mod tag to list of tags
		if( entryData.tags ){
			for( let [category, categoryTags] of Object.entries(entryData.tags) ){
				for( let tag of categoryTags ){
					pushFilter(entryId, tag, category);
				}
			}
		}

		// Mod Options

		if( entryData.options ){
			let detailsLink = document.createElement('a');
			detailsLink.className = 'hyperlink entry__details js-info';
			detailsLink.textContent = 'Details »';
			detailsLink.addEventListener('click', ()=>{viewMod(entryId);});
			div.append(detailsLink);
		}
	}

	// Return rendered HTML
	return div;
}

// Tutorial for new users. Activated upon page load.
function startThemeTutorial( ){
	let popup = new InfoPopup;
	let sidebar = document.getElementById('js-sidebar');
	let options = document.getElementById('js-options');
	let mods = document.getElementById('js-mods');

	let steps = [
		() => {
			popup.text('You can preview the theme, including any options you change, in the window on the right.<br/><br/>To give yourself some more space, click the arrow to minimise the sidebar.');
			let target = document.getElementById('js-toggle-drawer');
			popup.show(target, 'left');
			tutorial.highlightElement(target);
		},
		() => {
			let targets = [
				document.querySelector('#js-copy-output'),
				document.querySelector('.js-installation-btn')
			];
			sidebar.scrollTo( {'left': 0, 'top': sidebar.scrollHeight, 'behaviour': 'instant'} );
			popup.text(`Once you're ready, you can copy the customised CSS for use on MyAnimeList. A full install guide is located under "${targets[1].textContent}"`);
			popup.show(targets[1], 'left');
			tutorial.highlightElement(...targets);
		},
		() => {
			sidebar.scrollTo( {'left': 0, 'top': 0, 'behaviour': 'instant'} );
			popup.text('Want to share your configuration or import your previous one? Use the Import and Export buttons at the top.');
			let targets = [
				document.querySelector('.js-tutorial-import'),
				document.querySelector('.js-tutorial-export')
			];
			popup.show(targets[0], 'top');
			tutorial.highlightElement(...targets);
		},
		() => {
			popup.text('Have fun customising!');
			popup.show([document.scrollingElement.scrollWidth/2, document.scrollingElement.scrollHeight/2], 'none');
		},
		() => { popup.destruct() }
	];

	if( options || mods ){
		steps.unshift(() => {
			sidebar.scrollTo( {'left': 0, 'top': 0, 'behaviour': 'instant'} );
			let targets = options && mods ? [options,mods] : options ? [options] : [mods];
			tutorial.highlightElement(...targets);
			popup.text(`To customise the theme, use the available options and/or mods in the sidebar. Toggle them using the sliders or change their values with the input fields.`);
			popup.show(options || mods, 'left');
		},
		() => {
			sidebar.scrollTo( {'left': 0, 'top': sidebar.scrollHeight, 'behaviour': 'instant'} );
			popup.text(`If at any point you want to start over, just hit the reset button.`);
			let target = document.querySelector('.js-tutorial-reset');
			popup.show(target, 'left');
			tutorial.highlightElement(target);
		});
	}

	let help = document.querySelector('nav .js-help:not(.o-hidden)');
	if( help ){
		steps.splice(steps.length-2, 0, ()=>{
			popup.text('Need extra help with the theme? Check the Theme Help link for an author-provided resource.');
			popup.show(help, 'top');
			tutorial.highlightElement(help);
		});
	}

	let sponsor = document.querySelector('#js-sponsor:not(.o-hidden)');
	if( sponsor ){
		steps.splice(steps.length-2, 0, ()=>{
			popup.text('Loved this author\'s work? Visit their page to see how you can support them.'); popup.show(sponsor, 'top');
			tutorial.highlightElement(sponsor);
		});
	}

	let tutorial = new Tutorial('your first theme', steps);
	tutorial.start();
}