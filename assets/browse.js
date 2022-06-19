// ================
// COMMON FUNCTIONS
// ================


// ==================
// ONE-TIME FUNCTIONS
// ==================

function renderCards(cardData, orderedDataUrls) {
	// Render theme list
	for(let [themeId, theme] of Object.entries(cardData)) {
		let cardParent = document.createElement('a');
		cardParent.className = 'browser__card';
		cardParent.href = `./theme?q=${themeId}&data=${orderedDataUrls.join('&data=')}`;

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
		
		if('image' in theme) {
			let image = document.createElement('img');
			image.className = 'card__image';
			image.src = theme['image'];
			display.appendChild(image);
		} else {
			display.classList.add('card__display--no-image');
		}

		document.getElementById('js-theme-list').appendChild(cardParent);
	}
}



// BEGIN PROGRAM & INITIALISE PAGE

// Variables

let theme = query.get('q') || query.get('theme');
if(theme) {
	window.location = `./theme?q=${theme}&data=${dataUrls.join('&data=')}`;
	throw new Error();
}

// Get data for all themes and call other functions

const dataFiles = [];

for(let i = 0; i < dataUrls.length; i++) {
	dataFiles.push(fetchFile(dataUrls[i], false));
}

Promise.allSettled(dataFiles)
	.then((files) => {
		let failures = 0;

		for(let i = 0; i < files.length; i++) {
			let tempData = {};
			// Attempt to parse provided data.
			try {
				tempData = JSON.parse(files[i]['value']);
			} catch(e) {
				console.log(`[fetchData] Error during JSON.parse: ${e}`);
				failures++;
				continue;
			}

			// Put the relevant dataUrl at the beginning so the theme will read the correct one
			let orderedDataUrls = dataUrls;
			if(i > 0) {
				let temp = orderedDataUrls[i];
				orderedDataUrls.splice(i, 1);
				orderedDataUrls.unshift(temp);
			}

			renderCards(tempData, orderedDataUrls);
		}

		if(failures >= files.length) {
			loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
			throw new Error('too many failures');
		} else if(failures > 0) {
			messenger.error('Encountered a problem while parsing theme information. Some themes may not have loaded.', 'json.parse');
		}

		loader.loaded();
	});