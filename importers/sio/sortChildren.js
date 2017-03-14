function sortChildren(page) {
	page.children = sortChildrenInternal(page);
	return page;
}

function sortChildrenInternal(node) {
	return node.children;
}

module.exports = sortChildren;