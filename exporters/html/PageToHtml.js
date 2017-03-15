const jetpack = require('fs-jetpack');
const path = require('path');
const APP_ROOT = __dirname + '/../..';
const layoutParser = require(APP_ROOT + '/data-sources/sio/layoutParser');
const addTable = require(__dirname + '/Table');


module.exports = function processPage (sourceFolder) {
	const useLayouts = true;
	const pageRootPath = path.normalize(sourceFolder);
	const pageJson = pageRootPath + '/page.json';

	console.log(`> Reading ${pageJson}...`);
	let pageCfg = JSON.parse(jetpack.read(pageJson));

	let body = [];
	let page = {
		title: pageCfg.name,
		html: '',
		attachments: [],
		subPages: []
	};
	let pageLayout;

	function addChildren(node, html, isRoot) {
		if (isRoot) {
			pageLayout = node.layout && node.layout.columns;
	//	console.log(pageLayout);
		}

		for (let child of node.children) {
			html.push(addChild(child, html));
		}
		if (lastLayout && isRoot) {
			body.push(`</div></div>`);
		}
	}


	let lastLayout;

	function addChild(node, html) {
		if (node.layout && node.layout.column && node.layout.column !== lastLayout) {
			if (lastLayout) {
				html.push(`</div>`);
			}
			else {
				html.push('<div style="display: flex;flex-direction: row;flex-wrap: nowrap;">');
			}

			lastLayout = node.layout && node.layout.column;
			let width = 'auto';
			if (lastLayout && pageLayout) {
				width = pageLayout[lastLayout].width;
				if (width) {
					width = width + 'px';
				}
			}
			let styles = [
				'display: inline-block',
				'width: ' + width,
				'vertical-align: top',
				'overflow-x: hidden',
				'border: 1px solid #eeeeee',
				'padding: 10px'
			];
			html.push(`<div class="column column-${node.layout.column}" style="${styles.join(';')}";>`);
		}

		if (node.type === 'TextNote') {
			html.push(`<h2>${node.name}</h2>`);
			html.push(`<div>${node.value || ''}</div>`);
			pushDelmiter(html);
		}

		else if (node.type === 'Images') {
			// console.log(node.children[0].file);
			html.push(`<h2>${node.name}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'File' && node.file.properties.imageFormat) {
			let imgInfo = node.file.properties;
			// html.push(JSON.stringify(node));
			let style =	"max-width: 100%; height: auto !important;";
			html.push(`<div> <img style="${style}" src="${node.file.name}" width="${imgInfo.imageSize.width}" height="${imgInfo.imageSize.height}" /> </div>`);
			page.attachments.push(node.file.name);
		}

		else if (node.type === 'Table') {
			addTable(node, html);
			pushDelmiter(html);
		}

		else if (node.type === 'FileLib') {
			html.push(`<h2>Files</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'File') {
			html.push(`<a href="${node.file.name}">${node.name}</a>`);
			page.attachments.push(node.file.name);
		}
		else if (node.type === 'Page') {
			html.push(`<h3><a href="${node.id}">${node.name}</a></h3>`);
			page.subPages.push(node);
		}
		else if (node.type === 'LinkList') {
			html.push(`<h2>Links</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === "Link") {
			html.push(`<div><a href="${node.value}">${node.name}</a></div>`);
		}
		else {
			throw new Error(`Unknown node type ${node.type} -- ${JSON.stringify(node)}`);
		}
	}

	function pushDelmiter(html) {
		html.push('<hr style="border: 1px solid #eeeeee;" />');
	}



	addChildren(pageCfg, body, true);

	body = body.join('');


	page.html = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>${pageCfg.name}</title>
		<style type="text/css">
			body, p {
				margin: 0;
			}
			img {
				max-width: 100%;
				height: auto !important;
			}
			hr {
				border: 1px solid #eeeeee;
			}
			.layoutWrap {
				display: flex;
				flex-direction: row;
				flex-wrap: nowrap;
			}

		</style>
	<head>

	<body style="font-family: Helvetica, Arial, Sans-Serif; margin: 0;">
		${body}
	</body>
	</html>
	`;

	return page;
};