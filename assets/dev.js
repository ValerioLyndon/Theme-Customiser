loader.text('Setting up developer tools...');

function sanitiseForHtml( text ){
	let dummy = document.createElement('div');
	dummy.textContent = text;
	return dummy.innerHTML;
}

// Common functions

class AdvancedEditor {
	constructor( parent = document.body, onChange = () => {} ){
		this.onChange = onChange;
		// setup HTML
		this.container = document.createElement('div');
		this.container.className = 'advanced-editor';
		this.rawText = document.createElement('textarea');
		this.rawText.className = 'advanced-editor__interactable-text';
		this.rawText.wrap = 'off';
		this.scrollSync = document.createElement('div');
		this.visibleText = document.createElement('div');
		this.visibleText.className = 'advanced-editor__visible-text';
		this.lineContainer = document.createElement('div');
		this.lineContainer = document.createElement('div');
		this.lineContainer.className = 'advanced-editor__line-container';
		this.scrollSync.append(this.lineContainer);
		this.scrollSync.append(this.visibleText);
		this.container.append(this.scrollSync);
		this.container.append(this.rawText);
		parent.prepend(this.container);

		// setup passthrough variables
		this.selectionStart = this.rawText.selectionStart;
		this.selectionEnd = this.rawText.selectionEnd;

		// add basic functions
		this.rawText.addEventListener('input', () => {
			this.setVisible();
			this.onChange();
		});
		this.rawText.addEventListener('scroll', () => {
			this.scrollSync.style.transform = `translate(${-this.rawText.scrollLeft}px, ${-this.rawText.scrollTop}px)`;
		});
		let keyPress = this.onKeyPress.bind(this);
		this.rawText.addEventListener('focusin', () => {
			this.rawText.addEventListener('keydown', keyPress);
		});
		this.rawText.addEventListener('focusout', () => {
			this.rawText.removeEventListener('keydown', keyPress);
		});
	}

	setVisible( ){
		// check for errors and get location numbers
		let errorLine = -1;
		let errorChar = -1;
		try {
			JSON.parse(this.rawText.value);
		}
		catch( e ){
			try {
				let match = e.toString().match(/line ([0-9]*) column ([0-9]*)/);
				errorLine = match[1];
				errorChar = match[2];
			}
			catch{}
		}

		// let linted = this.rawText.value
		// 	.replaceAll(/([[{,][^[{]*?)(\"[^"]*\"[^":,]*)(:)/g, '$1<span style="color:#75bfff">$2</span>$3');
		this.lineContainer.replaceChildren();
		this.visibleText.replaceChildren();

		let lines = this.rawText.value.split('\n');
		for( let i = 0; i < lines.length; i++ ){
			let num = document.createElement('div');
			let text = lines[i];
			num.className = 'advanced-editor__line-num';
			num.textContent = i+1;
			this.lineContainer.append(num);

			let line = document.createElement('div');
			line.className = 'advanced-editor__line';
			line.id = `js-advanced-editor-${i+1}`;

			// sanitise text before changing HTML
			text = sanitiseForHtml(text);

			// if this is an error line, insert error info
			if( i === errorLine-1 && errorChar > -1 ){
				line.classList.add('advanced-editor__line--error');
				text = 
					text.substring(0, errorChar-1)
					+ '<span class="advanced-editor__error-char">'
					+ text.substring(errorChar-1, errorChar)
					+ '</span>'
					+ text.substring(errorChar, text.length);
			}

			// stylise tabs
			text = text.replaceAll('\t', '<span class="advanced-editor__tab">\t</span>');
			// stylise trailing space
			if( text.endsWith(' ') ){
				text = text.replace(/( +)$/, (match) => {
					let str = '';
					for( let char of match ){
						str += '<span class="advanced-editor__trailing"> </span>';
					}
					return str;
				});
			}
			
			// commit line
			line.innerHTML = text;
			this.visibleText.append(line);
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
		this.container.style.cssText = `--advanced-editor__line-width: ${w}px`;
	}

	value( text ){
		if( typeof text === 'string' ){
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

	onKeyPress( keyPress ){
		let key = keyPress['key'];

		// handle 
		if( key === 'Tab' ) {
			keyPress.preventDefault();
			this.insertAtCursor( '\t' );
			this.onChange();
		}
		else if( key === 'Enter' ){
			keyPress.preventDefault();

			let cursorPos = this.rawText.selectionStart;
			let currentLine = this.value().substr( 0, cursorPos ).match(/\n([^\n]*)$/);
			let startingWhitespace = currentLine && currentLine[1] ? currentLine[1].match(/^\s*/) : false;
			
			if( startingWhitespace ){
				this.insertAtCursor( '\n' + startingWhitespace );
			}
			else {
				this.insertAtCursor( '\n' );
			}

			this.onChange();
		}
	}
}


// JSON textarea

function fail( msg ){
	jsonValid = false;
	notice.innerHTML = msg;
	notice.classList.add('info-box--error');
	notice.classList.remove('o-hidden', 'info-box--warn');
}

function warn( msg ){
	jsonValid = true;
	notice.innerHTML = msg;
	notice.classList.add('info-box--warn');
	notice.classList.remove('o-hidden', 'info-box--error');
}

function good( json ){
	jsonValid = true;
	notice.classList.add('o-hidden');

	if( 'data' in json ){
		type = 'theme';
	}
	else if( 'themes' in json ){
		type = 'collection';
	}
	else if( 'collections' in json ){
		type = 'mega';
	}
}

function validate( ){
	json = editor.value();
	
	// save text to storage
	let storageString = {'date': Date.now(), 'editor': editor.value()};
	localStorage.setItem(`developer`, JSON.stringify(storageString));

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
		good( json );
	}
}

var editor = new AdvancedEditor( document.getElementById('js-json'), validate );
var notice = document.getElementById('js-json-notice');
var renderer = document.getElementById('js-renderer');



// Preview functions and habndlers

function renderPreview( ){
	iframeLoaded = false;
	if( type === 'theme' ){
		iframe.src = './theme?dynamic=1';
	}
	else {
		iframe.src = './?dynamic=1';
	}
	postToIframe(['json', json]);
}
document.getElementById('js-render').addEventListener('click', renderPreview);

var timer = undefined;
var lastJson = {};
function setRenderTimer( ){
	lastJson = json;
	timer = setTimeout(() => {
		if( jsonValid && json !== lastJson ){
			renderPreview();
		}
		setRenderTimer();
	}, 1000);
}

var preview = document.getElementById('js-preview'),
	iframe = document.createElement('iframe'),
	iframeLoaded = false,
	toPost = [],
	pageLoaded = false;

iframe.addEventListener('load', () => {
	iframeLoaded = true;
	if( toPost.length > 0 ){
		console.log(`[info] Posting backlogged message.`);
		postToIframe(toPost);
	}
});

iframe.className = 'preview__window preview__window--dynamic preview__window--dimmed';
preview.append(iframe);

function postToIframe(msg) {
	if(iframeLoaded) {
		iframe.contentWindow.postMessage(msg);
		return true;
	}
	toPost = msg;
	return false;
}



// Buttons

let autoRenderBtn = document.getElementById('js-auto-render');
autoRenderBtn.addEventListener('change', () => {
	if( autoRenderBtn.checked ){
		setRenderTimer();
	}
	else {
		clearTimeout(timer);
	}
});

function resetEditor( ){
	userConfirm('Clear everything from the editor and start over with the template JSON?')
	.then((choice) => {
		if( choice ){
			localStorage.removeItem('developer');
			editor.value(templateJson);
			validate()
		}
	})
}



// Tools

function updatePopupJson( ){
	let text = document.getElementById('js-update-json__in').value,
		output = document.getElementById('js-update-json__out'),
		json = false;

	output.value = '';

	try {
		json = JSON.parse(text);
	}
	catch {
		messenger.error('Input JSON appears to be invalid. Please validate it using the primary editor, fix any issues, and try again.', 'json.parse');
		return false;
	}

	let toReturn = 'theme';
	if( 'themes' in json ){
		toReturn = 'collection';
	}
	else if( 'collections' in json ){
		toReturn = 'mega';
	}
	else {
		toReturn = 'theme';
	}

	processJson( json, '', toReturn )
	.then( (processedJson) => {
		if( processedJson === false ){
			messenger.error('Failed to update the JSON.', 'process.generic');
		}
		else if( typeof processedJson === 'string' ){
			messenger.error(processedJson, 'process.caught');
		}
		else {
			output.value = JSON.stringify(processedJson, undefined, '\t');
		}
	});
}

function formatPopupCss( ){
	let css = document.getElementById('js-format-text__in').value,
		output = document.getElementById('js-format-text__out');

	output.value = JSON.stringify(css);
}


// On page load

var type = 'theme';
var json = {};
var jsonValid = true;

const templateJson = `{
	"json_version": 0.3,
	"data": {
		"name": "Your Theme Name",
		"author": "Your Name",
		"type": "modern"
	}
}`;

// load previous settings or clear if older than 4 hours (14,400,000ms).
let previousSettings = localStorage.getItem('developer');

if( previousSettings ){
	let data = JSON.parse(previousSettings);
	if(Date.now() - data['date'] > 14400000) {
		localStorage.removeItem('developer');
	}
	editor.value(data['editor']);
}
else {
	editor.value(templateJson);
}

validate(editor.value());
renderPreview();
setRenderTimer();
var tutorial = new InfoPopup;
startTutorial([
	() => {
		tutorial.text('Welcome to the Customiser\'s developer mode. This is meant for assistance in interfacing a CSS theme with the Customiser, <b>not</b> for creating new CSS themes.<br><br>Please see the documentation for correct use of this tool.');
		tutorial.show([document.scrollingElement.scrollWidth/2, 150], 'none');
	},
	() => {
		tutorial.destruct();
	}
]);

loader.loaded();