var data = {
	"clarity": {
		"name": "Clarity",
		"location": "../Clarity Theme/Theme.css",
		"type": "modern",
		"options": {
			"nm": {
				"name": "Name",
				"type": "user_text",
				"string_to_replace": "--name: none;",
				"string_to_insert": "--name: {{{insert}}};",
				"default": ""
			},
			"av": {
				"name": "Avatar",
				"type": "user_image",
				"string_to_replace": "--avatar: none;",
				"string_to_insert": "--avatar: {{{insert}}};",
				"default": ""
			},
			"bn": {
				"name": "Banner",
				"type": "user_image",
				"string_to_replace": "--banner: url(https://i.imgur.com/VoPJz2S.jpg);",
				"string_to_insert": "--banner: {{{insert}}};",
				"default": "https://i.imgur.com/VoPJz2S.jpg"
			},
			"ch": {
				"name": "Character",
				"type": "user_image",
				"string_to_replace": "--character: url(https://i.imgur.com/6IPyngH.png);",
				"string_to_insert": "--character: {{{insert}}};",
				"default": "https://i.imgur.com/6IPyngH.png"
			},
			"bg": {
				"name": "Background",
				"type": "user_image",
				"string_to_replace": "--background: none;",
				"string_to_insert": "--background: {{{insert}}};",
				"default": ""
			}
		},
		"mods": {
			"hd": {
				"name": "Image Hover Mod",
				"description": "Adds larger images on mouse hover. Will slow down page loads.",
				"location": "../Clarity Theme/Mod - Hover Image Compressed.css"
			}
		}
	},
	"brink": {
		"name": "Brink",
		"location": "../Brink Theme/Brink.css",
		"type": "modern"
	}
}