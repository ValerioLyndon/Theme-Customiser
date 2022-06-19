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
	console.log(data);
	for(let [themeId, theme] of Object.entries(data)) {
		let parent = document.createElement('div');
		parent.className = '';
		
		let header = document.createElement('h3');
		header.className = '';
		header.textContent = theme['name'];
		parent.appendChild(header);
		
		let author = document.createElement('span');
		author.className = '';
		author.textContent = theme['author'];
		parent.appendChild(author);
		
		let listtype = document.createElement('span');
		listtype.className = '';
		listtype.textContent = theme['type'];
		parent.appendChild(listtype);

		document.getElementById('js-content').appendChild(parent);
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