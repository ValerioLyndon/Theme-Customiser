let installBtn = document.querySelector('.gtag-install')
if( installBtn ){
	installBtn.addEventListener('click', () => {
		gtag('event', 'copy_css', {
			'theme_url': query.get('t'),
			'user_settings': JSON.stringify(userSettings)
		})
	})
}

let tutorialDismissBtn = document.querySelector('.gtag-tutorial-dismiss')
if( tutorialDismissBtn ){
	tutorialDismissBtn.addEventListener('click', () => {
		gtag('event', 'tutorial_dismiss', {
			'dismissed_at': tutorialDismissBtn.dataset.position,
			'page': location.pathname
		})
	})
}