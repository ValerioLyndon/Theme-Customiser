// Customiser-related code
function setColumns( columns ){
	let selectors = [];

	for( let [column, enabled] of Object.entries(columns) ){
		// Add selector for removal if the item is optional or disabled
		if(enabled === null && selectors.length < 7 && Math.round(Math.random()) === 1
		|| enabled === false) {
			selectors.push(`[tc-column="${column}"]`);
		}
	}

	for( sel of selectors ){
		for( ele of document.querySelectorAll(sel) ){
			ele.remove();
		}
	}
}

// Listen for messages from customiser.js
window.addEventListener(
	"message",
	function (event) {
		if( event.origin === window.location.origin ){
			let push = event.data || event.message;
			let type = push[0];
			let content = push[1];

			if( type === 'css' ){
				document.getElementById('custom-css').textContent = previewCss(content);
			}
			else if( type === 'columns' ){
				setColumns(content);
			}
			else if( type === 'view' ){
				setView(content);
			}
			else if( type === 'cover' ){
				toggleCover(content);
			}
			else if( type === 'style' ){
				console.log(`This option is still to do. Style #${content}`);
				//changeStyle(content);
			}
			else if( type === 'category' ){
				changeCategory(content);
			}
			else {
				console.log('[ERROR] Malformed request sent to iframe. No action taken.')
			}
		}
	},
	false
);

function previewCss( css ){
	let replacements = [
		// relative paths to absolute
		['url(/', 'url(https://myanimelist.net/'],
		// fontawesome tweaks
		[/"?fontawesome(?!\s?4)(?:\s?6\s?(?:free|pro))?"?/gi, '<<<FA_REPLACE>>>'],
		[/<<<FA_REPLACE>>>/gi, '"FontAwesome","FontAwesome 4.7.0"'],
		['\\e29e', '\\f017'], // timer
		['\\e3d6', '\\f149'], // arrow-turn-down-right
		['\\e211', '\\f044'], // edit-field
		['\\e0c0', '\\f518'] // book-open-cover
	]
	for( let [match, replace] of replacements ){
		css = css.replaceAll(match, replace);
	}
	css += `\n[class^="fa"]::before { font-family: "FontAwesome","FontAwesome 4.7.0"; }`;

	return css;
}