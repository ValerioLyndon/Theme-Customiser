// ================
// COMMON FUNCTIONS
// ================

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
    
    function list(fullmatch, captureGroup1, captureGroup2, offset, str) {
        contents = captureGroup2.replaceAll('[*]', '</li><li class="bb-list-item">');
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
        list
    ];

    // Convert BBCode using patterns defined above.
    for ( var i = 0; i < format_search.length; i++ ) {
        oldText = null;
        while(text !== oldText) {    
            oldText = text;
            text = text.replace( format_search[i], format_replace[i] );
        }
    }

	// Return

	parent.innerHTML = text;

	return parent;
}

function updateOption(id, defaultValue = '', parentModId = false) {
	// set values and default value
	let input = document.getElementById(`theme-${id}`),
		val = undefined;

	if(input.type === 'checkbox') {
		val = input.checked;
	} else {
		val = input.value;
	}

	// Add to userOpts unless matches default value
	if(val === defaultValue) {
		if(parentModId) {
			delete userOpts['mods'][parentModId][id];
		} else {
			delete userOpts['options'][id];
		}
	}
	else {
		if(parentModId) {
			userOpts['mods'][parentModId][id] = val;
		} else {
			userOpts['options'][id] = val;
		}
	}

	updateCss();
}

function updateMod(id) {
	let val = document.getElementById(`theme-${id}`).checked,
		mod = theme['mods'][id];

	// Enable required mods
	if('requires' in mod) {
		for(requirement of mod['requires']) {
			if(requirement in theme['mods']) {
				if(val) {
					userOpts['mods'][requirement] = val;
				} else {
					delete userOpts['mods'][requirement];
				}

				// todo: do this using js classes or something that won't fall apart the moment you change the DOM
				let check = document.getElementById(`theme-${requirement}`),
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
		for(conflict of mod['conflicts']) {
			if(conflict in theme['mods']) {
				// todo: do this using js classes or something that won't fall apart the moment you change the DOM
				let check = document.getElementById(`theme-${conflict}`),
					toggle = check.nextElementSibling,
					toggleInfo = toggle.firstElementChild;

				check.disabled = val;

				if(val) {
					toggle.classList.add('is-disabled', 'has-info');
					toggleInfo.textContent = 'You cannot use this with your current configuration due to conflicts with other options.';
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
		document.getElementById(`js-theme-${id}-parent`).classList.add('is-enabled');
	} else {
		document.getElementById(`js-theme-${id}-parent`).classList.remove('is-enabled');
	}

	// Add to userOpts unless matches default value (i.e disabled)
	if(val === false) {
		delete userOpts['mods'][id];
	}
	else {
		userOpts['mods'][id] = {};
	}

	updateCss();
}

function updateCss() {
	let newCss = baseCss;

	// Encode options & sanitise any CSS character
	let optsStr = JSON.stringify(userOpts).replaceAll('*/','*\\/').replaceAll('/*','\\/*');
	// Place options at top
	newCss = '/* Theme Customiser Preset\nhttps://github.com/ValerioLyndon/Theme-Customiser\n^TC' + optsStr + 'TC$*/\n\n' + baseCss;

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
			for(set of optData['replacements']) {
				// Choose the correct replacement set based on whether the toggle is on or off
				let toFind = set[0],
					toInsert = (insert === true) ? set[2] : set[1];

				css = findAndReplace(css, toFind, toInsert);
			}
		}
		else if(optData['type'] === 'select') {
			let replacements = optData['selections'][insert]['replacements'];
			for(set of replacements) {
				let toFind = set[0],
					toInsert = set[1];

				css = findAndReplace(css, toFind, toInsert);
			}
		}
		else {
			for(set of optData['replacements']) {
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
			for(let [id, value] of Object.entries(userOpts['mods'])) {
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
		// Update output
		document.getElementById('js-output').textContent = css;

		// Add notice if necessary
		let notice = document.getElementById('js-output-notice');
		if(css.length > 65535) {
			let excess = css.length - 65535;
			notice.innerHTML = `This configuration exceeds MyAnimeList's maximum CSS length by ${excess} characters. You will need to shorten this code or host it on an external site to bypass the limit. For help hosting the CSS, see <a class="hyperlink" href="https://myanimelist.net/forum/?topicid=1911384" target="_blank">this guide</a>.`;
			notice.classList.remove('o-hidden');
		} else {
			notice.classList.add('o-hidden');
		}

		// Update iframe
		var iframe = document.getElementById('js-frame');
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage(['css', css]);
		}
	}
}

function validateInput(id, type) {
	let notice = document.getElementById(`js-theme-${id}-notice`),
		noticeHTML = '',
		val = document.getElementById(`theme-${id}`).value.toLowerCase(),
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
		for(unit of units) {
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
		this.pageContent.classList.add('is-loaded');
		this.parent.classList.add('is-hidden');
		var that = this;
		setTimeout(function() {
			that.parent.classList.add('o-hidden');
		}, 1500)
	}

	failed(reason_array, stopExecution = true) {
		this.icon.className = 'loading-screen__cross';
		this.text.textContent = 'Page Failure.';
		this.subText.textContent = reason_array[0];
		this.subText2.classList.remove('o-hidden');
		this.subText2.textContent = `Code: ${reason_array[1]}`;
		if(stopExecution === true) {
			throw new Error(reason_array[1]);
		}
	}
}

class messageHandler {
	constructor() {
		this.parent = document.getElementById('js-messenger');
	}

	send(text, type = 'notice', subtext = null) {
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
			opt = dictionary[1];

		let div = document.createElement('div'),
			head = document.createElement('b'),
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
		head.textContent = opt['name'];
		head.className = 'entry__name';
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

		let split = opt['type'].split('/');
			baseType = split[0]
			qualifier = split[1],
			subQualifier = split[2];
		
		if('help' in opt) {
			div.classList.add('has-help');
		}

		if(baseType === 'text' || opt['type'] === 'color') {
			let input = document.createElement('input');
			input.id = `theme-${id}`;
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

				input.addEventListener('input', validateInput.bind(display, id, opt['type']));
			}
			else if(qualifier === 'size') {
				input.placeholder = 'Your size here. e.x 200px, 33%, 20vw, etc.';

				input.addEventListener('input', () => { validateInput(id, opt['type']) });
			}
			else if(qualifier === 'image_url') {
				input.type = 'url';
				input.placeholder = 'https://example.com/image.jpg';
				div.appendChild(input);

				link.textContent = 'Image Tips';
				link.href = 'https://github.com/ValerioLyndon/MAL-Public-List-Designs/wiki/Image-Hosting-Tips';

				input.addEventListener('input', () => { validateInput(id, opt['type']); });
			}

			input.addEventListener('input', () => {
				updateOption(id, opt['default'], parentModId);
			});
		}


		else if(baseType === 'textarea') {
			let input = document.createElement('textarea');
			input.id = `theme-${id}`;
			input.value = opt['default'];
			input.className = 'entry__textarea input input--textarea';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		else if(baseType === 'toggle') {
			let toggle = document.createElement('div');

			toggle.className = 'entry__toggle-box';
			toggle.innerHTML = `
				<input id="theme-${id}" type="checkbox" class="o-hidden" ${('default' in opt && opt['default'] == true) ? 'checked="checked"' : ''}" />
				<label class="toggle" for="theme-${id}">
					<div class="toggle__info"></div>
				</label>
			`;
			div.prepend(toggle);

			toggle.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		else if(baseType === 'select') {
			let select = document.createElement('select');

			// would be nice to have a simpler/nicer to look at switch for small lists but would require using radio buttons.
			select.className = 'entry__select';
			select.id = `theme-${id}`;
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

		notice.id = `js-theme-${id}-notice`;
		notice.className = 'info-box info-box--indented info-box--error o-hidden';
		div.appendChild(notice);

		return div;
	}

	if('options' in theme) {
		for(opt of Object.entries(theme['options'])) {
			optionsEle.appendChild(generateOptionHtml(opt));
		}
	} else {
		optionsEle.parentNode.remove();
	}

	var modsEle = document.getElementById('js-mods');

	if('mods' in theme) {
		for (const [modId, mod] of Object.entries(theme['mods'])) {

			let div = document.createElement('div'),
				head = document.createElement('b'),
				expando = document.createElement('div'),
				desc = document.createElement('div'),
				toggle = document.createElement('div');

			toggle.className = 'entry__toggle-box';
			toggle.innerHTML = `
				<input id="theme-${modId}" type="checkbox" class="o-hidden" />
				<label class="toggle" for="theme-${modId}">
					<div class="toggle__info"></div>
				</label>
			`;
			div.appendChild(toggle);

			div.className = 'entry';
			div.id = `js-theme-${modId}-parent`;
			head.textContent = mod['name'];
			head.className = 'entry__name entry__name--emphasised';
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

				for(opt of Object.entries(mod['options'])) {
					optDiv.appendChild(generateOptionHtml(opt, modId));
				}

				div.appendChild(optDiv);
			}

			if('flags' in mod && mod['flags'].includes('hidden')) {
				div.classList.add('o-hidden');
			}

			modsEle.appendChild(div);

			document.getElementById(`theme-${modId}`).addEventListener('change', () => { updateMod(modId); });
		}
	} else {
		modsEle.parentNode.remove();
	}

	// Help links
	if('help' in theme) {
		if(theme['help'].startsWith('http') || theme['help'].startsWith('mailto:')) {
			let help = document.getElementsByClassName('js-help'),
				helpLinks = document.getElementsByClassName('js-help-href');

			for(ele of help) {
				ele.classList.remove('o-hidden');
			}
			for(link of helpLinks) {
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

	if('columns' in theme) {
		intendedConfig.classList.remove('o-hidden');

		// functions
		function processColumns(base, mode, todo) {
			let columns = {};

			for(let col of base) {
				if(todo.includes(col)) {
					columns[col] = (mode === 'whitelist') ? true : false;
				} else {
					columns[col] = (mode === 'whitelist') ? false : true;
				}
			}
			
			return columns;
		}

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
					<input class="columns__check" type="checkbox" disabled="disabled" ${value ? 'checked="checked"' : ''}>
					<span class="columns__name">${name}</span>
				`;
				if(['Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors', 'Published Dates', 'Magazine'].includes(name)) {
					modern.appendChild(col);
				} else {
					classic.appendChild(col);
				}
			}
			columnsContainer.appendChild(typeWrapper);
		}

		// Get column info
		let mode = 'mode' in theme['columns'] ? theme['columns']['mode'] : 'whitelist',
			baseColumns = {
				'animelist': ['Numbers', 'Score', 'Type', 'Episodes', 'Rating', 'Start/End Dates', 'Total Days Watched', 'Storage', 'Tags', 'Priority', 'Genre', 'Demographics', 'Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors'],
				'mangalist': ['Numbers', 'Score', 'Type', 'Chapters', 'Volumes', 'Start/End Dates', 'Total Days Read', 'Retail Manga', 'Tags', 'Priority', 'Genres', 'Demographics', 'Image', 'Published Dates', 'Magazine']
			};

		// Do actual stuff here
		let parent = document.getElementById('js-columns');
		parent.classList.remove('o-hidden');

		var columns = [],
			columnsContainer = document.createElement('div');
		columnsContainer.className = 'columns';

		for(listtype of theme['supports']) {
			let tempcolumns = processColumns(baseColumns[listtype], mode, theme['columns'][listtype]);
			columns.push(tempcolumns);
			
			renderColumns(tempcolumns, listtype);
		}

		parent.appendChild(columnsContainer);

		// Update iframe
		var iframe = document.getElementById('js-frame');
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage(['columns', columns]);
		}
	}

	// Add expando functions

	let expandos = document.getElementsByClassName('js-expando');

	function toggleExpando() {
		let parent = this.parentNode,
			expandedHeight = parent.scrollHeight;
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
			parent.style = `height: ${collapsedHeight}px`;
			parent.classList.remove('is-expanded');
			parent.animate(animFrames, animTiming);
			this.textContent = 'Expand';
		} else {
			let animFrames = [
				{ height: `${collapsedHeight}px`},
				{ height: `${expandedHeight + 25}px`,
				  paddingBottom: '25px' }
			];
			parent.style = `height: auto; padding-bottom: 25px;`;
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

		// previous input should be any amount of text that also includes the ^TC{}TC$ text format with stringifed json useropts inside the curly braces. 
		// process previous CSS/input, removing everything except the json.
		previous = previous.match(/\^TC{.*?}}TC\$/);

		if(previous === null) {
			messenger.error('Import failed, could not interpret your options. Are you sure you input the correct text?', ' regex.match');
			return false;
		}

		previous = previous[0].substr(3, previous[0].length - 6);

		try {
			var previousOpts = JSON.parse(previous);
		} catch {
			messenger.error('Import failed, could not interpret your options. Are you sure you copied and pasted all the settings?', 'json.parse');
			return false;
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
	for([optId, val] of Object.entries(userOpts['options'])) {
		document.getElementById(`theme-${optId}`).value = val;
	}
	for([modId, modOpts] of Object.entries(userOpts['mods'])) {
		document.getElementById(`theme-${modId}`).checked = true;
		document.getElementById(`js-theme-${modId}-parent`).classList.add('is-enabled');
		
		for([optId, optVal] of Object.entries(modOpts)) {
			document.getElementById(`theme-${optId}`).value = optVal;
		}
	}

	updateCss();
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
		});
	} else {
		finalise(theme['css']);
	}

	function finalise(css) {
		// Update Preview
		baseCss = css;
	
		// Import settings if requested by URL
		if(query.get('import')) {
			let opts = localStorage.getItem('tcUserOptsImported');
			if(opts === null) {
				messenger.error('Failed to import options. If you initiated this operation, please report this issue.', 'localstorage.getitem');
			} else {
				try {
					opts = JSON.parse(opts);
				} catch {
					messenger.error('Failed to import options. Could not parse settings.', 'json.stringify');
				}
				// importpreviousopts will call updateCss and pushCss
				importPreviousOpts(opts);
			}
		}

		// Push to iframe
		else {
			updateCss(css);
		}

		// Remove Loader
		loader.loaded();
	}
}



// BEGIN PROGRAM & INITIALISE PAGE

// Variables

var query = (new URL(document.location)).searchParams,
	dataJson = query.get('data'),
	selectedTheme = query.get('theme'),
	theme = '',
	data = null,
	baseCss = '',
	loader = new loadingScreen(),
	messenger = new messageHandler();

if(dataJson === null) {
	dataJson = './assets/data.json';
}

var userOpts = {
	'theme': selectedTheme,
	'data': dataJson,
	'options': {},
	'mods': {}
};

if(selectedTheme === null) {
	loader.failed(['No theme was specified in the URL. Did you follow a broken link?', 'select']);
}

// Get data for all themes and call other functions

let fetchData = fetchFile(dataJson, false);

fetchData.then((json) => {
	// Attempt to parse provided data.
	try {
		data = JSON.parse(json);
	} catch(e) {
		loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
	}

	// Get theme info from URL & take action if problematic
	if(theme === null || !(selectedTheme.toLowerCase() in data)) {
		// redirect in future using: window.location = '?';
		// for now, simply fails
		loader.failed(['Encountered a problem while parsing theme information.', 'invalid theme']);
	} else {
		theme = data[selectedTheme.toLowerCase()];
	}

	renderHtml();
	finalSetup();
});

fetchData.catch((reason) => {
	loader.failed(reason);
});