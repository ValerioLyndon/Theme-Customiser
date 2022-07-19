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

// Filter & Sort functions

function filterByTag() {
	// Clear previous selection
	let hidden = document.querySelectorAll('.is-hidden-by-tag'),
		isSelected = this.className.includes('is-selected');
	for(let ele of hidden) {
		ele.classList.remove('is-hidden-by-tag');
	}

	// Remove other tags' styling & set our own
	tagsEle.classList.remove('has-selected');
	let selectedTags = document.querySelectorAll('.js-tag.is-selected');

	for(let tag of selectedTags) {
		tag.classList.remove('is-selected');
	}

	// Select new tags
	if(!isSelected) {
		tagsEle.classList.add('has-selected');
		let itemsToKeep = this.getAttribute('data-items').split(',');
		// convert string to int
		for(let i = 0; i < itemsToKeep.length; i++) {
			itemsToKeep[i] = parseInt(itemsToKeep[i]);
		}
		
		for(let itemId of [...Array(itemCount).keys()]) {
			itemId = parseInt(itemId);
			
			if(itemsToKeep.includes(itemId)) {
				continue;
			} else {
				document.querySelector(`[data-id="${itemId}"]`).classList.add('is-hidden-by-tag');
			}
		}
		this.classList.add('is-selected');
	}
}

// "items" var should be a DOM node list
function sortItems(items, attribute, order = 'ascending') {
	let attributes = [];

	for(let it of items) {
		let value = it.getAttribute(attribute),
			id = it.getAttribute('data-id');
		attributes.push([value, id]);
	}

	attributes.sort((attrOne,attrTwo) => {
		a = attrOne[0].toLowerCase();
		b = attrTwo[0].toLowerCase();
		if(a < b && order === 'ascending' || a > b && order === 'descending') { return -1; }
		if(a > b && order === 'ascending' || a < b && order === 'descending') { return 1; }
		return 0;
	});
	console.log(attributes)

	// Apply sort order
	for(i = 0; i < attributes.length; i++) {
		let val = attributes[i][0],
			id = attributes[i][1];
		document.querySelector(`[data-id="${id}"]`).style.order = i;
	}
}



// ==================
// ONE-TIME FUNCTIONS
// ==================

function renderCards(cardData) {
	// Render theme list
	for(let theme of cardData) {
		let themeName = theme['name'] ? theme['name'] : 'Untitled',
			themeAuthor = theme['author'] ? theme['author'] : 'Untitled',
			thisId = itemCount;
		if(!('url' in theme)) {
			console.log(`[renderCards] Skipping theme ${themeName} due to missing "url" key.`);
			continue;
		}

		let cardParent = document.createElement('a');
		cardParent.className = 'browser__card js-card';
		cardParent.href = `./theme?t=${theme['url']}&c=${collectionUrls.join('&c=')}`;
		cardParent.setAttribute('data-title', themeName);
		cardParent.setAttribute('data-id', thisId);
		if('date' in theme) {
			if(!sorts.includes('data-date')) {
				sorts.push('data-date');
			}

			cardParent.setAttribute('data-date', theme['date']);
		} else {
			cardParent.setAttribute('data-date', '0000-00-00');
		}

		let themeTags = theme['tags'] ? theme['tags'] : [];
		themeTags.push(theme['type']);
		cardParent.setAttribute('data-tags', themeTags);

		let card = document.createElement('div');
		card.className = 'card';
		cardParent.appendChild(card);

		let info = document.createElement('div');
		info.className = 'card__info';
		card.appendChild(info);
		
		let title = document.createElement('h3');
		title.className = 'card__title';
		title.textContent = themeName;
		info.appendChild(title);
		
		let author = document.createElement('span');
		author.className = 'card__author';
		author.textContent = `by ${themeAuthor}`;
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
			addTag(typeName, '#72d3ea');
		}

		if('flags' in theme) {
			if(theme['flags'].includes('beta')) {
				addTag('Beta', '#e37837');
			}
			else if(theme['flags'].includes('alpha')) {
				addTag('Alpha', '#cecc47');
			}
		}

		if('supports' in theme && theme['supports'].length === 1) {
			addTag(`${capitalise(theme['supports'][0])} Only`, '#d26666');
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

		for(let tag of themeTags) {
			if(tags[tag]) {
				tags[tag].push(thisId);
			} else {
				tags[tag] = [thisId];
			}
		}
		itemCount++;
	}
}

var tagsEle = document.getElementById('js-tags'),
	hidden;
function renderFilters() {
	tagsEle.classList.remove('o-hidden');

	let cloudEle = document.getElementById('js-tags__cloud');

	for(let [tag, itemIds] of Object.entries(tags)) {
		let tagEle = document.createElement('button'),
			countEle = document.createElement('span'),
			count = itemIds.length;

		tagEle.textContent = tag;
		tagEle.className = 'tags__tag js-tag';
		tagEle.setAttribute('data-items', itemIds);

		countEle.textContent = count;
		countEle.className = 'tags__count';

		tagEle.addEventListener('click', filterByTag.bind(tagEle));
		tagEle.appendChild(countEle);
		cloudEle.appendChild(tagEle);
	}
}



// BEGIN PROGRAM & INITIALISE PAGE

// Variables

var tags = {},
	itemCount = 0,
	sorts = ['data-title'];

// Get data for all collections and call other functions

loader.text('Fetching data files...');

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

		loader.text('Rendering page...');

		processJson(tempData, collectionUrls[i], 'collection')
		.then((processedJson) => {
			renderCards(processedJson['themes']);
			if(i === files.length - 1) {
				afterRenderingCards();
			}
		})
	}

	function afterRenderingCards() {
		loader.text('Sorting items...');

		if(Object.keys(tags).length > 0 && itemCount > 5) {
			renderFilters();
		}

		var cards = document.getElementsByClassName('js-card');
		console.log(sorts);
		if(sorts.includes('data-date')) {
			console.log('sorting by data');
			sortItems(cards, 'data-date', 'descending');
		} else {
			console.log('sorting by title');
			sortItems(cards, 'data-title');
		}

		if(failures >= files.length) {
			loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
			throw new Error('too many failures');
		} else if(failures > 0) {
			messenger.error('Encountered a problem while parsing theme information. Some themes may not have loaded.', 'json.parse');
		}

		loader.loaded();
	}
});