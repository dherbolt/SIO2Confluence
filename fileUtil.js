module.exports = {
	sanitize(str) {
		if (str) {
			return str.replace(/[\?\|&;:\$%@"'<>\(\)\+#,]/g, "").replace(/[–\/]/gi, '-');
		}
		
		return '';
	}
};