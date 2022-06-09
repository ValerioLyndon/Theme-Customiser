function setCss(css) {

}

function setColumns(columns) {
	let selectors = [];
	console.log(columns);

	for(let [column, enabled] of Object.entries(columns)) {
		if(!enabled) {
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
		if (event.origin === window.location.origin) {
			var push = event.data || event.message,
				type = push[0],
				content = push[1];

			if(type === 'css') {
				document.getElementById('custom-css').textContent = content;
			}
			else if(type ==='columns') {
	console.log('yes');
				setColumns(content);
			}
		}
	},
	false
);