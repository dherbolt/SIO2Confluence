const sanitize = require(APP_ROOT + '/fileUtil').sanitize;

module.exports = {
	getNodeInfo(node) {
		return {
			type: node.type,
			name: sanitize(node.name),
			id: node.id,
			dashifiedName: node.dashifiedName,
			layout: node.layout,
			value: node.value && (node.value.text || node.value.url || node.value.html || node.value.markerPosition)
		};
	}
}