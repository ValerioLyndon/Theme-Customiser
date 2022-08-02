// Customiser-related code
function setColumns(columns) {
	let selectors = [];

	for(let [column, enabled] of Object.entries(columns)) {
		// Add selector for removal if the item is optional or disabled
		if(enabled === null && selectors.length < 7 && Math.round(Math.random()) === 1
		|| enabled === false) {
			selectors.push(`[tc-column="${column}"]`);
		}
	}

	for(sel of selectors) {
		for(ele of document.querySelectorAll(sel)) {
			ele.remove();
		}
	}
}

// Listen for messages from customiser.js
window.addEventListener(
	"message",
	function (event) {
		if(event.origin === window.location.origin) {
			console.log('[receiver.js] Message received.');
			var push = event.data || event.message,
				type = push[0],
				content = push[1];

			if(type === 'css') {
				document.getElementById('custom-css').textContent = previewCss(content);
			}
			else if(type === 'columns') {
				setColumns(content);
			}
			else if(type === 'view') {
				setView(content);
			}
			else if(type === 'cover') {
				toggleCover(content);
			}
			else {
				console.log('[receiver.js] Malformed request received. No action taken.')
			}
		}
	},
	false
);

function previewCss(css) {
	// Replace relative URLs with absolute
	css = css.replaceAll('url(/', 'url(https://myanimelist.net/');

	return css;
}