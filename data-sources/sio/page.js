const APP_ROOT = __dirname + '/../..';
const request = require('request');
const fs = require('fs');
const sortChildren = require(__dirname + '/sortChildren');
const sanitize = require(APP_ROOT + '/fileUtil').sanitize;

const sendXhr = require(APP_ROOT + '/sendXhr');
const auth = require(APP_ROOT + '/auth');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));
const promisefy = require(APP_ROOT + '/promisefy');
const downloadFileLib = require(__dirname + '/FileLib');
var pages = {};

let rootDir;

function download(pageId, parentDir) {
	return new Promise(function (resolve, reject) {
		// downloadFile({
		// 	url: 'https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/401469089400651104',
		// 	path: 'download/__test---about-diaolog-final-spec-png'
		// }).then(function () {
		// 	Logger.log('----------------------');
		// });
		// return;


		getContent(pageId).then((args) => {
			let { error, response, body } = args;

			if (body.error) {
				Logger.error(`ERROR: ID: ${pageId} -- ${JSON.stringify(body.error)}`);
				Logger.error('Page cannot be downloaded!');
				return;
			}

			let sioPage = body.result.page;
			let dirName = `${sioPage.dashifiedName}--${pageId}`;
			let coeId = sioPage.coeRoomId.split('/')[0];

			if (!parentDir) {
				//Logger.log(`Cleaning ${dirName}`);
				//jetpack.remove(dirName);
				dirName = `download/${dirName}`;
				rootDir = dirName;
			}
			pages[sioPage.dashifiedName] = parentDir;

			Logger.log(`Downloaded ${sioPage.dashifiedName} --> ${pageId}`);
			if (parentDir) {
				dirName = `${parentDir}/${dirName}`;
			}

			jetpack.write(`${dirName}/sio-page.json`, JSON.stringify(sioPage, null, '\t'));

			promisefy(sioPage.children, processChild, {coeId, dirPath: dirName }).then(function (children) {
				let page = Object.assign({}, getNodeInfo(sioPage), {
					children: children,
					isNewSio: !!sioPage.teamContainer
				});

				page = sortChildren(page);

				jetpack.write(`${dirName}/page.json`, JSON.stringify(page, null, '\t'));

				// skip subPages
				if (!cfg.sio.downloadSubpages) {
					downloadAllFiles(resolve);
					return;
				}

				let subPages = [];
				for (let page of sioPage.components.subpages) {
					subPages.push(download(page.id, dirName));
				}
				Promise.all(subPages).then((function (parentDir) {

					return function () {
						if (parentDir) {  // subpage
							resolve({ rootDir });
							return;
						}

						downloadAllFiles(resolve);  // parent page completed
						// Promise.all(allFiles).then(() => resolve());
					};
				})(parentDir));
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

function getNodeInfo(node) {
	return {
		type: node.type,
		name: sanitize(node.name),
		id: node.id,
		dashifiedName: node.dashifiedName,
		layout: node.layout,
		value: node.value && (node.value.text || node.value.url || node.value.html || node.value.markerPosition)
	};
}

function processChildren(children, coeId, dirPath) {
	return new Promise(function (resolve, reject) {
		// let children = [];

		if (!children) {
			resolve();
			return undefined;
		}

		let processedChildren = [];
		for (let child of children) {
			processedChildren.push(processChild(child, {coeId, dirPath}));
		}

		Promise.all(processedChildren).then(function (children) {
			// console.log('####', children);
			children = children.length ? children : undefined;
			resolve(children);
		});
	});
}

function processChild(node, customParams) {
	return new Promise(function (resolve, reject) {
		let {coeId, dirPath } = customParams || {};
		if (node.type === 'FileLib') {
			downloadFileLib(node).then(resolve);
			return;
		}
		processChildren(node.children, coeId, dirPath).then(function (children) {
			let nodeInfo = Object.assign({}, getNodeInfo(node), {
				children: children,
				file: parseFile(node, coeId, dirPath)
			});

			if (nodeInfo.type === 'Table') {
				nodeInfo.value = node.value;
			}

			resolve(nodeInfo);
		});
	});
}

function parseFile(node, coeId, dirPath) {
	if (!node.file) {
		return;
	}
	addFile(coeId, node.id, `${dirPath}/${sanitize(node.file.name)}`);
	let file = node.file;
	return {
		name: sanitize(file.name),
		dashifiedName: node.dashifiedName,
		properties: file.properties
	};
}

var files = [];

function addFile(coeId, id, outFilePath) {
	files.push({
		url: `${cfg.sio.baseUrl}/${coeId}/file/${id}`,
		path: outFilePath
	});
}


function downloadAllFiles(resolve) {
	if (false === cfg.sio.downloadAttachments) { // download disabled
		Logger.log('Disabled files download, skipping...');
		resolve({ rootDir });
		return;
	} else if (files.length === 0) {  // no files
		Logger.log('No files found, skipping');
		resolve({ rootDir });
		return;
	}
	downloadCallback(0, resolve);
}

function downloadCallback(index, resolve) {
	console.assert(resolve);
	downloadFile(files[index]).then(function () {
		Logger.log(`Downloading file ${index + 1} of ${files.length}`);
		if (index + 1 === files.length) {
			Logger.log('files download done');
			resolve({ rootDir });
			return;
		}
		downloadCallback(index + 1, resolve);
	});
}

function downloadFile(file, callback) {
	let { url, path } = file;
	return new Promise(function (resolve, reject) {
		if (jetpack.exists(path)) {
			resolve();
			return;
		}

		let option = {
			uri: url,
			method: 'GET',
			timeout: 10000,
			followRedirect: true,
			followAllRedirects: true,
			maxRedirects: 10,
			jar: true,
			gzip: true,
		};
		request.head(option, function (err, res, body) {
			Logger.log('content-type:', res.headers['content-type']);
			Logger.log('content-length:', res.headers['content-length']);
			Logger.log('write to ' + path);

			request(option).pipe(fs.createWriteStream(path)).on('close', resolve);
		});
	});
}

//471637758398743956
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/imagepreview/471637758398743956?width=681&height=639&version=1
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/471637758398743956

//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/471637891542730187/High-level-architecture.xml
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/471637891542730187


module.exports = {
	download,
	getContent
};
