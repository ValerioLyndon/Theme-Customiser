loader.text('Setting up developer tools...');

function sanitiseForHtml( text ){
	let dummy = document.createElement('div');
	dummy.textContent = text;
	return dummy.innerHTML;
}

// Common functions

class AdvancedEditor {
	constructor( parent = document.body, onChange = () => {} ){
		this.delay = setTimeout(null, 0);
		this.onChange = ()=>{
			clearTimeout(this.delay);
			this.delay = setTimeout(()=>{
				onChange();
			}, 300);
		}
		this.lines = [];
		// setup HTML
		this.container = document.createElement('div');
		this.container.className = 'advanced-editor';
		this.rawText = document.createElement('textarea');
		this.rawText.className = 'advanced-editor__interactable-text';
		this.rawText.wrap = 'off';
		this.lineContainer = document.createElement('div');
		this.lineContainer.className = 'advanced-editor__line-container';
		this.container.append(this.lineContainer);
		this.container.append(this.rawText);
		parent.prepend(this.container);

		// setup passthrough variables
		this.selectionStart = this.rawText.selectionStart;
		this.selectionEnd = this.rawText.selectionEnd;

		// add basic functions
		this.rawText.addEventListener('input', ev => {
			this.updateDisplay(ev);
			this.onChange();
		});
		this.rawText.addEventListener('scroll', () => {
			this.lineContainer.style.transform = `translate(${-this.rawText.scrollLeft}px, ${-this.rawText.scrollTop}px)`;
		});
		let keyPress = this.onKeyPress.bind(this);
		this.rawText.addEventListener('focusin', () => {
			this.rawText.addEventListener('keydown', keyPress);
		});
		this.rawText.addEventListener('focusout', () => {
			this.rawText.removeEventListener('keydown', keyPress);
		});
	}

	updateDisplay( event ){
		const lines = this.rawText.value.split('\n');
		const maxLines = 1 > lines.length ? 1 : lines.length > this.lines.length ? lines.length : this.lines.length;

		// if the update only affects one line, reduce lag by only updating that one
		let startLine = 0;
		let endLine = maxLines;
		// checks if the operation was added via normal input and if it added a line
		if( event && event.inputType === 'insertText' && lines.length === this.lineCount ){
			let substr = this.rawText.value.substring(0, this.selStart);
			startLine = (substr.match(/\n/g) || []).length;
			endLine = startLine + 1;
		}

		for( let i = startLine; i < endLine; i++ ){
			// if dom line is no longer needed, remove
			if( i >= lines.length ){
				this.lineContainer.children[lines.length].remove();
				this.lines.pop(lines.length);
				continue;
			}

			// if dom line does not exist, add
			const newText = lines[i];
			const newLine = this.renderLine(newText);

			if( i >= this.lines.length ){
				this.lineContainer.append(newLine);
				this.lines.push(newText);
				continue;
			}

			// if both lines exist, compare raw and dom texts to determine if it needs updating
			const domText = this.lines[i];
			if( newText === domText ){
				continue;
			}

			this.lineContainer.children[i].replaceWith(newLine);
			this.lines[i] = newText;
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

	renderLine( text ){
		let line = document.createElement('div');
		line.className = 'advanced-editor__line';

		let lineNum = document.createElement('div');
		lineNum.className = 'advanced-editor__line-num';
		this.lineContainer.append(lineNum);
		
		let lineText = document.createElement('div');
		lineText.className = 'advanced-editor__line-text';

		text = sanitiseForHtml(text);

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
		lineText.innerHTML = text;
		line.append(lineNum,lineText);

		return line;
	}

	value( text ){
		if( isString(text) ){
			this.rawText.value = text;
			this.updateDisplay();
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

		this.selStart = this.rawText.selectionStart;
		this.lineCount = this.rawText.value.split('\n').length;

		// handle 
		if( key === 'Tab' ) {
			keyPress.preventDefault();
			this.insertAtCursor( '\t' );
			this.onChange();
		}
		else if( key === 'Enter' ){
			keyPress.preventDefault();

			let currentLine = this.value().substr( 0, this.selStart ).match(/\n([^\n]*)$/);
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
		fail(`JSON must have a "json_version" key. Please place one at the start of the file. Example:\n<code class="code code--block">{\n\t"json_version": 0.3\n}</code>`);
		return false;
	}
	else if( json['json_version'] < jsonVersion ){
		warn(`JSON's version, as defined by "json_version" key, is behind the current version of ${jsonVersion}. Please use <a class="hyperlink" onclick="toggleEle('#js-pp-update-json')">JSON updater</a>.`);
		return false;
	}
	else if( json['json_version'] > jsonVersion ){
		warn(`JSON's version, as defined by "json_version" key, is <b>ahead</b> of the version ${jsonVersion} supported by this Customiser instance.`);
		return false;
	}

	// json type
	else if( !('themes' in json) && !('data' in json) && !('collections' in json) ){
		fail(`JSON has no readable data. Please add a <code class="code">data</code> key for theme JSON, <code class="code">themes</code> key for collection JSON, or <code class="code">collections</code> key for mega collection JSON.`);
		return false;
	}

	try {
		Validate.permissive = false;
		Validate.json(json);
	}
	catch( e ){
		fail(e);
		return false;
	}

	good( json );
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
	.then( processedJson =>{
		output.value = JSON.stringify(processedJson, undefined, '\t');
	})
	.catch( err =>{
		messenger.error(`Failed to update the JSON.`, err.message);
	});
}

function encodeJson( ){
	let raw = document.getElementById('js-format-text__in').value,
		formattedEle = document.getElementById('js-format-text__out');

	let formatted = JSON.stringify(raw);
	formattedEle.value = formatted.substring(1, formatted.length-1);
}

function decodeJson( ){
	let rawEle = document.getElementById('js-format-text__in'),
		formatted = document.getElementById('js-format-text__out').value;

	if( formatted[0] !== '"' || formatted[formatted.length-1] !== '"' ){
		formatted = '"' + formatted + '"';
	}
	rawEle.value = JSON.parse(formatted);
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
let popup = new InfoPopup;
let tutorial = new Tutorial('the Customiser\'s developer mode', [
	() => {
		popup.text('The developer mode is meant for assistance in interfacing a CSS theme with the Customiser, <b>not</b> for creating new CSS themes.');
		popup.show([document.scrollingElement.scrollWidth/2, 150], 'none');
	},
	()=>{
		let target = document.querySelector('.js-tutorial-docs')
		popup.text('I highly recommended reading the documentation for guidance on writing JSON.');
		popup.show(target, 'top');
		tutorial.highlightElement(target);
	},
	()=>{
		let target = document.querySelector('.js-tutorial-tools')
		popup.text('You will find a few tools in the top bar which make common tasks easier.');
		popup.show(target, 'top');
		tutorial.highlightElement(target);
	},
	()=>{
		let target = document.querySelector('.js-tutorial-update')
		popup.text('It\'s much quicker to use the built-in updating tool than manually keeping up with the most recent changes. Just be sure to read the wiki for any issues you encounter!');
		popup.show(target, 'top');
		tutorial.highlightElement(target);
	},
	()=>{
		popup.text('Thanks for checking out the dev tools! If you make anything, please reach out so that it can be added to the default collections.');
		popup.show([document.scrollingElement.scrollWidth/2, 150], 'none');
	},
	() => {
		popup.destruct();
	}
]);
tutorial.start();

loader.loaded();