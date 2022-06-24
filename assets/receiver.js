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
				document.getElementById('custom-css').textContent = content;
			}
			else if(type ==='columns') {
				setColumns(content);
			}
		}
	},
	false
);