// Preview-only HTML - replicating default functionality

function toggle(defaultDisplay = 'block') {
	if(this.style.display === 'none' || this.style.display === '') {
		this.style.display = defaultDisplay;
	} else {
		this.style.display = 'none';
	}
}

// Category buttons

var categoryButtons = document.getElementsByClassName('status-button');
var categories = {
	7: 'All Anime',
	1: 'Currently Watching',
	2: 'Completed',
	3: 'On Hold',
	4: 'Dropped',
	6: 'Plan To Watch'
}

function changeCategory() {
	var catId = this.href.substring(button.href.length - 1),
		catClass = this.className.substring(14),
		catName = categories[catId];
	
	document.body.setAttribute('data-query',`{"status":${catId}}`);
	document.querySelector('.status-button.on').classList.remove('on');
	this.classList.add('on');
	document.getElementsByClassName('list-unit')[0].className = `list-unit ${catClass}`;
	document.querySelector('.list-status-title .text').textContent = catName.toUpperCase();
}
for(var button of categoryButtons) {
	button.addEventListener('click', changeCategory.bind(button));
}

// Fixed header

var statusMenu = document.getElementById('status-menu'),
	affixAtPos = statusMenu.getBoundingClientRect().y + window.scrollY;



window.addEventListener('scroll', () => {
	if(!statusMenu.className.includes('fixed')) {
		affixAtPos = statusMenu.getBoundingClientRect().y + window.scrollY;
	}

	if(window.scrollY >= affixAtPos) {
		statusMenu.classList.add('fixed');
	} else {
		statusMenu.classList.remove('fixed');
	}
})

// List Items

var items = document.getElementsByClassName('list-item');

for(var item of items) {
	// More button
	let more = item.getElementsByClassName('more-info')[0];
	item.querySelector('.more a').addEventListener('click', toggle.bind(more, 'table-row'));
}

// Filter overlay

let filterMenu = document.getElementById('advanced-options');
document.getElementById('advanced-options-button').addEventListener('click', () => {
	toggleMenu(filterMenu);
});
document.querySelector('#advanced-options #fancybox-close').addEventListener('click', () => {
	toggleMenu(filterMenu);
});

function toggleMenu(dom) {
	let display = dom.style.display;
	if(!display || display === 'none') {
		dom.style.display = 'block';
		toggleOverlay(true);
	} else {
		dom.style.display = 'none';
		toggleOverlay(false);
	}
}

let overlay = document.getElementById('fancybox-overlay');
function toggleOverlay(set = undefined) {
	let display = overlay.style.display;
	if(set === true || !display || display === 'none') {
		overlay.style.display = 'block';
		overlay.style.opacity = '0.3';
		overlay.style.backgroundColor = 'rgb(102, 102, 102)';
	}
	else {
		overlay.style.display = 'none';
	}
}