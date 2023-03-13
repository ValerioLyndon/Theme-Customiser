gtag('event', 'user', {
	'user_agent': window.navigator.userAgent
})

let installBtn = document.querySelector('.gtag-install')
if( installBtn ){
	installBtn.addEventListener('click', () => {
		gtag('event', 'copy_css', {
			'theme_url': query.get('t'),
			'settings': userSettings
		})
	})
}