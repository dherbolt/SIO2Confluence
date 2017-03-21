var ConfluenceAPI = require('confluence-api');

function Confluence(cfg) {
	this.confluence = new ConfluenceAPI({
		username: cfg.user,
		password: cfg.password,
		baseUrl: cfg.baseUrl,
		notify: false
	});

	if (!cfg.space) {
		throw 'Space must be defined!';
	}

	if (!cfg.rootPage) {
		throw 'Root page must be defined!';
	}

	this.space = cfg.space;
	this.rootPage = cfg.rootPage;
	this.uploadMissingFilesOnly = cfg.uploadMissingFilesOnly || false;
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
			// Logger.log(JSON.stringify(data.results));
			if (data && data.results && 1 === data.results.length) {
				callback && callback.call(this, data.results[0].id);
				resolve(data.results[0].id);
			}
			else {
				Logger.log('Can\'t obtatin Id for page ' + pageTitle);
				reject();
			}
		});
	});
};

/**
 * Create new or update existing page.
 *
 * @param {String} pageTitle Title of page to create or update
 * @param {String} template Data to set to new page
 * @param {String} parentPageTitleOrId Title of page to create or update
 * @param {String} (optional, default: undefined) parentPageTitleOrId Title or Id of parent page where new page will be created.
 * @param {Function} (optional, default: undefined) Callback when page is created or updated
 *
 * @returns {undefined}
 */
Confluence.prototype.createOrUpdatePage = function (pageTitle, template, parentPageTitleOrId, callback) {
	Logger.log('Creating or update page "' + pageTitle + '"...');

	this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
		if (err !== null) {
			Logger.log(err);
			throw err;
		}

		if (data.results.length === 0) {
			const createNewPage = (id) => {
				this.createPage(pageTitle, template, id, callback);
			};

			parentPageTitleOrId = parentPageTitleOrId || this.rootPage;
			if (!isNaN(Number(parentPageTitleOrId))) {
				createNewPage(parentPageTitleOrId);
			} else {
				this.getPageIdByTitle(parentPageTitleOrId, createNewPage);
			}
		}
		else {
			let pageId = data.results[0].id;
			let version = parseInt(data.results[0].version.number, 10) + 1;

			this.updatePage(pageId, version, pageTitle, template, callback);
		}
	});
};

Confluence.prototype.uploadOrUpdateFile = function (pageTitleOrId, fileName, filePath, callback) {
	var me = this;
	const uploadFile = function(pageId, callback) {
		me.confluence.createAttachment(me.space, pageId, filePath, function(err, result) {
			if (err) {
				Logger.log(err);
			}
			else {
				callback.call(me, result.results[0]);
			}
		});
	};

	const updateFile = function(pageId, attachmentId, callback) {
		me.confluence.updateAttachmentData(me.space, pageId, attachmentId, filePath, function(err, result) {
			if (err) {
				Logger.log(err);
			}
			else {
				callback.call(me, result);
			}
		});
	};

	me.getPageIdByTitle(pageTitleOrId, function(pageId) {
		me.getAttachments(pageId, function(result) {
			let existing = result.results.findByValueOfObject('title', fileName);

			// Logger.log(`pageId:${pageId}, pageTitleOrId:${pageTitleOrId}, fileName:${fileName}, attachmentId:${existing[0].id}`);
			if (existing && existing.length) {
				if (me.uploadMissingFilesOnly) {
					Logger.log(`Skipping file '${fileName}', file already exists.`);
					callback.call(me, {
						title: fileName
					});
				}
				else {
					updateFile(pageId, existing[0].id, callback);
				}				
			}
			else {
				uploadFile(pageId, callback);
			}
		});
	});
};

Confluence.prototype.createPage = function (pageTitle, body, id, callback) {
	return new Promise((resolve, rejcet) => {
		Logger.log('Creating new page "' + pageTitle + '"...');
		this.confluence.postContent(this.space, pageTitle, body, id, (err, result) => {
			if (err) {
				Logger.log(err.message);
				rejcet();
			}
			else {
				Logger.log('Page created successfully.');
				callback && callback.call(this, result);
				resolve(result.id);
			}
		});
	});
};

Confluence.prototype.getPageById = function(pageId, callback) {
	this.confluence.getContentById(pageId, function(err, data) {
		if (err !== null) {
			Logger.log(err);
			throw err;
		}

		// let pageId = data.results[0].id;
		callback(data);
	});
};

Confluence.prototype.updatePage = function (pageId, version, pageTitle, body, callback) {
	Logger.log('Updating page "' + pageTitle + '"...');
	this.confluence.putContent(this.space, pageId, version, pageTitle, body, (err, result) => {
		if (err) {
			Logger.log(err);
			throw err;
		}
		Logger.log('Page updated successfully.');
		callback.call(this, result);
	});
};

Confluence.prototype.getAttachments = function (pageTitleOrId, callback) {
	const attachmentsResult = (pageId) => {
		this.confluence.getAttachments(this.space, pageId, (err, result) => {
			if (err) {
				Logger.log(err);
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
};

Array.prototype.findByValueOfObject = function (key, value) {
	return this.filter(function (item) {
		return (item[key] === value);
	});
};

module.exports = Confluence;