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

// Sort function

/* Activated by user on click of a button. Updates relevant UI elements then call sortItems. 
 * link
   - the clicked link/element
 * array
   - an array of arguments to pass directly to sortItems
 */
function selectSort(link, array) {
	// Add sort value to array if needed
	if(!array[2]) {
		array[2] = 'ascending';
	}

	// Check if currently sorted
	let currentSort = link.getAttribute('data-sort');

	// Remove all other sort styling
	let sortLinks = document.getElementsByClassName('js-sort');
	for(let l of sortLinks) {
		l.classList.remove('is-active');
		l.removeAttribute('data-sort');

		let icons = l.getElementsByClassName('js-sort-icon');
		for(let icon of icons) {
			icon.classList.add('o-hidden');
		}
	}

	// Correct array sorting if needed
	if(array[2] === 'descending' && currentSort === 'descending') {
		array[2] = 'ascending';
	} else if(array[2] === 'ascending' && currentSort === 'ascending') {
		array[2] = 'descending';
	}
	
	// Add styling to current item
	link.classList.add('is-active');
	let cls = array[2] === 'descending' ? 'js-descending' : 'js-ascending';
	link.getElementsByClassName(cls)[0].classList.remove('o-hidden');
	link.setAttribute('data-sort', array[2]);

	// Sort items.
	sortItems(...array);
}

// "items" var should be a DOM node list
function sortItems(items, attribute, order = 'ascending') {
	let attributes = [];

	for(let it of items) {
		let value = it.getAttribute(attribute),
			id = it.id.split(':')[1];
		attributes.push([value, id]);
	}

	attributes.sort((attrOne,attrTwo) => {
		a = attrOne[0].toLowerCase();
		b = attrTwo[0].toLowerCase();
		if(a < b && order === 'ascending' || a > b && order === 'descending') { return -1; }
		if(a > b && order === 'ascending' || a < b && order === 'descending') { return 1; }
		return 0;
	});

	// Apply sort order
	for(i = 0; i < attributes.length; i++) {
		let val = attributes[i][0],
			id = attributes[i][1];
		document.getElementById(`card:${id}`).style.order = i;
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
		cardParent.id = `card:${thisId}`;
		if('date' in theme) {
			if(!sorts.includes('data-date')) {
				sorts.push('data-date');
			}

			cardParent.setAttribute('data-date', theme['date']);
		} else {
			cardParent.setAttribute('data-date', '0000-00-00');
		}
		if('author' in theme) {
			if(!sorts.includes('data-author')) {
				sorts.push('data-author');
			}

			cardParent.setAttribute('data-author', theme['author']);
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
			renderTags(tags, [...Array(itemCount).keys()], 'card:ID');
		}

		// Add sort dropdown items and apply default sort
		var cards = document.getElementsByClassName('js-card');
		
		let titleLink = document.getElementById('js-sort-title')
		titleLink.addEventListener('click', () => { selectSort(titleLink, [cards, 'data-title']) });
		
		let dataLink = document.getElementById('js-sort-date')
		if(sorts.includes('data-date')) {
			dataLink.addEventListener('click', () => { selectSort(dataLink, [cards, 'data-date', 'descending']) });
			sortItems(cards, 'data-date', 'descending');
		} else {
			dataLink.parentNode.remove();
			sortItems(cards, 'data-title');
		}
		
		let authorLink = document.getElementById('js-sort-author')
		if(sorts.includes('data-author')) {
			authorLink.addEventListener('click', () => { selectSort(authorLink, [cards, 'data-author']) });
		} else {
			authorLink.parentNode.remove();
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