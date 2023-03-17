// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
// Require openai
const { Configuration, OpenAIApi } = require("openai");

// Set OpenAI API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup OpenAI
const openai = new OpenAIApi(configuration);

// Create a new client instance
const client = new Client({intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,] });

// Console log when logged in
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Create personalities array
let personalities;

// Initialize personalities function
function initPersonalities() {
	personalities = [];
	let envKeys = Object.keys(process.env);
	envKeys.forEach(element => {
		if (element.startsWith('personality.')) {
			name = element.slice(12);
			personalities.push( { "name": name, "request" : [{"role": "system", "content": `${process.env[element]}`}]})
		}
	});
}
// Run function
initPersonalities();

// Get called personality from message
function getPersonality(message) {
	let personality = null;
	for (let i=0; i<personalities.length; i++) {
		let thisPersonality = personalities[i];
		if (message.includes(thisPersonality.name.toUpperCase())) {
			personality = thisPersonality;
		}
	}
	return personality;
}

// Create Pause var
client.isPaused = false;

// Set admin user IDs
adminId = process.env.ADMIN_ID.split(',');

// Check message author id function
function isAdmin(authorId) {
	return adminId.includes(authorId);
}

client.on('messageCreate', async msg => {
	// Don't do anything when message is from bot
	if (msg.author.bot) return;

	// Bot commands
	if (msg.content === '!disable') {
		if (isAdmin(msg.author.id)) {
			client.isPaused = true;
			msg.channel.send(process.env.DISABLE_MSG);
		} else {
			msg.channel.send(process.env.COMMAND_PERM_MSG);
		}
	}
	if (msg.content === '!enable') {
		if (isAdmin(msg.author.id)) {
			client.isPaused = false;
			msg.channel.send(process.env.ENABLE_MSG);
		} else {
			msg.channel.send(process.env.COMMAND_PERM_MSG);
		}
	}
	if (msg.content === '!reset') {
		if (isAdmin(msg.author.id)) {
			initPersonalities();
			msg.channel.send(process.env.RESET_MSG);
			return;
		} else {
			msg.channel.send(process.env.COMMAND_PERM_MSG);
		}
	}

	// Run get personality from message function
	p = getPersonality(msg.content.toUpperCase());
	if (p == null) return;

		// Check if bot disabled/enabled
	if (client.isPaused === true) {
		if (!isAdmin(msg.author.id)) {
			msg.channel.send(process.env.DISABLED_MSG);
			return;
		}
	}

	// Add user message to request
	p.request.push({"role": "user", "content": `${msg.content}`});
	// Run API request function
	const response = await chat(p.request);
	// Send API response
	msg.channel.send(response);
})

// API request function
async function chat(requestX){
	// Make API request
	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: requestX
	});

	// Add assistant message to next request
	requestX.push({"role": "assistant", "content": `${completion.data.choices[0].message.content}`});
	let responseContent;

	// Check capitlization mode
	switch (process.env.CASE_MODE) {
		case "":
			responseContent = completion.data.choices[0].message.content;
			break;
		case "upper":
			responseContent = completion.data.choices[0].message.content.toUpperCase();
			break;
		case "lower":
			responseContent = completion.data.choices[0].message.content.toLowerCase();
			break;
		default:
			console.log('Invalid CASE_MODE value. Please change and restart bot.');
	}
	// Return response
	return responseContent;
}

// Log in to Discord with your client's token
client.login(process.env.CLIENT_TOKEN);
