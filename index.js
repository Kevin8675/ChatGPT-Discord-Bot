// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
// Require openai
const { Configuration, OpenAIApi } = require("openai");
// Use Azure TTS
const sdk = require("microsoft-cognitiveservices-speech-sdk");
// Use Azure Text Analytics for Sentiment Analysis
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");

const textAnalyticsKey = process.env.LANGUAGE_KEY;
const textAnalyticsEndpoint = process.env.LANGUAGE_ENDPOINT;
const modelName = process.env.GPT_MODEL;

const textAnalyticsClient = new TextAnalyticsClient(textAnalyticsEndpoint, new AzureKeyCredential(textAnalyticsKey));

// Analyze message for sentiment
async function getMessageSentiment(message) {
	const sentimentAnalysis = await textAnalyticsClient.analyzeSentiment([message]);
	return sentimentAnalysis[0].sentiment;
  }
  
// Map sentiements to voice styles
function mapSentimentToStyle(sentiment) {
	// Customize this mapping according to your preferences
	const sentimentStyleMapping = {
		"positive": "excited",
		"negative": "angry",
		"neutral": "unfriendly",
	};

	return sentimentStyleMapping[sentiment] || "friendly";
}

async function textToSpeech(text, voice, style) {
	const subscriptionKey = process.env.AZURE_TTS_KEY;
	const serviceRegion = process.env.AZURE_SERVICE_REGION;
  
	const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
	speechConfig.speechSynthesisVoiceName = voice;
  
	const audioConfig = sdk.AudioConfig.fromAudioFileOutput(`${voice}-${style}.mp3`);
	const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
  
	const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
	  <voice name="${voice}" style="${style}">${text}</voice>
	</speak>`;
  
	return new Promise((resolve, reject) => {
	  synthesizer.speakSsmlAsync(
		ssml,
		result => {
		  if (result) {
			synthesizer.close();
			resolve(`${voice}-${style}.mp3`);
		  } else {
			synthesizer.close();
			reject(new Error("Text to speech synthesis failed."));
		  }
		},
		error => {
		  synthesizer.close();
		  reject(error);
		}
	  );
	});
}

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
	// For each variable in .env check if starts with personality. and add to personalities array if true
	envKeys.forEach(element => {
		if (element.startsWith('personality.')) {
			name = element.slice(12);
			//personalities.push({ "name": name, "request" : [{"role": "system", "content": `${process.env[element]}`}]})
            personalities.push({ 
                "name": name, 
                "prompt": process.env[element],
                "request": [{
                    "role": "system",
                    "content": `${process.env[element]}`
                }]
            });
		}
	});
}
// Run function
initPersonalities();

function getPersonality(message) {
    let personality = null;
    let earliestIndex = Infinity;

    // For each personality, check if the message includes the exact name of the personality
    for (let i = 0; i < personalities.length; i++) {
        let thisPersonality = personalities[i];
        const regex = new RegExp('\\b' + thisPersonality.name.toUpperCase() + '\\b');
        const match = regex.exec(message);

        if (match && match.index < earliestIndex) {
            personality = thisPersonality;
            earliestIndex = match.index;
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

// Create Pause var
client.isPaused = false;

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
function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function callOpenAIWithRetry(apiCall, retries, delay) {
	let attempts = 0;
  
	while (attempts < retries) {
	  try {
		const response = await apiCall();
		return response;
	  } catch (error) {
		if (error.statusCode === 502 && attempts < retries - 1) {
		  console.log('Encountered a 502 error. Retrying...');
		  attempts++;
		  await new Promise((resolve) => setTimeout(resolve, delay));
		} else {
		  throw error;
		}
	  }
	}
}

client.on('messageCreate', async msg => {
	// Don't do anything when message is from the bot itself or from other bots, based on the BOT_REPLIES environment variable
	if (msg.author.id === client.user.id || (msg.author.bot && process.env.BOT_REPLIES !== "true")) return;

	// Enable/Disable bot commands
	if (msg.content === '!disable') {
		if (isAdmin(msg)) {
			client.isPaused = true;
			sendCmdResp(msg, process.env.DISABLE_MSG);
		} else {
			sendCmdResp(msg, process.env.COMMAND_PERM_MSG);
			return;
		}
	}
	if (msg.content === '!enable') {
		if (isAdmin(msg)) {
			client.isPaused = false;
			sendCmdResp(msg, process.env.ENABLE_MSG);
		} else {
			sendCmdResp(msg, process.env.COMMAND_PERM_MSG);
			return;
		}
	}

    // Reset bot command
	if (msg.content.startsWith('!reset')) {
        // Check disabled status
		if (client.isPaused === true && !isAdmin(msg)) {
			sendCmdResp(msg, process.env.DISABLED_MSG);
			return;
		}
		let cutMsg = msg.content.slice(7);
		// Delete all memories if message is "!reset all"
		if (cutMsg === 'all') {
			initPersonalities();
			sendCmdResp(msg, process.env.RESET_MSG);
			return;
		} else {
			// Check what personality's memory to delete
			for (let i = 0; i < personalities.length; i++) {
				let thisPersonality = personalities[i];
				if (cutMsg.toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
					personalities[i] = { "name": thisPersonality.name, "request" : [{"role": "system", "content": `${process.env["personality." + thisPersonality.name]}`}]};
					sendCmdResp(msg, process.env.DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
					return;
				}
			}
			// Return error if reset message does not match anything
			sendCmdResp(msg, process.env.RESET_ERROR_MSG);
			return;
		}
	}

    // List personalities bot command
	if (msg.content === '!personalities') {
		// Check disabled status
		if (client.isPaused === true && !isAdmin(msg)) {
			sendCmdResp(msg, process.env.DISABLED_MSG);
			return;
		}
		// Create message variable
        // Output the personalities in a code block, and include their prompts.
		persMsg = process.env.PERSONALITY_MSG + "\n" + "```";
		// Add personality names to variable
		for (let i = 0; i < personalities.length; i++) {
			let thisPersonality = personalities[i];
			//persMsg += "- " + thisPersonality.name + "\n"
            persMsg += `- ${thisPersonality.name}: ${thisPersonality.prompt}\n`;
		}
        persMsg += "```";
		// Send variable
		sendCmdResp(msg, persMsg);
	}

	if (msg.content.startsWith('!tts')) {
		const input = msg.content.split(' ');
		const numMessagesBack = input.length > 1 && !isNaN(input[1]) ? parseInt(input[1]) : 1;
		const botMessages = Array.from(msg.channel.messages.cache.filter(m => m.author.bot).values());
	  
		if (botMessages.length >= numMessagesBack) {
			const lastBotMessage = botMessages[botMessages.length - numMessagesBack];
			const colonIndex = lastBotMessage.content.indexOf(':');
			const messageContent = colonIndex !== -1 ? lastBotMessage.content.split(':')[1].trim() : lastBotMessage.content.trim();
			//const messageContent = lastBotMessage.content.split(':')[1].trim(); // Get the message content after the colon

			const voiceMap = new Map([
				["jeff", "en-US-JasonNeural"],
				["tony", "en-US-TonyNeural"],
				["bobby", "en-US-GuyNeural"],
				["hank", "en-US-DavisNeural"],
				["frank", "en-US-TonyNeural"]
			  ]);
			if (p == null || p.name == null) return;
			const voice = voiceMap.get(p.name.toLowerCase()) || "en-US-GuyNeural";
			getMessageSentiment(lastBotMessage.content).then(sentiment => {
			  console.log("Sentiment:", sentiment);
			  const style = mapSentimentToStyle(sentiment); // Get the style based on the sentiment
			  textToSpeech(messageContent, voice, style)
				.then(async outputFilePath => {
			  		await msg.channel.send({
				//content: "Here's the TTS audio:",
						files: [outputFilePath]
			  	});
			})
			.catch(error => {
			  console.error("Text to speech synthesis failed:", error);
			  msg.channel.send("Failed to generate TTS audio.");
			});
		});
	  } else {
		msg.channel.send("There are not enough previous bot messages.");
	  }
	}

	// Run get personality from message function
	p = getPersonality(msg.content.toUpperCase());
	if (p == null) return;

	// Check if bot disabled/enabled
	if (client.isPaused === true && !isAdmin(msg)) {
		sendCmdResp(msg, process.env.DISABLED_MSG);
		return;
	}

	// Add user message to request
	p.request.push({"role": "user", "content": `${msg.content}`});
	try {
		// Start typing indicator
		msg.channel.sendTyping();
		console.log(`[${formatDate(new Date())}] Making API request...`);

		// Run API request function
		//const response = await chat(p.request);
		// Call the chat function with retry handling
		const response = await callOpenAIWithRetry(() => chat(p.request), 3, 5000);

		console.log(`[${formatDate(new Date())}] Received API response.`);
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
	} catch (error) {
		//console.error('Message processing failed:', error);
		console.error(`[${formatDate(new Date())}] Message processing failed:`, error);
		msg.channel.send('An error occurred while processing the message.');
	  }
});

// API request function
async function chat(requestX){
	try {
		// Make API request
		const completion = await openai.createChatCompletion({
			model: modelName,
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
	} catch (error) {
		//console.error('API request failed:', error);
		console.error(`[${formatDate(new Date())}] API request failed:`, error);
		throw error;
	}
}

// Log in to Discord with your client's token
client.login(process.env.CLIENT_TOKEN);
