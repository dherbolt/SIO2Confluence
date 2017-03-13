const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const jetpack = require('fs-jetpack');


function download(pageId, parentDir) {
	return new Promise(function (resolve, reject) {
		module.exports.getContent(pageId).then((args) => {
			let { error, response, body } = args;
			let sioPage = body.result.page;
			let dirName = `${sioPage.dashifiedName}--${pageId}`;
			if (!parentDir) {
				console.log(`Cleaning ${dirName}`);
				jetpack.remove(dirName);
			}

			console.log(`Downloaded ${sioPage.dashifiedName} --> ${pageId}`);
			if (parentDir) {
				dirName = `${parentDir}/${dirName}`;
			}

			let page = {
				name: sioPage.name,
				children: processChildren(sioPage)
			};

			jetpack.write(`download/${dirName}/sio-page.json`, JSON.stringify(sioPage, null, '\t'));
			jetpack.write(`download/${dirName}/page.json`, JSON.stringify(page, null, '\t'));

			let subPages = [];
			for (let page of sioPage.components.subpages) {
				subPages.push(download(page.id, dirName));
			}
			Promise.all(subPages).then(() => {
				resolve();
			});
		});
	});
}

function getContent(pageId, callback) {
	return new Promise(function (resolve, reject) {
		sendXhr('Pages.getWithContent', {
			id: pageId,
			tenantId: auth.info.tenant.publicId
		}, resolve);
	});
}

function processChildren(node) {
	let children = [];
	if (!node.children) {
		return undefined;
	}
	for (let child of node.children) {
		children.push(processChild(child));
	}
	children = children.length ? children : undefined;
	return children;
}

function processChild(node) {
	return {
		type: node.type,
		name: node.name,
		id: node.id,
		children: processChildren(node),
		value: node.value && (node.value.text || node.value.url || undefined)
	};
}
//471637758398743956
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/imagepreview/471637758398743956?width=681&height=639&version=1

module.exports = {
	download,
	getContent
};
