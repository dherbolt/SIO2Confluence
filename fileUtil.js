module.exports = {
	sanitize(str) {
		return str ? str.replace(/[\?\|&;:\$%@"'<>\(\)\+#,ФЭ…]/g, "").replace(/[–\/]/gi, '-') : '';
	},

	sanitizeName(str) {
		return str ? str.replace(/[…]/g, "...")
			.replace(/[–\/]/gi, '-')
			.replace(/[\&/]/gi, ' and ')
			.replace(/[\+/]/gi, ' and ')
			.replace(/[\@/]/gi, ' at ')
			.replace(/[\%/]/gi, ' percent ')
			.replace(/[\$/]/gi, ' dollar ')
			.replace(/\?\|&;:\$%@"'<>\(\)\+#,ФЭ…]/gi, '')
			: '';
	}
};