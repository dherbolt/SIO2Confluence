const sanitize = require(APP_ROOT + '/fileUtil').sanitize;
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));

module.exports = {
	getNodeInfo(node, coeId, dirPath) {
		let nodeInfo = {
			type: node.type,
			name: sanitize(node.name),
			id: node.id,
			dashifiedName: node.dashifiedName,
			layout: node.layout,
			value: node.value && (node.value.text || node.value.url),
			file: parseFile(node, coeId, dirPath)
		};

		switch (node.type) {
			case 'File':
				nodeInfo.value = node.file;
				break;
			case 'Map':
				nodeInfo.value = node.value.markerPosition;
				break;
			case 'Mashup':
				nodeInfo.value = node.value.html;
				break;
			case 'Event':
				nodeInfo.value = {
					endDate: node.value.endDate,
					startDate: node.value.startDate,
					description: node.value.description,
					location: node.value.location
				}
				break;
			default:
		}

		return nodeInfo;
	}
};


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

function addFile(coeId, id, outFilePath) {
	global.files.push({
		url: `${cfg.sio.baseUrl}/${coeId}/file/${id}`,
		path: outFilePath
	});
}
