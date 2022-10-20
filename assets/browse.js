// ================
// COMMON FUNCTIONS
// ================

// An extended filter class with search & sorting
class ExtendedFilters extends BaseFilters {
	constructor( items, selector = 'ID' ){
		super( items, selector );

		// Search Variables
		this.searchBar = document.getElementById('js-search');
		this.searchAttributes = ['data-title'];
		this.itemSearchCls = 'is-hidden-by-search';

		// Sort Variables
		this.sortContainer = document.getElementById('js-sorts');
		this.activeSort = [];
		this.sorts = {
			'title': {
				'attr': 'data-title',
				'default': 'ascending',
				'label': 'Title'
			},
			'author': {
				'attr': 'data-author',
				'default': 'ascending',
				'label': 'Author'
			},
			'date': {
				'attr': 'data-date',
				'default': 'descending',
				'label': 'Release Date'
			},
			'random': {
				'attr': 'random',
				'label': 'Random'
			}
		}
	}

	initialiseSort( display = true ){
		if( display ){
			document.getElementById('js-sorts-parent').classList.remove('o-hidden');
		}

		for( let [key, info] of Object.entries(this.sorts) ){
			// Check that sort is valid and delete if not
			let valid = false;
			if( info.attr !== 'random' ){
				for( let item of this.items ){
					if( item.hasAttribute(info.attr) ){
						valid = true;
						break;
					}
				}
				if( !valid ){
					delete this.sorts[key];
					continue;
				}
			}

			// Render HTML
			let div = document.createElement('div');
			let link = document.createElement('a');
			let icon = document.createElement('i');

			div.className = 'dropdown__item';
			link.className = 'hyper-button';
			link.id = `sort:${key}`;
			link.textContent = `${info.label} `;
			icon.className = 'hyper-button__icon fa-solid fa-sort-asc o-hidden';

			link.appendChild(icon);
			div.appendChild(link);
			this.sortContainer.appendChild(div);

			this.sorts[key]['btn'] = link;
			this.sorts[key]['icon'] = icon;

			link.addEventListener('click', () => {
				this.sort(key);
			});
		}
	}

	initialiseSearch( ){
		this.searchBar.classList.remove('o-hidden');
		this.searchBar.addEventListener('input', () => { this.search(this.searchBar.value); } );
	}

	reset( ){
		this.resetTags();
		this.resetSearch();
	}
	resetSearch( ){
		query.remove('search');
		
		for( let item of this.items ){
			item.classList.remove(this.itemSearchCls);
		}
	}

	// Search
	search( input ){
		if( input.length > 0 ){
			query.set('search', input);
		}
		else {
			query.remove('search');
		}

		for( let item of this.items ){
			let match = false;
			for( let attr of this.searchAttributes ){
				let attrValue = item.getAttribute(attr);

				if( attrValue && attrValue.toLowerCase().includes( input.toLowerCase() ) ){
					match = true;
					break;
				}
			}
			if( match ){
				item.classList.remove(this.itemSearchCls);
			}
			else {
				item.classList.add(this.itemSearchCls);
			}
		}
	}

	sort( key, forceOrder, updateQuery = true ) {
		let info = this.sorts[key];
		// returns false if sort key is invalid
		if( !info ){
			return false;
		}

		let attributes = [];
		let order = forceOrder ? forceOrder : info.default;

		// check if already sorted
		if( this.activeSort.length > 0 ){
			if( !(this.activeSort[0] === key) ) {
				this.sorts[this.activeSort[0]]['btn'].classList.remove('is-active');
				this.sorts[this.activeSort[0]]['icon'].classList.add('o-hidden');
			}
			else if( this.activeSort[1] === order ){
				order = (order === 'ascending') ? 'descending' : 'ascending';
			}
		}

		// update button
		info.btn.classList.add('is-active');
		if( key !== 'random' ) {
			info.icon.classList.remove('o-hidden', 'fa-sort-asc', 'fa-sort-desc');
			if( order === 'ascending' ){
				info.icon.classList.add('fa-sort-asc');
			}
			else {
				info.icon.classList.add('fa-sort-desc');
			}
		}

		// calculate sort
		for( let item of this.items ) {
			let value = item.getAttribute(info.attr);
			let id = item.id;
			attributes.push([value, id]);
		}

		if( key === 'random' ){
			let currentIndex = attributes.length, randomIndex;

			// While there remain elements to shuffle.
			while (currentIndex != 0) {

				// Pick a remaining element.
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex--;

				// And swap it with the current element.
				[attributes[currentIndex], attributes[randomIndex]] = [
				attributes[randomIndex], attributes[currentIndex]];
			}
		}
		else {
			attributes.sort((attrOne,attrTwo) => {
				let a = attrOne[0].toLowerCase();
				let b = attrTwo[0].toLowerCase();
				if( a < b && order === 'ascending' || a > b && order === 'descending' ){ return -1; }
				if( a > b && order === 'ascending' || a < b && order === 'descending' ){ return 1; }
				return 0;
			});
		}

		// Apply sort, set URL query, update variables

		for( i = 0; i < attributes.length; i++ ){
			let id = attributes[i][1];
			document.getElementById(id).style.order = i;
		}

		if( updateQuery ){
			query.set('sort', key);
			query.set('sortdir', order);
		}

		this.activeSort = [key, order];

		return true;
	}
}

// ==================
// ONE-TIME FUNCTIONS
// ==================

function renderCards( cardData ){
	// Render theme list
	for( let theme of cardData ){
		let themeName = theme.name ? theme.name : 'Untitled';
		let themeAuthor = theme.author ? theme.author : 'Untitled';
		let thisId = itemCount;
		
		if( !('url' in theme) ){
			loader.log(`[ERROR] Skipping theme ${themeName} due to missing "url" key.`);
			continue;
		}

		let cardParent = document.createElement('a');
		cardParent.className = 'browser__card';
		let cardUrl = `./theme?t=${theme.url}`;
		if( collectionUrls.length > 0 ){
			cardUrl += `&c=${collectionUrls.join('&c=')}`;
		}
		if( (megaUrls.length !== 1 && megaUrls[0] !== 'json/default.json') && megaUrls.length > 0 ){
			cardUrl += `&m=${megaUrls.join('&m=')}`;
		}
		cardParent.href = cardUrl;
		cardParent.setAttribute('data-title', themeName);
		cardParent.id = `card:${thisId}`;
		if( 'date' in theme ){
			if( !sorts.includes('data-date') ){
				sorts.push('data-date');
			}

			cardParent.setAttribute('data-date', theme.date);
		}
		else {
			cardParent.setAttribute('data-date', '0000-00-00');
		}
		if( 'author' in theme ){
			if( !sorts.includes('data-author') ){
				sorts.push('data-author');
			}

			cardParent.setAttribute('data-author', theme.author);
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

		function addTag( name, colour ){
			let tag = document.createElement('span');
			tag.className = 'card__tag';
			tag.textContent = name;
			if( colour ){
				tag.style.cssText = `--tag-accent: ${colour};`;
			}
			tagArea.appendChild(tag);
		}

		let typeName = capitalise(theme.type);
		if( theme.type === 'classic' ){
			addTag(typeName, '#5ad590');
		}
		else {
			addTag(typeName, '#72d3ea');
		}

		let releaseState = 'released';
		if( 'flags' in theme ){
			if( theme.flags.includes('beta') ){
				addTag('Beta', '#e37837');
				releaseState = 'beta';
			}
			else if( theme.flags.includes('alpha') ){
				addTag('Alpha', '#cecc47');
				releaseState = 'alpha';
			}
		}

		if( 'supports' in theme && theme.supports.length === 1 ){
			addTag(`${capitalise(theme.supports[0])} Only`, '#d26666');
		}
		
		if( 'image' in theme ){
			let image = document.createElement('img');
			image.className = 'card__image';
			image.src = theme.image;
			image.loading = 'lazy';
			display.appendChild(image);
		}
		else {
			display.classList.add('card__display--no-image');
		}

		document.getElementById('js-theme-list').appendChild(cardParent);
		cards.push(cardParent);

		// Add tags to sortable list
		tempTags = formatFilters(theme.tags);
		pushFilter(thisId, theme.type, 'list type');
		pushFilter(thisId, themeAuthor, 'author');
		pushFilter(thisId, releaseState, 'release state');

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

var itemCount = 0;
var sorts = ['data-title'];
var cards = [];

// Get data for all collections and call other functions

loader.text('Fetching data files...');

if( collectionUrls.length === 0 && megaUrls.length === 0 ){
	megaUrls.push('json/default.json');
}

// Accepts array of URLs to fetch then returns a promise once they have all loaded.
function fetchAllFiles( arrayOfUrls ){
	const files = [];
	for( let i = 0; i < arrayOfUrls.length; i++ ){
		files.push(fetchFile(arrayOfUrls[i], false));
	}
	return Promise.allSettled(files);
}

// Fetch mega collections and add any collection URLs to the list.
// Then, load each collection URL and render cards. 
fetchAllFiles(megaUrls)
.then((files) => {
	let failures = 0;
	let allCollectionUrls = structuredClone(collectionUrls);

	for( let i = 0; i < files.length; i++ ){
		let tempData = {};
		// Attempt to parse provided data.
		try {
			tempData = JSON.parse(files[i]['value']);
		} catch(e) {
			loader.logJsonError(`[ERROR] Failed to parse mega collection JSON.`, files[i]['value'], e, megaUrls[i]);
			failures++;
			continue;
		}

		if( !('collections' in tempData) ){
			loader.log(`[ERROR] Mega collection "${megaUrls[i]}" does not use correct format.`);
			continue;
		}

		if( tempData.collections.length === 0 ){
			loader.log(`[warn] Mega collection "${megaUrls[i]}" has no URLs!`);
			continue;
		}

		for( let url of tempData.collections ){
			allCollectionUrls.push(url);
		}
	}

	fetchAllFiles(allCollectionUrls)
	.then((files) => {
		loader.text('Rendering page...');

		let processing = [];

		// Process all files
		for( let i = 0; i < files.length; i++ ){
			let tempData = {};
			// Attempt to parse provided data.
			try {
				tempData = JSON.parse(files[i]['value']);
			} catch(e) {
				loader.logJsonError('[ERROR] Failed to parse collection JSON', files[i]['value'], e, allCollectionUrls[i]);
				failures++;
				continue;
			}

			processing.push(processJson(tempData, allCollectionUrls[i], 'collection'));
		}

		// Render & Sort Cards
		Promise.allSettled(processing)
		.then((allJson) => {
			if( failures >= files.length ){
				loader.failed(['Encountered a problem while parsing theme information.', 'json.parse']);
				throw new Error('too many failures');
			}
			else if( failures > 0 ){
				messenger.error('Encountered a problem while parsing theme information. Some themes may not have loaded.', 'json.parse');
			}

			for( let response of allJson ){
				let json = response.value;
				renderCards(json.themes);
			}

			loader.text('Filtering items...');
			
			// Create and load filters.
			var filter = new ExtendedFilters(cards, 'card:ID');

			if( itemCount <= 5 ){
				filter.initialiseSort(false);
			}
			else if( itemCount > 5 ){
				filter.initialiseSort(true);
				filter.initialiseSearch();

				let hasTags = false;
				for( let categoryTags of Object.values(tags) ){
					if( Object.keys(categoryTags).length > 0 ){
						hasTags = true;
						break;
					}
				}
				if( hasTags ){
					filter.initialiseTags(tags);
				}

				let tSearch = query.get('search');
				let tTags = query.get('tags');
				
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
			let attemptedSort = false;
			let tSort = query.get('sort');
			let tSortDir = query.get('sortdir') ? query.get('sortdir') : 'ascending';
			
			if( tSort ){
				attemptedSort = filter.sort(tSort, tSortDir, false);
			}
			else {
				attemptedSort = filter.sort('date', undefined, false)
			}
			if( attemptedSort === false ){
				filter.sort('random', undefined, false);
			}

			loader.loaded();
			startBrowseTutorial();
		});
	});
});

// Tutorial

function startBrowseTutorial( ){
	var tutorial = new InfoPopup;
	startTutorial([
		() => { tutorial.text('Welcome to the Theme Customiser browse page!<br/><br/>Click anywhere to continue.<br/>To escape, click "Dismiss".'); tutorial.show([document.scrollingElement.scrollWidth/2, 150], 'none'); },
		() => {
			if( document.querySelector('#js-search:not(.o-hidden)') ){
				tutorial.text('Looking for something in particular? Use the filters and search to narrow results.');
				tutorial.show(document.getElementById('js-search'), 'top');
			}
			else {
				return false;
			}
		},
		() => { tutorial.text('Trying to import a pre-made configuration? Click on this button to bring up the Import popup.'); tutorial.show(document.getElementById('js-import'), 'right'); },
		() => { tutorial.text('Once you\'ve found an interesting design, just click on it! The guide will continue on the theme page.'); tutorial.show([document.scrollingElement.scrollWidth/2, 220], 'left'); },
		() => { tutorial.hide() }
	]);
}