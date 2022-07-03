// ================
// COMMON FUNCTIONS
// ================

// Capitalises the first letter of every word. To capitalise sentences, set the divider to ".".
function capitalise(str, divider = ' ') {
	let words = str.split(divider);
	
	for(i = 0; i < words.length; i++) {
		let first = words[i].substring(0,1).toUpperCase(),
			theRest = words[i].substring(1);
		words[i] = first + theRest;
	}
	
	str = words.join(divider);
	return str;
}



// ==================
// ONE-TIME FUNCTIONS
// ==================

function renderCards(cardData) {
	// Render theme list
	for(let theme of cardData) {
		let cardParent = document.createElement('a');
		cardParent.className = 'browser__card';
		cardParent.href = `./theme?t=${theme['url']}&c=${collectionUrls.join('&c=')}`;

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

		let tagArea = document.createElement('div');
		tagArea.className = 'card__tag-list';
		display.appendChild(tagArea);

		function addTag(name, colour) {
			let tag = document.createElement('span');
			tag.className = 'card__tag';
			tag.textContent = name;
			if(colour) {
				tag.style.cssText = `--tag-accent: ${colour};`;
			}
			tagArea.appendChild(tag);
		}

		let typeName = capitalise(theme['type']);
		if(theme['type'] === 'classic') {
			addTag(typeName, '#5ad590');
		} else {
			addTag(typeName, '#5bb8ce');
		}

		if('flags' in theme) {
			if(theme['flags'].includes('beta')) {
				addTag('Beta', '#eea579');
			}
		}

		if('supports' in theme && theme['supports'].length === 1) {
			let tagSupport = document.createElement('span');
			tagSupport.className = 'card__tag';
			tagSupport.textContent = capitalise(`${theme['supports'][0]} only`);
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

// Get data for all collections and call other functions

const collectionFiles = [];

if(collectionUrls.length === 0) {
	collectionUrls.push(['./assets/collection.json']);
}

for(let i = 0; i < collectionUrls.length; i++) {
	collectionFiles.push(fetchFile(collectionUrls[i], false));
}

Promise.allSettled(collectionFiles)
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

			processJson(tempData, collectionUrls[i], 'collection')
			.then((processedJson) => {
				renderCards(processedJson['themes']);
			})
		}

		if(failures >= files.length) {
			loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
			throw new Error('too many failures');
		} else if(failures > 0) {
			messenger.error('Encountered a problem while parsing theme information. Some themes may not have loaded.', 'json.parse');
		}

		loader.loaded();
	});