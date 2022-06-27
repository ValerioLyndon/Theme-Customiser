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

function splitSlide() {
	let slider = document.getElementById('js-toggle-drawer'),
		sidebar = document.getElementById('js-sidebar');

	slider.classList.toggle('is-active');
	sidebar.classList.toggle('is-aside');
}

function createBB(text) {
	let parent = document.createElement('p');
	parent.classList.add('bb');

	// sanitise

	let dummy = document.createElement('div');
	dummy.textContent = text;
	text = dummy.innerHTML;

	// Define BB patterns

	function bold(fullmatch, captureGroup, offset, str) {
		return '<b class="bb-bold">'+captureGroup+'</b>';
	}

	function italic(fullmatch, captureGroup, offset, str) {
		return '<i class="bb-italic">'+captureGroup+'</i>';
	}

	function underline(fullmatch, captureGroup, offset, str) {
		return '<span style="text-decoration:underline;" class="bb-underline">'+captureGroup+'</span>';
	}

	function strike(fullmatch, captureGroup, offset, str) {
		return '<span style="text-decoration:line-through;" class="bb-strike">'+captureGroup+'</span>';
	}
    
	function link(fullmatch, captureGroup1, captureGroup2, offset, str) {
		return '<a href="'+captureGroup1.substr(1)+'" target="_blank" class="hyperlink">'+captureGroup2+'</a>';
	}

	function list(fullmatch, captureGroup1, captureGroup2, offset, str) {
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

	// The array of regex patterns to look for

	let format_search = [
		/\n/ig,
		/\[b\]((?:(?!\[b\]).)*?)\[\/b\]/ig,
		/\[i\]((?:(?!\[i\]).)*?)\[\/i\]/ig,
		/\[u\]((?:(?!\[u\]).)*?)\[\/u\]/ig,
		/\[s\]((?:(?!\[s\]).)*?)\[\/s\]/ig,
		/\[url(=.*?)\]((?:(?!\[url\]).)*?)\[\/url\]/ig,
		/\[list(=.*?){0,1}\]((?:(?!\[list\]).)*?)\[\/list\]/ig,
		/\[yt\](.*?)\[\/yt\]/ig
	];

	// The array of strings to replace regex matches with

	let format_replace = [
		'<br>',
		bold,
		italic,
		underline,
		strike,
		link,
		list
	];

	// Convert BBCode using patterns defined above.
	for ( var i = 0; i < format_search.length; i++ ) {
		let oldText = null;
		while(text !== oldText) {    
			oldText = text;
			text = text.replace( format_search[i], format_replace[i] );
		}
	}

	// Return

	parent.innerHTML = text;

	return parent;
}

function updateOption(optId, defaultValue = '', parentModId = false, skipCss = false) {
	// set values and default value
	let fullId = `opt:${optId}`;
	if(parentModId) {
		fullId = `mod:${parentModId}:${optId}`;
	}
	let input = document.getElementById(fullId),
		val = undefined;

	if(input.type === 'checkbox') {
		val = input.checked;
	} else {
		val = input.value;
	}

	// Add to userOpts unless matches default value
	if(val === defaultValue) {
		if(parentModId) {
			delete userOpts['mods'][parentModId][optId];
		} else {
			delete userOpts['options'][optId];
		}
	}
	else {
		if(parentModId) {
			userOpts['mods'][parentModId][optId] = val;
		} else {
			userOpts['options'][optId] = val;
		}
	}

	if(!skipCss) {
		updateCss();
	}
}

function updateMod(id) {
	let val = document.getElementById(`mod:${id}`).checked,
		mod = theme['mods'][id];

	// Enable required mods
	if('requires' in mod) {
		for(let requirement of mod['requires']) {
			if(requirement in theme['mods']) {
				if(val) {
					userOpts['mods'][requirement] = val;
				} else {
					delete userOpts['mods'][requirement];
				}

				// todo: do this using js classes or something that won't fall apart the moment you change the DOM
				let check = document.getElementById(`mod:${requirement}`),
					toggle = check.nextElementSibling,
					toggleInfo = toggle.firstElementChild;
				
				check.disabled = val;
				check.checked = val;

				if(val) {
					toggle.classList.add('is-forced', 'has-info');
					toggleInfo.textContent = 'This must be enabled for other options to work.';
				} else {
					toggle.classList.remove('is-forced', 'has-info');
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
					toggle = check.nextElementSibling,
					toggleInfo = toggle.firstElementChild;

				check.disabled = val;

				if(val) {
					toggle.classList.add('is-disabled', 'has-info');
					toggleInfo.textContent = `This mod is incompatible with one of your choices. To use, disable "${mod['name']}".`;
				} else {
					toggle.classList.remove('is-disabled', 'has-info');
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

	// Add to userOpts unless matches default value (i.e disabled)
	if(val === false) {
		delete userOpts['mods'][id];
	}
	else {
		userOpts['mods'][id] = {};

		// Update options if it has any before calling CSS
		if('options' in mod) {
			for(let [optId, opt] of Object.entries(mod['options'])) {
				if(opt['default'] === undefined && opt['type'] === 'toggle') {
					opt['default'] = false;
				} else if(opt['default'] === undefined) {
					opt['default'] = '';
				}
				updateOption(optId, opt['default'], id, true);
			}
		}
	}

	updateCss();
}

function updateCss() {
	let newCss = baseCss;
	
	function applyOptionToCss(css, optData, insert) {
		let qualifier = optData['type'].split('/')[1],
			subQualifier = optData['type'].split('/')[2];

		if(qualifier === 'content') {
			// formats text to be valid for CSS content statements
			insert = '"' + insert.replaceAll('\\','\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\a ') + '"';
		}
		else if(qualifier === 'image_url') {
			if(insert === '') {
				insert = 'none';
			} else {
				insert = `url(${insert})`;
			}
		}
		
		function findAndReplace(str, toFind, toInsert) {
			if(toFind.startsWith('RegExp')) {
				toFind = new RegExp(toFind.substr(7), 'g');
			}

			return str.replaceAll(toFind, toInsert);
		}
		
		if(optData['type'] === 'toggle') {
			for(let set of optData['replacements']) {
				// Choose the correct replacement set based on whether the toggle is on or off
				let toFind = set[0],
					toInsert = (insert === true) ? set[2] : set[1];

				css = findAndReplace(css, toFind, toInsert);
			}
		}
		else if(optData['type'] === 'select') {
			let replacements = optData['selections'][insert]['replacements'];
			for(let set of replacements) {
				let toFind = set[0],
					toInsert = set[1];

				css = findAndReplace(css, toFind, toInsert);
			}
		}
		else {
			for(let set of optData['replacements']) {
				let toFind = set[0],
					toInsert = set[1].replaceAll('{{{insert}}}', insert);

				css = findAndReplace(css, toFind, toInsert);
			}
		}

		return css;
	}

	// Options
	for(let [id, val] of Object.entries(userOpts['options'])) {
		newCss = applyOptionToCss(newCss, theme['options'][id], val);
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
	
	if('mods' in theme && Object.keys(userOpts['mods']).length > 0) {
		(async () => {
			for(let id of Object.keys(userOpts['mods'])) {
				let modData = theme['mods'][id];
				for(let [location, resource] of Object.entries(modData['css'])) {
					if(resource.startsWith('http')) {
						try {
							var modCss = await fetchFile(resource);
						} catch (failure) {
							console.log(`[updateCss] Failed during mods fetchfile: ${failure}`);
							messenger.error(`Failed to fetch CSS for mod "${id}". Try waiting 30s then disabling and re-enabling the mod. If this continues to happen, check if the listed resource still exists.`, failure[1] ? failure[1] : 'fetchfile');
						}
					} else {
						var modCss = resource;
					}

					for(let [optId, val] of Object.entries(userOpts['mods'][id])) {
						modCss = applyOptionToCss(modCss, modData['options'][optId], val);
					}

					extendCss(modCss, location);
				}
			}
			pushCss(newCss);
		})();
	}
	else {
		pushCss(newCss);
	}

	function pushCss(css) {
		// Encode options & sanitise any CSS character
		let optsStr = JSON.stringify(userOpts).replaceAll('*/','*\\/').replaceAll('/*','\\/*');
		// Update export textareas
		document.getElementById('js-export-code').textContent = optsStr;
		// Place options at top
		let cssWithSettings = '/* Theme Customiser Settings\nhttps://github.com/ValerioLyndon/Theme-Customiser\n^TC' + optsStr + 'TC$*/\n\n' + css;

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



// ONE-TIME FUNCTIONS

// Setup basic options structure and add event listeners
function renderHtml() {
	// options & mods
	document.getElementById('js-title').textContent = theme['name'];
	let credit = document.getElementById('js-theme-credit');
	if('author' in theme && theme['author']) {
		credit.textContent = `Customising "${theme['name']}" by ${theme['author']}`;
	} else {
		credit.textContent = `Customising "${theme['name']}"`;
	}

	var optionsEle = document.getElementById('js-options');

	function generateOptionHtml(dictionary, parentModId) {
		let id = dictionary[0],
			opt = dictionary[1],
			fullId = `opt:${id}`;
		
		if(parentModId) {
			fullId = `mod:${parentModId}:${id}`;
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
		headLeft.textContent = opt['name'];
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
				updateOption(id, opt['default'], parentModId);
			});
		}


		else if(baseType === 'textarea') {
			let input = document.createElement('textarea');
			input.id = fullId;
			input.value = opt['default'];
			input.className = 'entry__textarea input input--textarea';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		else if(baseType === 'toggle') {
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



			toggle.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		else if(baseType === 'select') {
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

			select.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		notice.id = `${fullId}-notice`;
		notice.className = 'info-box info-box--indented info-box--error o-hidden';
		div.appendChild(notice);

		return div;
	}

	if('options' in theme) {
		for(let opt of Object.entries(theme['options'])) {
			optionsEle.appendChild(generateOptionHtml(opt));
		}
	} else {
		optionsEle.parentNode.remove();
	}

	var modsEle = document.getElementById('js-mods'),
		tagsEle = document.getElementById('js-mod-tags'),
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
			headLeft.textContent = mod['name'];
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
					optDiv.appendChild(generateOptionHtml(opt, modId));
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
		tagsEle.classList.remove('o-hidden');

		function selectTag() {
			// Clear previous selection
			let hidden = document.querySelectorAll('.is-hidden-by-tag'),
				isSelected = this.className.includes('is-selected');
			for(let ele of hidden) {
				ele.classList.remove('is-hidden-by-tag');
			}

			// Remove other tags' styling & set our own
			tagsEle.classList.remove('has-selected');
			let selectedTags = document.querySelectorAll('.js-tag.is-selected');

			for(let tag of selectedTags) {
				tag.classList.remove('is-selected');
			}

			// Select new tags
			if(!isSelected) {
				tagsEle.classList.add('has-selected');
				let modsToKeep = this.getAttribute('data-mods').split(',');
				for(let modId of Object.keys(theme['mods'])) {
					if(modsToKeep.includes(modId)) {
						continue;
					} else {
						document.getElementById(`mod-parent:${modId}`).classList.add('is-hidden-by-tag');
					}
				}
				this.classList.add('is-selected');
			}
		}
		

		let cloudEle = document.getElementById('js-mod-tags-cloud');
		
		for(let [tag, mods] of Object.entries(modTags)) {
			let tagEle = document.createElement('button'),
				countEle = document.createElement('span'),
				count = mods.length;

			tagEle.textContent = tag;
			tagEle.className = 'tags__tag js-tag';
			tagEle.setAttribute('data-mods', mods);

			countEle.textContent = count;
			countEle.className = 'tags__count';

			tagEle.addEventListener('click', selectTag.bind(tagEle));
			tagEle.appendChild(countEle);
			cloudEle.appendChild(tagEle);
		}
	}

	// Back link
	if(collectionUrls.length > 0) {
		let back = document.getElementById('js-back');
		back.classList.remove('o-hidden');
		back.href = `./?c=${collectionUrls.join('&c=')}`;
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
		if(['animelist','mangalist'].includes(theme['supports'][0])) {
			intendedConfig.classList.remove('o-hidden');
			
			let parent = document.getElementById('js-list-type');
			parent.classList.remove('o-hidden');
			parent.innerHTML = `Use only with your <b>${theme['supports'][0]}</b>.`;
		}
		else {
			messenger.warn('The supported list was ignored due to being invalid. The only accepted values are "animelist" and "mangalist".');
		}
	} else {
		theme['supports'] = ['animelist','mangalist'];
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
			let tempcolumns = processColumns(baseColumns[listtype], mode, theme['columns'][listtype]);
			
			renderColumns(tempcolumns, listtype);
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
				{ height: `${collapsedHeight}px`}
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

	// Add other functions

	document.getElementById('js-import-button').addEventListener('click', () => { importPreviousOpts(); });
}

function importPreviousOpts(opts = undefined) {
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
		// * random text that includes the ^TC{}TC$ text format with stringifed json useropts inside the curly braces. 
		
		// Try to parse as JSON, if it fails then process as normal string.
		try {
			var previousOpts = JSON.parse(previous.trim());
		}
		catch {
			previous = previous.match(/\^TC{.*?}}TC\$/);

			if(previous === null) {
				messenger.error('Import failed, could not interpret your options. Are you sure you input the correct text?', ' regex.match');
				return false;
			}

			previous = previous[0].substr(3, previous[0].length - 6);

			try {
				var previousOpts = JSON.parse(previous);
			} catch(e) {
				console.log(`[importPreviousOpts] Error during JSON.parse: ${e}`);
				messenger.error('Import failed, could not interpret your options. Are you sure you copied and pasted all the settings?', 'json.parse');
				return false;
			}
		}
	} else {
		var previousOpts = opts;
	}

	localStorage.setItem('tcUserOptsImported', JSON.stringify(previousOpts));
	
	// Do nothing if useropts are the same.
	if(userOpts === previousOpts) {
		messenger.warn('Nothing imported. Settings exactly match the current page.');
		return null;
	}
    
	// If theme or data is wrong, offer to redirect or to try importing anyway.
	else if(userOpts['theme'] !== previousOpts['theme'] || userOpts['data'] !== previousOpts['data']) {
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
				window.location = `./theme?q=${previousOpts['theme']}&t=${previousOpts['data']}`;
			} else if(choice === 'ignore') {
				applyPreviousOpts(previousOpts);
				return true;
			} else {
				localStorage.removeItem('tcImport');
				messenger.timeout('Action aborted.');
			}
		});

		return false;
	}
	applyPreviousOpts(previousOpts);
	return true;
}
	
function applyPreviousOpts(previousOpts) {
	// set current options to match
	let tempTheme = userOpts['theme'],
		tempData = userOpts['data'];
	userOpts['mods'] = previousOpts['mods'];
	userOpts['theme'] = tempTheme;
	userOpts['data'] = tempData;
	
	// update HTML to match new options
	let errors = [];
	for(let [optId, val] of Object.entries(userOpts['options'])) {
		try {
			document.getElementById(`opt:${optId}`).value = val;
		} catch {
			delete userOpts['options'][optId];
			errors.push(`opt:<b>${optId}</b>`);
		}
	}
	for(let [modId, modOpts] of Object.entries(userOpts['mods'])) {
		try {
			document.getElementById(`mod:${modId}`).checked = true;
			document.getElementById(`mod-parent:${modId}`).classList.add('is-enabled');
		} catch {
			delete userOpts['mods'][modId];
			errors.push(`mod:<b>${optId}</b>`);
			continue;
		}
		
		for(let [optId, optVal] of Object.entries(modOpts)) {
			try {
				document.getElementById(`mod:${modId}:${optId}`).value = optVal;
			} catch {
				delete userOpts['mods'][modId][optId];
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
	messenger.timeout('Settings import complete.');
}

// Updates preview CSS & removes loader
function finalSetup() {
	// Get theme CSS
	if(theme['css'].startsWith('http')) {
		let fetchThemeCss = fetchFile(theme['css']);

		fetchThemeCss.then((css) => {
			finalise(css);
		});

		fetchThemeCss.catch((reason) => {
			loader.failed(reason);
			throw new Error(reason);
		});
	} else {
		finalise(theme['css']);
	}

	function finalise(css) {
		// Update Preview
		baseCss = css;
	
		// Import settings if requested by URL
		if(localStorage.getItem('tcImport')) {
			let opts = localStorage.getItem('tcUserOptsImported');
			if(opts === null) {
				messenger.error('Failed to import options. If you initiated this operation, please report this issue.', 'localstorage.getitem');
			} else {
				try {
					opts = JSON.parse(opts);
				} catch(e) {
					console.log(`[finalise] Error during JSON.parse: ${e}`);
					messenger.error('Failed to import options. Could not parse settings.', 'json.stringify');
				}
				// importpreviousopts will call updateCss and pushCss
				if(importPreviousOpts(opts)) {
					localStorage.removeItem('tcImport');
				}
			}
		}

		// Push to iframe
		else {
			updateCss(css);
		}

		pageLoaded = true;

		// Remove Loader if iframe has loaded, else wait until iframe calls function.
		if(iframeLoaded) {
			loader.loaded();
		}
		else {
			console.log('[finalSetup] Awaiting iframe before completing page load.');
		}
	}
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
iframe.src = 'preview.html';
iframe.className = 'preview__window';
preview.appendChild(iframe);

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

var userOpts = {
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
	console.log('2')
}
// Generic failure
else if(themeUrls.length === 0) {
	loader.failed(['No theme was specified in the URL. Did you follow a broken link?', 'select']);
	throw new Error('select');
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
		} else if(!('data' in processedJson)) {
			loader.failed(['Encountered a problem while parsing theme information.', 'invalid.json']);
			throw new Error('invalid json format');
		} else {
			theme = processedJson['data'];
			userOpts['theme'] = selectedTheme ? selectedTheme : theme['name'];
		}

		document.getElementsByTagName('title')[0].textContent = `Theme Customiser - ${theme['name']}`;

		renderHtml();
		finalSetup();
	})
});

fetchData.catch((reason) => {
	loader.failed(reason);
	throw new Error(reason);
});