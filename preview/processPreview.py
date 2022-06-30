import os
import re
fileToOpen = 'preview.html'
contents = open(fileToOpen, 'r').read()
with open(fileToOpen, 'w') as file:
	replacements = [
		[r'', ''],
		[r'data-owner-id="[0-9]*"', 'data-owner-id="0"'],
		[r'data-owner-name="[^"]*"', 'data-owner-id="Example"'],
		[r'YuiAfterDark|Valerio_Lyndon', r'Example'],
		[r'(<div style="padding-top: 8px">)[\s\S]*?<div[\s\S]*?</div>', r'\1'],
		[r'<div style="padding-top: 8px">[\s\S]*?</div>', ''],
		[r'</footer>[\s\S]*</div>[\s\S]*?</body>', '</footer>\n</body>'],
		[r'<a(.*?)>', r'<a\1 onclick="return false;">'],
		[r'onclick="return false;" onclick="return false;"', r'onclick="return false;"'],
		[r'id="footer-block" style="[^"]*"', 'id="footer-block"']
	]

	for pair in replacements:
		contents = re.sub(pair[0], pair[1], contents)

	file.write(contents)
	