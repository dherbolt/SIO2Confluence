require('./common.js');

const Confluence = require('./lib/Confluence');
const jetpack = require('fs-jetpack');
const tidy = require('htmltidy').tidy;
const cfg = JSON.parse(jetpack.read('config.json'));
const processPage = require('./exporters/html/PageToHtml');
const path = require('path');
let argv = process.argv.slice(2);
let sio2confMap;
let logFileName = './logs/sio2conf.json';
let confIdToNameMap = {};

let client = new Confluence({
	user: cfg.confluence.userName,
	password: cfg.confluence.password,
	baseUrl: cfg.confluence.baseUrl,
	space: cfg.confluence.targetSpace,
	rootPage: cfg.confluence.targetPage
});

sio2confMap = jetpack.read(logFileName, 'json') || {};

function run(sourceDir, parentPage, resolvePageUploaded) {
	if (!cfg.confluence.targetSpace || !cfg.confluence.targetPage) {
		throw 'Confluence space and/or page URL is not defined in config.json or it is in invalid format.';
	}
	parentPage = parentPage || null;

	let page = processPage(sourceDir);

	const getFileLink = function (pageId, fileName) {
		return '/download/attachments/' + pageId + '/' + encodeURI(fileName);
	};

	const getConfluenceSubPageUrl = function (confluenceId) {
		return '/pages/viewpage.action?pageId=' + confluenceId;
	};

	// sio-id => confuluence-id
	let pageMap = {};

	client.createOrUpdatePage(
		page.name,
		'',
		parentPage, // start in root page defined in cfg
		function (result) {
			const parentPageId = result.id;
			let fileUploads = [];

			sio2confMap[page.id] = parentPageId;
			confIdToNameMap[parentPageId] = page.name;

			for (let fileName of page.attachments) {
				page.html = page.html.replace(fileName, getFileLink(result.id, fileName));
				Logger.log(`Uploading file '${fileName}'...`);
				fileUploads.push(new Promise(function (resolve, reject) {
					client.uploadOrUpdateFile(page.name, fileName, `${sourceDir}/${fileName}`, function (attachment) {
						resolve(attachment);
						Logger.log(`File '${attachment.title}' uploaded successfully.`);
					});
				}));
			}

			let doneCallback;
			let done = new Promise(function (resolve, reject) {
				doneCallback = resolve;
			});

			const processNextPage = function (index) {
				let subPage = page.subPages[index];

				if (!subPage) {
					doneCallback();
					return;
				}

				Logger.log(subPage.name + '/' + index);

				client.getPageIdByTitle(subPage.name)
					.then((id) => {
						// ok - get id
						sio2confMap[subPage.id] = id;
						pageMap[subPage.id] = id;
						confIdToNameMap[id] = page.name;
						processNextPage(index + 1);
					})
					.catch(() => {
						// create
						client.createPage(subPage.name, '', result.id, function (result) {
							sio2confMap[subPage.id] = result.id;
							pageMap[subPage.id] = result.id;
							processNextPage(index + 1);
						});
					});
			};

			processNextPage(0);

			done.then(() => {

				for (let sioId in pageMap) {
					let confluenceId = pageMap[sioId];

					page.html = page.html.replace(sioId, getConfluenceSubPageUrl(confluenceId));
				}

				let options = {
					bare: true,
					breakBeforeBr: true,
					fixUri: true,
					hideComments: true,
					indent: true,
					'output-xhtml': true,
					'show-body-only': true
				};

				// Parse and fix HTML
				let parsePromise = new Promise(function (resolve, reject) {
					tidy(page.html, options, function (err, parsedHtml) {
						client.updatePage(
							result.id,
							parseInt(result.version.number, 10) + 1,
							result.title,
							parsedHtml,
							function (result) {
								Logger.log(`Page ${result.title} uploaded`);
								const uploadSubPage = function (index) {
									const pageInfo = page.subPages[index];

									if (!pageInfo) {
										resolve();
										return;
									}
									Logger.log(`Uploading subpage: ${pageInfo.dashifiedName}  ${index}/${page.subPages.length}`);

									const dir = `${sourceDir}/${pageInfo.dashifiedName}--${pageInfo.id}`;
									run(dir, parentPageId, function () {
										Logger.log(`Subpage uploaded: ${pageInfo.dashifiedName}`);
										uploadSubPage(index + 1);
									});
									jetpack.write(__dirname + '/download/subpage.txt', JSON.stringify(pageInfo, null, '\t'));
								};

								uploadSubPage(0);
							}
						);
					});
				});

				Promise.all(fileUploads.concat(parsePromise)).then(() => {
					jetpack.write(logFileName, JSON.stringify(sio2confMap, null, '\t'), {atomic: true});

					renamePages(confIdToNameMap).then(() => {
						resolvePageUploaded && resolvePageUploaded();
					});
				});
			});
		}
	);
}

/**
 * Fails on "bad request"
 * @param {} confIdToNameMap
 */
function renamePages(confIdToNameMap) {
	return new Promise(function(resolve, reject) {
		let counter = 0;
		let done = 0;
		for (let confId in confIdToNameMap) {
			console.log(confIdToNameMap);
			let confName = confIdToNameMap[confId];
			let pageName = confName.replace(/sid\:.*\:sid/, '').trim();
			counter++;
			client.getPageById(confId, function(data) {
				let version = +data.version.number + 1;
				// pageId, version, pageTitle, body, callback
				console.log(`Renaming page: ${pageName}  #${confId}  ${version}   bad reuest ==> page already exists`);
				let html = data.body.storage.value;

				client.updatePage(confId, version, pageName, html, function() {
					done++;
					console.log(`Renaming done ${done}/${counter}`);

					if (done === counter) {
						resolve();
					}
				});

			});
		}
	});
}

module.exports.importToConfluence = run;

if (argv.length && path.normalize(process.argv[1]) === __filename) {
	run(argv[0]);
}