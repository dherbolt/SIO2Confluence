var ConfluenceAPI = require('confluence-api');

function Confluence(cfg) {
    this.confluence = new ConfluenceAPI({
        username: cfg.user,
        password: cfg.password,
        baseUrl: cfg.baseUrl
    });
}

Confluence.prototype.createOrUpdatePage = function (space, pageTitle, template) {
    if (typeof (space) === 'undefined') {
        console.log('No Confluence space provided. Please check your config file.')
        process.exit();
    }

    console.log('Posting to Confluence...');

    this.confluence.getContentByPageTitle(space, pageTitle, (err, data) => {
        if (err !== null) console.log(err);

        if (data.results.length === 0) {
            this.confluence.postContent(space, pageTitle, template, null, function (err) {
                if (err) {
                    console.log(err.res.body.message);
                }
                console.log('Page created successfully.');
            });
        } else {
            var pageId = data.results[0].id;
            var version = parseInt(data.results[0].version.number) + 1;

            this.confluence.putContent(space, pageId, version, pageTitle, template, function (err) {
                if (err) {
                    console.log(err.res.body.message);
                }
                console.log('Page updated successfully.');
            });
        }
    });
}

module.exports = Confluence;