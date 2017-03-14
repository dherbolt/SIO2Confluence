function sortChildren(page) {
	page.children = sortChildrenInternal(page);
	return page;
}

function sortChildrenInternal(node) {
	let columns = {};
	for (let child of node.children) {
		let layout = child.layout;
		columns[layout.column] = columns[layout.column] || [];
		columns[layout.column][layout.position] = child;
	}

	let children = [];
	let knownColumns = ['left', 'center', 'right'];

	for (let columnName in columns) {
		//console.log('layout column: ' + columnName);
		console.assert(knownColumns.indexOf(columnName) >= 0);
		//let items = columns[columnName];
	}

	for (let columnName of knownColumns) {
		children = children.concat(columns[columnName]);
	}

	return children;
}

module.exports = sortChildren;