class loadingScreen {
	constructor() {
		this.pageContent = document.getElementById('js-content');
		this.parent = document.getElementById('js-loader');
		this.icon = document.getElementById('js-loader-icon');
		this.text = document.getElementById('js-loader-text');
		this.subText = document.getElementById('js-loader-subtext');
		this.subText2 = document.getElementById('js-loader-subsubtext');
		this.stop = false;
	}

	loaded() {
		this.pageContent.classList.add('is-loaded');
		this.parent.classList.add('is-hidden');
		var that = this;
		setTimeout(function() {
			that.parent.classList.add('o-hidden');
		}, 1500)
	}

	failed(reason_array) {
		// only runs once
		if(!this.stop) {
			this.icon.className = 'loading-screen__cross';
			this.text.textContent = 'Page Failure.';
			this.subText.textContent = reason_array[0];
			this.subText2.classList.remove('o-hidden');
			this.subText2.textContent = `Code: ${reason_array[1]}`;
			this.stop = true;
			return new Error(reason_array[1]);
		}
	}
}

class messageHandler {
	constructor() {
		this.parent = document.getElementById('js-messenger');
	}

	send(text, type = 'notice', subtext = null) {
		this.parent.classList.remove('is-hidden');

		let msg = document.createElement('div'),
			head = document.createElement('b');

		msg.className = 'messenger__message js-message';
		msg.innerHTML = text;
		head.className = 'messenger__message-header';
		head.textContent = type.toUpperCase();
		msg.prepend(head);

		if(type === 'error') {
			msg.classList.add('messenger__message--error');
		}
		else if(type === 'warning') {
			msg.classList.add('messenger__message--warning');
		}

		if(subtext) {
			let sub = document.createElement('i');
			sub.className = 'messenger__message-subtext';
			sub.textContent = subtext;
			msg.appendChild(sub);
		}

		this.parent.appendChild(msg);
	}

	warn(msg, code = null) {
		if(code) {
			code = `Code: ${code}`;
		}
		this.send(msg, 'warning', code);
	}

	error(msg, code = null) {
		if(code) {
			code = `Code: ${code}`;
		}
		this.send(msg, 'error', code);
	}

	clear(amount = 0) {
		let msgs = this.parent.getElementsByClassName('js-message');
		if(amount > 0) {
			for(let i = 0; i < msgs.length && i < amount; i++) {
				msgs[i].remove();
			}
		} else {
			for(let msg of msgs) {
				msg.remove();
			}
		}
		msgs = this.parent.getElementsByClassName('js-message');
		if(msgs.length === 0) {
			this.parent.classList.add('is-hidden');
		}
	}
}

function fetchFile(path, cacheResult = true) {
	return new Promise((resolve, reject) => {
		// Checks if item has previously been fetched and returns the cached result if so
		let cache = sessionStorage.getItem(path);

		if(cacheResult && cache) {
			console.log(`[fetchFile] Retrieving cached result for ${path}`);
			resolve(cache);
		}
		else {
			console.log(`[fetchFile] Fetching ${path}`);
			var request = new XMLHttpRequest();
			request.open("GET", path, true);
			request.send(null);
			request.onreadystatechange = function() {
				if (request.readyState === 4) {
					if (request.status === 200) {
						// Cache result on success and then return it
						if(cacheResult) {
							sessionStorage.setItem(path, request.responseText);
						}
						resolve(request.responseText);
					} else {
						console.log(`[FetchFile] Failed while fetching "${path}". Code: request.status.${request.status}`);
						reject([`Encountered a problem while loading a resource.`, `request.status.${request.status}`]);
					}
				}
			}
			request.onerror = function(e) {
				console.log(`[FetchFile] Failed while fetching "${path}". Code: request.error`);
				reject(['Encountered a problem while loading a resource.', 'request.error']);
			}
		}
	});
}

// VARIABLES

const
	query = (new URL(document.location)).searchParams,
	dataUrls = query.getAll('data'),
	loader = new loadingScreen(),
	messenger = new messageHandler();

if(dataUrls.length === 0) {
	dataUrls.push(['./assets/data.json']);
}