var data = {
	"clarity": {
		"name": "Clarity",
		"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Theme%20-%20Compressed.css",
		"type": "modern",
		"options": {
			"nm": {
				"name": "Name",
				"type": "user_text",
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
				"description": "Darker visuals for a more appealing look.",
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Dark%20Mode%20Compressed.css"
			},
			"hdr": {
				"name": "Image Hover Mod (On Row variant)",
				// needs import at top with username: @\import "https://malscraper.azurewebsites.net/covers/anime/YOURNAME/presets/dataimagelinkbefore";
				"description": "Adds larger images on mouse hover. Will slow down page loads.",
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Hover%20Image%20Compressed.css"
			},
			"hdi": {
				"name": "Image Hover Mod (On Image variant)",
				// needs import at top with username: @\import "https://malscraper.azurewebsites.net/covers/anime/YOURNAME/presets/dataimagelinkbefore";
				"description": "Adds larger images on mouse hover. Will slow down page loads.",
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Hover%20Image%20On%20Circle%20Compressed.css"
			},
			"re": {
				"name": "Review-style/note-style Tags",
				"description": "Widens the tag box and condenses it all into one cohesive paragraph, disabling tag functionality. Great for mini-reviews or quick notes.",
				"incompatibilities": ["ho"],
				"location": "https://raw.githubusercontent.com/ValerioLyndon/MAL-Public-List-Designs/master/Clarity%20Theme/Mod%20-%20Review%20Tags%20Compressed.css"
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
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Favourite%20Hearts%20Left%20Compressed.css"
			},
			"favr": {
				"name": "Favourite Hearts (Right variant)",
				"description": "Ditto",
				"incompatibilities": ["favl"],
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Favourite%20Hearts%20Right%20Compressed.css"
			},
			"ho": {
				"name": "Horizontal Tags",
				"description": "todo",
				"incompatibilities": ["re"],
				"location": "../Clarity Theme/Mod - .css"
			},
			"ren": {
				"name": "Character Renders",
				"description": "Adds two optional character renders on the left and right of the list. Do note that the renders will not be properly visible at low resolutions. I recommend having at least a 1600x900 monitor to add renders, as they purposefully do not intersect the center list area.",
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Character%20Renders.css",
				// needs options for images and positions
				"options": {}
			},
			"col": {
				// this is probably better added via more theme options rather than another mod.
				"name": "Custom Theme Colours",
				"description": "todo - may not add",
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Dark%20Mode%20Compressed.css",
				"options": {
					// light theme base https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Dark%20Mode%20Compressed.css
					// dark theme base https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Theme%20Colours%20Dark.css
				}
			},
			"tint": {
				"name": "Tinting the Background",
				"description": "",
				"location": "../Clarity Theme/Mod - .css"
			},
			"caib": {
				"name": "Per-category Banner Images",
				"description": "todo",
				"location": "../Clarity Theme/Mod - .css"
			},
			"caic": {
				"name": "Per-category Character Images",
				"description": "todo",
				"location": "../Clarity Theme/Mod - .css"
			},
			"caib": {
				"name": "Per-category Background Images",
				"description": "todo",
				"location": "../Clarity Theme/Mod - .css"
			},
			"tra": {
				"name": "Transparent List Rows",
				"description": "todo",
				"location": "../Clarity Theme/Mod - .css"
			},
			"ban": {
				"name": "Change Banner Height",
				"description": "todo",
				"location": "../Clarity Theme/Mod - .css"
			},
			"sta": {
				"name": "Increase the Status Bar Width",
				"description": "todo - per popular request",
				"location": "../Clarity Theme/Mod - .css"
			},
			"lis": {
				"name": "Coloured Line on Header",
				"description": "Adds a coloured line around the header bar and avatar for some extra flair. Single colour variant.",
				"incompatibilities": ["lis"],
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Header%20Outline%20Compressed.css"
			},
			"lic": {
				"name": "Coloured Line on Header - Category-coloured",
				"description": "Adds a coloured line around the header bar and avatar for some extra flair. Category-coloured variant.",
				"incompatibilities": ["lis"],
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Header%20Outline%20Category-Coloured%20Compressed.css"
			},
			"cach": {
				"name": "Category-coloured Header Text",
				"description": "Colours the header to match the referenced categories.",
				"location": "https://valeriolyndon.github.io/MAL-Public-List-Designs/Clarity%20Theme/Mod%20-%20Category-Coloured%20Header%20Text%20Compressed.css"
			}
			// "": {
			// 	"name": "",
			// 	"description": "",
			// 	"location": "../Clarity Theme/Mod - .css"
			// }
		}
	},
	"brink": {
		"name": "Brink",
		"location": "../Brink Theme/Brink.css",
		"type": "modern"
	}
}