const sanitize = require(APP_ROOT + '/fileUtil').sanitize;
const { getNodeInfo } = require(__dirname + '/node');
const promisefy = require(APP_ROOT + '/promisefy');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));
const sendXhr = require(APP_ROOT + '/sendXhr');

module.exports = function downloadFileLib(node, customParams) {
	return new Promise(function (resolve, reject) {
		let { dirPath, coeId, sioPage } = customParams;

		console.assert(node.type === 'FileLib');

		let nodeInfo = Object.assign({}, getNodeInfo(node, coeId, dirPath));

		// empty file lib
		if (!node.children || node.children.length === 0) {
			resolve(nodeInfo);
		}

		promisefy(node.children, processFile, { dirPath, coeId, sioPage }).then(function (packedChildren) {
			// unpack array of children
			let children = [];
			for (let child of packedChildren) {
				if (Array.isArray(child)) {
					// unpack
					child.length && Array.prototype.push.apply(children, child);  // concat & add items to 'children'
				}
				else {
					children.push(child);
				}
			}

			nodeInfo.children = children;
			resolve(nodeInfo);
		});
	});
};


function processFile(fileNode, args) {
	let { dirPath, coeId } = args;
	return new Promise(function (resolve, reject) {
		let nodeInfo = getNodeInfo(fileNode, coeId, dirPath); //parseFile(fileNode, args);
		if (fileNode.type === 'FileFolder') {
			processFolder(fileNode, args).then(function(packedChildren) {
				let children = [];
				for (let child of packedChildren) {
					if (Array.isArray(child)) {
						// unpack
						child.length && Array.prototype.push.apply(children, child);  // concat & add items to 'children'
					}
					else {
						children.push(child);
					}
				}
				resolve(children);
			});
			return;
		}

		resolve(nodeInfo);
	});
}

function processFolder(folderNode, args) {
	let { dirPath, coeId } = args;
	// xhr:Items.getList
	// pid:"476424095723236572"
	// sort:"[{"property":"type","direction":"ASC"},{"property":"shortName","direction":"ASC"},{"property":"extension","direction":"ASC"},{"property":"id","direction":"ASC"}]"
	//
	// {"result":{"items":[{"layout":{"position":0},"updatedTime":"2017-03-20T11:14:15+0100","dashifiedName":"gitignore","updatedBy":{"emailAddress":"vpurchart@kerio.com","invited":false,"guid":"6f168fe5c4e56c57d7b13a96030d140def3cafbe","fullName":"Vaclav Purchart","id":"146","type":"user"},"role":"Admin","file":{"size":30,"createdBy":{"emailAddress":"vpurchart@kerio.com","invited":false,"guid":"6f168fe5c4e56c57d7b13a96030d140def3cafbe","fullName":"Vaclav Purchart","id":"146","type":"user"},"name":".gitignore","createdTime":"2017-03-20T11:14:15+0100","version":1,"hash":"6dcd5d83a076885fa575f0c35e6f015f82a3da7a","properties":{}},"createdBy":{"emailAddress":"vpurchart@kerio.com","invited":false,"guid":"6f168fe5c4e56c57d7b13a96030d140def3cafbe","fullName":"Vaclav Purchart","id":"146","type":"user"},"name":".gitignore","createdTime":"2017-03-20T11:14:15+0100","id":"476424173032647918","roleSource":"Member","type":"File"}]},"id":0,"jsonrpc":"2.0"}
	console.assert(folderNode.type === 'FileFolder');
	Logger.log(`Found folder '${folderNode.name}' expanding files...`);

	return new Promise(function (resolve, reject) {
		sendXhr('Items.getList', {
			pid: folderNode.id,
			sort: [{ "property": "type", "direction": "ASC" }, { "property": "shortName", "direction": "ASC" }, { "property": "extension", "direction": "ASC" }, { "property": "id", "direction": "ASC" }]
		}, {
			uri: `${cfg.sio.baseUrl}/${coeId}/server/data?method=Items.getList`
		}).then(function (result) {
			let { error, response, body } = result;

			if (body.error) {
				Logger.error(`ERROR: ID: ${folderNode.id} -- ${JSON.stringify(body.error)}`);
				Logger.error('Page cannot be downloaded!');
				throw new Error(JSON.stringify(body.error));
			}

			let dirFiles = body.result.items;
			Logger.log(`Found ${dirFiles.length} inner files.`);
			promisefy(dirFiles, processFile, args).then(function (result) {
				// result = result.map((item) => {
				// 	return `${sanitize(folderNode.name)}--${item}`;
				// });
				resolve(result);
			});

		});
	});
}
