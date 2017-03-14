const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read('config.json'));

function download(pageId, parentDir) {
	return new Promise(function (resolve, reject) {
		module.exports.getContent(pageId).then((args) => {
			let { error, response, body } = args;
			let sioPage = body.result.page;
			let dirName = `${sioPage.dashifiedName}--${pageId}`;
			let coeId = sioPage.coeRoomId.split('/')[0];

			if (!parentDir) {
				console.log(`Cleaning ${dirName}`);
				jetpack.remove(dirName);
				dirName = `download/${dirName}`;
			}

			console.log(`Downloaded ${sioPage.dashifiedName} --> ${pageId}`);
			if (parentDir) {
				dirName = `${parentDir}/${dirName}`;
			}

			let page = {
				name: sioPage.name,
				children: processChildren(sioPage, coeId, dirName)
			};

			jetpack.write(`${dirName}/sio-page.json`, JSON.stringify(sioPage, null, '\t'));
			jetpack.write(`${dirName}/page.json`, JSON.stringify(page, null, '\t'));

			let subPages = [];
			for (let page of sioPage.components.subpages) {
				subPages.push(download(page.id, dirName));
			}
			Promise.all(subPages).then((function(parentDir) {

				return function() {
					if (!parentDir) {
						resolve();
						return;
					}

					// root page

					console.log('Page data downloaded. Downloading files...');
					// let allFiles = [];
					let i = 0;

					console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${dirName}`);
					console.log(`>> ${parentDir}`);

					resolve();

					// function downloadCb() {
					// 	console.log(`Downloading ${i} of ${files.length}: ${files[i].path}`);
					// 	i++;
					// 	if (i === files.length) {
					// 		resolve();
					// 	}
					// 	else {
					// 		downloadFile(files[i]).then(downloadCb);
					// 	}
					// }

					// downloadFile(files[0]).then(downloadCb);


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
		children: processChildren(node, coeId, dirPath),
		value: node.value && (node.value.text || node.value.url || undefined),
		file: parseFile(node, coeId, dirPath)
	};
}

function parseFile(node, coeId, dirPath) {
	if (!node.file) {
		return;
	}
	addFile(coeId, node.id, `${dirPath}/${node.dashifiedName}`);
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

function downloadFile(file) {
	let { url, path } = file;

	return getFile(url, path);
}
//471637758398743956
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/imagepreview/471637758398743956?width=681&height=639&version=1
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/471637758398743956

//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/471637891542730187/High-level-architecture.xml
//https://samepage.io/72f3728084841d1a9db65c44335a41d27bfa96c2/file/471637891542730187

const request = require('request');
const fs = require('fs');

function getFile(uri, path) {
	// console.log('Downloading file ' + path);
	jetpack.write(path, '');

	return new Promise(function (resolve, reject) {
		request({
			uri: uri,
			method: 'GET',
			timeout: 10000,
			followRedirect: true,
			followAllRedirects: true,
			maxRedirects: 10,
			jar: true,
			gzip: true,
		}, function (error, response, data) {
			console.log(uri, path);
			if (response.statusCode !== 200) {
				console.log("oops, got a " + response.statusCode);
				return;
			}
			var file = fs.createWriteStream(path);
			file.on('finish', function () {
				// console.log('Completed: ' + path);
				file.close(resolve);
			});
			response.pipe(file).on('error', handleFailure);
			file.on('error', handleFailure);
			//jetpack.write(path, data);

			// resolve();
		});
	});
}

function handleFailure() { }



module.exports = {
	download,
	getContent
};
