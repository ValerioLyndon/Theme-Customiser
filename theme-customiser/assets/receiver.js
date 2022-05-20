window.addEventListener(
	"message",
	function (event) {
		if (event.origin === window.location.origin) {
			document.getElementById('custom-css').textContent = event.data;
		}
	},
	false
);