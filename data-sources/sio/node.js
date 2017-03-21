const sanitize = require(APP_ROOT + '/fileUtil').sanitize;

module.exports = {
	getNodeInfo(node) {
		let nodeInfo = {
			type: node.type,
			name: sanitize(node.name),
			id: node.id,
			dashifiedName: node.dashifiedName,
			layout: node.layout,
			value: node.value && (node.value.text || node.value.url)
		};

		switch (node.type) {
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
}