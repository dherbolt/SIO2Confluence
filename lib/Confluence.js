var ConfluenceAPI = require('confluence-api');

function Confluence(cfg) {
	this.confluence = new ConfluenceAPI({
		username: cfg.user,
		password: cfg.password,
		baseUrl: cfg.baseUrl
	});

	if (!cfg.space) {
		throw 'Space must be defined!';
	}

	if (!cfg.rootPage) {
		throw 'Root page must be defined!';
	}

	this.space = cfg.space;
	this.rootPage = cfg.rootPage;
}

/**
 * Gets id of page according to its title.
 *
 * @param {String} pageTitle Title of page to obtain id
 * @param {Function} callback Callback function, param: id
 * @returns {undefined}
 */
Confluence.prototype.getPageIdByTitle = function (pageTitle, callback) {
	return new Promise((resolve, reject) => {
		this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
			// console.log(JSON.stringify(data.results));
			if (data && data.results && 1 === data.results.length) {
				callback && callback.call(this, data.results[0].id);
				resolve(data.results[0].id);
			}
			else {
				console.log('Can\'t obtatin Id for page ' + pageTitle);
				reject();
			}
		});
	});
};

/**
 * Create new or update existing page.
 *
 * @param {String} parentPageTitleOrId Title of page to create or update
 * @param {String} template Data to set to new page
 * @param {String} (optional, default: undefined) parentPageTitleOrId Title or Id of parent page where new page will be created.
 * @param {Function} (optional, default: undefined) Callback when page is created or updated
 *
 * @returns {undefined}
 */
Confluence.prototype.createOrUpdatePage = function (pageTitle, template, parentPageTitleOrId, callback) {
	console.log('Posting to Confluence...');

	this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
		if (err !== null) {
			throw err;
		}

		if (data.results.length === 0) {
			console.log('Creating new page "' + pageTitle + '"...');
			const createNewPage = (id) => {
				this.confluence.postContent(this.space, pageTitle, template, id, (err, result) => {
					if (err) {
						throw err.message;
					}

					console.log('Page created successfully.');
					callback.call(this, result);
				});
			};

			parentPageTitleOrId = parentPageTitleOrId || this.rootPage;
			if (!isNaN(Number(parentPageTitleOrId))) {
				createNewPage(parentPageTitleOrId);
			} else {
				this.getPageIdByTitle(parentPageTitleOrId, createNewPage);
			}
		} else {
			var pageId = data.results[0].id;
			var version = parseInt(data.results[0].version.number, 10) + 1;

			console.log('Updating page "' + pageTitle + '"...');
			this.confluence.putContent(this.space, pageId, version, pageTitle, template, (err, result) => {
				if (err) {
					throw err;
				}
				console.log('Page updated successfully.');
				callback.call(this, result);
			});
		}
	});
};

//Confluence.prototype.createSubPage = function (space, )

Confluence.prototype.uploadOrUpdateFile = function (pageTitleOrId, fileName, filePath, callback) {
	const uploadFile = (pageId, callback) => {
		this.confluence.createAttachment(this.space, pageId, filePath, (err, result) => {
			if (err) {
				console.log(err);
			} else {
				console.log('File uploaded successfully.');
				callback.call(this, result);
			}
		});
	};

	const updateFile = (pageId, attachmentId, callback) => {
		this.confluence.updateAttachmentData(this.space, pageId, attachmentId, filePath, (err, result) => {
			if (err) {
				console.log(err);
			} else {
				console.log('File updated successfully.');
				callback.call(this, result);
			}
		});
	};

	this.getPageIdByTitle(pageTitleOrId, (pageId) => {
		this.getAttachments(pageId, (result) => {
			let existing = result.results.findByValueOfObject('title', fileName);

			// console.log(`pageId:${pageId}, pageTitleOrId:${pageTitleOrId}, fileName:${fileName}, attachmentId:${existing[0].id}`);
			if (existing) {
				updateFile(pageId, existing[0].id);
			} else {
				uploadFile(pageId);
			}
		});
	});
};

Confluence.prototype.createPage = function (pageTitle, body, id, callback) {
	return new Promise((resolve, rejcet) => {
		console.log('Creating new page "' + pageTitle + '"...');
		this.confluence.postContent(this.space, pageTitle, body, id, (err, result) => {
			if (err) {
				console.log(err.message);
				rejcet();
			}
			else {
				console.log('Page created successfully.');
				callback && callback.call(this, result);
				resolve(result.id);
			}
		});
	});
};

Confluence.prototype.updatePage = function (pageId, version, pageTitle, body, callback) {
	console.log('Updating page "' + pageTitle + '"...');
	console.log(arguments);
	this.confluence.putContent(this.space, pageId, version, pageTitle, body, (err, result) => {
		if (err) {
			throw err;
		}
		console.log('Page updated successfully.');
		callback.call(this, result);
	});
};

Confluence.prototype.getAttachments = function (pageTitleOrId, callback) {
	const attachmentsResult = (pageId) => {
		this.confluence.getAttachments(this.space, pageId, (err, result) => {
			if (err) {
				throw err;
			} else {
				callback.call(this, result);
			}
		});
	};

	if (!isNaN(Number(pageTitleOrId))) {
		attachmentsResult(pageTitleOrId);
	} else {
		this.getPageIdByTitle(pageTitleOrId, attachmentsResult);
	}
}

Array.prototype.findByValueOfObject = function (key, value) {
	return this.filter(function (item) {
		return (item[key] === value);
	});
}

module.exports = Confluence;