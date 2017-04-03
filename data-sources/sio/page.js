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
const { getNodeInfo } = require(__dirname + '/node');
const json = require(APP_ROOT + '/json');
var pages = {};

let rootDir;

let files = [];
global.files = files;


const incrementalCacheRoot = 'data/incremental';
global.dbPagesDone = incrementalCacheRoot + '/pages-done.json';
// global.dbFilesDone = incrementalCacheRoot + '/files-done.json';
// global.dbFilesToDownload = incrementalCacheRoot + '/files-to-download.json';
global.dbFileLibsDiscovered = incrementalCacheRoot + '/filelibs-discovered.json';


function download(pageId, parentDir) {
	let _pageId = pageId;
	let _parentDir = parentDir;

	if (global.isIncrementalSioExport) {
		let dirPath = json.read(global.dbPagesDone)[pageId];
		if (dirPath && jetpack.exists(dirPath)) {
			// Logger.log(`Using cache for page ${pageId} in ${dirPath}/sio-page.json`);
			let sioPage = json.read(`${dirPath}/sio-page.json`);
			return downloadAfterGetContentCallback(_pageId, _parentDir, sioPage, true);
		}
	}

	return getContent(pageId).then((args) => {
		let { error, response, body } = args;

		if (body.error) {
			Logger.error(`ERROR: ID: ${_pageId} -- ${JSON.stringify(body.error)}`);
			Logger.error('Page cannot be downloaded!');
			return;
		}

		let sioPage = body.result.page;

		return downloadAfterGetContentCallback(_pageId, _parentDir, sioPage);
	});
}

function downloadAfterGetContentCallback(pageId, parentDir, sioPage, isCache) {
	return new Promise(function (resolve, reject) {
		let dirName = `${sioPage.dashifiedName}--${pageId}`;
		let coeId;
		try {
			coeId = sioPage.coeRoomId.split('/')[0];
		}
		catch (e) {
			Logger.error(`Error parsion coeRoomId for page ${pageId}`);
			downloadAfterGetContentCallback(pageId, parentDir, sioPage, isCache).then(() => {
				resolve();
			});
			return;
		}

		if (!parentDir) {
			//Logger.log(`Cleaning ${dirName}`);
			//jetpack.remove(dirName);
			dirName = `download/${dirName}`;
			rootDir = dirName;
		}
		pages[sioPage.dashifiedName] = parentDir;

		Logger.log(`Downloaded ${sioPage.dashifiedName} --> ${pageId}` + (isCache ? ' [cache]' : ''));

		if (parentDir) {
			dirName = `${parentDir}/${dirName}`;
		}

		json.write(`${dirName}/sio-page.json`, sioPage);

		promisefy(sioPage.children, processChild, { coeId, dirPath: dirName, sioPage }).then(function (children) {
			let taskComponents = sioPage.components && sioPage.components.taskComponents;

			for (let task of (taskComponents || [])) {
				children.push(getNodeInfo(task, coeId, dirName));
			}

			let page = Object.assign({}, getNodeInfo(sioPage, coeId, dirName), {
				children: children,
				isNewSio: !!sioPage.teamContainer
			});

			page = sortChildren(page);

			json.write(`${dirName}/page.json`, page);
			json.update(global.dbPagesDone, { [pageId]: dirName });

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
}

function getContent(pageId, callback) {
	return new Promise(function (resolve, reject) {
		sendXhr('Pages.getWithContent', {
			id: pageId,
			tenantId: auth.info.tenant.publicId
		}, { callback: resolve });
	});
}

function processChildren(children, args) {
	return new Promise(function (resolve, reject) {
		// let children = [];
		let { coeId, dirPath, sioPage } = args;

		if (!children) {
			resolve();
			return undefined;
		}

		let processedChildren = [];
		for (let child of children) {
			processedChildren.push(processChild(child, { coeId, dirPath, files, sioPage }));
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
		let { coeId, dirPath, sioPage } = customParams || {};
		if (node.type === 'FileLib') {
			downloadFileLib(node, customParams).then(function (nodeInfo) {
				resolve(nodeInfo);
			});
			return;
		}

		processChildren(node.children, customParams).then(function (children) {
			let nodeInfo = Object.assign({}, getNodeInfo(node, coeId, dirPath), {
				children: children,
			});

			if (nodeInfo.type === 'Table') {
				nodeInfo.value = node.value;
			}

			resolve(nodeInfo);
		});
	});
}


function downloadAllFiles(resolve) {
	if (false === cfg.sio.downloadAttachments) { // download disabled
		Logger.log('Disabled files download, skipping...');
		resolve({ rootDir });
		return;
	}
	else if (files.length === 0) {  // no files
		Logger.log('No files found, skipping');
		resolve({ rootDir });
		return;
	}
	Logger.log(`Downloading ${files.length} files ...`);
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
	return new Promise(function (resolve, reject) {
		let { url, path, id } = file;
		if (jetpack.exists(path)) {
			resolve();
			return;
		}

		let option = {
			uri: url,
			method: 'GET',
			timeout: 30000,
			followRedirect: true,
			followAllRedirects: true,
			maxRedirects: 10,
			jar: true,
			gzip: true,
		};
		request.head(option, function (err, res, body) {
			// Logger.log('content-type:', res.headers['content-type']);
			if (err) {
				Logger.error(`Error downloading file: ${url}\n\n${JSON.stringify(file)}\n\n`
				+ `Maybe the file is too big. You can try to download it manually and copy to the target folder `
				+ `(or just create empty file with the same name).\n\n -- \n\n${JSON.stringify(err)}`);
				throw err;
			}
			Logger.log('content-length:', res.headers['content-length']);
			Logger.log('write to ' + path);

			request(option).pipe(fs.createWriteStream(path)).on('close', function () {
				// json.update(global.dbFilesDone, { [id]: file });
				// json.update(global.dbFilesToDownload, { [id]: undefined });
				resolve.apply(this, arguments);
			});
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
