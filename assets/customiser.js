// ================
// COMMON FUNCTIONS
// ================

function confirm(msg, options = {'Yes': {'value': true, 'type': 'suggested'}, 'No': {'value': false}}) {
	return new Promise((resolve, reject) => {
		let modal = document.createElement('div'),
			modalInner = document.createElement('div'),
			modalExit = document.createElement('div'),
			modalContent = document.createElement('div'),
			header = document.createElement('h4'),
			blurb = document.createElement('p');

		modal.className = 'popup';
		modal.id = 'js-confirmation';
		modalInner.className = 'popup__inner';
		modalContent.className = 'popup__content popup__content--narrow';
		modalExit.className = 'popup__invisibutton';
		modalExit.onclick = 'togglEle("#js-confirmation")';
		modal.appendChild(modalInner);
		modalInner.appendChild(modalExit);
		modalInner.appendChild(modalContent);

		header.className = 'popup__header';
		header.textContent = 'Confirm action.';
		blurb.className = 'popup__paragraph';
		blurb.textContent = msg;
		modalContent.appendChild(header);
		modalContent.appendChild(blurb);

		// Add buttons

		function complete(returnValue) {
			resolve(returnValue);
			modal.remove();
		}

		for(let [label, details] of Object.entries(options)) {
			let btn = document.createElement('button');
			btn.className = 'button';
			if('type' in details) {
				if(details['type'] === 'suggested') {
					btn.classList.add('button--highlighted');
				} else if(details['type'] === 'danger') {
					btn.classList.add('button--danger');
				}
			}
			btn.textContent = label;
			btn.addEventListener('click', ()=>{complete(details['value'])});
			modalContent.appendChild(btn);
		}

		modalExit.addEventListener('click', ()=>{complete(false)});

		document.body.appendChild(modal);
	});
}

function splitSlide() {
	let slider = document.getElementById('js-toggle-drawer'),
		sidebar = document.getElementById('js-sidebar');

	slider.classList.toggle('is-active');
	sidebar.classList.toggle('is-aside');
}

function createBB(text) {
	// Sanitise input from HTML characters

	let dummy = document.createElement('div');
	dummy.textContent = text;
	text = dummy.innerHTML;

	// Functions to convert BB text to HTML
	// Each function gets passed a fullmatch and respective capture group arguments from the regexes

	function bold(fullmatch, captureGroup) {
		return '<b class="bb-bold">'+captureGroup+'</b>';
	}

	function italic(fullmatch, captureGroup) {
		return '<i class="bb-italic">'+captureGroup+'</i>';
	}

	function underline(fullmatch, captureGroup) {
		return '<span style="text-decoration:underline;" class="bb-underline">'+captureGroup+'</span>';
	}

	function strike(fullmatch, captureGroup) {
		return '<span style="text-decoration:line-through;" class="bb-strike">'+captureGroup+'</span>';
	}
    
	function link(fullmatch, captureGroup1, captureGroup2) {
		return '<a href="'+captureGroup1.substr(1)+'" target="_blank" class="hyperlink">'+captureGroup2+'</a>';
	}

	function list(fullmatch, captureGroup1, captureGroup2) {
		let contents = captureGroup2.replaceAll('[*]', '</li><li class="bb-list-item">');
		contents = contents.replace(/l>.*?<\/li>/, 'l>');
		
		let ol = '<ol class="bb-list bb-list--ordered">'+contents+'</li></ol>',
			ul = '<ul class="bb-list">'+contents+'</li></ul>';

		if(typeof captureGroup1 !== 'undefined') {
			if(captureGroup1 === '=0' || captureGroup1 === '') {
				return ul;
			}
			else if(captureGroup1 === '=1' || captureGroup1 === '') {
				return ol;
			}
		}
		return ul;
	}

	// BB Tags Array Sets. Each array contains:
	// - a regex to find matches
	// - a string or function reference to handle the conversion of that match from text to HTML
	let bbTags = [
		[/\n/ig, '<br>'],
		[/\[b\]((?:(?!\[b\]).)*?)\[\/b\]/ig, bold],
		[/\[i\]((?:(?!\[i\]).)*?)\[\/i\]/ig, italic],
		[/\[u\]((?:(?!\[u\]).)*?)\[\/u\]/ig, underline],
		[/\[s\]((?:(?!\[s\]).)*?)\[\/s\]/ig, strike],
		[/\[url(=.*?)\]((?:(?!\[url\]).)*?)\[\/url\]/ig, link],
		[/\[list(=.*?){0,1}\]((?:(?!\[list\]).)*?)\[\/list\]/ig, list]
	];

	// Convert BBCode using patterns defined above.
	for (let bb of bbTags) {
		text = text.replaceAll(bb[0], bb[1]);
	}

	// Create HTML & return
	let parent = document.createElement('p');
	parent.classList.add('bb');
	parent.innerHTML = text;
	return parent;
}

// Takes CSS values from the JSON, checks to see if they are URLs or actual CSS, and proceeds accordingly.
function returnCss(resource) {
	return new Promise((resolve, reject) => {
		if(resource.startsWith('http')) {
			fetchFile(resource)
				.then((response) => {
					resolve(response);
				})
				.catch((response) => {
					reject(response);
				})
		}
		else {
			resolve(resource);
		}
	});
}

// If funcConfig['forceValue'] is set then the mod will be updated to match this value. If not, the value will be read from the HTML
// Accepted values for funcConfig:
// 'defaultValue' // Default none
// 'parentModId' // Default none
// 'skipUpdateCss' // Default off/false
// 'forceValue' // Default none
function updateOption(optId, funcConfig = {}) {
	try {
		// set values and default value
		let fullId = funcConfig['parentModId'] ? `mod:${funcConfig['parentModId']}:${optId}` : `opt:${optId}`,
			input = document.getElementById(fullId),
			val = funcConfig['forceValue'];

		if(val === undefined) {
			if(input.type === 'checkbox') {
				val = input.checked;
			} else {
				val = input.value;
			}
		}

		// Add to userSettings unless matches default value
		if(val === funcConfig['defaultValue']) {
			if(funcConfig['parentModId']) {
				delete userSettings['mods'][funcConfig['parentModId']][optId];
			} else {
				delete userSettings['options'][optId];
			}
		}
		else {
			// Update HTML if necessary
			if(funcConfig['forceValue'] !== undefined) {
				if(input.type === 'checkbox') {
					input.checked = val;
				} else {
					input.value = val;
				}
			}

			if(funcConfig['parentModId']) {
				userSettings['mods'][funcConfig['parentModId']][optId] = val;
			} else {
				userSettings['options'][optId] = val;
			}
		}

		if(funcConfig['skipUpdateCss'] !== true) {
			updateCss();
		}
		return true;
	}
	catch(e) {
		console.log(`[updateMod] Unexpected error: ${e}`);
		return false;
	}
}

// If funcConfig['forceValue'] is set then the mod will be updated to match this value. If not, the value will be read from the HTML
// Accepted values for funcConfig:
// 'skipUpdateCss' // Default off/false
// 'skipOptions' // Default off/false
// 'forceValue' // Default none
function updateMod(id, funcConfig = {}) {
	try {
		let toggle = document.getElementById(`mod:${id}`),
			val = toggle.checked,
			mod = theme['mods'][id];

		if(funcConfig['forceValue'] !== undefined) {
			val = funcConfig['forceValue'];
		}

		// Enable required mods
		if('requires' in mod) {
			for(let requirement of mod['requires']) {
				if(requirement in theme['mods']) {
					if(val) {
						userSettings['mods'][requirement] = val;
					} else {
						delete userSettings['mods'][requirement];
					}

					// todo: do this using js classes or something that won't fall apart the moment you change the DOM
					let check = document.getElementById(`mod:${requirement}`),
						requiredToggle = check.nextElementSibling,
						requiredToggleInfo = requiredToggle.firstElementChild;
					
					check.disabled = val;
					check.checked = val;

					if(val) {
						requiredToggle.classList.add('is-forced', 'has-info');
						requiredToggleInfo.textContent = 'This must be enabled for other options to work.';
					} else {
						requiredToggle.classList.remove('is-forced', 'has-info');
					}
				}
				else {
					messenger.warn(`Failed to set "${requirement}" requirement of mod "${id}". This usually indicates a problem with the theme JSON. Does the mod "${requirement}" exist?`);
				}
			}
		}
		
		// Disable incompatible mods
		if('conflicts' in mod) {
			for(let conflict of mod['conflicts']) {
				if(conflict in theme['mods']) {
					// todo: do this using js classes or something that won't fall apart the moment you change the DOM
					let check = document.getElementById(`mod:${conflict}`),
						conflictToggle = check.nextElementSibling,
						conflictToggleInfo = conflictToggle.firstElementChild;

					check.disabled = val;

					if(val) {
						conflictToggle.classList.add('is-disabled', 'has-info');
						conflictToggleInfo.textContent = `This mod is incompatible with one of your choices. To use, disable "${mod['name']}".`;
					} else {
						conflictToggle.classList.remove('is-disabled', 'has-info');
					}
				}
				else {
					messenger.warn(`Failed to set the "${conflict}" conflict of mod "${id}". This usually indicates a problem with the theme JSON. Does the mod "${conflict}" exist?`);
				}
			}
		}

		// Add some CSS style rules
		if(val === true) {
			document.getElementById(`mod-parent:${id}`).classList.add('is-enabled');
		} else {
			document.getElementById(`mod-parent:${id}`).classList.remove('is-enabled');
		}

		// Add to userSettings unless matches default value (i.e disabled)
		if(val === false) {
			delete userSettings['mods'][id];
		}
		else {
			// Update HTML if necessary
			if(funcConfig['forceValue'] !== undefined) {
				toggle.checked = val;
			}

			userSettings['mods'][id] = {};

			// Update options if it has any before calling CSS
			if('options' in mod && !funcConfig['skipOptions']) {
				for(let [optId, opt] of Object.entries(mod['options'])) {
					if(opt['default'] === undefined && opt['type'] === 'toggle') {
						opt['default'] = false;
					} else if(opt['default'] === undefined) {
						opt['default'] = '';
					}
					updateOption(optId, {'defaultValue': opt['default'], 'parentModId': id, 'skipUpdateCss': true});
				}
			}
		}

		if(funcConfig['skipUpdateCss'] !== true) {
			updateCss();
		}
		return true;
	}
	catch(e) {
		console.log(`[updateMod] Unexpected error: ${e}`);
		return false;
	}
}

function applySettings(settings = false) {
	if(settings) {
		let tempTheme = userSettings['theme'],
			tempData = userSettings['data'];
		userSettings['mods'] = settings['mods'];
		userSettings['options'] = settings['options'];
		userSettings['theme'] = tempTheme;
		userSettings['data'] = tempData;
	}
	
	// update HTML to match new options
	let errors = [];
	for(let [optId, val] of Object.entries(userSettings['options'])) {
		if(!updateOption(optId, {'skipUpdateCss': true, 'forceValue': val})) {
			delete userSettings['options'][optId];
			errors.push(`opt:<b>${optId}</b>`);
		}
	}
	for(let [modId, modOpts] of Object.entries(userSettings['mods'])) {
		if(!updateMod(modId, {'skipUpdateCss': true, 'forceValue': true, 'skipOptions': true})) {
			delete userSettings['mods'][modId];
			errors.push(`mod:<b>${modId}</b>`);
			continue;
		}
		
		for(let [optId, optVal] of Object.entries(modOpts)) {
			if(!updateOption(optId, {'parentModId': modId, 'skipUpdateCss': true, 'forceValue': optVal})) {
				delete userSettings['mods'][modId][optId];
				errors.push(`opt:<b>${optId}</b><i> of mod:${modId}</i>`);
			}
		}
	}

	// Report errors
	if(errors.length > 0) {
		console.log(`Could not import settings for some mods or options: ${errors.join(', ').replaceAll(/<.*?>/g,'')}. Did the JSON change since this theme was customised?`);
		messenger.error(`Could not import settings for some mods or options. The skipped items were:<br />• ${errors.join('<br />• ')}.`);
	}

	updateCss();
}

async function updateCss() {
	let storageString = {'date': Date.now(), 'settings': userSettings};
	localStorage.setItem(`theme:${userSettings['data']}`, JSON.stringify(storageString));

	let newCss = baseCss;
		
	function findAndReplace(str, toFind, toInsert) {
		if(toFind.startsWith('RegExp')) {
			toFind = new RegExp(toFind.substr(7), 'g');
		}
		
		return str.replaceAll(toFind, toInsert);
	}
	
	async function applyOptionToCss(css, optData, insert) {
		let type = optData['type'],
			qualifier = optData['type'].split('/')[1];

		if(qualifier === 'content') {
			// formats text to be valid for CSS content statements
			insert = '"' + insert.replaceAll('\\','\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\a ') + '"';
		}
		else if(qualifier === 'image_url') {
			if(insert === '' || insert === 'none') {
				insert = 'none';
			} else {
				insert = `url(${insert})`;
			}
		}
		
		if(type === 'toggle') {
			for(let set of optData['replacements']) {
				// Choose the correct replacement set based on whether the toggle is on or off
				let toFind = set[0],
					toInsert = (insert === true) ? set[2] : set[1];
				
				toInsert = await returnCss(toInsert);

				css = findAndReplace(css, toFind, toInsert);
			}
		}
		else if(type === 'select') {
			let replacements = optData['selections'][insert]['replacements'];
			for(let set of replacements) {
				let toFind = set[0],
					toInsert = set[1];
				
				toInsert = await returnCss(toInsert);

				css = findAndReplace(css, toFind, toInsert);
			}
		}
		else {
			for(let set of optData['replacements']) {
				let toFind = set[0],
					toInsert = set[1];

				toInsert = await returnCss(toInsert);
				toInsert = toInsert.replaceAll('{{{insert}}}', toInsert);

				css = findAndReplace(css, toFind, toInsert);
			}
		}

		return css;
	}

	// Options
	for(let [id, val] of Object.entries(userSettings['options'])) {
		newCss = await applyOptionToCss(newCss, theme['options'][id], val);
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
	
	if('mods' in theme && Object.keys(userSettings['mods']).length > 0) {
		for(let id of Object.keys(userSettings['mods'])) {
			let modData = theme['mods'][id];
			if(!('css' in modData) || typeof modData['css'] === 'string') {
				modData['css'] = {'bottom': ''}
			}
			for(let [location, resource] of Object.entries(modData['css'])) {
				try {
					var modCss = await returnCss(resource);
				} catch (failure) {
					console.log(`[updateCss] Failed during mod ${id} returnCss: ${failure}`);
					messenger.error(`Failed to return CSS for mod "${id}". Try waiting 30s then disabling and re-enabling the mod. If this continues to happen, check with the author if the listed resource still exists.`, failure[1] ? failure[1] : 'returnCss');
				}

				let globalOpts = [];
				for(let [optId, val] of Object.entries(userSettings['mods'][id])) {
					let optData = modData['options'][optId];
					if('flags' in optData && optData['flags'].includes('global')) {
						globalOpts.push([optData, val]);
					} else {
						modCss = await applyOptionToCss(modCss, optData, val);
					}
				}

				extendCss(modCss, location);

				for(let opt of globalOpts) {
					newCss = await applyOptionToCss(newCss, ...opt);
				}
			}
		}
		pushCss(newCss);
	}
	else {
		pushCss(newCss);
	}

	function pushCss(css) {
		// Encode options & sanitise any CSS character
		let settingsStr = JSON.stringify(userSettings).replaceAll('*/','*\\/').replaceAll('/*','\\/*');
		// Update export textareas
		document.getElementById('js-export-code').textContent = settingsStr;
		// Place options at top
		let cssWithSettings = '/* Theme Customiser Settings\nhttps://github.com/ValerioLyndon/Theme-Customiser\n^TC' + settingsStr + 'TC$*/\n\n' + css;

		// Add settings if there is room and add over-length notice if necessary
		let notice = document.getElementById('js-output-notice');
		if(css.length < 65535 && cssWithSettings.length > 65535) {
			let spare = 65535 - css.length;
			notice.innerHTML = `This configuration is close to exceeding MyAnimeList's maximum CSS length. The customiser settings area has been removed to make space and you now have ${spare} characters remaining. If you need help bypassing the limit, see <a class="hyperlink" href="https://myanimelist.net/forum/?topicid=1911384" target="_blank">this guide</a>.`;
			notice.classList.add('info-box--warn');
			notice.classList.remove('o-hidden', 'info-box--error');
		}
		else if(css.length > 65535) {
			let excess = css.length - 65535;
			notice.innerHTML = `This configuration exceeds MyAnimeList's maximum CSS length by ${excess} characters. You will need to <a class="hyperlink" href="https://www.toptal.com/developers/cssminifier" target="_blank">shorten this code</a> or <a class="hyperlink" href="https://myanimelist.net/forum/?topicid=1911384" target="_blank">host it on an external site to bypass the limit</a>.`;
			notice.classList.add('info-box--error');
			notice.classList.remove('o-hidden', 'info-box--warn');
		} else {
			notice.classList.add('o-hidden');
			css = cssWithSettings;
		}

		// Update code textarea
		document.getElementById('js-output').textContent = css;

		// Update iframe
		postToIframe(['css', css]);
	}
}

function validateInput(fullid, type) {
	let notice = document.getElementById(`${fullid}-notice`),
		noticeHTML = '',
		val = document.getElementById(`${fullid}`).value.toLowerCase(),
		problems = 0,
		qualifier = type.split('/')[1],
		subQualifier = type.split('/')[2];
	
	if(val.length === 0) {
		notice.classList.add('o-hidden');
		return undefined;
	}

	if(qualifier === 'image_url') {
		// Consider replacing this with a script that simply loads the image and tests if it loads. Since we're already doing that with the preview anyway it shouldn't be a problem.
		noticeHTML = 'We detected some warnings. If your image does not display, fix these issues and try again.<ul class="info-box__list">';

		function problem(text) {
			problems += 1;
			noticeHTML += `<li class="info-box__list-item">${text}</li>`;
		}

		if(val !== 'none' && val.length > 0) {
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
		}
		
	}

	else if(type === 'color') {
		this.style.color = '';
		this.style.color = val;
		if(this.style.color.length === 0) {
			problems += 1;
			noticeHTML = 'Your colour appears to be invalid. For help creating valid CSS colours, see <a class="hyperlink" href="https://css-tricks.com/almanac/properties/c/color/">this guide</a>.';
		} else {
			this.style.backgroundColor = val;
		}
	}

	else if(qualifier === 'size') {
		let units = ['px','%','em','rem','vh','vmax','vmin','vw','ch','cm','mm','Q','in','pc','pt','ex']
		problems += 1;
		for(let unit of units) {
			if(val.endsWith(unit)) {
				problems -= 1;
			}
		}
		if(val.startsWith('calc(') && val.endsWith(')')) {
			problems = 0;
		}
		if(problems > 0) {
			noticeHTML = 'Did not detect a length unit. All CSS sizes must end in a length unit such as "px", "%", "vw", or otherwise. For help creating valid CSS colours, see <a class="hyperlink" href="https://css-tricks.com/the-lengths-of-css/">this guide</a>.';
		}
	}
	
	if(problems > 0) {
		notice.innerHTML = noticeHTML;
		notice.classList.remove('o-hidden');
		return false;
	} else {
		notice.classList.add('o-hidden');
		return true;
	}
}

function resetSettings() {
	confirm('Wipe your currently selected settings and start from scratch?', {'Yes': {'value': true, 'type': 'danger'}, 'No': {'value': false}})
	.then((choice) => {
		if(choice) {
			userSettings['options'] = {};
			userSettings['mods'] = {};
			applySettings(userSettings);
			messenger.timeout('Settings reset to default.');
		}
	});
}

function clearCache() {
	confirm('Clear all cached data? This can be useful if the customiser is pulling out-of-date CSS or something seems broken, but normally this should never be needed.', {'Yes': {'value': true, 'type': 'danger'}, 'No': {'value': false}})
	.then((choice) => {
		if(choice) {
			sessionStorage.clear();
			localStorage.removeItem('tcImport');
			messenger.timeout('Cache cleared.');
			confirm('Cache cleared! Reload the current page? This will load the customiser with a fresh slate.')
			.then((choice) => {
				if(choice) {
					location.reload();
				}
			});
		}
	});
}



// ONE-TIME FUNCTIONS

// Setup basic options structure and add event listeners
function renderHtml() {
	loader.text('Rendering page...');

	// options & mods
	document.getElementById('js-title').textContent = theme['name'] ? theme['name'] : 'Untitled';
	document.getElementById('js-author').textContent = theme['author'] ? theme['author'] : 'Unknown Author';
	let credit = document.getElementById('js-theme-credit');
	if('author' in theme && theme['author']) {
		credit.textContent = `Customising "${theme['name']}" by ${theme['author']}`;
	} else {
		credit.textContent = `Customising "${theme['name']}"`;
	}

	if('flags' in theme) {
		let themeTag = document.getElementById('js-theme-tag');
		if(theme['flags'].includes('beta')) {
			themeTag.textContent = 'BETA';
			themeTag.classList.remove('o-hidden');
		}
		else if(theme['flags'].includes('alpha')) {
			themeTag.textContent = 'ALPHA';
			themeTag.classList.remove('o-hidden');
		}
	}

	var optionsEle = document.getElementById('js-options');

	function generateOptionHtml(dictionary, parentModId) {

		let optId = dictionary[0],
			opt = dictionary[1],
			fullId = `opt:${optId}`;
		
		if(parentModId) {
			fullId = `mod:${parentModId}:${optId}`;
		}
			
		if(!('type' in opt)) {
			return `Option must have a "type" key.`;
		}

		let div = document.createElement('div'),
			head = document.createElement('div'),
			headLeft = document.createElement('b'),
			headRight = document.createElement('div'),
			expando = document.createElement('div'),
			desc = document.createElement('div'),
			notice = document.createElement('p'),
			link = document.createElement('a');

		if(opt['default'] === undefined && opt['type'] === 'toggle') {
			opt['default'] = false;
		} else if(opt['default'] === undefined) {
			opt['default'] = '';
		}

		div.className = 'entry has-help';
		head.className = 'entry__head';
		headLeft.textContent = opt['name'] ? opt['name'] : 'Untitled';
		headLeft.className = 'entry__name';
		headRight.className = 'entry__action-box';
		head.appendChild(headLeft);
		head.appendChild(headRight);
		div.appendChild(head);

		expando.className = 'expando js-expando';
		expando.setAttribute('data-expando-limit', "100");
		expando.innerHTML = '<button class="expando__button expando__button--subtle js-expando-button">Expand</button>';
		desc.className = 'entry__desc';
		expando.appendChild(desc);
		if('description' in opt) {
			desc.appendChild(createBB(opt['description']));
			div.appendChild(expando);
		}

		link.className = 'entry__help hyperlink';
		link.target = "_blank";
		head.appendChild(link);

		let split = opt['type'].split('/'),
			baseType = split[0],
			qualifier = split[1],
			subQualifier = split[2];
		
		if('help' in opt) {
			div.classList.add('has-help');
		}

		if(baseType === 'text' || opt['type'] === 'color') {
			if(!('replacements' in opt)) {
				return 'Option must contain a "replacements" key.';
			}

			let input = document.createElement('input');
			input.id = fullId;
			input.type = 'text';
			input.value = opt['default'];
			input.className = 'input';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			if(qualifier === 'value' && subQualifier) {
				input.placeholder = 'Your value here.';
				
				let property = opt['type'].split('/')[2];

				link.textContent = 'Valid Inputs';
				link.href = `https://developer.mozilla.org/en-US/docs/Web/CSS/${property}#values`
			}
			else if(opt['type'] === 'color') {
				input.placeholder = 'Your colour here. e.x rgba(0, 135, 255, 1.0)';

				let display = document.createElement('div');
				display.className = 'entry__colour';

				div.appendChild(display);

				link.textContent = 'Colour Picker';
				link.href = 'https://mdn.github.io/css-examples/tools/color-picker/';

				input.addEventListener('input', validateInput.bind(display, fullId, opt['type']));
			}
			else if(qualifier === 'size') {
				input.placeholder = 'Your size here. e.x 200px, 33%, 20vw, etc.';

				input.addEventListener('input', () => { validateInput(fullId, opt['type']) });
			}
			else if(qualifier === 'image_url') {
				input.type = 'url';
				input.placeholder = 'https://example.com/image.jpg';
				div.appendChild(input);

				link.textContent = 'Image Tips';
				link.href = 'https://github.com/ValerioLyndon/MAL-Public-List-Designs/wiki/Image-Hosting-Tips';

				input.addEventListener('input', () => { validateInput(fullId, opt['type']); });
			}

			input.addEventListener('input', () => {
				updateOption(optId, {'defaultValue': opt['default'], 'parentModId': parentModId});
			});
		}


		else if(baseType === 'textarea') {
			if(!('replacements' in opt)) {
				return 'Option must contain a "replacements" key.';
			}

			let input = document.createElement('textarea');
			input.id = fullId;
			input.value = opt['default'];
			input.className = 'entry__textarea input input--textarea';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOption(optId, {'defaultValue': opt['default'], 'parentModId': parentModId}); });
		}

		else if(baseType === 'toggle') {
			if(!('replacements' in opt)) {
				return 'Option must contain a "replacements" key.';
			}

			let toggle = document.createElement('input');
			toggle.type = 'checkbox';
			toggle.id = fullId;
			toggle.className = 'o-hidden';
			if('default' in opt && opt['default'] == true) {
				toggle.checked = true;
			}
			headRight.innerHTML = `
				<label class="toggle info-popup" for="${fullId}">
					<div class="info-popup__box"></div>
				</label>
			`;
			headRight.prepend(toggle);

			toggle.addEventListener('input', () => { updateOption(optId, {'defaultValue': opt['default'], 'parentModId': parentModId}); });
		}

		else if(baseType === 'select') {
			if(!('selections' in opt)) {
				return 'Option must contain a "replacements" key.';
			}

			let select = document.createElement('select');

			// would be nice to have a simpler/nicer to look at switch for small lists but would require using radio buttons.
			select.className = 'entry__select';
			select.id = fullId;
			for(let [selectKey, selectData] of Object.entries(opt['selections'])) {
				let selectOption = document.createElement('option');
				selectOption.value = selectKey;
				selectOption.textContent = selectData['label'];
				if(selectKey === opt['default']) {
					selectOption.selected = true;
				}
				select.append(selectOption);
			}
			div.append(select);

			select.addEventListener('input', () => { updateOption(optId, {'defaultValue': opt['default'], 'parentModId': parentModId}); });
		}

		notice.id = `${fullId}-notice`;
		notice.className = 'info-box info-box--indented info-box--error o-hidden';
		div.appendChild(notice);

		return div;
	}

	if('options' in theme) {
		for(let opt of Object.entries(theme['options'])) {
			let ele = generateOptionHtml(opt);
			if(typeof ele === 'string') {
				console.log(`[generateOptionHtml] Skipped option "${opt[0]}": ${ele}`);
			} else {
				optionsEle.appendChild(ele);
			}
		}
	} else {
		optionsEle.parentNode.remove();
	}

	var modsEle = document.getElementById('js-mods'),
		modTags = {};

	if('mods' in theme) {
		for (const [modId, mod] of Object.entries(theme['mods'])) {

			let div = document.createElement('div'),
				head = document.createElement('div'),
				headLeft = document.createElement('b'),
				headRight = document.createElement('div'),
				expando = document.createElement('div'),
				desc = document.createElement('div');

			if('css' in mod) {
				headRight.innerHTML = `
					<input id="mod:${modId}" type="checkbox" class="o-hidden" />
					<label class="toggle info-popup" for="mod:${modId}">
						<div class="info-popup__box"></div>
					</label>
				`;
			} else if('url' in mod) {
				let link = document.createElement('a');
				link.className = 'entry__external-link info-popup info-popup--activated-on-hover';
				link.href = mod['url'];
				link.target = "_blank";
				link.innerHTML = `
					<i class="entry__external-link-icon fa-solid fa-arrow-up-right-from-square"></i>
					<div class="info-popup__box">
						This mod has linked an external resource or guide for you to install. Unless otherwise instructed, these should be installed <b>after</b> you install the main theme.
					</div>
				`;
				headRight.appendChild(link);
			}

			div.className = 'entry';
			div.id = `mod-parent:${modId}`;
			head.className = 'entry__head';
			headLeft.textContent = mod['name'] ? mod['name'] : 'Untitled';
			headLeft.className = 'entry__name entry__name--emphasised';
			headRight.className = 'entry__action-box';
			head.appendChild(headLeft);
			head.appendChild(headRight);
			div.appendChild(head);

			expando.className = 'expando js-expando';
			expando.setAttribute('data-expando-limit', "100");
			expando.innerHTML = '<button class="expando__button expando__button--subtle js-expando-button">Expand</button>';
			if('description' in mod) {
				desc.appendChild(createBB(mod['description']));
			}
			desc.className = 'entry__desc';
			expando.appendChild(desc);
			div.appendChild(expando);

			if('options' in mod) {
				let optDiv = document.createElement('div');
				optDiv.className = 'entry__options';

				for(let opt of Object.entries(mod['options'])) {
					let ele = generateOptionHtml(opt, modId);
					if(typeof ele === 'string') {
						console.log(`[generateOptionHtml] Skipped option "${opt[0]}" of mod "${modId}": ${ele}`);
					} else {
						optDiv.appendChild(ele);
					}
				}

				div.appendChild(optDiv);
			}

			if('flags' in mod && mod['flags'].includes('hidden')) {
				div.classList.add('o-hidden');
				// skips tags on hidden items to prevent weird item counts on the GUI
				delete mod['tags'];
			}

			modsEle.appendChild(div);

			if('css' in mod) {
				document.getElementById(`mod:${modId}`).addEventListener('change', () => { updateMod(modId); });
			}

			// Add mod tag to list of tags
			if('tags' in mod) {
				for(let tag of mod['tags']) {
					if(modTags[tag]) {
						modTags[tag].push(modId);
					} else {
						modTags[tag] = [modId];
					}
				}
			}
		}
	} else {
		modsEle.parentNode.remove();
	}

	// Add tag links

	// Add mod tag to list of tags
	if(Object.entries(modTags).length > 0 && Object.entries(theme['mods']).length > 3) {
		renderTags(modTags, Object.keys(theme['mods']), 'mod-parent:ID');
	}

	// Back link
	if(collectionUrls.length > 0) {
		let back = document.getElementById('js-back');
		back.classList.remove('o-hidden');
		back.href = `./?c=${collectionUrls.join('&c=')}`;
	}

	// Sponsor Link
	if('sponsor' in theme) {
		let sponsor = document.getElementById('js-sponsor');
		sponsor.classList.remove('o-hidden');
		sponsor.href = theme['sponsor'];
	}

	// Help links
	if('help' in theme) {
		if(theme['help'].startsWith('http') || theme['help'].startsWith('mailto:')) {
			let help = document.getElementsByClassName('js-help'),
				helpLinks = document.getElementsByClassName('js-help-href');

			for(let ele of help) {
				ele.classList.remove('o-hidden');
			}
			for(let link of helpLinks) {
				link.href = theme['help'];
			}
		} else {
			messenger.warn('The help URL provided by the theme was ignored due to being invalid. Only HTTP and MAILTO protocols are accepted.');
		}
	}

	let intendedConfig = document.getElementById('js-intended-config');

	// Add support
	if('supports' in theme && theme['supports'].length === 1) {
		let type = theme['supports'][0];
		if(['animelist','mangalist'].includes(type)) {
			intendedConfig.classList.remove('o-hidden');
			
			let parent = document.getElementById('js-list-type'),
				child = document.getElementById('js-list-type__text');
			child.innerHTML = `This theme was designed only for <b>${type}s</b>. Use on ${type === 'animelist' ? 'mangalist' : 'animelist'}s may have unexpected results.`;
			parent.classList.remove('o-hidden');
		}
		else {
			messenger.warn('The supported list was ignored due to being invalid. The only accepted values are "animelist" and "mangalist".');
		}
	} else {
		theme['supports'] = ['animelist','mangalist'];
	}

	// Add classic list functions

	let installBtn = document.getElementById('js-installation-btn');
	if(theme['type'] === 'classic') {
		installBtn.addEventListener('click', () => { toggleEle('#js-pp-installation-classic') });
		installBtn.textContent = 'How do I install classic lists?';
	} else {
		installBtn.addEventListener('click', () => { toggleEle('#js-pp-installation-modern') });
	}

	// Set theme columns and push to iframe

	let baseColumns = {
			'animelist': ['Numbers', 'Score', 'Type', 'Episodes', 'Rating', 'Start/End Dates', 'Total Days Watched', 'Storage', 'Tags', 'Priority', 'Genre', 'Demographics', 'Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors'],
			'mangalist': ['Numbers', 'Score', 'Type', 'Chapters', 'Volumes', 'Start/End Dates', 'Total Days Read', 'Retail Manga', 'Tags', 'Priority', 'Genres', 'Demographics', 'Image', 'Published Dates', 'Magazine']
		},
		columns = {};

	function processColumns(base, mode, todo) {
		let columns = {};

		for(let col of base) {
			if(Object.keys(todo).includes(col)) {
				columns[col] = todo[col];
			}
			else if(mode === 'whitelist') {
				columns[col] = false;
			}
			else if(mode === 'blacklist') {
				columns[col] = true;
			}
			else if(mode === 'greylist') {
				columns[col] = null;
			}
		}
		
		return columns;
	}

	if('columns' in theme) {
		intendedConfig.classList.remove('o-hidden');


		function renderColumns(columns, listtype) {
			let typeWrapper = document.createElement('div'),
				glue = document.createElement('div'),
				classic = document.createElement('div'),
				modern = document.createElement('div');
			
			typeWrapper.className = 'columns__wrapper';
			glue.className = 'columns__glue';
			classic.className = 'columns__split';
			modern.className = 'columns__split';

			typeWrapper.innerHTML = `<b class="columns__header">${listtype[0].toUpperCase()}${listtype.substr(1)} Columns</b>`;
			typeWrapper.appendChild(glue);
			glue.appendChild(classic);
			if(theme['type'] === 'modern') {
				glue.appendChild(modern);
				classic.innerHTML = `<b class="columns__split-header">Common</b>`;
				modern.innerHTML = `<b class="columns__split-header">Modern Only</b>`;
			}

			for(let [name, value] of Object.entries(columns)) {
				let col = document.createElement('div');
				col.className = 'columns__item';
				col.innerHTML = `
					<input type="checkbox" disabled="disabled" style="display:none">
					<label class="columns__check"></label>
					<span class="columns__name">${name}</span>
				`;
				
				let input = col.getElementsByTagName('input')[0];
				
				if(value === true) {
					input.checked = true;
				}
				else if(value === false) {
					input.checked = false;
				}
				else if(value === null) {
					input.indeterminate = true;
				}

				if(['Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors', 'Published Dates', 'Magazine'].includes(name)) {
					modern.appendChild(col);
				} else {
					classic.appendChild(col);
				}
			}
			columnsContainer.appendChild(typeWrapper);
		}

		// Get column info
		let mode = 'mode' in theme['columns'] ? theme['columns']['mode'] : 'whitelist';

		// Do actual stuff here
		let parent = document.getElementById('js-columns');
		parent.classList.remove('o-hidden');

		var columnsContainer = document.createElement('div');
		columnsContainer.className = 'columns';

		for(let listtype of theme['supports']) {
			if(listtype in theme['columns']) {
				let tempcolumns = processColumns(baseColumns[listtype], mode, theme['columns'][listtype]);
				
				renderColumns(tempcolumns, listtype);
			}
		}

		columns = processColumns(baseColumns[theme['supports'][0]], mode, theme['columns'][theme['supports'][0]])

		parent.appendChild(columnsContainer);
	}
	// Set random columns if they aren't set
	else {
		var tempcolumns = {
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
		let listtype = theme['supports'][0];
		for(let col of baseColumns[listtype]) {
			if(Object.keys(tempcolumns[listtype]).length > 8) {
				break;
			}

			if(!Object.keys(tempcolumns[listtype]).includes(col) && Math.round(Math.random()) === 1) {
				tempcolumns[listtype][col] = true;
			}
		}
		columns = processColumns(baseColumns[listtype], 'whitelist', tempcolumns[listtype]);
	}

	// Update iframe
	postToIframe(['columns', columns]);

	// Add expando functions

	let expandos = document.getElementsByClassName('js-expando');

	function toggleExpando() {
		let parent = this.parentNode,
			expandedHeight = parent.scrollHeight,
			collapsedHeight = parent.getAttribute('data-expando-limit'),
			expanded = parent.classList.contains('is-expanded'),
			animTiming = {
				duration: 300 + expandedHeight / 3,
				iterations: 1,
				easing: 'ease'
			};

		if(expanded) {
			let animFrames = [
				{ height: `${expandedHeight}px` },
				{ height: `${collapsedHeight}px` }
			];
			parent.style.height = `${collapsedHeight}px`;
			parent.style.paddingBottom = `0px`;
			parent.classList.remove('is-expanded');
			parent.animate(animFrames, animTiming);
			this.textContent = 'Expand';
		} else {
			let animFrames = [
				{ height: `${collapsedHeight}px`},
				{ height: `${expandedHeight + 25}px`,
				  paddingBottom: '25px' }
			];
			parent.style.height = `auto`;
			parent.style.paddingBottom = `25px`;
			parent.classList.add('is-expanded');
			parent.animate(animFrames, animTiming);
			this.textContent = 'Collapse';
		}
	}

	for(let expando of expandos) {
		let limit = expando.getAttribute('data-expando-limit');
		if(expando.scrollHeight < limit) {
			expando.classList.add('is-innert');
		} else {
			expando.style.height = `${limit}px`;
			let btn = expando.getElementsByClassName('js-expando-button')[0];
			btn.addEventListener('click', toggleExpando.bind(btn));
		}
	}

	// Add swappable text functions

	let swaps = document.getElementsByClassName('js-swappable-text');

	function swapText() {
		let toSwap = this.querySelector('.swappable-text');
		
		toSwap.classList.add('is-swapped');
		setTimeout(() => {
			toSwap.classList.remove('is-swapped')
		}, 666);
	}

	for(let swap of swaps) {
		swap.addEventListener('click', swapText.bind(swap));
	}
}

// Updates preview CSS & removes loader
function finalSetup() {
	loader.text('Fetching CSS...');

	// Get theme CSS
	let fetchThemeCss = returnCss(theme['css']);

	fetchThemeCss.catch((reason) => {
		loader.failed(reason);
		throw new Error(reason);
	});

	fetchThemeCss.then((css) => {
		// Update Preview
		baseCss = css;
	
		// Import settings if requested by storage
		if(localStorage.getItem('tcImport')) {
			let tempSettings = localStorage.getItem('tcUserSettingsImported');
			if(tempSettings === null) {
				messenger.error('Failed to import options. If you initiated this operation, please report this issue.', 'localstorage.getitem');
			} else {
				try {
					tempSettings = JSON.parse(tempSettings);
				} catch(e) {
					console.log(`[finalise] Error during JSON.parse: ${e}`);
					messenger.error('Failed to import options. Could not parse settings.', 'json.stringify');
				}
				// importPreviousSettings will call updateCss and pushCss
				if(importPreviousSettings(tempSettings)) {
					localStorage.removeItem('tcImport');
				}
			} 
		}

		// Clear any previous theme settings that are older than 4 hours (14,400,000ms).
		for(i = 0; i < localStorage.length; i++) {
			let key = localStorage.key(i);

			if(key.startsWith('theme:')) {
				let data = JSON.parse(localStorage.getItem(key));
				if(Date.now() - data['date'] > 14400000) {
					localStorage.removeItem(key);
				}
			}
		}

		// Apply previous settings if they exist.
		let settingsStorage = localStorage.getItem(`theme:${userSettings['data']}`);
		if(settingsStorage) {
			let storage = JSON.parse(settingsStorage);
			applySettings(storage['settings']);
		}

		// Push to iframe as normal if no import present
		else {
			updateCss();
		}

		pageLoaded = true;

		// Remove Loader if iframe has loaded, else wait until iframe calls function.
		if(iframeLoaded) {
			loader.loaded();
		}
		else {
			loader.text('Loading preview...');
			console.log('[finalSetup] Awaiting iframe before completing page load.');
		}
	});
}



// BEGIN PROGRAM & INITIALISE PAGE

// Preview Window

var preview = document.getElementById('js-preview'),
	iframe = document.createElement('iframe'),
	iframeLoaded = false,
	toPost = [],
	pageLoaded = false;

iframe.addEventListener('load', () => {
	iframeLoaded = true;
	if(toPost.length > 0) {
		console.log(`[iframe] Posting ${toPost.length} backlogged messages.`);
		for(msg of toPost) {
			postToIframe(msg);
		}
	}
	if(pageLoaded === true) {
		loader.loaded();
	}
});

iframe.className = 'preview__window';

function postToIframe(msg) {
	if(iframeLoaded) {
		iframe.contentWindow.postMessage(msg);
		return true;
	}
	toPost.push(msg);
	console.log('[postToIframe] Tried to post a message before the iframe finished loading.');
	return false;
}

// Variables

var theme = '',
	json = null,
	baseCss = '';

var userSettings = {
	'data': themeUrls[0],
	'options': {},
	'mods': {}
};


// Get data for all themes and call other functions

let fetchUrl = themeUrls[0],
	selectedTheme = query.get('q') || query.get('theme');

// Legacy processing for json 0.1 > 0.2
if(themeUrls.length === 0 && collectionUrls.length > 0) {
	fetchUrl = collectionUrls[0];
}
// Generic failure
else if(themeUrls.length === 0) {
	loader.failed(['No theme was specified in the URL. Did you follow a broken link?', 'select']);
	throw new Error('select');
}

loader.text('Fetching theme...');

function jsonfail(msg) {
	loader.failed([msg, 'invalid.json']);
	throw new Error('invalid json format');
}

let fetchData = fetchFile(fetchUrl, false);

fetchData.then((json) => {
	// Attempt to parse provided data.
	try {
		json = JSON.parse(json);
	} catch(e) {
		console.log(`[fetchData] Error during JSON.parse: ${e}`);
		loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
		throw new Error('json.parse');
	}

	// Check for legacy json
	if(themeUrls.length > 0 && collectionUrls.includes(themeUrls[0]) && !selectedTheme) {
		selectedTheme = 'theme';
	}
	processJson(json, themeUrls[0], selectedTheme ? selectedTheme : 'theme')
	.then((processedJson) => {

		// Get theme info from URL & take action if problematic
		if(processedJson === false) {
			loader.failed(['Encountered a problem while parsing theme information.', 'invalid.name']);
			throw new Error('invalid theme name');
		} else if(typeof processedJson === 'string') {
			jsonfail(processedJson);
		} else {
			theme = processedJson['data'];
			userSettings['theme'] = selectedTheme ? selectedTheme : theme['name'];
		}

		// Set preview to correct type and add iframe to page
		let framePath = './preview/';
		if(theme['type'] === 'classic') {
			framePath += 'classic/';
		} else {
			framePath += 'modern/';
		}
		if(theme['supports'] === ['mangalist']) {
			//framePath += 'mangalist.html';
			console.log('Detected mangalist only, but this feature is not yet supported.');
			framePath += 'animelist.html';
		} else {
			framePath += 'animelist.html';
		}
		iframe.src = framePath;
		preview.appendChild(iframe);

		// Test for basic JSON values to assist list designers debug.
		if(!('css' in theme)) {
			console.log('[processJson] Theme did not define any CSS.');
			theme['css'] = '';
		}
		if(!('type' in theme)) {
			console.log('[processJson] Theme did not define a list type, assuming "modern".');
			theme['type'] = 'modern';
		}

		// Set page title
		document.getElementsByTagName('title')[0].textContent = `Theme Customiser - ${theme['name']}`;

		renderHtml();
		finalSetup();
	})
});

fetchData.catch((reason) => {
	loader.failed(reason);
	throw new Error(reason);
});