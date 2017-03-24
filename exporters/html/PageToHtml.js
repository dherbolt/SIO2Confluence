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
const sioIdPrefix = cfg.confluence.sioIdPrefix;

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

	function getComponentTitle (title, defValue) {
		return title || defValue || '';
	}

	function getSearchUrl(sioUrl) {
		return encodeURI(`${cfg.confluence.baseUrl}/dosearchsite.action?queryString="[${sioIdPrefix}:${getSioPageIdFromUrl(sioUrl)}]"`);
	}

	function replaceYoutubeIframe(html) {
		let pattern = /src="([^"]+)"/,
			match = pattern.exec(html),
			url;

		if (match) {
			url = match[1];
		} else {
			return html;
		}

		pattern = /embed\/([\d\w]+)/;
		match = pattern.exec(url)

		let youtubeId = match[1];

		return (youtubeId)
			? `<a target="_blank" href="http://youtube.com/watch?v=${youtubeId}"><img src="http://img.youtube.com/vi/${youtubeId}/1.jpg" width="100%" /></a>`
			: html;
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
			let search = /\W(?:href=|src=)("|')((?:https:\/\/)?samepage\.io\/.*?)\1|("|')(\/.*?)\3/gi;
			let match;

			while (match = search.exec(value)) {
    			let matchedUri = match[2] || match[4];
				let searchUrl = getSearchUrl(matchedUri);

				value = value.replace(matchedUri, searchUrl);

				jetpack.append(APP_ROOT + '/logs/links.txt', `[${new Date().toISOString()}] Page ${page.name} (id: ${page.id}) contains links to other pages.\n`);
			}

			html.push(`<h2>${getComponentTitle(node.name, 'Text')}</h2>`);
			html.push(`<div>${value}</div>`);
			pushDelmiter(html);
		}

		else if (node.type === 'Images') {
			// Logger.log(node.children[0].file);
			html.push(`<h2>${getComponentTitle(node.name, 'Images')}</h2>`);
			node.children && addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'Table') {
			let cmpHtml = [];
			addTable(node, cmpHtml);
			renderCmp(cmpHtml.join(''));
			pushDelmiter(html);
		}

		else if (node.type === 'FileLib') {
			html.push(`<h2>${getComponentTitle(node.name, 'Files')}</h2>`);
			node.children && addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'File') {
			let fileProps;
			let fileName;

			if (node.value) {
				fileProps = node.value.properties;
				fileName = node.value.name;
			}
			else {
				fileProps = node.file.properties;
				fileName = node.file.name;
			}

			if (fileProps.imageFormat) {
				// html.push(JSON.stringify(node));
				let style =	"max-width: 100%; height: auto !important;";
				renderCmp(`<div style="${pageCfg.isNewSio ? 'text-align: center' : ''}"> <img style="${style}" src="${fileName}" width="${fileProps.imageSize.width}" height="${fileProps.imageSize.height}" /> </div>`);
			}
			else {
				renderCmp(`<div><a style="color:${linkColor};" href="${fileName}">${node.name}</a></div>`);
			}

			page.attachments.push(fileName);
		}
		else if (node.type === 'Page') {
			renderCmp(`<h3><a style="color:${linkColor};" href="${node.id}">${node.name}</a></h3>`);
			page.subPages.push(Object.assign({}, node, {name: getConfluencePageName(node)}));
		}
		else if (node.type === 'LinkList') {
			html.push(`<h2>${getComponentTitle(node.name, 'Links')}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'Link') {
			let value = node.value;
			let name = node.name;

			let sioLinkRe = /\W((?:https:\/\/)?samepage\.io\/.*)|(\/.*\/#?page-.*)/gi;

			if (sioLinkRe.test(value)) {
				value = getSearchUrl(value);

				if (sioLinkRe.test(name)) {
					name = getSearchUrl(name);
				}
			}

			renderCmp(`<div><a style="color:${linkColor};" href="${value}">${name}</a></div>`);
		}
		else if (node.type === "FileFolder") {
			Logger.error(`>> ${getConfluencePageName(node)} contains a folder Skipping...`);
		}
		else if (node.type === 'Mashup') {
			html.push(`<h2>${getComponentTitle(node.name, 'HTML')}</h2>`);
			html.push(replaceYoutubeIframe(node.value));
			pushDelmiter(html);
		}
		else if (node.type === 'DropboxLinks') {
			html.push(`<h2>${getComponentTitle(node.name, 'Cloud Files')}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'DropboxLink') {
			renderCmp(`<div><a style="color:${linkColor};" href="${node.value}">${node.name}</a></div>`);
		}
		else if (node.type === 'Video' || node.type === 'Video2') {
			html.push(`<h2>${getComponentTitle(node.name, 'Video')}</h2>`);
			html.push(replaceYoutubeIframe(node.value));
			pushDelmiter(html);
		}
		else if (node.type === 'Map') {
			html.push(`<h2>${getComponentTitle(node.name, 'Map')}</h2>`);
			renderCmp(`<div><a style="color:${linkColor};" target="_blank" href="https://maps.google.com/maps?q=${node.value.lat},${node.value.lng}">Google Map</a></div>`);
			pushDelmiter(html);
		}
		else if (node.type === 'EventList') {
			html.push(`<h2>${getComponentTitle(node.name, 'Events')}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'Event') {
			let content = `<div><b>${node.name}</b></div>`;

			content += '<div>';
			if (node.value.allday) {
				content += `<li>date: ${Date(node.value.startDate)}</li>`;
			} else {
				content += `<li>starts: ${Date(node.value.startDate)}</li>`;
				content += `<li>ends: ${Date(node.value.endDate)}</li>`;
			}
			if (node.value.location) {
				content += `<li>location: ${node.value.location}</li>`;
			}
			if (node.value.description) {
				content += `<li>description: ${node.value.description}</li>`;
			}
			content += '</div>';
			renderCmp(content);
		}
		else if (node.type === 'TaskList') {
			html.push(`<h2>${getComponentTitle(node.name, 'Tasks')}</h2>`);
			addChildren(node, html);
			pushDelmiter(html);
		}
		else if (node.type === 'Task') {
			let content = [];
			let value = node.value || {};
			let assengee = value.assignee && (value.assignee.fullname || value.assignee.emailAddress);
			let progress = value.finished ? '&#x2713;' : (value.progress || 0) + '%';
			let description = value.description;

			let search = /\W?(https:\/\/samepage\.io\/[a-zA-Z0-9\/#!-]+)/gi;
			let match;

			while (match = search.exec(description)) {
    			let matchedUri = match[1];
				let searchUrl = getSearchUrl(matchedUri);

				description = description.replace(matchedUri, `<a href="${searchUrl}">${decodeURI(searchUrl)}</a>`);
			}


			content.push('<div><ul>');
			content.push(
				`<li>`,
					`<span style="padding-right: 10px;">${progress}</span>`,
					assengee ? `<span style="padding-right: 10px;">${assengee}</span>` : '',
					node.name ? `<span style="padding-right: 10px;">${node.name}</span>` : '',
					value.dueDate ? `<div style="padding-top: 5px;">${value.dueDate ? ('Due Date: ' + Date(value.dueDate)) : ''}</div>` : '',
					description ? `<div style="padding-top: 5px;">${description || ''}</div>`: '',
				`</li>`
			);

			content.push('</ul></div>');
			renderCmp(content.join(''));
		}
		else if (node.type === 'Comment') {
			// skip
		}
		else {
			Logger.log(`Unknown node type '${node.type}' -- '${JSON.stringify(node)}'`);
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