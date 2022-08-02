// Preview-only HTML - replicating default functionality

function toggle(defaultDisplay = 'block') {
	if(this.style.display === 'none' || this.style.display === '') {
		this.style.display = defaultDisplay;
	} else {
		this.style.display = 'none';
	}
}

// List Items

function getExpand(id) {
	let more = document.getElementById(`more${id}`);
	toggle.bind(more)();
}

// Category buttons

var categoryButtons = document.querySelectorAll('[class^="status_"]');
var categoryCodes = {
	7: 'all',
	1: 'current',
	2: 'completed',
	3: 'paused',
	4: 'dropped',
	6: 'planned'
}

function changeCategory() {
	let a = this.getElementsByTagName('a')[0],
		indexStart = a.href.indexOf('status=') + 7,
		indexEnd = indexStart + 1,
		catId = a.href.substring(indexStart, indexEnd);
	
	// Change basic attributes
	for(var button of categoryButtons) {
		button.className = 'status_not_selected';
	}
	this.className = 'status_selected';

	// Hide relevant tables
	let tables = document.getElementsByTagName('table');
	console.log(catId);
	for(let table of tables) {
		let tableCat = table.getAttribute('tc-category');
		if(catId === '7' || tableCat === categoryCodes[catId]) {
			table.style = '';
		} else if(tableCat === null) {
			continue;
		} else {
			table.style = 'display: none !important';
		}
	}
}
for(var button of categoryButtons) {
	button.addEventListener('click', changeCategory.bind(button));
}