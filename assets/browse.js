'use strict';

// ================
// COMMON FUNCTIONS
// ================

// An extended filter class with search & sorting
class ExtendedFilters extends BaseFilters {
	constructor( items, selector = 'ID', saveToUrl = true ){
		super( items, selector, saveToUrl );

		// Search Variables
		this.searchBar = document.getElementById('js-search');
		this.searchAttributes = ['title'];
		this.itemSearchCls = 'is-hidden-by-search';
		this.searchTimeout = setTimeout(null, 0);

		// Sort Variables
		this.sortContainer = document.getElementById('js-sorts');
		this.activeSort = [];
		this.sorts = {
			'title': {
				'attr': 'title',
				'default': 'ascending',
				'label': 'Title'
			},
			'author': {
				'attr': 'author',
				'default': 'ascending',
				'label': 'Author'
			},
			'date': {
				'attr': 'date',
				'default': 'descending',
				'label': 'Date Released'
			},
			'dateAdded': {
				'attr': 'dateAdded',
				'default': 'descending',
				'label': 'Date Added'
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
					if( info.attr in item.dataset ){
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

		// Activate any previously active sort
		let previousSort = query.get('sort');
		let previousSortDir = query.get('sortdir') ? query.get('sortdir') : 'ascending';
		if( previousSort ){
			this.sort(previousSort, previousSortDir, false);
		}
	}

	initialiseSearch( ){
		this.searchBar.classList.remove('o-hidden');
		this.searchBar.addEventListener('input', () => { this.search(this.searchBar.value); } );

		// Activate any previously active search
		let previousSearch = query.get('search');
		if( previousSearch ){
			this.search( previousSearch );
			this.searchBar.value = previousSearch;
		}
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
		clearTimeout(this.searchTimeout);

		if( this.saveToUrl && input.length > 0 ){
			query.set('search', input);
		}
		if( input.length === 0 ) {
			query.remove('search');
			this.resetSearch();
			return;
		}

		// parse query
		const exclusionRegex = /(?:^|\s)+-(\w+)/g;
		const phraseRegex = /"([^"]+)"/g;
		let search = input.toLowerCase();

		let failMatches = search.matchAll(exclusionRegex);
		let exclusions = Array.from(failMatches).map( match => match[1] );
		search = search.replaceAll(exclusionRegex, '');

		let phraseMatches = search.matchAll(phraseRegex);
		let phrases = Array.from(phraseMatches).map( match => match[1] );

		search = search.replaceAll(/["']+/g, '');
		let words = search.replaceAll(phraseRegex, '').split(' ');
		search = search.replaceAll(/\s+/g, '');

		this.searchTimeout = setTimeout(()=>{
			for( let item of this.items ){
				let any = '';
				for( let attr of this.searchAttributes ){
					any += item.dataset[attr].toLowerCase();
				}
				let score = this.searchScore(any, search, phrases, words, exclusions);
				if( score > 1 ){
					item.classList.remove(this.itemSearchCls);
				}
				else {
					item.classList.add(this.itemSearchCls);
				}
			}
		}, 350);
	}

	searchScore( input, search, phrases, words, exclusions ){
		let score = 0;
		let inputWords = input.split(' ');
		input = input.replaceAll(/["'\s]+/g, '');

		// cannot match any exclusions
		for( let str of exclusions ){
			if( input.includes(str) ){
				return -1;
			}
		}

		// must match all phrases
		for( let phrase of phrases ){
			if( !(input.includes(phrase)) ){
				return 0;
			}
		}

		// if entire query matches, bump up score
		if( input.includes(search) ){
			score += 1 * (10 + (search.length / 2));
			console.log(input, 'added', score)
		}

		// can match any word
		for( let word of inputWords){
			if( word.length < 1 ){
				continue;
			}
			else if( word.length > 0 && words.includes(word) ){
				score += 7;
			}
		}
		for( let word of words ){
			if( word.length < 1 ){
				continue;
			}
			else if( input.includes(word) ){
				score += 7;
			}
			else {
				score -= 10;
			}
		}
		
		// score based on similarity
		let letterCount = {};
		for( let letter of search ){
			if( /['"\s]+/.test(letter) ){
				continue;
			}
			if( letter in letterCount ){
				letterCount[letter]++;
			}
			else {
				letterCount[letter] = 1;
			}
		}
		let similarity = 0;
		for( let letter of input ){
			if( letter in letterCount && letterCount[letter] > 0 ){
				similarity++;
				letterCount[letter]--;
			}
		}
		// take away the leftovers
		Object.values(letterCount).map((letters)=>{
			similarity -= letters;
		});
		similarity = similarity / input.length;

		console.log(input, score < 0 || similarity < 0 ? -1 : score * similarity);
		return similarity < 0 ? -1 : score * similarity;
	}

	sort( key, forceOrder, updateUrl = true ) {
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
			let value = item.dataset[info.attr];
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

		for( let i = 0; i < attributes.length; i++ ){
			let id = attributes[i][1];
			document.getElementById(id).style.order = i;
		}

		if( this.saveToUrl && updateUrl ){
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
		cardParent.dataset.title = themeName;
		cardParent.id = `card:${thisId}`;
		if( 'date_added' in theme ){
			if( !sorts.includes('dateAdded') ){
				sorts.push('dateAdded');
			}

			cardParent.dataset.dateAdded = theme.date_added;
		}
		else {
			cardParent.dataset.dateAdded = '0000-00-00';
		}
		if( 'date' in theme ){
			if( !sorts.includes('date') ){
				sorts.push('date');
			}

			cardParent.dataset.date = theme.date;
		}
		else {
			cardParent.dataset.date = '0000-00-00';
		}
		if( 'author' in theme ){
			if( !sorts.includes('author') ){
				sorts.push('author');
			}

			cardParent.dataset.author = theme.author;
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
		let tempTags = formatFilters(theme.tags);
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
var sorts = ['title'];
var cards = [];

// This function initialises all the other parts of the code that are needed.
function pageSetup( ){
	// Set state of filter sidebar to match previous load
	let filterToggle = localStorage.getItem('filters-open');
	if( filterToggle !== null ){
		toggleEle('.js-filters', (filterToggle === "true"));
	}

	// Accepts array of URLs to fetch then returns a promise once they have all loaded.
	function fetchAllFiles( arrayOfUrls ){
		const files = [];
		for( let i = 0; i < arrayOfUrls.length; i++ ){
			if( typeof arrayOfUrls[i] === 'string' ){
				files.push(fetchFile(arrayOfUrls[i], false));
			}
			// this codes' only purpose is to allow dev tools to directly inject JSON into the page through window.addEventListener
			else {
				files.push(JSON.stringify(arrayOfUrls[i]));
			}
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
			}
			catch(e) {
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
			let collectionFailures = 0;

			// Process all files
			for( let i = 0; i < files.length; i++ ){
				let tempData = {};
				// Attempt to parse provided data.
				try {
					tempData = JSON.parse(files[i]['value']);
				}
				catch(e) {
					loader.logJsonError('[ERROR] Failed to parse collection JSON', files[i]['value'], e, allCollectionUrls[i]);
					collectionFailures++;
					continue;
				}

				processing.push(processJson(tempData, allCollectionUrls[i], 'collection'));
			}
			
			if( collectionFailures >= files.length ){
				loader.failed(['Encountered a problem while parsing collection information.', 'json.parse']);
				throw new Error('too many failures');
			}
			else if( collectionFailures > 0 ){
				messenger.error('Encountered a problem while parsing collection information. Some themes may not have loaded.', 'json.parse');
			}

			// Render & Sort Cards
			Promise.allSettled(processing)
			.then((allJson) => {
				let jsonFailures = 0;

				for( let response of allJson ){
					let json = response.value;
					if( json.themes ){
						renderCards(json.themes);
					}
					else {
						jsonFailures++;
					}
				}

				if( jsonFailures >= files.length ){
					loader.failed(['Encountered a problem while parsing collection information.', 'invalid.json']);
					throw new Error('too many failures');
				}
				else if( jsonFailures > 0 ){
					messenger.error('Encountered a problem while parsing collection information. Some themes may not have loaded.', 'invalid.json');
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
				}

				// If not already sorted, attempt various sorts depending on available info.
				let previousSort = query.get('sort');
				
				if( !previousSort ) {
					// Choose sort depending on which keys exist
					(filter.sort('dateAdded', undefined, false) || filter.sort('date', undefined, false) || filter.sort('random', undefined, false));
				}

				// Finish up
				loader.loaded();
				startBrowseTutorial();
			});
		});
	});
}

// If page is in 'dynamic' dev mode, it awaits a message via window.addEventListener. Else proceeds via URL.
if( !query.get('dynamic') ) {
	// Get data for all collections and call other functions

	loader.text('Fetching data files...');

	if( collectionUrls.length === 0 && megaUrls.length === 0 ){
		document.querySelector('.js-home').removeAttribute('href');
		megaUrls.push('json/default.json');
	}

	pageSetup( );
}

window.addEventListener(
	"message",
	function( event ){
		if( event.origin === window.location.origin ){
			var push = event.data || event.message;
			var type = push[0];
			var content = push[1];

			if( type === 'json' ){
				console.log(content);
				let receivedJson = content;
				if( 'collections' in receivedJson ){
					megaUrls.push(receivedJson);
				}
				else if( 'themes' in receivedJson ){
					collectionUrls.push(receivedJson);
				}
				pageSetup( );
			}
			else {
				console.log('[ERROR] Malformed request sent to browse.js. No action taken.')
			}
		}
	},
	false
);

// Tutorial

function startBrowseTutorial( ){
	var popup = new InfoPopup;
	startTutorial([
		() => { popup.text('Welcome to the Theme Customiser browse page!<br/><br/>Click anywhere to continue.<br/>To escape, click "Dismiss".'); popup.show([document.scrollingElement.scrollWidth/2, 150], 'none'); },
		() => {
			if( document.querySelector('#js-search:not(.o-hidden)') ){
				popup.text('Looking for something in particular? Use the filters to narrow results.');
				popup.show(document.querySelector('#js-tags__button'), 'top');
			}
			else {
				return false;
			}
		},
		() => { popup.text('Trying to import a pre-made configuration? Click on this button to bring up the Import popup.'); popup.show(document.getElementById('js-import'), 'top'); },
		() => { popup.text('Once you\'ve found an interesting design, just click on it! The guide will continue on the theme page.'); popup.show([document.scrollingElement.scrollWidth/2, 150], 'none'); },
		() => { popup.destruct(); }
	]);
}