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

function changeCategory() {
	let a = this.getElementsByTagName('a')[0],
		indexStart = a.href.indexOf('status=') + 7,
		indexEnd = indexStart + 1,
		catId = a.href.substring(indexStart, indexEnd);
	
	// Change basic attributes
	for(var button of categoryButtons) {
		button.className = 'status_not_selected';
	}
	this.className = 'status_selected';

	// Hide relevant tables
	let tables = document.getElementsByTagName('table');
	console.log(catId);
	for(let table of tables) {
		let tableCat = table.getAttribute('tc-category');
		if(catId === '7' || tableCat === categoryCodes[catId]) {
			table.style = '';
		} else if(tableCat === null) {
			continue;
		} else {
			table.style = 'display: none !important';
		}
	}
}
for(var button of categoryButtons) {
	button.addEventListener('click', changeCategory.bind(button));
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

function setView(view) {
	let menu = document.getElementById('mal_control_strip');

	if(view === 'owner') {
		document.body.setAttribute('data-owner', 1);

		menu.innerHTML = menuHtml['owner'];
	}

	else if(view.startsWith('visitor')) {
		document.body.setAttribute('data-owner', '');

		if(view === 'visitor:user') {
			menu.innerHTML = menuHtml['visitor:user'];
		}
		else if(view === 'visitor:guest') {
			menu.innerHTML = menuHtml['visitor:guest'];
		}
	}

	else {
		return false;
	}
}