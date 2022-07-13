// Preview-only HTML - replicating default functionality

function toggle(defaultDisplay = 'block') {
	if(this.style.display === 'none' || this.style.display === '') {
		this.style.display = defaultDisplay;
	} else {
		this.style.display = 'none';
	}
}

// List Items

function getExpand(id) {
	let more = document.getElementById(`more${id}`);
	toggle.bind(more)();
}