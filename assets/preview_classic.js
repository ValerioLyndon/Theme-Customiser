'use strict';

// Preview-only HTML - replicating default functionality

function toggle( defaultDisplay = 'block' ){
	if( this.style.display === 'none' || this.style.display === '' ){
		this.style.display = defaultDisplay;
	}
	else {
		this.style.display = 'none';
	}
}

// More Info

const moreData = {
	'5114': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td1 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=5114" target="_blank" onclick="return false;">Discuss Anime</a></div>
                        <span title="Anime Database Rating">Rating: R - 17+ (violence &amp; profanity)</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: &nbsp;<br>Retail Disks: <br>Start Date: May  10, 2016
                <br>
                End Date: <br>
                         Days Since Started Watching: 2,249<br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        33 hours, 39 minutes, and 40 seconds <small>(0 hours, 24 minutes, and 20 seconds per episode)</small><br>
                        Notes: Vestibulum luctus dolor dui, ut iaculis quam auctor sed. Vestibulum vitae tellus nunc. Curabitur dapibus lorem et sagittis lobortis. Nullam eget tellus rhoncus, eleifend felis et, dignissim nisl.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus ut nunc orci. Nunc et consequat risus.&nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'918': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td2 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=918" target="_blank" onclick="return false;">Discuss Anime</a></div>
                        <span title="Anime Database Rating">Rating: PG-13 - Teens 13 or older</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: Medium<br>
                            Deviation Score: -2.0<br>Retail Disks: <br>Start Date: Feb  3, 2021
                <br>
                End Date: <br>
                         Days Since Started Watching: 519<br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        56 hours, 26 minutes, and 24 seconds <small>(0 hours, 24 minutes, and 54 seconds per episode)</small><br>
                        Notes: &nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'3841': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td1 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=3841" target="_blank" onclick="return false;">Discuss Anime</a></div>This series has been re-watched
                                    <strong>0</strong> times<br>
                        <span title="Anime Database Rating">Rating: G - All Ages</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: &nbsp;<br>
                            Deviation Score: 0.3<br>Retail Disks: <br>Start Date: Dec  1, 2021
                <br>
                End Date: Dec  28, 2021<br>
                         Days Since Started Watching: 28<br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        5 hours, 12 minutes, and 0 seconds <small>(0 hours, 3 minutes, and 0 seconds per episode)</small><br>
                        Notes: &nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'32281': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td2 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=32281" target="_blank" onclick="return false;">Discuss Anime</a></div>This series has been re-watched
                                    <strong>3</strong> times<br>
                        <span title="Anime Database Rating">Rating: PG-13 - Teens 13 or older</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage: NAS at 3.00 Gb<br>Rewatch Value: Very High<br>
                            Deviation Score: 1.1<br>Retail Disks: <br>Start Date: Jun  29, 2022
                <br>
                End Date: Jun  29, 2022<br>
                         Days Since Started Watching: 1<br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        1 hour, 46 minutes, and 31 seconds <small>(1 hour, 46 minutes, and 31 seconds per episode)</small><br>
                        Notes: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus ut nunc orci. Nunc et consequat risus. Ut lobortis lorem eget odio molestie aliquam. Etiam egestas, purus a aliquet consectetur, nisl felis sagittis nisi, ut bibendum augue tortor vitae elit. Nullam suscipit eget ipsum eu blandit. Donec elit eros, pellentesque sit amet venenatis ut, sollicitudin sit amet sem. In placerat erat nec tortor aliquet consectetur. Vestibulum luctus dolor dui, ut iaculis quam auctor sed. Vestibulum vitae tellus nunc. Curabitur dapibus lorem et sagittis lobortis. Nullam eget tellus rhoncus, eleifend felis et, dignissim nisl.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus ut nunc orci. Nunc et consequat risus. Ut lobortis lorem eget odio molestie aliquam. Etiam egestas, purus a aliquet consectetur, nisl felis sagittis nisi, ut bibendum augue tortor vitae elit. Nullam suscipit eget ipsum eu blandit. Donec elit eros, pellentesque sit amet venenatis ut, sollicitudin sit amet sem. In placerat erat nec tortor aliquet consectetur. Vestibulum luctus dolor dui, ut iaculis quam auctor sed. Vestibulum vitae tellus nunc. Curabitur dapibus lorem et sagittis lobortis. Nullam eget tellus rhoncus, eleifend felis et, dignissim nisl.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus ut nunc orci. Nunc et consequat risus. Ut lobortis lorem eget odio molestie aliquam. Etiam egestas, purus a aliquet consectetur, nisl felis sagittis nisi, ut bibendum augue tortor vitae elit.&nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'21': `<table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tbody><tr><td class="td1 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=21" target="_blank" onclick="return false;">Discuss Anime</a></div>
                        <span title="Anime Database Rating">Rating: PG-13 - Teens 13 or older</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: &nbsp;<br>Retail Disks: <br>Start Date: Jan  8, 2007
                <br>
                End Date: <br>
                         Days Since Started Watching: 5,686<br>
                         Last Updated: 
                         08-01-22
                        <br>
                        Time Spent Watching: 
                        54 hours, 0 minutes, and 0 seconds <small>(0 hours, 24 minutes, and 0 seconds per episode)</small><br>
                        Notes: &nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'2372': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td1 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=2372" target="_blank" onclick="return false;">Discuss Anime</a></div>
                        <span title="Anime Database Rating">Rating: Rx - Hentai</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: &nbsp;<br>Retail Disks: <br>Start Date: Apr  3, 2019
                <br>
                End Date: <br>
                         Days Since Started Watching: 1,191<br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        0 hours, 28 minutes, and 32 seconds <small>(0 hours, 28 minutes, and 32 seconds per episode)</small><br>
                        Notes: &nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'4654': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td2 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=4654" target="_blank" onclick="return false;">Discuss Anime</a></div>
                        <span title="Anime Database Rating">Rating: R - 17+ (violence &amp; profanity)</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: &nbsp;<br>
                            Deviation Score: -6.4<br>Retail Disks: <br>Start Date: 
                <br>
                End Date: <br>
                         Days Since Started Watching: <br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        9 hours, 32 minutes, and 0 seconds <small>(0 hours, 23 minutes, and 50 seconds per episode)</small><br>
                        Notes: &nbsp;<br></td>
                        </tr>
                        </tbody></table>`,
	'47': `<table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr><td class="td1 borderRBL"><div style="margin-bottom: 3px;"><a href="/forum/?animeid=47" target="_blank" onclick="return false;">Discuss Anime</a></div>
                        <span title="Anime Database Rating">Rating: R+ - Mild Nudity</span> (<a href="javascript:void(0);" onclick="window.open('/info.php?go=mpaa','bbcode','menubar=no,scrollbars=yes,status=no,width=350,height=250');return false;" onclick="return false;">Why?</a>)<br>Storage:  None<br>Rewatch Value: &nbsp;<br>Retail Disks: <br>Start Date: 
                <br>
                End Date: <br>
                         Days Since Started Watching: <br>
                         Last Updated: 
                         06-29-22
                        <br>
                        Time Spent Watching: 
                        0 hours, 0 minutes, and 0 seconds <small>(2 hours, 4 minutes, and 28 seconds per episode)</small><br>
                        Notes: Japan, 1988. An explosion caused by a young boy with psychic powers tears through the city of Tokyo and ignites the fuse that leads to World War III. In order to prevent any further destruction, he is captured and taken into custody, never to be heard from again. Now, in the year 2019, a restored version of the city known as Neo-Tokyo—an area rife with gang violence and terrorism against the current government—stands in its place. Here, Shoutarou Kaneda leads "the Capsules," a group of misfits known for riding large, custom motorcycles and being in constant conflict with their rivals "the Clowns."<br />
<br />
During one of these battles, Shoutarou's best friend Tetsuo Shima is caught up in an accident with an esper who finds himself in the streets of Tokyo after escaping confinement from a government institution. Through this encounter, Tetsuo begins to develop his own mysterious abilities, as the government seeks to quarantine this latest psychic in a desperate attempt to prevent him from unleashing the destructive power that could once again bring the city to its knees.&nbsp;<br></td>
                        </tr>
                        </tbody></table>`
}

function getExpand( id ){
	let more = document.getElementById(`more${id}`);
	
	// add HTML on first run to simulate MAL-like behaviour
	if( !more.hasChildNodes() ){
		more.innerHTML = moreData[id];
	}

	// toggle display 
	toggle.bind(more)();
}

// Category buttons

var categoryButtons = document.querySelectorAll('[class^="status_"]');
var categoryCodes = {
	7: 'all',
	1: 'current',
	2: 'completed',
	3: 'paused',
	4: 'dropped',
	6: 'planned'
}

function changeCategory( catId, catBtn ){
	if( !catBtn ){
		for( let button of categoryButtons ){
			let href = button.getElementsByTagName('a')[0].href;
			if( href.includes(`status=${catId}`) ){
				catBtn = button;
			}
		}
	}

	// Change button attributes
	for( let button of categoryButtons ){
		button.className = 'status_not_selected';
	}
	catBtn.className = 'status_selected';

	// Hide relevant tables
	let tables = document.getElementsByTagName('table');

	for( let table of tables ){
		let tableCat = table.getAttribute('tc-category');
		if( catId == 7 || tableCat === categoryCodes[catId] ){
			table.style = '';
		}
		else if( tableCat === null ){
			continue;
		}
		else {
			table.style = 'display: none !important';
		}
	}
}

for( let button of categoryButtons ){
	button.addEventListener('click', () => {
		let a = button.getElementsByTagName('a')[0],
			indexStart = a.href.indexOf('status=') + 7,
			indexEnd = indexStart + 1,
			catId = a.href.substring(indexStart, indexEnd);
		changeCategory(catId, button);
	});
}

// Change list view

let menuHtml = {
	'owner': `<tbody><tr>
											<td id="mal_cs_listinfo">
					<div>
						<strong>
							<a onclick="return false;" href="/profile/Example">
								<strong>Example</strong>
							</a>
						</strong>
					</div>
					<div>
						<form action="https://myanimelist.net/logout.php" method="post">
	<a onclick="return false;" href="javascript:void(0);" onclick="$(this).parent().submit();" class="logout">
		<i class="fa-solid fa-fw fa-right-from-bracket"></i>
		Logout
	</a>
</form>
					</div>
				</td>
				<td id="mal_cs_links">
					<div>
						<a onclick="return false;" href="/addtolist.php?hidenav=1" class="List_LightBox">Add to List</a>
						<a onclick="return false;" href="/">Home</a>
					</div>
					<div>
						<a onclick="return false;" href="/animelist/Example">Anime List</a>
						<a onclick="return false;" href="/mangalist/Example">Manga List</a>
					</div>
				</td>
				<td id="mal_cs_otherlinks">
											<div>
							<strong>
								You are viewing your anime list
							</strong>
						</div>
						<div>
							<a onclick="return false;" href="/history/Example">History</a>
							<a onclick="return false;" href="/forum/">Forum</a>
							<a onclick="return false;" href="/panel.php?go=export">Export</a>
						</div>
									</td>
						<td id="mal_cs_powered" valign="top" align="right">
				<a onclick="return false;" href="/"><img class=" lazyloaded" data-src="https://cdn.myanimelist.net/images/list-top-powered.gif" src="https://cdn.myanimelist.net/images/list-top-powered.gif"></a>
				<div id="search">
					<input id="searchBox" value="Search" type="textbox">
					<img class=" lazyloaded" data-src="https://cdn.myanimelist.net/images/magnify.gif" id="searchListButton" src="https://cdn.myanimelist.net/images/magnify.gif">
					<input type="hidden" id="listUserId" value="7541105">
					<input type="hidden" id="listUserName" value="Example">
					<input type="hidden" id="listType" value="anime">
				</div>
			</td>
		</tr>
	</tbody>`,

	'visitor:user': `<tbody><tr>
											<td id="mal_cs_listinfo">
					<div>
						<strong>
							<a onclick="return false;" href="/profile/Example">
								<strong>Example</strong>
							</a>
						</strong>
					</div>
					<div>
						<form action="https://myanimelist.net/logout.php" method="post">
	<a onclick="return false;" href="javascript:void(0);" onclick="$(this).parent().submit();" class="logout">
		<i class="fa-solid fa-fw fa-right-from-bracket"></i>
		Logout
	</a>
</form>
					</div>
				</td>
				<td id="mal_cs_links">
					<div>
						<a onclick="return false;" href="/addtolist.php?hidenav=1" class="List_LightBox">Add to List</a>
						<a onclick="return false;" href="/">Home</a>
					</div>
					<div>
						<a onclick="return false;" href="/animelist/Example">Anime List</a>
						<a onclick="return false;" href="/mangalist/Example">Manga List</a>
					</div>
				</td>
				<td id="mal_cs_otherlinks">
											<div>
							<strong>
								You are viewing anime list of
								<a onclick="return false;" href="/profile/Example">Example</a>
							</strong>
						</div>
						<div>
							4
															<a onclick="return false;" href="/sharedanime.php?u1=Example&amp;u2=Example">Shared Anime</a>,
														<span title="Affinity">0% Affinity</span>
							-
															<a onclick="return false;" href="/mangalist/Example">Manga List</a>
														<a onclick="return false;" href="/history/Example">History</a>
						</div>
									</td>
						<td id="mal_cs_powered" valign="top" align="right">
				<a onclick="return false;" href="/"><img class="lazyload" data-src="https://cdn.myanimelist.net/images/list-top-powered.gif"></a>
				<div id="search">
					<input id="searchBox" value="Search" type="textbox">
					<img class="lazyload" data-src="https://cdn.myanimelist.net/images/magnify.gif" id="searchListButton">
					<input type="hidden" id="listUserId" value="7541105">
					<input type="hidden" id="listUserName" value="Example">
					<input type="hidden" id="listType" value="anime">
				</div>
			</td>
		</tr>
	</tbody>`,

	'visitor:guest': `<tbody><tr>
											<td id="mal_cs_pic"><a onclick="return false;" href="/"><img class=" lazyloaded" data-src="https://cdn.myanimelist.net/images/list-top-logo.gif" src="https://cdn.myanimelist.net/images/list-top-logo.gif"></a></td>
				<td id="mal_cs_otherlinks">
					<div>
						<strong>
							You are viewing anime list of
							<a onclick="return false;" href="/profile/Example">Example</a>
						</strong>
					</div>
					<div>
						<a onclick="return false;" href="/login.php">Log in</a>
						<a onclick="return false;" href="/register.php">Create an Anime List</a>
						<a onclick="return false;" href="/forum/?board=515949">Learn more</a>
					</div>
				</td>
						<td id="mal_cs_powered" valign="top" align="right">
				<a onclick="return false;" href="/"><img class=" lazyloaded" data-src="https://cdn.myanimelist.net/images/list-top-powered.gif" src="https://cdn.myanimelist.net/images/list-top-powered.gif"></a>
				<div id="search">
					<input id="searchBox" value="Search" type="textbox">
					<img class=" lazyloaded" data-src="https://cdn.myanimelist.net/images/magnify.gif" id="searchListButton" src="https://cdn.myanimelist.net/images/magnify.gif">
					<input type="hidden" id="listUserId" value="7541105">
					<input type="hidden" id="listUserName" value="Example">
					<input type="hidden" id="listType" value="anime">
				</div>
			</td>
		</tr>
	</tbody>`
}

function setView( view ){
	let menu = document.getElementById('mal_control_strip');

	if( view === 'owner' ){
		document.body.setAttribute('data-owner', 1);

		menu.innerHTML = menuHtml.owner;
	}

	else if( view.startsWith('visitor') ){
		document.body.setAttribute('data-owner', '');

		if( view === 'visitor:user' ){
			menu.innerHTML = menuHtml['visitor:user'];
		}
		else if( view === 'visitor:guest' ){
			menu.innerHTML = menuHtml['visitor:guest'];
		}
	}

	else {
		return false;
	}
}