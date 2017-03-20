module.exports = {
	sanitize(str) {
		return str.replace(/[\?\|&;\$%@"'<>\(\)\+,]/g, "");
	}
};