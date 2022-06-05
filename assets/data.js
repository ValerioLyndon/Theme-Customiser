var data = {
	"clarity": {
		"name": "Clarity",
		"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Theme%20-%20Compressed.css",
		"type": "modern",
		"options": {
			"nm": {
				"name": "Name",
				"type": "css_content_value",
				"string_to_replace": "--name:none;",
				"string_to_insert": "--name:{{{insert}}};",
				"default": ""
			},
			"av": {
				"name": "Avatar",
				"type": "user_image",
				"string_to_replace": "--avatar:none;",
				"string_to_insert": "--avatar:{{{insert}}};",
				"default": ""
			},
			"bn": {
				"name": "Banner",
				"type": "user_image",
				"string_to_replace": "--banner:url(https://i.imgur.com/VoPJz2S.jpg);",
				"string_to_insert": "--banner:{{{insert}}};",
				"default": "https://i.imgur.com/VoPJz2S.jpg"
			},
			"ch": {
				"name": "Character",
				"type": "user_image",
				"string_to_replace": "--character:url(https://i.imgur.com/6IPyngH.png);",
				"string_to_insert": "--character:{{{insert}}};",
				"default": "https://i.imgur.com/6IPyngH.png"
			},
			"bg": {
				"name": "Background",
				"type": "user_image",
				"string_to_replace": "--background:none;",
				"string_to_insert": "--background:{{{insert}}};",
				"default": ""
			}
		},
		"mods": {
			"d": {
				"name": "Dark Mode",
				"description": "Darker visuals. 100% fewer flashbangs!",
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Dark%20Mode%20Compressed.css"}
			},
			"hdr": {
				"name": "Image Hover Mod (On Row variant)",
				// needs import at top with username: ;
				"description": "Adds larger images on mouse hover. Will slow down page loads.",
				"incompatibilities": ["hdi"],
				"css": {
					"top": `@\\import "https://malscraper.azurewebsites.net/covers/all/anime/presets/dataimagelinkbefore";
@\\import "https://malscraper.azurewebsites.net/covers/all/manga/presets/dataimagelinkbefore";`,
					"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Hover%20Image%20Compressed.css"
				},
				"options": {
					"username": {
						"name": "Your MyAnimeList Username",
						"type": "text",
						"string_to_replace": ["all/anime/presets","all/manga/presets"],
						"string_to_insert": ["anime/{{{insert}}}/presets","manga/{{{insert}}}/presets"],
						"default": ""
					}
				}
			},
			"hdi": {
				"name": "Image Hover Mod (On Image variant)",
				// needs import at top with username: @\import "https://malscraper.azurewebsites.net/covers/anime/YOURNAME/presets/dataimagelinkbefore";
				"description": "Adds larger images on mouse hover. Will slow down page loads.",
				"incompatibilities": ["hdr"],
				"css": {
					"import": `@\\import "https://malscraper.azurewebsites.net/covers/all/anime/presets/dataimagelinkbefore";
@\\import "https://malscraper.azurewebsites.net/covers/all/manga/presets/dataimagelinkbefore";`,
					"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Hover%20Image%20On%20Circle%20Compressed.css"
				}
			},
			"re": {
				"name": "Review-style/note-style Tags",
				"description": "Widens the tag box and condenses it all into one cohesive paragraph, disabling tag functionality. Great for mini-reviews or quick notes.",
				"incompatibilities": ["ho"],
				"css": {"bottom": "https://raw.githubusercontent.com/ValerioLyndon/MAL-Public-List-Designs/master/Clarity%20Theme/Mod%20-%20Review%20Tags%20Compressed.css"}
			},
			// these types of variants should really be controlled with options rather than different mods.
			"favl": {
				"name": "Favourite Hearts (Left variant)",
				"description": `This modification changes the appearance of any tag called \"Favourite\" or \"Favorite\" to display at the side of the list entry as a heart.
					<br /><br />
					<b>Limitations:</b>
					<ul>
						<li>This mod <u>cannot detect</u> your MAL favourites. It only changes the appearance of correctly labelled <b>tags</b>, nothing more. Due to this, however, you can have more than 20 entries tagged as favourites. Part of why I made this was to circumvent the item limit on non-supporter profiles.</li>
						<li> If using the left-side Favourite Tag with the unedited Image Hover mod then the hover image will cover up the tag on mouse-over. You can avoid this by using the right-side version or the edited (Hover on Circle) Image Hover mod.</li>
					</ul>`,
				"incompatibilities": ["favr"],
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Favourite%20Hearts%20Left%20Compressed.css"}
			},
			"favr": {
				"name": "Favourite Hearts (Right variant)",
				"description": "Ditto",
				"incompatibilities": ["favl"],
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Favourite%20Hearts%20Right%20Compressed.css"}
			},
			"ho": {
				"name": "Horizontal Tags",
				"description": "Convert the vertical tags into a horizontal line across the bottom of each list item.",
				"incompatibilities": ["re"],
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Horizontal%20Tags%20Compressed.css"}
			},
			"ren": {
				"name": "Character Renders",
				"description": "Adds two optional character renders on the left and right of the list. Do note that the renders will not be properly visible at low resolutions. I recommend having at least a 1600x900 monitor to add renders, as they purposefully do not intersect the center list area.",
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Character%20Renders.css"},
				// needs options for images and positions
				"options": {
					"li": {
						"name": "Left Image",
						"type": "user_image",
						"string_to_replace": "",
						"string_to_insert": "{{{insert}}}",
						"default": ""
					},
					"ri": {
						"name": "Right Image",
						"type": "user_image",
						"string_to_replace": "",
						"string_to_insert": "{{{insert}}}",
						"default": ""
					},
					"la": {
						"name": "Left Alignment",
						"type": "css_value",
						"string_to_replace": "",
						"string_to_insert": "{{{insert}}}",
						"default": ""
					},
					"ra": {
						"name": "Right Alignment",
						"type": "css_value",
						"string_to_replace": "",
						"string_to_insert": "{{{insert}}}",
						"default": ""
					},
					"la": {
						"name": "Left Size",
						"type": "css_value",
						"string_to_replace": "",
						"string_to_insert": "{{{insert}}}",
						"default": ""
					},
					"ra": {
						"name": "Right Size",
						"type": "css_value",
						"string_to_replace": "",
						"string_to_insert": "{{{insert}}}",
						"default": ""
					}
				}
			},
			"col": {
				// this is probably better added via more theme options rather than another mod.
				"name": "Custom Theme Colours",
				"description": "todo - may not add",
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Dark%20Mode%20Compressed.css"},
				"options": {
					// light theme base https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Dark%20Mode%20Compressed.css
					// dark theme base https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Theme%20Colours%20Dark.css
				}
			},
			"tint": {
				"name": "Tint the Background Image",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Background Tint                |
\\*------------------------------*/

body::before {
	/* change colour here */
	background: rgba(0, 0, 0, 0.8);
	
	content: "";
	z-index: -1;
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

/*------------------------E-N-D-*/`}
				// need options here
			},
			// need options for these per-category images
			"caib": {
				"name": "Per-category Banner Images",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Per-Category Banner Image      |
\\*------------------------------*/

/* All Anime */
[data-query*='status":7'] { --banner: url(URLHERE); }
/* Watching/Reading */
[data-query*='status":1'] { --banner: url(URLHERE); }
/* Completed */
[data-query*='status":2'] { --banner: url(URLHERE); }
/* Onhold */
[data-query*='status":3'] { --banner: url(URLHERE); }
/* Dropped */
[data-query*='status":4'] { --banner: url(URLHERE); }
/* Planned */
[data-query*='status":6'] { --banner: url(URLHERE); }

/*------------------------E-N-D-*/`}
			},
			"caic": {
				"name": "Per-category Character Images",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Per-Category Character Image   |
\\*------------------------------*/

/* All Anime */
[data-query*='status":7'] { --character: url(URLHERE); }
/* Watching/Reading */
[data-query*='status":1'] { --character: url(URLHERE); }
/* Completed */
[data-query*='status":2'] { --character: url(URLHERE); }
/* Onhold */
[data-query*='status":3'] { --character: url(URLHERE); }
/* Dropped */
[data-query*='status":4'] { --character: url(URLHERE); }
/* Planned */
[data-query*='status":6'] { --character: url(URLHERE); }

/*------------------------E-N-D-*/`}
			},
			"caib": {
				"name": "Per-category Background Images",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Per-Category Background Image  |
\\*------------------------------*/

/* All Anime */
body[data-query*='status":7'] { --background: url(URLHERE); }
/* Watching/Reading */
body[data-query*='status":1'] { --background: url(URLHERE); }
/* Completed */
body[data-query*='status":2'] { --background: url(URLHERE); }
/* Onhold */
body[data-query*='status":3'] { --background: url(URLHERE); }
/* Dropped */
body[data-query*='status":4'] { --background: url(URLHERE); }
/* Planned */
body[data-query*='status":6'] { --background: url(URLHERE); }

/*------------------------E-N-D-*/`}
			},
			"tra": {
				"name": "Transparent List Rows",
				"description": "This is useful in tandem with the background image, in-case you want to show it off a bit more. It will not work without a background image.",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Transparent List Rows          |
\\*------------------------------*/

:root {
	/* Change colour here */
	--row-tint: rgba(33,33,33,0.8);
}

.list-item, .data.priority, .data.number, .data.status:before, .data.status:after {
	background: linear-gradient(var(--row-tint),var(--row-tint)), var(--background) no-repeat center / cover fixed transparent !important;
}

/*------------------------E-N-D-*/`}
				// need options here
			},
			"ban": {
				"name": "Change Banner Height",
				"description": "Modify the banner height to your preference.",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Change Banner Height           |
\\*------------------------------*/

/*Change number here*/
:root { --banner-height: 318px; }

.cover-block { height: var(--banner-height); }
.header { margin-top: calc(var(--banner-height) - 36px); }
.list-stats { top: calc(var(--banner-height) + 98px); }

/*------------------------E-N-D-*/`},
				"options": {
					"height": {
						"name": "Height",
						"type": "css_value",
						"string_to_replace": "--banner-height: 318px;",
						"string_to_insert": "--banner-height: {{{insert}}};",
						"default": "318px"
					}
				}
			},
			"sta": {
				"name": "Increase the Status Bar Width",
				"description": "Increase the width of the coloured bar that indicates whether the entry is completed, dropped, etc.",
				"css": {"bottom": `/*-S-T-A-R-T--------------------*\\
| Change Status Bar Width        |
\\*------------------------------*/

.data.status { width: 2px !important; }
.list-table-data { padding-left: 0px; }

/*------------------------E-N-D-*/`}
				// need options here
			},
			"lis": {
				"name": "Coloured Line on Header",
				"description": "Adds a coloured line around the header bar and avatar for some extra flair. Single colour variant.",
				"incompatibilities": ["lic"],
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Header%20Outline%20Compressed.css"}
			},
			"lic": {
				"name": "Coloured Line on Header - Category-coloured",
				"description": "Adds a coloured line around the header bar and avatar for some extra flair. Category-coloured variant.",
				"incompatibilities": ["lis"],
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Header%20Outline%20Category-Coloured%20Compressed.css"}
			},
			"cach": {
				"name": "Category-coloured Header Text",
				"description": "Colours the header to match the referenced categories.",
				"css": {"bottom": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Category-Coloured%20Header%20Text%20Compressed.css"}
			}
			// "": {
			// 	"name": "",
			// 	"description": "",
			// 	"css": {"bottom": "../Clarity Theme/Mod - .css"}
			// }
		}
	},
	"clarified": {
		"name": "Clarified",
		"location": "",
		"type": "modern"
	},
	"brink": {
		"name": "Brink",
		"location": "",
		"type": "modern"
	},
	"agile": {
		"name": "Agile",
		"location": "",
		"type": "classic"
	},
	"kure": {
		"name": "Kure暮れ",
		"location": "",
		"type": "modern"
	},
	"puni": {
		"name": "Puni",
		"location": "",
		"type": "modern"
	},
	"tilt": {
		"name": "Tilt",
		"location": "",
		"type": "modern"
	},
	"9anime": {
		"name": "9anime",
		"location": "",
		"type": "modern"
	}
}