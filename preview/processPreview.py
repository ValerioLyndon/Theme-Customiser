import os
import re
previewFiles = [
	'modern\\animelist.html',
	'classic\\animelist.html'
	#'modern\\mangalist.html',
	#'classic\\mangalist.html'
]
for filePath in previewFiles:
	fileToOpen = os.path.join(os.path.dirname(__file__), filePath)
	contents = open(fileToOpen, 'r').read()
	with open(fileToOpen, 'w') as file:
		replacements = [
			#modern lists & mixed
			[r'data-owner-id="[0-9]*"', 'data-owner-id="0"'],
			[r'data-owner-name="[^"]*"', 'data-owner-id="Example"'],
			[r'YuiAfterDark|Valerio_Lyndon', r'Example'],
			[r'(<div style="padding-top: 8px">)[\s\S]*?<div[\s\S]*?</div>', r'\1'],
			[r'<div style="padding-top: 8px">[\s\S]*?</div>', ''],
			[r'</footer>[\s\S]*</div>[\s\S]*?</body>', '</footer>\n</body>'],
			[r'<a(.*?)>', r'<a\1 onclick="return false;">'],
			[r'onclick="return false;" onclick="return false;"', r'onclick="return false;"'],
			[r'id="footer-block" style="[^"]*"', 'id="footer-block"'],
			[r'class="header-title number"', r'class="header-title number" tc-column="Numbers"'],
			[r'class="data number"', r'class="data number" tc-column="Numbers"'],
			[r'class="header-title image"', r'class="header-title image" tc-column="Image"'],
			[r'class="data image"', r'class="data image" tc-column="Image"'],
			[r'class="header-title score"', r'class="header-title score" tc-column="Score"'],
			[r'class="data score"', r'class="data score" tc-column="Score"'],
			[r'class="header-title type"', r'class="header-title type" tc-column="Type"'],
			[r'class="data type"', r'class="data type" tc-column="Type"'],
			[r'class="header-title progress"', r'class="header-title progress" tc-column="Episodes"'],
			[r'class="data progress"', r'class="data progress" tc-column="Episodes"'],
			[r'class="header-title tags"', r'class="header-title tags" tc-column="Tags"'],
			[r'class="data tags"', r'class="data tags" tc-column="Tags"'],
			[r'class="header-title rated"', r'class="header-title rated" tc-column="Rating"'],
			[r'class="data rated"', r'class="data rated" tc-column="Rating"'],
			[r'class="header-title started"((?:[\s\S](?!th))*?Started Date)', r'class="header-title started" tc-column="Start/End Dates"\1'],
			[r'class="data started"', r'class="data started" tc-column="Start/End Dates"'],
			[r'class="header-title finished"((?:[\s\S](?!th))*?Finished Date)', r'class="header-title finished" tc-column="Start/End Dates"\1'],
			[r'class="data finished"', r'class="data finished" tc-column="Start/End Dates"'],
			[r'class="header-title days"', r'class="header-title days" tc-column="Total Days Watched"'],
			[r'class="data days"', r'class="data days" tc-column="Total Days Watched"'],
			[r'class="header-title started"((?:[\s\S](?!th))*?Premiered)', r'class="header-title started" tc-column="Premiered"\1'],
			[r'class="data season"', r'class="data season" tc-column="Premiered"'],
			[r'class="header-title started"((?:[\s\S](?!th))*?Air Start)', r'class="header-title started" tc-column="Aired Dates"\1'],
			[r'class="data airing-started"', r'class="data airing-started" tc-column="Aired Dates"'],
			[r'class="header-title finished"((?:[\s\S](?!th))*?Air End)', r'class="header-title finished" tc-column="Aired Dates"\1'],
			[r'class="data airing-finished"', r'class="data airing-finished" tc-column="Aired Dates"'],
			[r'class="header-title studio"', r'class="header-title studio" tc-column="Studios"'],
			[r'class="data studio"', r'class="data studio" tc-column="Studios"'],
			[r'class="header-title licensor"', r'class="header-title studio" tc-column="Licensors"'],
			[r'class="data licensor"', r'class="data licensor" tc-column="Licensors"'],
			[r'class="header-title storage"', r'class="header-title storage" tc-column="Storage"'],
			[r'class="data storage"', r'class="data storage" tc-column="Storage"'],
			[r'class="header-title priority"', r'class="header-title priority" tc-column="Priority"'],
			[r'class="data priority"', r'class="data priority" tc-column="Priority"'],
			[r'class="header-title genre"', r'class="header-title genre" tc-column="Genre"'],
			[r'class="data genre"', r'class="data genre" tc-column="Genre"'],
			[r'class="header-title demographic"', r'class="header-title demographic" tc-column="Demographics"'],
			[r'class="data demographic"', r'class="data demographic" tc-column="Demographics"'],
			#class lists only
			[r'(style="border-left-width: 1px;" width="30" align="center")', r'\1 tc-column="Numbers"'],
			[r'(width="45" align="center")', r'\1 tc-column="Score"'],
			[r'(width="70" align="center")', r'\1 tc-column="Episodes"'],
			[r'(width="50" align="center")((?:[\s\S](?!td))*?(?:TV|Special|OVA|ONA))', r'\1 tc-column="Type"\2'],
			[r'(width="70" align="center")', r'\1 tc-column="Episodes"'],
			[r'(width="125" align="left")((?:[\s\S](?!td))*?tagChangeRow)', r'\1 tc-column="Tags"'],
			[r'(width="50" align="center")((?:[\s\S](?!td))*?(?:G|PG|PG-13|R|R\+|X))', r'\1 tc-column="Rating"\2'],
			[r'(width="90" align="center")', r'\1 tc-column="Start/End Dates"'],
			[r'(width="45" nowrap="" align="center")', r'\1 tc-column="Days"'],
			[r'(width="75" nowrap="" align="center")', r'\1 tc-column="Storage"'],
			[r'(width="125" align="left")((?:[\s\S](?!td))*?genre=)', r'\1 tc-column="Genre"\2'],
			[r'(width="90" align="left")', r'\1 tc-column="Demographic"'],
			#both lists
			[r'(tc-column="[^"]*?") tc-column="[^"]*?"', r'\1']
		]

		for pair in replacements:
			contents = re.sub(pair[0], pair[1], contents)

		file.write(contents)
	