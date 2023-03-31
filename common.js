// Global functions file

// Initialize personalities function
function initPersonalities(personalities, env) {
	personalities.length = 0;
	let envKeys = Object.keys(env);
	// For each variable in .env check if starts with personality. and add to personalities array if true
	envKeys.forEach(element => {
		if (element.startsWith('personality.')) {
			let name = element.slice(12);
			personalities.push({ "name": name, "request" : [{"role": "system", "content": `${env[element]}`}]})
		}
	});
}

// Export the function(s)
module.exports = {
    initPersonalities: initPersonalities
};
