const Confluence = require('./lib/Confluence');
const jetpack = require('fs-jetpack');
const tidy = require('htmltidy').tidy;
const cfg = JSON.parse(jetpack.read('config.json'));
const processPage = require('./exporters/html/PageToHtml');
const path = require('path');
let argv = process.argv.slice(2);

let client = new Confluence({
	user: cfg.confluence.userName,
	password: cfg.confluence.password,
	baseUrl: cfg.confluence.baseUrl,
	space: cfg.confluence.targetSpace,
	rootPage: cfg.confluence.targetPage
});

function run(sourceDir, parentPage, resolvePageUploaded) {
	if (!cfg.confluence.targetSpace || !cfg.confluence.targetPage) {
		throw 'Confluence space and/or page URL is not defined in config.json or it is in invalid format.';
	}
	parentPage = parentPage || null;

	//let sourceDir = __dirname + '/download/10k-users-in-kerio-connect--58309038387064065';
	//sourceDir = sourceDir || (__dirname + '/download/daniel-herbolt--4507');

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

			for (let fileName of page.attachments) {
				page.html = page.html.replace(fileName, getFileLink(result.id, fileName));
				console.log(`Uploading file '${fileName}'...`);
				fileUploads.push(new Promise(function (resolve, reject) {
					client.uploadOrUpdateFile(page.name, fileName, `${sourceDir}/${fileName}`, function (attachment) {
						resolve(attachment);
						console.log(`File '${attachment.title}' uploaded successfully.`);
					});
				}));
			}

			let doneCallback;
			let done = new Promise(function (resolve, reject) {
				doneCallback = resolve;
			});

			const precessNexPage = function (index) {
				let subPage = page.subPages[index];

				if (!subPage) {
					doneCallback();
					return;
				}

				console.log(subPage.name + '/' + index);

				client.getPageIdByTitle(subPage.name)
					.then((id) => {
						// ok - get id
						pageMap[subPage.id] = id;
						// pages.push(Promise.resolve(id));
						precessNexPage(index + 1);
					})
					.catch(() => {
						// create
						client.createPage(subPage.name, '', result.id, function (result) {
							pageMap[subPage.id] = result.id;
							precessNexPage(index + 1);
						});
					});
			};

			precessNexPage(0);

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
								console.log(`Page ${result.title} uploaded`);
								const uploadSubPage = function (index) {
									const pageInfo = page.subPages[index];

									if (!pageInfo) {
										resolve()
										return;
									}
									console.log(`Uploading subpage: ${pageInfo.dashifiedName}  ${index}/${page.subPages.length}`);

									const dir = `${sourceDir}/${pageInfo.dashifiedName}--${pageInfo.id}`;
									run(dir, parentPageId, function () {
										console.log(`Subpage uploaded: ${pageInfo.dashifiedName}`);
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
					resolvePageUploaded && resolvePageUploaded();
				});
			});
		}
	);
}

module.exports.importToConfluence = run;

if (argv.length && path.normalize(process.argv[1]) === __filename) {
	run(argv[0]);
}