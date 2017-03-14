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

	this.space = cfg.space;
}

Confluence.prototype.createOrUpdatePage = function (pageTitle, template) {
    console.log('Posting to Confluence...');

    this.confluence.getContentByPageTitle(this.space, pageTitle, (err, data) => {
        if (err !== null) console.log(err);

        if (data.results.length === 0) {
            this.confluence.postContent(this.space, pageTitle, template, null, function (err) {
                if (err) {
                    console.log(err.res.body.message);
                }
                console.log('Page created successfully.');
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