let installBtn = document.querySelector('.gtag-install')
if( installBtn ){
	installBtn.addEventListener('click', () => {
		gtag('event', 'copy_css', {
			'theme_url': query.get('t'),
			'settings': userSettings
		})
	})
}