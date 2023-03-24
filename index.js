// Require the necessary discord.js classes
const { Client, Discord, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
const botCommand = process.env.BOT_COMMAND;
// Require openai and set API key and setup
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const modelName = process.env.GPT_MODEL;
const openai = new OpenAIApi(configuration);

// TTS Related settings and functions
// Require ffmpeg, fs, path, child_process for working with audio files
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');
// Require TikTok TTS package and store sessionID and URL
const { config, createAudioFromText } = require('tiktok-tts');
const sessionID = process.env.SESSION_ID;
const BASE_URL = process.env.BASE_URL;
config(sessionID, BASE_URL);
// Voice mappings
const voiceMapping = {
	default: 'en_us_rocket',
    au_female: 'en_au_001',
    au_male: 'en_au_002',
    uk_male1: 'en_uk_001',
    uk_male2: 'en_uk_003',
    us_female1: 'en_us_001',
    us_female2: 'en_us_002',
    us_male1: 'en_us_006',
    us_male2: 'en_us_007',
    us_male3: 'en_us_009',
    us_male4: 'en_us_010',
	alto: 'en_female_f08_salut_damour',
    tenor: 'en_male_m03_lobby',
    warmy_breeze: 'en_female_f08_warmy_breeze',
    sunshine_soon: 'en_male_m03_sunshine_soon',
    narrator: 'en_male_narration',
    wacky: 'en_male_funny',
    peaceful: 'en_female_emotional',
    serious: 'en_male_cody',
    pirate: 'en_male_pirate',
    glorious: 'en_female_ht_f08_glorious',
    funny_sing: 'en_male_sing_funny_it_goes_up',
    chipmunk: 'en_male_m2_xhxs_m03_silly',
    dramatic: 'en_female_ht_f08_wonderful_world',
	ghostface: 'en_us_ghostface',
    chewbacca: 'en_us_chewbacca',
    c3po: 'en_us_c3po',
    stitch: 'en_us_stitch',
    stormtrooper: 'en_us_stormtrooper',
    rocket: 'en_us_rocket',
    fr_male1: 'fr_001',
    fr_male2: 'fr_002',
    de_female: 'de_001',
    de_male: 'de_002',
    es_male: 'es_002',
    mx_male: 'es_mx_002',
    br_female1: 'br_001',
    br_female2: 'br_003',
    br_female3: 'br_004',
    br_male: 'br_005',
    id_female: 'id_001',
    jp_female1: 'jp_001',
    jp_female2: 'jp_003',
    jp_female3: 'jp_005',
    jp_male: 'jp_006',
    kr_male1: 'kr_002',
    kr_female: 'kr_003',
    kr_male2: 'kr_004'
};

// Voice descriptions
const voiceDescriptions = {
    au_female: 'English AU - Female',
    au_male: 'English AU - Male',
    uk_male1: 'English UK - Male 1',
    uk_male2: 'English UK - Male 2',
    us_female1: 'English US - Female 1',
    us_female2: 'English US - Female 2',
    us_male1: 'English US - Male 1',
    us_male2: 'English US - Male 2',
    us_male3: 'English US - Male 3',
    us_male4: 'English US - Male 4',
	alto: 'Alto',
    tenor: 'Tenor',
    warmy_breeze: 'Female',
    sunshine_soon: 'Male',
    narrator: 'Narrator',
    wacky: 'Wacky',
    peaceful: 'Female (UK)',
    serious: 'Male',
    pirate: 'Male',
    glorious: 'Female Singing',
    funny_sing: 'Rising Male Singing',
    chipmunk: 'High Pitched Singing',
    dramatic: 'Female Singing',
	ghostface: 'Ghost Face',
    chewbacca: 'Chewbacca',
    c3po: 'C3PO',
    stitch: 'Stitch',
    stormtrooper: 'Stormtrooper',
    rocket: 'Rocket (Guardians)'
};
// Voice descriptions
const ne_voiceDescriptions = {
    fr_male1: 'French - Male 1',
    fr_male2: 'French - Male 2',
    de_female: 'German - Female',
    de_male: 'German - Male',
    es_male: 'Spanish - Male',
    mx_male: 'Spanish MX - Male',
    br_female1: 'Portuguese BR - Female 1',
    br_female2: 'Portuguese BR - Female 2',
    br_female3: 'Portuguese BR - Female 3',
    br_male: 'Portuguese BR - Male',
    id_female: 'Indonesian - Female',
    jp_female1: 'Japanese - Female 1',
    jp_female2: 'Japanese - Female 2',
    jp_female3: 'Japanese - Female 3',
    jp_male: 'Japanese - Male',
    kr_male1: 'Korean - Male 1',
    kr_female: 'Korean - Female',
    kr_male2: 'Korean - Male 2'
};

async function mergeAudioFiles(files, outputFile) {
    const currentDirectory = __dirname;
    const filterString = files.map((_, index) => `[${index}:0]`).join('');
    const inputFiles = files.map(file => `-i "${path.join(currentDirectory, file)}"`).join(' ');

    const outputFilePath = path.join(currentDirectory, outputFile);
    
    return new Promise((resolve, reject) => {
        exec(`${ffmpegPath} ${inputFiles} -filter_complex "${filterString}concat=n=${files.length}:v=0:a=1[out]" -map "[out]" "${outputFilePath}"`, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function textToSpeech(speaker, text) {
    const parts = splitMessage(text, 250);
    const audioFiles = await Promise.all(parts.map(async part => {
        const fileName = `${Date.now()}_${speaker}_tts`;
        await createAudioFromText(part, fileName, speaker);
        return fileName.replace('_tts', '_tts.mp3');
    }));

    if (audioFiles.length === 1) {
        return audioFiles[0];
    } else {
        const mergedFilename = `${Date.now()}_${speaker}_tts_merged.mp3`;
        await mergeAudioFiles(audioFiles, mergedFilename);

        // Clean up temporary audio files
        audioFiles.forEach(file => {
            fs.unlink(file, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        });

        return mergedFilename;
    }
}

// Create a new Discord client instance
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
	// For each variable in .env check if starts with personality_ and add to personalities array if true
	envKeys.forEach(element => {
		if (element.startsWith('personality_')) {
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
function groupVoiceDescriptions(voiceDescriptions) {
    const grouped = {};
    const regex = /^(.*\D)(\d+)$/;

    for (const key in voiceDescriptions) {
        const match = key.match(regex);
        if (match) {
            const prefix = match[1];
            const number = match[2];

            if (grouped[prefix]) {
                grouped[prefix].push(number);
            } else {
                grouped[prefix] = [number];
            }
        } else {
            grouped[key] = voiceDescriptions[key];
        }
    }

    const newVoiceDescriptions = {};
    for (const key in grouped) {
        if (Array.isArray(grouped[key])) {
            const newKey = `${key}${grouped[key].join('_')}`;
            newVoiceDescriptions[newKey] = voiceDescriptions[`${key}${grouped[key][0]}`];
        } else {
            newVoiceDescriptions[key] = grouped[key];
        }
    }

    return newVoiceDescriptions;
}

function voiceEmbed(voiceDescriptions, title) {
	const formattedDescriptions = groupVoiceDescriptions(voiceDescriptions);
	// create an embed object
	let voiceEmbed = new EmbedBuilder()
		.setColor(0x0099FF) // set the color of the embed
		.setTitle(title) // set the title of the embed
		.setDescription('Here are the '+ title +' you can use'); // set the description of the embed

	// loop through your voiceDescriptions object and add fields to the embed
	for (let key in formattedDescriptions) {
		const formattedKey = key.replace(/(\d)_/g, '$1,');
		voiceEmbed.addFields({ name: formattedKey, value: formattedDescriptions[key], inline: true });
	}

	return voiceEmbed;
}

client.on('messageCreate', async msg => {
	// Don't do anything when message is from the bot itself or from other bots, based on the BOT_REPLIES environment variable
	if (msg.author.id === client.user.id || (msg.author.bot && process.env.BOT_REPLIES !== "true")) return;

	// Enable/Disable bot commands
	if (msg.content === botCommand + 'disable') {
		if (isAdmin(msg)) {
			client.isPaused = true;
			sendCmdResp(msg, process.env.DISABLE_MSG);
		} else {
			sendCmdResp(msg, process.env.COMMAND_PERM_MSG);
			return;
		}
	}
	if (msg.content === botCommand + 'enable') {
		if (isAdmin(msg)) {
			client.isPaused = false;
			sendCmdResp(msg, process.env.ENABLE_MSG);
		} else {
			sendCmdResp(msg, process.env.COMMAND_PERM_MSG);
			return;
		}
	}

    // Reset bot command
	if (msg.content.startsWith(botCommand + 'reset')) {
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
	if (msg.content === botCommand + 'personalities') {
		// Check disabled status
		if (client.isPaused === true && !isAdmin(msg)) {
			sendCmdResp(msg, process.env.DISABLED_MSG);
			return;
		}
		// Create an embed object
		let persEmbed = new EmbedBuilder()
			.setColor(0x0099FF) // set the color of the embed
			.setTitle(process.env.PERSONALITY_MSG) // set the title of the embed
			.setDescription('Here are some personalities and their prompts'); // set the description of the embed
	
		// Add personality names and prompts to fields
		for (let i = 0; i < personalities.length; i++) {
			let thisPersonality = personalities[i];
			// Truncate the prompt to 1024 characters if it's longer than that
			let truncatedPrompt = thisPersonality.prompt.substring(0, 1024);
			persEmbed.addFields({ name: thisPersonality.name, value: truncatedPrompt });
		}
	
		// Send the embed
		sendCmdResp(msg,{embeds:[persEmbed]});
	}

	if (msg.content.startsWith(botCommand + 'say')) {
		const input = msg.content.split(' ').slice(1);
		const messageIdOrNumBack = !isNaN(input[0]) ? input.shift() : 1;
		const speakerKey = input.length > 0 && voiceMapping.hasOwnProperty(input[0].toLowerCase()) ? input.shift().toLowerCase() : "default";
		const botMessages = Array.from(msg.channel.messages.cache.filter(m => m.author.bot).values());
	
		let lastBotMessage = null;
	
		if (messageIdOrNumBack.toString().length > 2) { // Message ID
			try {
				lastBotMessage = await msg.channel.messages.fetch(messageIdOrNumBack);
				if (!lastBotMessage.author.bot) {
					lastBotMessage = null;
				}
			} catch (error) {
				console.error('Error fetching message by ID:', error);
			}
		} else { // Number of messages back
			const filteredBotMessages = botMessages.filter(m => m.attachments.size === 0);
			if (filteredBotMessages.length >= messageIdOrNumBack) {
				lastBotMessage = filteredBotMessages[filteredBotMessages.length - messageIdOrNumBack];
			}
		}
	
		if (lastBotMessage) {
			const messageContent = lastBotMessage.content.trim().replace(/^[^:]*:\s*/, '');
			const voice = voiceMapping[speakerKey];
	
			try {
				const audioFilename = await textToSpeech(voice, messageContent);
	
				msg.channel.send({
					files: [{
						attachment: audioFilename,
						name: `${speakerKey}_tts.mp3`
					}]
				}).then(() => {
					fs.unlink(audioFilename, (err) => {
						if (err) {
							console.error(err);
						}
					});
				});
			} catch (error) {
				console.error(error);
				msg.reply('Error generating audio. Please try again later.');
			}
		} else {
			msg.channel.send("No valid bot message found.");
		}
	}

	if (msg.content.startsWith(botCommand + 'tts')) {
        // Check disabled status
        if (client.isPaused === true && !isAdmin(msg)) {
            sendCmdResp(msg, process.env.DISABLED_MSG);
            return;
        }

        const regex = /^!tts\s+(\S+)\s+(.+)/;
        const matches = msg.content.match(regex);

        // Check for correct command format
        if (!matches) {
            msg.reply('Invalid command format. Use: !tts <speaker> "<text>" (or !tts <speaker> <messageID>)');
            return;
        }
		
        let speakerKey = matches[1].toLowerCase();
		let text = matches[2];

		if (text.length > 2 && !isNaN(text)) { // Check if the text argument is a message ID
			try {
				const fetchedMessage = await msg.channel.messages.fetch(text);
				text = fetchedMessage.content;
			} catch (error) {
				console.error('Error fetching message by ID:', error);
				msg.reply("Invalid message ID. Please provide a valid message ID (from this channel) or text.");
				return;
			}
		}

		// Validate speaker
        if (!voiceMapping.hasOwnProperty(speakerKey)) {
            msg.reply('Invalid speaker. Please use a valid speaker name.');
            return;
        }

        const speaker = voiceMapping[speakerKey];

        const voiceRegex = /(?<=^[^_]+_[^_]+_).+/;
        const speaker_name = speaker.match(voiceRegex)
        try {
            const audioFilename = await textToSpeech(speaker, text);

            // Send the generated audio file to the Discord channel
            msg.channel.send({
                files: [{
                    attachment: audioFilename,
                    name: `${speaker_name}_tts.mp3`
                }]
            }).then(() => {
                // Remove the file after sending
                fs.unlink(audioFilename, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            });
        } catch (error) {
            console.error(error);
            msg.reply('Error generating audio. Please try again later.');
        }
    }

	if (msg.content.startsWith(botCommand + 'help')) {
		// create an embed object
		let helpEmbed = new EmbedBuilder()
			.setColor(0x0099FF) // set the color of the embed
			.setTitle('**Bot Commands**') // set the title of the embed
			.setDescription('Here are some commands you can use'); // set the description of the embed
	
		// add fields to the embed for each command and its usage
		helpEmbed.addFields(
			{ name: `${botCommand}enable`, value: 'Enables the bot.' },
			{ name: `${botCommand}disable`, value: 'Disables the bot.' },
			{ name: `${botCommand}reset`, value: `Resets the memory of all personalities or a single personality. \n \`${botCommand}reset [all,<personality_name>]\`` },
			{ name: `${botCommand}personality`, value: 'Displays all personalities and their prompts.' },
			{ name: `${botCommand}tts`, value: `Generates TTS for a message. \n \`${botCommand}tts <speaker> [<text>,<messageID>] \`` },
			{ name: `${botCommand}say`, value: `Generates TTS for a bot message. With no input, uses the last message with \`rocket\`. Both arguments are optional. \n \`${botCommand}say [<number>,<messageID>] <speaker>\`` },
			{ name: `${botCommand}speakers`, value: `Displays all TTS speakers available to the \`${botCommand}tts\` command.` },
			{ name: `${botCommand}sample`, value:`Listen to samples of each available speaker to the \`${botCommand}tts\` command. \n \`${botCommand}sample <speaker>\``},
			{ name:`${botCommand}help`,value:'Displays this help message.'}
		);
	
		// send the embed to the channel
		msg.channel.send({ embeds:[helpEmbed] });
	}

	if (msg.content.startsWith(botCommand + 'speakers')) {
		const [, ne_voices] = msg.content.split(' ')
		let voiceEmbed_en = voiceEmbed(voiceDescriptions, 'English Speakers')
		// send the embed to the channel
		msg.channel.send({ embeds: [voiceEmbed_en] });

		if(ne_voices == "all"){
			let voiceEmbed_ne = voiceEmbed(ne_voiceDescriptions, 'Non-English Speakers')
			// send the embed to the channel
			msg.channel.send({ embeds: [voiceEmbed_ne] });
		}
		
	}

    if (msg.content.startsWith(botCommand + 'sample')) {
        // Extract the speakerKey from the command
        const [, speakerKey] = msg.content.split(' ');
    
        // Check if the speakerKey is valid
        if (voiceMapping.hasOwnProperty(speakerKey)) {
            const speaker = voiceMapping[speakerKey];
            const audioFilePath = path.join(__dirname, `voices/${speaker}.mp3`);
    
            // Check if the audio file exists
            fs.access(audioFilePath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error(err);
                    msg.reply('Error: Sample audio file not found.');
                } else {
                    // Send the sample audio file to the Discord channel
                    msg.channel.send({
                        files: [{
                            attachment: audioFilePath,
                            name: `${speakerKey}.mp3`
                        }]
                    });
                }
            });
        } else {
            msg.reply('Invalid speaker. Please use a valid speaker name.');
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