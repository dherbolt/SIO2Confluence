module.exports = {
	sanitize(str) {
		if (str) {
			return str.replace(/[\?\|&;:\$%@"'<>\(\)\+#,ФЭ]…/g, "").replace(/[–\/]/gi, '-');
		}

		return '';
	}
};