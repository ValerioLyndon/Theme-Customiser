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
			console.log(`[ERROR] Skipping theme ${themeName} due to missing "url" key.`);
			continue;
		}

		let cardParent = document.createElement('a');
		cardParent.className = 'browser__card';
		let cardUrl = `./theme?t=${theme['url']}`;
		if(collectionUrls.length > 0) {
			cardUrl += `&c=${collectionUrls.join('&c=')}`;
		}
		if(megaUrls.length > 0) {
			cardUrl += `&m=${megaUrls.join('&m=')}`;
		}
		cardParent.href = cardUrl;
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
			image.loading = 'lazy';
			display.appendChild(image);
		} else {
			display.classList.add('card__display--no-image');
		}

		document.getElementById('js-theme-list').appendChild(cardParent);
		cards.push(cardParent);

		// Add tags to sortable list
		tempTags = formatFilters(theme['tags']);
		tempTags['list type'] = [theme['type']];
		tempTags['author'] = [themeAuthor];

		for( let [category, tags] of Object.entries(tempTags) ){
			for( let tag of tags ){
				pushFilter(thisId, tag, category);
			}
		}
		itemCount++;
	}
}



// BEGIN PROGRAM & INITIALISE PAGE

// Variables

var itemCount = 0,
	sorts = ['data-title'],
	cards = [];

// Get data for all collections and call other functions

loader.text('Fetching data files...');

if(collectionUrls.length === 0 && megaUrls.length === 0) {
	megaUrls.push('json/default.json');
}

// Accepts array of URLs to fetch then returns a promise once they have all loaded.
function fetchAllFiles(arrayOfUrls) {
	const files = [];
	for(let i = 0; i < arrayOfUrls.length; i++) {
		files.push(fetchFile(arrayOfUrls[i], false));
	}
	return Promise.allSettled(files);
}

// Fetch mega collections and add any collection URLs to the list.
// Then, load each collection URL and render cards. 
fetchAllFiles(megaUrls)
.then((files) => {
	let failures = 0,
		allCollectionUrls = structuredClone(collectionUrls);

	for(let i = 0; i < files.length; i++) {
		let tempData = {};
		// Attempt to parse provided data.
		try {
			tempData = JSON.parse(files[i]['value']);
		} catch(e) {
			console.log(`[ERROR] Failed to parse mega collection JSON: ${e}`);
			failures++;
			continue;
		}

		if(!('collections' in tempData)) {
			console.log('[ERROR] Mega collection does not use correct format.');
			continue;
		}

		if(tempData['collections'].length === 0) {
			console.log('[warn] Mega collection has no URLs!');
			continue;
		}

		for(let url of tempData['collections']) {
			allCollectionUrls.push(url);
		}
	}

	fetchAllFiles(allCollectionUrls)
	.then((files) => {
		loader.text('Rendering page...');

		let processing = [];

		// Process all files
		for(let i = 0; i < files.length; i++) {
			let tempData = {};
			// Attempt to parse provided data.
			try {
				tempData = JSON.parse(files[i]['value']);
			} catch(e) {
				console.log(`[ERROR] Failed to parse collection JSON: ${e}`);
				failures++;
				continue;
			}

			processing.push(processJson(tempData, allCollectionUrls[i], 'collection'));
		}

		// Render & Sort Cards
		Promise.allSettled(processing)
		.then((allJson) => {
			for(let response of allJson) {
				let json = response['value'];
				renderCards(json['themes']);
			}

			loader.text('Filtering items...');

			// Create and load filters.
			if(itemCount > 5) {
				var filter = new filters(cards, 'card:ID');

				let hasTags = false;
				for(let categoryTags of Object.values(tags)) {
					if(Object.keys(categoryTags).length > 0) {
						hasTags = true;
						break;
					}
				}
				if( hasTags ){
					filter.renderTags(tags);
				}

				// Add sort functionality
				filter.renderSorts();

				// Add search functionality
				filter.renderSearch();

				let tSearch = query.get('search'),
					tTags = query.get('tags');
				
				if( tSearch ){
					filter.search( tSearch );
					filter.searchBar.value = tSearch;
				}
				if( tTags ){
					let splitTags = tTags.split('&&');
					for( let tag of splitTags ){
						document.getElementById(`tag:${tag}`).dispatchEvent( new Event('click') );
					}
				}
			}

			// Add sort dropdown items and apply default sort
			let attemptedSort = false,
				tSort = query.get('sort'),
				tSortDir = query.get('sortdir') ? query.get('sortdir') : 'ascending';
			
			if( tSort ){
				attemptedSort = filter.sort(tSort, tSortDir, false);
			}
			else {
				attemptedSort = filter.sort('date', undefined, false)
			}
			if( attemptedSort === false ){
				filter.sort('random', undefined, false);
			}

			if(failures >= files.length) {
				loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
				throw new Error('too many failures');
			} else if(failures > 0) {
				messenger.error('Encountered a problem while parsing theme information. Some themes may not have loaded.', 'json.parse');
			}

			loader.loaded();
		});
	});
});
