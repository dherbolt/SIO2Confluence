const sanitize = require(APP_ROOT + '/fileUtil').sanitize;

module.exports = function downloadFileLib(node) {
	return new Promise(function(resolve, reject) {
		let nodeInfo = {
			type: node.type,
			name: sanitize(node.name),
			id: node.id,
			dashifiedName: node.dashifiedName,
			layout: node.layout,
			children: undefined,
			todo: 'TODO',
			value: node.value && (node.value.text || node.value.url || node.value.html),
			//file: parseFile(node, coeId, dirPath)
		};

		resolve(nodeInfo);
	});
};