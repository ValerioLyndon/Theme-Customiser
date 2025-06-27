try {
	umami.track(props => {
		props['url'] = props['url'].replace('/Theme-Customiser', '');
		return props
	});
} catch {
	console.log('Analytics failed to initialise.');
}