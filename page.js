const request = require('request');
const fs = require('fs');
const sortChildren = require(__dirname + '/importers/sio/sortChildren');


const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read('config.json'));
var pages = {};





function download(pageId, parentDir) {
	return new Promise(function (resolve, reject) {
		// downloadFile({
		// 	url: 'https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/401469089400651104',
		// 	path: 'download/__test---about-diaolog-final-spec-png'
		// }).then(function () {
		// 	console.log('----------------------');
		// });
		// return;


		getContent(pageId).then((args) => {
			let { error, response, body } = args;
			let sioPage = body.result.page;
			let dirName = `${sioPage.dashifiedName}--${pageId}`;
			let coeId = sioPage.coeRoomId.split('/')[0];

			if (!parentDir) {
				console.log(`Cleaning ${dirName}`);
				jetpack.remove(dirName);
				dirName = `download/${dirName}`;
			}
			pages[sioPage.dashifiedName] = parentDir;

			console.log(`Downloaded ${sioPage.dashifiedName} --> ${pageId}`);
			if (parentDir) {
				dirName = `${parentDir}/${dirName}`;
			}

			let page = {
				name: sioPage.name,
				layout: sioPage.layout,
				children: processChildren(sioPage, coeId, dirName)
			};

			page = sortChildren(page);

			jetpack.write(`${dirName}/sio-page.json`, JSON.stringify(sioPage, null, '\t'));
			jetpack.write(`${dirName}/page.json`, JSON.stringify(page, null, '\t'));

			let subPages = [];
			for (let page of sioPage.components.subpages) {
				subPages.push(download(page.id, dirName));
			}
			Promise.all(subPages).then((function (parentDir) {

				return function () {
					if (parentDir) {  // subpage
						resolve();
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
		}, resolve);
	});
}

function processChildren(node, coeId, dirPath) {
	let children = [];

	if (!node.children) {
		return undefined;
	}
	for (let child of node.children) {
		children.push(processChild(child, coeId, dirPath));
	}
	children = children.length ? children : undefined;
	return children;
}

function processChild(node, coeId, dirPath) {
	return {
		type: node.type,
		name: node.name,
		id: node.id,
		layout: node.layout,
		children: processChildren(node, coeId, dirPath),
		value: node.value && (node.value.text || node.value.url || undefined),
		file: parseFile(node, coeId, dirPath)
	};
}

function parseFile(node, coeId, dirPath) {
	if (!node.file) {
		return;
	}
	addFile(coeId, node.id, `${dirPath}/${node.name}`);
	let file = node.file;
	return {
		name: file.name,
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
	downloadCallback(0, resolve);
}

function downloadCallback(index, resolve) {
	console.assert(resolve);
	downloadFile(files[index]).then(function() {
		console.log(`Downloading file ${index} of ${files.length}`);
		if (index + 1 === files.length) {
			console.log('files download done');
			resolve();
			return;
		}
		downloadCallback(index + 1, resolve);
	});
}

function downloadFile(file, callback) {
	let { url, path } = file;
	return new Promise(function (resolve, reject) {
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
			console.log('content-type:', res.headers['content-type']);
			console.log('content-length:', res.headers['content-length']);
			console.log('write to ' + path);

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
