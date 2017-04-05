var ConfluenceAPI = require('confluence-api');
let jetpack = require('fs-jetpack');
const APP_ROOT = __dirname + '/..';
let title2idFileName;
let filesInPageFileName;

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

	let fileNamePrefix = APP_ROOT + `/data/${this.space.toLowerCase()}_`;
	title2idFileName = `${fileNamePrefix}title2id.json`;
	filesInPageFileName = `${fileNamePrefix}filesInPage.json`;

	Logger.log(`Reading files in page from '${filesInPageFileName}'`);
	this.filesInPage = jetpack.read(filesInPageFileName, 'json') || {};
	Logger.log(`${Object.getOwnPropertyNames(this.filesInPage).length} items read.`);

	Logger.log(`Reading title to page id map from '${title2idFileName}'`);
	this.pageTitle2Id = jetpack.read(title2idFileName, 'json') || {};
	Logger.log(`${Object.getOwnPropertyNames(this.pageTitle2Id).length} items read.`);
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

		if (this.pageTitle2Id[pageTitle]) {
			setTimeout(() => {
				let id = this.pageTitle2Id[pageTitle];

				Logger.log(`Using id '${id}' for '${pageTitle}' from cache.`);
				callback && callback.call(this, id);
				resolve(id);
			}, 1);
			return;
		}

		this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
			// Logger.log(JSON.stringify(data.results));
			if (data && data.results && 1 === data.results.length) {
				let pageId = data.results[0].id;

				this.pageTitle2Id[pageTitle] = pageId;
				jetpack.write(title2idFileName, JSON.stringify(this.pageTitle2Id, null, '\t'));
				callback && callback.call(this, pageId);
				resolve(pageId);
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
			Logger.log(err.response.text);
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
				let res = JSON.parse(err.response.text);

				if (res.statusCode === 400 && res.message &&
					0 === res.message.indexOf(`Cannot add a new attachment with same file name as an existing attachment: ${fileName}`)) {

					Logger.error(`File '${fileName}'was not uploaded because it already exists!`);
					callback.call(me, {title: fileName});
				}
				else {
					Logger.log(err.response.text);
					throw err;
				}
			}
			else {
				let attachment = result.results[0];
				me.filesInPage[pageId] = me.filesInPage[pageId] || [];
				me.filesInPage[pageId].push(attachment);
				jetpack.write(filesInPageFileName, JSON.stringify(me.filesInPage, null, '\t'));

				Logger.log(`File '${attachment.title}' uploaded successfully.`);
				callback.call(me, attachment);
			}
		});
	};

	const updateFile = function(pageId, attachmentId, callback) {
		me.confluence.updateAttachmentData(me.space, pageId, attachmentId, filePath, function(err, result) {
			if (err) {
				Logger.log(err.response.text);
			}
			else {
				Logger.log(`File '${result.title}' uploaded successfully.`);
				callback.call(me, result);
			}
		});
	};

	Logger.log(`Preparing for file '${fileName}' upload...`);
	me.getPageIdByTitle(pageTitleOrId, function(pageId) {
		me.getAttachments(pageId, function(attachments) {
			let existing = attachments.findByValueOfObject('title', fileName);

			if (existing && existing.length) {
				if (me.uploadMissingFilesOnly) {
					Logger.log(`Skipping file '${fileName}', file already exists.`);
					callback.call(me, {
						title: fileName
					});
				}
				else {
					Logger.log(`Updating file '${fileName}'...`);
					updateFile(pageId, existing[0].id, callback);
				}
			}
			else {
				Logger.log(`Uploading file '${fileName}'...`);
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
				Logger.log(err.response.text);
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
			Logger.log(err.response.text);
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
			if (err.response.text) {
				Logger.log(err.response.text);
			}
			else {
				console.error(err);
			}
			throw err;
		}
		Logger.log('Page updated successfully.');
		callback.call(this, result);
	});
};

Confluence.prototype.getAttachments = function (pageTitleOrId, callback) {
	const attachmentsResult = (pageId) => {

		if (undefined !== this.filesInPage[pageId]) {
			setTimeout(() => {
				Logger.log(`Using attachments list for '${pageTitleOrId}' from cache.`);
				callback && callback.call(this, this.filesInPage[pageId]);
			}, 1);
			return;
		}

		this.confluence.getAttachments(this.space, pageId, (err, result) => {
			if (err) {
				Logger.log(err.response.text);
				throw err;
			}
			else {
				this.filesInPage[pageId] = result.results;
				callback && callback.call(this, result.results);
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