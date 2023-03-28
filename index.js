// Require the necessary node classes
const fs = require('node:fs');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
// Require openai
const { Configuration, OpenAIApi } = require("openai");
// Require global functions
const { initPersonalities } = require(path.join(__dirname, "common.js"));

// Set OpenAI API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup OpenAI
const openai = new OpenAIApi(configuration);

// Create a new client instance
const client = new Client({intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,] });

// Initialize Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// Initialize command files
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Console log when logged in
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

// Create state array
let state = {
	isPaused: false,
	personalities: [],

};

// Run function
initPersonalities(state.personalities, process.env);

// Get called personality from message
function getPersonality(message) {
	let personality = null;
	// For each personality, check if the message includes the the name of the personality
	for (let i = 0; i < state.personalities.length; i++) {
		let thisPersonality = state.personalities[i];
		if (message.includes(thisPersonality.name.toUpperCase())) {
			personality = thisPersonality;
		}
	}
	// Return the personality of the message
	return personality;
}

// Split message function
function splitMessage(resp, charLim) {
	const responseNum = Math.ceil(resp.length / charLim);
	const responses = new Array(responseNum);
	// For the number of split responses, if its the last response, make the size the character limit, else make the size the last index of a space that is under 2000 characters
	for (let i = 0, c = 0, chunkSize = null; i < responseNum; i++, c+=chunkSize) {
		if (i + 1 >= responseNum) {
			chunkSize = charLim;
		} else {
					chunkSize = resp.substr(c, charLim).lastIndexOf(" ");
		}
		responses[i] = resp.substr(c, chunkSize);
	}
	return responses;
}

// Send command responses function
function sendCmdResp(msg, cmdResp) {
	if (process.env.REPLY_MODE === 'true') {
		msg.reply(cmdResp);
	} else {
		msg.channel.send(cmdResp);
	}
}

// Set admin user IDs
adminId = process.env.ADMIN_ID.split(',');

// Check message author id function
function isAdmin(msg) {
	if (msg.member.permissions.has(PermissionFlagsBits.Administrator) || msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
		return true;
	} else {
		return adminId.includes(msg.author.id);
	}
}

// Listen for interactions/Commands
client.on(Events.InteractionCreate, async interaction => {
	// Don't do anything if the interaction is not a slash command
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	// Execute the command and log errors if they appear
	try {
		await command.execute(interaction, state);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}

})

client.on('messageCreate', async msg => {
	// Don't do anything when message is from self or bot depending on config
	if (process.env.BOT_REPLIES === 'true') {
		if (msg.author.id === client.user.id) return;
	} else {
		if (msg.author.bot) return;
	}

	// Run get personality from message function
	p = getPersonality(msg.content.toUpperCase());
	// Check if message is a reply if no personality name
	if (p == null && msg.reference?.messageId) {
		let refMsg = await msg.fetchReference();
		// Check if the reply is to the bot
		if (refMsg.author.id === client.user.id) {
			// Check the personality that the message being replied to is from
			p = state.personalities.find(pers => pers.request.some(element => (element.content === refMsg.content)));
		}
	}
	if (p == null) return;

	// Check if bot disabled/enabled
	if (state.isPaused === true && !isAdmin(msg)) {
		sendCmdResp(msg, process.env.DISABLED_MSG);
		return;
	}

	// Add user message to request
	p.request.push({"role": "user", "content": `${msg.content}`});
	// Start typing indicator
	msg.channel.sendTyping();
	// Run API request function
	const response = await chat(p.request);
	// Split response if it exceeds the Discord 2000 character limit
	const responseChunks = splitMessage(response, 2000)
	// Send the split API response
	for (let i = 0; i < responseChunks.length; i++) {
		if (process.env.REPLY_MODE === 'true' && i === 0) {
			msg.reply(responseChunks[i]);
		} else {
			msg.channel.send(responseChunks[i]);
		}
	}
})

// API request function
async function chat(requestX){
	try {
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
			console.log('[WARNING] Invalid CASE_MODE value. Please change and restart bot.');
		}
		// Return response
		return responseContent;
	} catch (error) {
		// Return error message if API error occurs
		console.error(`[ERROR] OpenAI API request failed: ${error}`);
		return process.env.API_ERROR_MSG;
	}
}

// Log in to Discord with your client's token
client.login(process.env.CLIENT_TOKEN);
