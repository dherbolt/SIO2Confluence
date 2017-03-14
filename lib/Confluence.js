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

Confluence.prototype.getPageIdByTitle = function (pageTitle, callback) {
    this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
		if (data && data.results && 1 === data.results.length) {
			callback.call(this, data.results[0].id);
		}
		else {
			throw 'Can\'t obtatin Id for page ' + pageTitle;
		}
	});
};

Confluence.prototype.createOrUpdatePage = function (pageTitle, template, parentPageTitle) {
    console.log('Posting to Confluence...');

    this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
        if (err !== null) {
			throw err;
		}

        if (data.results.length === 0) {
			this.getPageIdByTitle(parentPageTitle || this.rootPage, (id) => {
				this.confluence.postContent(this.space, pageTitle, template, id, function (err) {
					if (err) {
						throw err.message;
					}
					console.log('Page created successfully.');
				});
			});
        } else {
            var pageId = data.results[0].id;
            var version = parseInt(data.results[0].version.number, 10) + 1;

            this.confluence.putContent(this.space, pageId, version, pageTitle, template, function (err) {
                if (err) {
                    console.log(err.res.body.message);
                }
                console.log('Page updated successfully.');
            });
        }
    });
};

//Confluence.prototype.createSubPage = function (space, )

module.exports = Confluence;