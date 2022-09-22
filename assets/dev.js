loader.loaded();

// Common functions

// yes i took this from StackOverflow https://stackoverflow.com/questions/11076975/how-to-insert-text-into-the-textarea-at-the-current-cursor-position
function insertAtCursor( myField, myValue ){
	if( myField.selectionStart || myField.selectionStart == '0' ){
		let startPos = myField.selectionStart;
		let endPos = myField.selectionEnd;
		// insert text
		myField.value = myField.value.substring(0, startPos)
			+ myValue
			+ myField.value.substring(endPos, myField.value.length);
		// fix selection
		myField.selectionStart = startPos + myValue.length;
		myField.selectionEnd = startPos + myValue.length;
	}
	else {
		myField.value += myValue;
	}
}


// JSON textarea

var input = document.getElementById('js-json'),
	notice = document.getElementById('js-json-notice'),
	renderer = document.getElementById('js-renderer');

input.addEventListener('focusin', () => {
	input.addEventListener('keydown', onKeyPress);
});
input.addEventListener('focusout', () => {
	input.removeEventListener('keydown', onKeyPress);
});
input.addEventListener('input', validate);

function onKeyPress( keyPress ){
	let key = keyPress['key'];

	// handle 
	if( key === 'Tab' ) {
		keyPress.preventDefault();
		insertAtCursor( input, '\t' );
		input.dispatchEvent(new Event('input'));
	}
	if( key === 'Enter' ){
		keyPress.preventDefault();

		let cursorPos = input.selectionStart,
			currentLine = input.value.substr( 0, cursorPos ).match(/\n([^\n]*)$/),
			startingWhitespace = currentLine && currentLine[1] ? currentLine[1].match(/^\s*/) : false;
		
		if( startingWhitespace ){
			insertAtCursor( input, '\n' + startingWhitespace );
		}
		else {
			insertAtCursor( input, '\n' );
		}

		input.dispatchEvent(new Event('input'));
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
	let storageString = {'date': Date.now(), 'editor': input.value};
	localStorage.setItem(`developer`, JSON.stringify(storageString));
}

function validate( ){
	let json = input.value;

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
	console.log(json);
}


// On page load

// load previous settings or clear if older than 4 hours (14,400,000ms).
let previousSettings = localStorage.getItem('developer');

if( previousSettings ){
	let data = JSON.parse(previousSettings);
	if(Date.now() - data['date'] > 14400000) {
		localStorage.removeItem('developer');
	}
	input.value = data['editor'];
	validate(data['editor']);
}