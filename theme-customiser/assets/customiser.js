// Variables & Functions

var theme = {
	'name': 'Clarity'
}

// Basic page content

document.querySelector('.js-title').textContent = theme['name'];

// Remove loader once page content is loaded.

document.querySelector('.js-content').classList.add('loaded');

var loader = document.querySelector('.js-loader');
loader.classList.add('hidden');
setTimeout(function(){
	loader.remove();
}, 1500)