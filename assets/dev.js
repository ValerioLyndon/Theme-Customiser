loader.loaded();

// Common functions

class AdvancedEditor {
	constructor( parent = document.body ){
		// setup HTML
		this.container = document.createElement('div');
		this.container.className = 'ae';
		this.rawText = document.createElement('textarea');
		this.rawText.className = 'ae-raw';
		this.rawText.wrap = 'off';
		this.scrollSync = document.createElement('div');
		this.visibleText = document.createElement('div');
		this.visibleText.className = 'ae-vis';
		this.lineContainer = document.createElement('div');
		this.lineContainer = document.createElement('div');
		this.lineContainer.className = 'ae-lines';
		this.scrollSync.appendChild(this.lineContainer);
		this.scrollSync.appendChild(this.visibleText);
		this.container.appendChild(this.scrollSync);
		this.container.appendChild(this.rawText);
		parent.prepend(this.container);

		// setup passthrough variables
		this.selectionStart = this.rawText.selectionStart;
		this.selectionEnd = this.rawText.selectionEnd;

		// add basic functions
		this.rawText.addEventListener('input', () => {
			try {
				JSON.parse(this.rawText.value);
				this.setVisible();
			}
			catch( e ){
				try {
					let match = e.toString().match(/line ([0-9]*) column ([0-9]*)/);
					this.showError( match[1], match[2] );
				}
				catch{
					this.setVisible();
				}
			}
		});
		this.rawText.addEventListener('scroll', () => {
			this.scrollSync.style.transform = `translate(${-this.rawText.scrollLeft}px, ${-this.rawText.scrollTop}px)`;
		});
	}

	setVisible( ){
		// let linted = this.rawText.value
		// 	.replaceAll(/([[{,][^[{]*?)(\"[^"]*\"[^":,]*)(:)/g, '$1<span style="color:#75bfff">$2</span>$3');

		this.visibleText.textContent = this.rawText.value;
		let lines = this.rawText.value.split('\n');
		for( let i = 0; i < lines.length; i++ ){
			let line = document.createElement('div');
			line.className = 'ae-line';
			line.textContent = i+1;
			this.lineContainer.appendChild(line);
		}
		
		let w = 18;
		if( lines.length < 100 ){
			w = 18;
		}
		if( lines.length > 100 ){
			w = 24;
		}
		else if( lines.length > 1000 ){
			w = 30;
		}
		this.container.style.cssText = `--ae-line-width: ${w}px`;
	}

	showError( line, column ){
		let lines = this.rawText.value.split('\n');
		let errorLine = lines[line-1];
		lines[line-1] = errorLine.substring(0, column-2)
		            + '<span class="ae-t-error">'
					+ errorLine.substring(column-2, column)
					+ '</span>'
					+ errorLine.substring(column, errorLine.length);
					console.log(errorLine.substring(0, column-1),
					errorLine.substring(column-1, 1),
					errorLine.substring(column, errorLine.length))
		let highlighted = lines.join('\n');
		this.visibleText.innerHTML = highlighted;
	}

	value( text ){
		if( text !== 'undefined' && typeof text === 'string' ){
			this.rawText.value = text;
			this.setVisible();
		}

		return this.rawText.value;
	}

	// yes i took this from StackOverflow https://stackoverflow.com/questions/11076975/how-to-insert-text-into-the-textarea-at-the-current-cursor-position
	insertAtCursor( myValue ){
		if( this.rawText.selectionStart || this.rawText.selectionStart == '0' ){
			let startPos = this.rawText.selectionStart;
			let endPos = this.rawText.selectionEnd;
			// insert text
			this.value(
				this.rawText.value.substring(0, startPos)
				+ myValue
				+ this.rawText.value.substring(endPos, this.rawText.value.length)
			);
			// fix selection
			this.rawText.selectionStart = startPos + myValue.length;
			this.rawText.selectionEnd = startPos + myValue.length;
		}
		else {
			this.value(myValue);
		}
	}
}



// JSON textarea

var editor = new AdvancedEditor( document.getElementById('js-json') ),
	notice = document.getElementById('js-json-notice'),
	renderer = document.getElementById('js-renderer');

editor.rawText.addEventListener('focusin', () => {
	editor.rawText.addEventListener('keydown', onKeyPress);
});
editor.rawText.addEventListener('focusout', () => {
	editor.rawText.removeEventListener('keydown', onKeyPress);
});
editor.rawText.addEventListener('input', validate);

function onKeyPress( keyPress ){
	let key = keyPress['key'];

	// handle 
	if( key === 'Tab' ) {
		keyPress.preventDefault();
		editor.insertAtCursor( '\t' );
		validate();
	}
	if( key === 'Enter' ){
		keyPress.preventDefault();

		let cursorPos = editor.rawText.selectionStart,
			currentLine = editor.value().substr( 0, cursorPos ).match(/\n([^\n]*)$/),
			startingWhitespace = currentLine && currentLine[1] ? currentLine[1].match(/^\s*/) : false;
		console.log(currentLine, startingWhitespace)
		if( startingWhitespace ){
			editor.insertAtCursor( '\n' + startingWhitespace );
		}
		else {
			editor.insertAtCursor( '\n' );
		}

		validate();
	}
}

function fail( msg ){
	notice.innerHTML = msg;
	notice.classList.add('info-box--error');
	notice.classList.remove('o-hidden', 'info-box--warn');
}

function warn( msg ){
	notice.innerHTML = msg;
	notice.classList.add('info-box--warn');
	notice.classList.remove('o-hidden', 'info-box--error');
}

function good( json ){
	notice.classList.add('o-hidden');

	let type = 'theme';
	if( 'themes' in json ){
		type = 'collection';
	}
	if( 'collections' in json ){
		type = 'mega';
	}
	renderPreview( type, json );
	
	// save text to storage
	let storageString = {'date': Date.now(), 'editor': editor.value()};
	localStorage.setItem(`developer`, JSON.stringify(storageString));
}

function validate( ){
	let json = editor.value();

	// attempt parsing
	try {
		json = JSON.parse(json);
	}
	catch( e ){
		fail(e);
		return false;
	}

	// version
	if( !('json_version' in json) ){
		fail(`JSON must have a "json_version" key. Please place one at the start of the file. Example:\n<code class="code code--block">{\n\t"json_version": 0.3\n}</code>`)
	}
	else if( json['json_version'] < jsonVersion ){
		warn(`JSON's version, as defined by "json_version" key, is behind the current version of ${jsonVersion}. Please use <a class="hyperlink" onclick="toggleEle('#js-pp-update-json')">JSON updater</a>.`)
	}
	else if( json['json_version'] > jsonVersion ){
		warn(`JSON's version, as defined by "json_version" key, is <b>ahead</b> of the version ${jsonVersion} supported by this Customiser instance.`)
	}

	// json type
	else if( !('themes' in json) && !('data' in json) && !('collections' in json) ){
		fail(`JSON has no readable data. Please add a <code class="code">data</code> key for theme JSON, <code class="code">themes</code> key for collection JSON, or <code class="code">collection</code> key for mega collection JSON.`)
	}

	// if everything good
	else {
		good(json);
	}
}

function renderPreview( type, json ){
	if( type === 'theme' ){
		renderer.innerHTML = `
					<div class="sidebar__section sidebar__section--top">
						<h1 class="title">Parsed Information</h1>
						<div>Theme Name: <span id="js-title">Loading theme...</span> <span class="theme-tag o-hidden" id="js-theme-tag"></span></div>
						<div>Theme Author: <span id="js-author">unknown author</span></div>
					</div>
					
					<div class="sidebar__section">
						<div id="js-options">
							<h3 class="sidebar__header">Theme options</h3>

							<!-- options gets put here by customiser.js -->
						</div>
					</div>

					<div class="sidebar__section">
						<div id="js-mods">
							<h3 class="sidebar__header">
								Theme modifications
								<div class="sidebar__header-aside">
									<button type="button" class="button o-hidden" id="js-tags__button" onclick="toggleEle('#js-tags__cloud', this)">
										<i class="fa-solid fa-tags"></i> Filters
									</button>
								</div>
							</h3>

							<div class="tag-cloud is-hidden" id="js-tags__cloud">
								<small class="tag-cloud__blurb">Select a subject that interests you to narrow results.</small>
							</div>
							
							<!-- mods gets put here by customiser.js -->
						</div>
					</div>

					<span class="o-hidden" id="js-theme-credit"></span>
			`;

		theme = json['data'];
		tags = {};
		renderTheme();
	}
	else {
		renderer.innerHTML = `<div class="browser" id="js-theme-list"></div>`;

		itemCount = 0;
		cards = [];

		if( type === 'mega' ){
			let collections = json['collections'];
			fetchAllFiles(collections)
			.then((files) => {
				for( let file of files ){
					let json = JSON.parse(file['value']);
					renderCards(Object.values(json['themes']));
				}
			})
		}
		else if( type === 'collection' ){
			renderCards(Object.values(json['themes']));
		}
	}
}


// On page load

// load previous settings or clear if older than 4 hours (14,400,000ms).
let previousSettings = localStorage.getItem('developer');

if( previousSettings ){
	let data = JSON.parse(previousSettings);
	if(Date.now() - data['date'] > 14400000) {
		localStorage.removeItem('developer');
	}
	editor.value(data['editor']);
	validate(data['editor']);
}
else {
	editor.value(`{
	"json_version": 0.3,
	"data": {
		"name": "Your Theme Name",
		"author": "Your Name"
	}
}`);
	validate(editor.value());
}