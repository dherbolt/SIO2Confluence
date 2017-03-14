const jetpack = require('fs-jetpack');
const path = require('path');

let pageRootPath = path.normalize(__dirname + '/../../download/10k-users-in-kerio-connect--58309038387064065');
let outPath = pageRootPath + '/index.html';
const pageJson = pageRootPath + '/page.json';

console.log(`> Reading ${pageJson}...`);
let page = JSON.parse(jetpack.read(pageJson));

let body = [`<h1>${page.name}</h1>`];

function addChildren(node, html) {
	for (let child of node.children) {
		html.push(addChild(child, html));
	}
}

function addChild(node, html) {
	if (node.type === 'TextNote') {
		html.push(`<h2>${node.name}</h2>`);
		html.push(`<div>${node.value}</div>`);
	}

	else if (node.type === 'Images') {
		html.push(`<h2>${node.name}</h2>`);
		addChildren(node, html);
	}
	else if (node.type === 'File' && node.file.properties.imageFormat) {
		let imgInfo = node.file.properties;
		// html.push(JSON.stringify(node));
		html.push(`<div> <img src="${node.file.dashifiedName}" width="${imgInfo.width}" height="${imgInfo.height}" /> </div>`);
	}

	else if (node.type === 'Table') {
		html.push(`<div> TODO </div>`);
	}

	else if (node.type === 'FileLib') {
		html.push(`<h2>Files</h2>`);
		addChildren(node, html);
	}
	else if (node.type === 'File') {
		html.push(`<a href="${node.file.dashifiedName}">${node.name}</a>`);
	}
}

addChildren(page, body);

body = body.join('');


let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
	<title>${page.name}</title>
<head>

<body style="font-family: Helvetica, Arial, Sans-Serif;">
${body}
</body>
</html>
`;




jetpack.write(outPath, html);

console.log('Done');