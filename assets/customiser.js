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

function updateOption(id, defaultValue = '', parentModId = false) {
	// set values and default value
	let val = undefined;

	val = document.getElementById(id).value;

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
	let val = document.getElementById(id).checked,
		mod = theme['mods'][id];

	// Enable required mods
	if('requires' in mod) {
		for(requirement of mod['requires']) {
			try {
				if(val) {
					userOpts['mods'][requirement] = val;
				} else {
					delete userOpts['mods'][requirement];
				}

				// todo: do this using js classes or something that won't fall apart the moment you change the DOM
				let check = document.getElementById(requirement),
					toggle = check.nextElementSibling,
					toggleInfo = toggle.firstElementChild;
				
				check.disabled = val;
				check.checked = val;

				if(val) {
					toggle.classList.add('toggle--forced', 'toggle--has-extra-info');
					toggleInfo.textContent = 'This must be enabled for other options to work.';
				} else {
					toggle.classList.remove('toggle--forced', 'toggle--has-extra-info');
				}
			} catch(e) {
				console.log('error in data json todo: add user-facing error report here');
				console.log(e);
			}
		}
	}
	
	// Disable incompatible mods
	if('conflicts' in mod) {
		for(conflict of mod['conflicts']) {
			try {
				// todo: do this using js classes or something that won't fall apart the moment you change the DOM
				let check = document.getElementById(conflict),
					toggle = check.nextElementSibling,
					toggleInfo = toggle.firstElementChild;

				check.disabled = val;

				if(val) {
					toggle.classList.add('toggle--disabled', 'toggle--has-extra-info');
					toggleInfo.textContent = 'You cannot use this with your current configuration due to conflicts with other options.';
				} else {
					toggle.classList.remove('toggle--disabled', 'toggle--has-extra-info');
				}
			} catch(e) {
				console.log('error in data json todo: add user-facing error report here');
				console.log(e);
			}
		}
	}

	// Add some CSS style rules
	if(val === true) {
		document.getElementById(`js-${id}-parent`).classList.add('mod--checked');
	} else {
		document.getElementById(`js-${id}-parent`).classList.remove('mod--checked');
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

	// Encode options at top

	newCss = '/* Theme Customiser Preset\nhttps://github.com/ValerioLyndon/Theme-Customiser\n^TC' + JSON.stringify(userOpts) + 'TC$*/\n\n' + baseCss;

	function applyOptionToCss(css, optData, insert) {
		if(optData['type'] === 'css_content_value') {
			// format text to be valid for CSS content statements
			insert = `"${insert.replaceAll('"', '\\"').replaceAll('\n', '\\a ').replaceAll('\\','\\\\')}"`;
		}
		else if(optData['type'] === 'image_url') {
			if(insert === '') {
				insert = 'none';
			} else {
				insert = `url(${insert})`;
			}
		}

		for(set of optData['replacements']) {
			let toFind = set[0],
				toInsert = set[1].replaceAll('{{{insert}}}', insert);

			if(toFind.startsWith('RegExp')) {
				toFind = new RegExp(toFind.substr(7), 'g');
			}

			css = css.replaceAll(toFind, toInsert);
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

						for(let [optId, val] of Object.entries(userOpts['mods'][id])) {
							modCss = applyOptionToCss(modCss, modData['options'][optId], val);
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
		iframe.contentWindow.postMessage(['css', css]);
	}
}

function validateInput(id, type) {
	let notice = document.getElementById(`js-${id}-notice`),
		val = document.getElementById(id).value.toLowerCase();
	
	if(val.length === 0) {
		notice.classList.add('o-hidden');
		return undefined;
	}

	if(type === 'image_url') {
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

// Setup basic options structure and add event listeners
function renderHtml() {
	// options & mods
	document.getElementById('js-title').textContent = theme['name'];

	var optionsEle = document.getElementById('js-options');

	function generateOptionHtml(dictionary, parentModId) {
		let id = dictionary[0],
			opt = dictionary[1];
		

		let div = document.createElement('div'),
			head = document.createElement('b'),
			notice = document.createElement('div');

		if(opt['default'] === undefined) {
			opt['default'] = '';
		}

		div.className = 'option';
		head.textContent = opt['name'];
		head.className = 'option__name';
		div.appendChild(head);

		if(['text', 'css_generic_value'].includes(opt['type'])) {
			let input = document.createElement('input');
			input.id = id;
			input.type = 'text';
			input.value = opt['default'];
			input.className = 'option__input option__input--textarea';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			switch (opt['type']) {
				case 'text':
					input.addEventListener('input', () => {
						updateOption(id, opt['default'], parentModId);
					});
				case 'css_generic_value':
					input.addEventListener('input', () => {
						validateInput(id, opt['type']);
						updateOption(id, opt['default'], parentModId);
					});
			}
		}

		else if(opt['type'] === 'image_url') {
			let input = document.createElement('input');
			input.id = id;
			input.type = 'url';
			input.value = opt['default'];
			input.placeholder = 'https://example.com/image.jpg';
			input.className = 'option__input';
			div.appendChild(input);

			input.addEventListener('input', () => {
				validateInput(id, opt['type']);
				updateOption(id, opt['default'], parentModId);
			});
		}

		else if(opt['type'] === 'css_content_value') {
			let input = document.createElement('textarea');
			input.id = id;
			input.value = opt['default'];
			input.className = 'option__input option__input--textarea';
			input.placeholder = 'Your text here.';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		else if(opt['type'] === 'colour') {
			// todo: make this better because the built-in colour selector is garbo but using just text is pretty bad too
			let input = document.createElement('input');
			input.id = id;
			input.value = opt['default'];
			//input.type = 'color';
			input.type = 'text';
			input.className = 'option__input';
			input.placeholder = 'Your colour here. e.x rgba(0, 135, 255, 1.0)';
			div.appendChild(input);

			input.addEventListener('input', () => { updateOption(id, opt['default'], parentModId); });
		}

		notice.id = `js-${id}-notice`;
		notice.className = 'c-notice o-hidden';
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
				desc = document.createElement('p'),
				toggle = document.createElement('div');

			toggle.className = 'mod__toggle-box';
			toggle.innerHTML = `
				<input id="${modId}" type="checkbox" class="o-hidden" />
				<label class="toggle" for="${modId}">
					<div class="toggle__info"></div>
				</label>
			`;
			div.appendChild(toggle);

			div.className = 'mod';
			div.id = `js-${modId}-parent`;
			head.textContent = mod['name'];
			head.className = 'mod__name';
			div.appendChild(head);

			expando.className = 'c-expando js-expando';
			expando.setAttribute('data-expando-limit', "100");
			expando.innerHTML = '<button class="c-expando__button c-expando__button--subtle js-expando-button">Expand</button>';
			if('description' in mod) {
				desc.appendChild(createBB(mod['description']));
			}
			desc.className = 'mod__desc';
			expando.appendChild(desc);
			div.appendChild(expando);

			if('options' in mod) {
				let optDiv = document.createElement('div');
				optDiv.className = 'mod__options';

				for(opt of Object.entries(mod['options'])) {
					optDiv.appendChild(generateOptionHtml(opt, modId));
				}

				div.appendChild(optDiv);
			}

			if('flags' in mod && mod['flags'].includes('hidden')) {
				div.classList.add('o-hidden');
			}

			modsEle.appendChild(div);

			document.getElementById(modId).addEventListener('change', () => { updateMod(modId); });
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
			console.log('invalid help url');
		}
	}

	// Set theme columns and push to iframe
	if('columns' in theme) {
		// Get column info
		let baseAnimeCol = ['Numbers', 'Score', 'Type', 'Episodes', 'Rating', 'Start/End Dates', 'Total Days Watched', 'Storage', 'Tags', 'Priority', 'Genre', 'Demographics', 'Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors'],
			baseMangaCol = ['Numbers', 'Score', 'Type', 'Chapters', 'Volumes', 'Start/End Dates', 'Total Days Read', 'Retail Manga', 'Tags', 'Priority', 'Genres', 'Demographics', 'Image', 'Published Dates', 'Magazine'],
			mode = 'mode' in theme['columns'] ? theme['columns']['mode'] : 'whitelist',
			animeCol = theme['columns']['animelist'],
			mangaCol = theme['columns']['mangalist'];

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

		let columns = processColumns(baseAnimeCol, mode, animeCol);

		// Render HTML

		let parent = document.getElementById('js-columns'),
			left = document.createElement('div'),
			right = document.createElement('div');
		parent.className = 'c-columns';
		parent.innerHTML = `
			<div class="c-columns__blurb">
				<b>This theme has a recommended set of list columns.</b>

				<p>You can set your list columns to match in your <a class="hyperlink" href="https://myanimelist.net/editprofile.php?go=listpreferences">list preferences.</a> Using unrecommended configurations may cause visual errors not intended by the theme designer.</p>
			</div>
		`;
		left.className = 'c-columns__split c-columns__split--left';
		right.className = 'c-columns__split c-columns__split--right';

		for(let [name, value] of Object.entries(columns)) {
			let col = document.createElement('c-columns__item');
			col.innerHTML = `
				<input class="c-columns__check" type="checkbox" disabled="disabled" ${value ? 'checked="checked"' : ''}>
				<span class="c-columns__name">${name}</span>
			`;
			if(['Image', 'Premiered', 'Aired Dates', 'Studios', 'Licensors', 'Published Dates', 'Magazine'].includes(name)) {
				right.appendChild(col);
			} else {
				left.appendChild(col);
			}
		}
		parent.appendChild(left);
		parent.appendChild(right);

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
			expanded = parent.classList.contains('c-expando--expanded'),
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
			parent.classList.remove('c-expando--expanded');
			parent.animate(animFrames, animTiming);
			this.textContent = 'Expand';
		} else {
			let animFrames = [
				{ height: `${collapsedHeight}px`},
				{ height: `${expandedHeight + 25}px`,
				  paddingBottom: '25px' }
			];
			parent.style = `height: auto; padding-bottom: 25px;`;
			parent.classList.add('c-expando--expanded');
			parent.animate(animFrames, animTiming);
			this.textContent = 'Collapse';
		}
	}

	for(let expando of expandos) {
		let limit = expando.getAttribute('data-expando-limit');
		if(expando.scrollHeight < limit) {
			expando.classList.add('c-expando--innert');
		} else {
			expando.style.height = `${limit}px`;
			let btn = expando.getElementsByClassName('js-expando-button')[0];
			btn.addEventListener('click', toggleExpando.bind(btn));
		}
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
	for([optId, val] of Object.entries(userOpts['options'])) {
		document.getElementById(optId).value = val;
	}
	for([modId, modOpts] of Object.entries(userOpts['mods'])) {
		document.getElementById(modId).checked = true;
		document.getElementById(`js-${modId}-parent`).classList.add('mod--checked');
		
		for([optId, optVal] of Object.entries(modOpts)) {
			document.getElementById(optId).value = optVal;
		}
	}

	updateCss();
	return true;
}

document.getElementById('js-import-button').addEventListener('click', () => { importPreviousOpts(); });

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

		// Push to iframe
		else {
			pushCss(css);
		}

		// Remove Loader
		loader.loaded();
	}
}

// INITIALISE PAGE

let fetchData = fetchFile(dataJson, false);

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