const APP_ROOT = __dirname + '/../..';

require(APP_ROOT + '/common.js');

const jetpack = require('fs-jetpack');
const path = require('path');
const layoutParser = require(APP_ROOT + '/data-sources/sio/layoutParser');
const addTable = require(__dirname + '/Table');
const latinize = require(APP_ROOT + '/lib/Latinize').latinize;
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));
const linkColor = '#00adef';
let newSioComponentsHtml = [];
let cmpIndex = 0;
const sioIdPrefix = cfg.confluence.sioIdPrefix || 'SIO';

module.exports = function processPage (sourceFolder) {
	const useLayouts = true;
	const pageRootPath = path.normalize(sourceFolder);
	const pageJson = pageRootPath + '/page.json';

	Logger.log(`> Reading ${pageJson}...`);
	let pageCfg = JSON.parse(jetpack.read(pageJson));

	let body = [];
	let page = {
		name: getConfluencePageName(pageCfg),
		html: '',
		attachments: [],
		subPages: [],
		id: pageCfg.id
	};
	let pageLayout;

	function addChildren(node, html, isRoot) {
		if (isRoot) {
			pageLayout = node.layout && node.layout.columns;
			html.push(node.value || '');
		}

		if (node.children) {
			for (let child of node.children) {
				html.push(addChild(child, html));
			}
		}
		if (lastLayout && isRoot) {
			body.push(`</div></div>`);
		}
	}


	let lastLayout;

	function getConfluencePageName(page) {
		return (`${latinize(page.name)} [${sioIdPrefix}:${page.id}]`).replace(/\s+/g, ' ').trim();
	}

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
			let value = (node.value || '').replace(/<p>/gi, '<p style="margin: 0;">');
			let search = /(href=|src=)("|')((https:\/\/)?samepage.io\.*?)("|')/gi;
			let match = [];

			while (match=search.exec(value)) {
    			let searchUrl = encodeURI(`${cfg.confluence.baseUrl}/dosearchsite.action?queryString="[${sioIdPrefix}:${getSioPageIdFromUrl(match[3])}]"`);

				// Logger.log(`Page ${page.name} (id: ${page.id}) contains links to other pages.`);
				// Logger.log(`${match[3]} => ${searchUrl}`);

				value = value.replace(match[3], searchUrl);
				value = value.replace('<a href', `<a style="color:${linkColor};" href`);

				jetpack.append(APP_ROOT + '/logs/links.txt', `[${new Date().toISOString()}] Page ${page.name} (id: ${page.id}) contains links to other pages.\n`);
			}

			html.push(`<h2>${node.name || 'Text'}</h2>`);
			html.push(`<div>${value}</div>`);
			pushDelmiter(html);
		}

		else if (node.type === 'Images') {
			// Logger.log(node.children[0].file);
			html.push(`<h2>${node.name || 'Images'}</h2>`);
			node.children && addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'File' && node.file.properties.imageFormat) {
			let imgInfo = node.file.properties;
			// html.push(JSON.stringify(node));
			let style =	"max-width: 100%; height: auto !important;";
			renderCmp(`<div style="${pageCfg.isNewSio ? 'text-align: center' : ''}"> <img style="${style}" src="${node.file.name}" width="${imgInfo.imageSize.width}" height="${imgInfo.imageSize.height}" /> </div>`);

			page.attachments.push(node.file.name);
		}

		else if (node.type === 'Table') {
			let cmpHtml = [];
			addTable(node, cmpHtml);
			renderCmp(cmpHtml.join(''));
			pushDelmiter(html);
		}

		else if (node.type === 'FileLib') {
			html.push(`<h2>${node.name || 'Files'}</h2>`);
			node.children && addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'File') {
			renderCmp(`<div><a style="color:${linkColor};" href="${node.file.name}">${node.name}</a></div>`);
			page.attachments.push(node.file.name);
		}
		else if (node.type === 'Page') {
			renderCmp(`<h3><a style="color:${linkColor};" href="${node.id}">${node.name}</a></h3>`);
			page.subPages.push(Object.assign({}, node, {name: getConfluencePageName(node)}));
		}
		else if (node.type === 'LinkList') {
			html.push(`<h2>${node.name || 'Links'}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === "Link") {
			renderCmp(`<div><a style="color:${linkColor};" href="${node.value}">${node.name}</a></div>`);
		}
		else if (node.type === "FileFolder") {
			Logger.error(`>> ${getConfluencePageName(node)} contains a folder Skipping...`);
		}
		else if (node.type === 'Mashup') {
			html.push(`<h2>${node.name || 'HTML'}</h2>`);
			html.push(`<div>${node.value || ''}</div>`);
			pushDelmiter(html);
		}
		else if (node.type === 'DropboxLinks') {
			html.push(`<h2>${node.name || 'Cloud Files'}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'DropboxLink') {
			renderCmp(`<div><a style="color:${linkColor};" href="${node.value}">${node.name}</a></div>`);
		}
		else if (node.type === 'Video' || node.type === 'Video2') {
			html.push(`<h2>${node.name || 'Video'}</h2>`);
			html.push(`<iframe width="560" height="315" src="${node.value || ''}" frameborder="0" allowfullscreen></iframe>`);
			pushDelmiter(html);
		}
		else if (node.type === 'Map') {
			html.push(`<h2>${node.name || 'Map'}</h2>`);
			renderCmp(`<div><a style="color:${linkColor};" target="_blank" href="https://maps.google.com/maps?q=${node.value.lat},${node.value.lng}">Google Map</a></div>`);
			pushDelmiter(html);
		}
		else if (node.type === 'EventList') {
			html.push(`<h2>${node.name || 'Events'}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'Event') {
			let content = `<div><b>${node.name}</b></div>`;

			content += '<div>';
			if (node.value.location) {
				content += `<li>location: ${node.value.location}</li>`;
			}
			if (node.value.description) {
				content += `description: ${node.value.description}</li>`;
			}
			if (node.value.startDate) {
				content += `<li>starts: ${node.value.startDate}</li>`;
			}
			if (node.value.endDate) {
				content += `<li>ends: ${node.value.endDate}</li>`;
			}
			content += '</div>';
			renderCmp(content);
		}
		else {
			throw new Error(`Unknown node type ${node.type} -- ${JSON.stringify(node)}`);
		}
	}

	function pushDelmiter(html) {
		html.push('<hr style="border: 1px solid #eeeeee;" />');
	}


	function renderCmp(htmlCmp, append) {
		newSioComponentsHtml[cmpIndex] = (newSioComponentsHtml[cmpIndex] || '') + htmlCmp;
		cmpIndex++;

		body.push(htmlCmp);
	}


	addChildren(pageCfg, body, true);

	if (pageCfg.isNewSio) {
		body = pageCfg.value;

		for (let cmp of newSioComponentsHtml) {
			body = body.replace('~', cmp);
		}

		body = `<div style="min-width: 430px; max-width: 812px; margin-left: auto; margin-right: auto;">${body}</div>`;
	}
	else {
		body = body.join('');
	}


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