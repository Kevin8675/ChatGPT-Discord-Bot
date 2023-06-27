// Global functions file

// Initialize personalities function
function initPersonalities(personalities, env) {
	personalities.length = 0;
	let envKeys = Object.keys(env);
	// For each variable in .env check if starts with personality. and add to personalities array if true
	envKeys.forEach(element => {
		if (element.startsWith('personality.')) {
			let name = element.slice(12);
			// Use description if provided
			let truncatedPrompt;
			if (typeof process.env["description." + name] !== 'undefined') {
                // Truncate the description to 1024 characters if it's longer than that
                truncatedPrompt = process.env["description." + name].substring(0, 1024);
            } else {
                // Truncate the prompt to 1024 characters if it's longer than that
                truncatedPrompt = env[element].substring(0, 1024);
			}
			// Determine capitalization mode
			let caseMode = process.env["caps." + name];
			if (caseMode == null) {
				caseMode = "";
			}
			personalities.push({ "name": name, "request" : [{"role": "system", "content": `${env[element]}`}], "description": truncatedPrompt, "caseMode": caseMode});
		}
	});
}

// Export the function(s)
module.exports = {
    initPersonalities: initPersonalities
};
