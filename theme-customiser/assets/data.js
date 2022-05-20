var data = {
	"clarity": {
		"name": "Clarity",
		"location": "../Clarity Theme/Theme.css",
		"type": "modern",
		"options": [
			{
				"name": "Name",
				"type": "user_text",
				"string_to_replace": "--name: none;",
				"string_to_insert": "--name: {{{insert}}};",
				"default": ""
			},
			{
				"name": "Avatar",
				"type": "user_image",
				"string_to_replace": "--avatar: none;",
				"string_to_insert": "--avatar: {{{insert}}};",
				"default": ""
			},
			{
				"name": "Banner",
				"type": "user_image",
				"string_to_replace": "--banner: url(https://i.imgur.com/VoPJz2S.jpg);",
				"string_to_insert": "--banner: {{{insert}}};",
				"default": "https://i.imgur.com/VoPJz2S.jpg"
			},
			{
				"name": "Character",
				"type": "user_image",
				"string_to_replace": "--character: url(https://i.imgur.com/6IPyngH.png);",
				"string_to_insert": "--character: {{{insert}}};",
				"default": "https://i.imgur.com/6IPyngH.png"
			},
			{
				"name": "Background",
				"type": "user_image",
				"string_to_replace": "--background: none;",
				"string_to_insert": "--background: {{{insert}}};",
				"default": ""
			}
		],
		"mods": [
			{
				"name": "Image Hover Mod",
				"description": "Adds larger images on mouse hover. Will slow down page loads.",
				"location": "../Clarity Theme/Mod - Hover Image Compressed.css"
			}
		]
	}
}