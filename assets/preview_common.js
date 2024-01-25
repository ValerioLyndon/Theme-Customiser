'use strict';

// Customiser-related code
function setColumns( columns ){
	let selectors = [];

	for( let [column, enabled] of Object.entries(columns) ){
		// Add selector for removal if the item is optional or disabled
		if( enabled === false || enabled === null && selectors.length < 7 && Math.round(Math.random()) === 1 ){
			selectors.push(`[tc-column="${column}"]`);
		}
	}

	for( let sel of selectors ){
		for( let ele of document.querySelectorAll(sel) ){
			ele.remove();
		}
	}
}

// Listen for messages from customiser.js
window.addEventListener(
	"message",
	function (event) {
		if( event.origin === window.location.origin ){
			let push = event.data || event.message;
			let type = push[0];
			let content = push[1];

			if( type === 'css' ){
				document.getElementById('custom-css').textContent = previewCss(content);
			}
			else if( type === 'columns' ){
				setColumns(content);
			}
			else if( type === 'view' ){
				setView(content);
			}
			else if( type === 'cover' ){
				toggleCover(content);
			}
			else if( type === 'background' ){
				toggleBackground(content);
			}
			else if( type === 'cover_url' ){
				setCover(content);
			}
			else if( type === 'background_url' ){
				setBackground(content);
			}
			else if( type === 'style' ){
				console.log(`This option is still to do. Style #${content}`);
				//changeStyle(content);
			}
			else if( type === 'category' ){
				changeCategory(content);
			}
			else {
				console.log('[ERROR] Malformed request sent to iframe. No action taken.')
			}
		}
	},
	false
);

const coverImages = {
	"21": "https://cdn.myanimelist.net/images/anime/1244/138851.webp",
	"47": "https://cdn.myanimelist.net/images/anime/1408/114012.webp",
	"918": "https://cdn.myanimelist.net/images/anime/10/73274.webp",
	"2372": "https://cdn.myanimelist.net/images/anime/6/40117.webp",
	"3841": "https://cdn.myanimelist.net/images/anime/6/7632.webp",
	"4654": "https://cdn.myanimelist.net/images/anime/2/75533.webp",
	"5114": "https://cdn.myanimelist.net/images/anime/1208/94745.webp",
	"32281": "https://cdn.myanimelist.net/images/anime/5/87048.webp"
}
const presets = {
	'dataimagelink': '.data.image a[href^="/{type}/{id}/"]{background-image:url({image})}',
	'dataimagelinkbefore': '.data.image a[href^="/{type}/{id}/"]:before{background-image:url({image})}',
	'dataimagelinkafter': '.data.image a[href^="/{type}/{id}/"]:after{background-image:url({image})}',
	'datatitlelink': '.data.title>a[href^="/{type}/{id}/"]{background-image:url({image})}',
	'datatitlelinkbefore': '.data.title>a[href^="/{type}/{id}/"]:before{background-image:url({image})}',
	'datatitlelinkafter': '.data.title>a[href^="/{type}/{id}/"]:after{background-image:url({image})}',
	'animetitle': '.animetitle[href^="/{type}/{id}/"]{background-image:url({image})}',
	'animetitlebefore': '.animetitle[href^="/{type}/{id}/"]:before{background-image:url({image})}',
	'animetitleafter': '.animetitle[href^="/{type}/{id}/"]:after{background-image:url({image})}',
	'more': '#more{id}{background-image:url({image})}'
}

function previewCss( css ){
	// remove cover imports and add an optimised version to improve page loads!
	let covers = css.matchAll(/@\\?import (?:url\("?|\")?https?:\/\/malscraper\.azurewebsites\.net\/covers\/[^\/]+\/[^\/]+\/presets\/(\w+)(?:"|"?\));/g);
	for( let match of covers ){
		let preset = match[1];
		// do not replace if are unable to generate an optimised version
		if( preset === undefined || !(preset in presets) ){
			continue;
		}
		css = css.replace(match[0], '');
		for( let [id, image] of Object.entries(coverImages) ){
			css += '\n' + presets[preset].replace('{type}','anime').replace('{id}', id).replace('{image}', image);
		}
	}

	// generic replacements
	let replacements = [
		// relative paths to absolute
		['url(/', 'url(https://myanimelist.net/'],
		// fontawesome tweaks
		[/["']?fontawesome(?!\s?4)(?:\s?6\s?(?:free|pro))?["']?/gi, '<<<FA_REPLACE>>>'],
		[/<<<FA_REPLACE>>>/gi, '"FontAwesome","FontAwesome 4.7.0"'],
		['\\e29e', '\\f017'], // timer
		['\\e3d6', '\\f149'], // arrow-turn-down-right
		['\\e211', '\\f044'], // edit-field
		['\\e0c0', '\\f518'] // book-open-cover
	]
	for( let [match, replace] of replacements ){
		css = css.replaceAll(match, replace);
	}
	css += `\n[class^="fa"]::before { font-family: "FontAwesome","FontAwesome 4.7.0"; }`;

	return css;
}