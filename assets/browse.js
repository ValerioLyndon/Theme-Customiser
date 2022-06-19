// ================
// COMMON FUNCTIONS
// ================

// BEGIN PROGRAM & INITIALISE PAGE

// Variables

var query = (new URL(document.location)).searchParams,
	dataJson = query.get('data'),
	data = null,
	loader = new loadingScreen(),
	messenger = new messageHandler();

if(dataJson === null) {
	dataJson = './assets/data.json';
}

let theme = query.get('q') || query.get('theme');
if(theme) {
	window.location = `/theme?q=${theme}&data=${dataJson}`;
	throw new Error();
}


// ==================
// ONE-TIME FUNCTIONS
// ==================

function renderHtml() {
	// Render theme list
	for(let [themeId, theme] of Object.entries(data)) {
		let cardParent = document.createElement('a');
		cardParent.className = 'browser__card';
		cardParent.href = `./theme?q=${themeId}&data=${dataJson}`;

		let card = document.createElement('div');
		card.className = 'card';
		cardParent.appendChild(card);

		let info = document.createElement('div');
		info.className = 'card__info';
		card.appendChild(info);
		
		let title = document.createElement('h3');
		title.className = 'card__title';
		title.textContent = theme['name'];
		info.appendChild(title);
		
		let author = document.createElement('span');
		author.className = 'card__author';
		author.textContent = `by ${theme['author']}`;
		info.appendChild(author);

		let display = document.createElement('div');
		display.className = 'card__display';
		card.appendChild(display);

		let tagArea = document.createElement('span');
		tagArea.className = 'card__tag-list';
		display.appendChild(tagArea);

		let tagType = document.createElement('span');
		tagType.className = 'card__tag';
		tagType.textContent = theme['type'];
		tagArea.appendChild(tagType);

		if('supports' in theme && theme['supports'].length === 1) {
			let tagSupport = document.createElement('span');
			tagSupport.className = 'card__tag';
			tagSupport.textContent = `${theme['supports'][0]} only`;
			tagArea.appendChild(tagSupport);
		}
		
		let image = document.createElement('img');
		image.className = 'card__image';
		image.textContent = theme['type'];
		if('image' in theme) {
			image.src = theme['image'];
		} else {
			image.classList.add('card__image--blank');
		}
		display.appendChild(image);

		document.getElementById('js-theme-list').appendChild(cardParent);
	}
}



// Get data for all themes and call other functions

let fetchData = fetchFile(dataJson, false);

fetchData.then((json) => {
	// Attempt to parse provided data.
	try {
		data = JSON.parse(json);
	} catch(e) {
		console.log(`[fetchData] Error during JSON.parse: ${e}`);
		loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
	}

	renderHtml();
	loader.loaded();
});

fetchData.catch((reason) => {
	loader.failed(reason);
});