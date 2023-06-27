// Require the necessary node classes
const fs = require('node:fs');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
// Initialize dotenv
const dotenv = require('dotenv');
// Require openai
const { Configuration, OpenAIApi } = require("openai");
// Require global functions
const { initPersonalities } = require(path.join(__dirname, "common.js"));

// Initialize dotenv config file
const args = process.argv.slice(2);
let envFile = '.env';
if (args.length === 1) {
	envFile = `${args[0]}`;
}
dotenv.config({ path: envFile });

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
	tokenTimer: null,
	tokenCount: null,
	startTime: new Date(),
	totalTokenCount: 0,
	slowModeTimer: {},
	channelIds: process.env?.CHANNELS?.split(','),
	envFile: envFile
};

// Run function
initPersonalities(state.personalities, process.env);

// Get called personality from message
function getPersonality(message) {
	// Function to check for the personality name
	const checkPers = (msg, word) => new RegExp('\\b' + word + '\\b', 'i').test(msg);
	let personality = null;
	// For each personality, check if the message includes the the name of the personality
	for (let i = 0; i < state.personalities.length; i++) {
		let thisPersonality = state.personalities[i];
		if (checkPers(message, thisPersonality.name)) {
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

// Set unrestricted role(s)
unrestrictedRoles = process.env?.UNRESTRICTED_ROLE_IDS?.split(',');
let isUnrestricted = null;

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
	// Don't do anything when not in bot channel
	const channelCond = [msg.channelId, msg.channel.name, msg.channel?.parentId, msg.channel?.parent?.name];
	if (state.channelIds != "" && typeof state.channelIds !== 'undefined' && !channelCond.some(cond => state.channelIds.includes(cond))) {
		return;
	}

	// Don't do anything when message is from self or bot depending on config
	if ((process.env.BOT_REPLIES === 'true' && msg.author.id === client.user.id) || (process.env.BOT_REPLIES !== 'true' && msg.author.bot)) return;

	// Don't reply to system messages
	if (msg.system) return;

	p = null;

	// Check if message is a reply
	if (msg.reference?.messageId) {
		let refMsg = await msg.fetchReference();
		// Check if the reply is to the bot
		if (refMsg.author.id === client.user.id) {
			// Check the personality that the message being replied to is from
			p = state.personalities.find(pers => pers.request.some(element => (element.content === refMsg.content)));
		}
	}

	// Check if message is from joined thread if no personality name
	if (p == null && msg.channel.isThread() && msg.channel.joined) {
		// Fetch last message from bot
		let messages = await msg.channel.messages.fetch();
		let lastMsg = messages.find(msg => msg.author.id === client.user.id);
		// If no message found, fetch starter message
		if (lastMsg == null) {
			lastMsg = await msg.channel.fetchStarterMessage();
		}
		// Set personality to last message from bot personality
		p = state.personalities.find(pers => pers.request.some(element => (element.content === lastMsg?.content)));
	}

	// Run get personality from message function if not reply to bot
	if (p == null) {
		p = getPersonality(msg.content.toUpperCase());
	}
	
	// Don't reply if no personality found
	if (p == null) return;

	// Check if not admin
	if (!isAdmin(msg)) {
		// Check if bot disabled/enabled
		if (state.isPaused === true) {
			sendCmdResp(msg, process.env.DISABLED_MSG);
			return;
		}

		// Check is user has an unrestricted rols
		for (let i = 0; i < unrestrictedRoles?.length; i++) {
			isUnrestricted = msg.member.roles.cache.has(unrestrictedRoles[i]);
			if (isUnrestricted === true) break;
		}

		if (!isUnrestricted) {
			const tokenResetTime = parseInt(process.env?.TOKEN_RESET_TIME, 10);
			timePassed = Math.abs(new Date() - state.tokenTimer);
			// Set variables on first start or when time exceeds token timer
			if ((tokenResetTime != "" || tokenResetTime != undefined) && (timePassed >= tokenResetTime || state.tokenTimer === null)) {
				state.tokenTimer = new Date();
				state.tokenCount = 0;
			}
			// Send message when token limit reached
			if ((tokenResetTime != "" || tokenResetTime != undefined) && timePassed < tokenResetTime && state.tokenCount >= parseInt(process.env?.TOKEN_NUM, 10)) {
				sendCmdResp(msg, process.env.TOKEN_LIMIT_MSG.replace("<m>", Math.round((tokenResetTime - timePassed) / 6000) / 10));
				return;
			}

			const slowModeTime = parseInt(process.env?.SLOW_MODE_TIME, 10);
			smTimePassed = Math.abs(new Date() - state.slowModeTimer?.[msg.author.id]);
			// Set variables on first start or when time exceeds slow mode timer
			if ((slowModeTime != "" || slowModeTime != undefined) && (smTimePassed >= slowModeTime || state.slowModeTimer?.[msg.author.id] == undefined)) {
				state.slowModeTimer[msg.author.id] = new Date();
			}
			// Send message when slow mode reached
			if ((slowModeTime != "" || slowModeTime != undefined) && smTimePassed < slowModeTime) {
				smMsg = process.env.SLOW_MODE_MSG.replace("<m>", Math.round((slowModeTime - smTimePassed) / 6000) / 10);
				smMsg = smMsg.replace("<s>", Math.round((slowModeTime - smTimePassed) / 1000));
				sendCmdResp(msg, smMsg);
				return;
			}
		}
	}

	// Check if it is a new month
	let today = new Date();
	if (state.startTime.getUTCMonth() !== today.getUTCMonth()) {
		state.startTime = new Date();
		state.totalTokenCount = 0;
	}

	// Add user message to request
	p.request.push({"role": "user", "content": `${msg.content}`});

	// Truncate conversation if # of messages in conversation exceed MSG_LIMIT
	if (process.env.MSG_LIMIT !== "" && p.request.length - 1 > parseInt(process.env.MSG_LIMIT, 10)) {
		let delMsg = (p.request.length - 1) - parseInt(process.env.MSG_LIMIT, 10);
		p.request.splice(1, delMsg);
	}
	
	// Start typing indicator
	msg.channel.sendTyping();
	// Run API request function
	const response = await chat(p, msg);
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
async function chat(p, msg){
	try {
		// Make API request
		const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: p.request
		});

		// Increase token counter if not admin
		if (!isAdmin(msg) && !isUnrestricted) {
			state.tokenCount += completion.data.usage.completion_tokens;
		}

		// Increase total token count
		state.totalTokenCount += completion.data.usage.total_tokens;

		let responseContent;

		// Check capitlization mode
		switch (p.caseMode) {
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

		// Add assistant message to next request
		p.request.push({"role": "assistant", "content": `${responseContent}`});
		
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
