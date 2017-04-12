module.exports = {
	sanitize(str) {
		return str ? str.replace(/[\?\|&;:\$%@"'<>\(\)\+#,ФЭ…]/g, "").replace(/[–\/]/gi, '-') : '';
	},

	sanitizeName(str) {
		return str ? str.replace(/[…]/g, "...").replace(/[–\/]/gi, '-') : '';
	}
};