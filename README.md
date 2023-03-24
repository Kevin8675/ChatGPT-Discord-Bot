# ChatGPT Discord Bot
A GPT powered Discord Bot built with NodeJS.


## Features
* Multiple Personality Support: Add multiple personalities and depending on how you call the bot, it will respond differently.
* Enable/Disable/Reset commands for admins.
* Memory: Bot will remember conversations until restarted or reset.
* Message splitter for longer messages that exceed 2000 characters
* TTS: Bot will generate TTS clips from messages using TikTok's TTS api.

## Dependencies
* nodejs
* npm
   * dotenv
   * discord.js
   * openai
   * tiktok-tts
   * ffmpeg-static
   * child_process
* [OpenAI API Key](https://platform.openai.com/account/api-keys)
* [Discord Application Bot](https://discord.com/developers/applications/)
* [TikTok SessionID](#get-tiktok-session-id)

## Setup/Installation
1. Create an [OpenAI API Key](https://platform.openai.com/account/api-keys). Copy the key somewhere for usage later.
2. Create a [Discord Application Bot](https://discord.com/developers/applications/). You can follow [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) tutorial. Copy the bot token somewhere for usage later.
3. Get your TikTok `sessonid`. See [below](#get-tiktok-session-id) for instructions.
5. Invite the bot to your server. You can follow [this](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) tutorial.
6. Install [NodeJS](https://nodejs.org/) for your system. Refer to Google for installation based on OS.
7. Download Source Code from releases or clone this repo for dev build.
8. Run `npm ci` to install NPM dependencies.
9.  Copy `.env.example` to `.env` and add all previously mentioned required keys into `.env`. Add 1 or more personalities. Change other options to your liking.
10. Finally, run `npm start` or `node index.js` to run the bot.
11. **OPTIONAL** Run the bot in a container if you want to keep your bot active. See [below](#docker) for instructions.

## Usage
Once the server is started, simply send a message containing the personality name you put in the `.env` file and a question, comment, etc. and the bot will respond!
### Commands
- `!enable`: Enables the bot.
- `!disable`: Disables the bot.
- `!reset [all,<personality_name>]`: Resets the memory of all personalities or a single personality.
  - Usage: `!reset [all,<personality_name>]`
- `!personality`: Displays all personalities and their prompts.
- `!tts <speaker> <message>`: Generates TTS for a message. You must specify a valid speaker, use `!speakers` to see all available and `!sample <speaker>` to hear samples of each. 
  - Usage: `!tts <speaker> [<text>,<messageID>] `
- `!say`: Generates TTS for a bot message. With no input, uses the last message with `rocket`. Both arguments are optional. 
  - Usage: `!say [<number>,<messageID>] <speaker>`
- `!speakers`: Displays all TTS speakers available to the `!tts` command.  
- `!sample`: Listen to samples of each available speaker to the `!tts` command.
  - Usage: `!sample <speaker>`
- `!help`: Displays a help message with all available commands. 

## Get TikTok Session id 🍪
- Install [Cookie Editor extension](https://cookie-editor.cgagnier.ca) for your browser.
- Log in to [TikTok Web](https://tiktok.com)
- While on TikTok web, open the extension and look for ```sessionid```
- Copy the ```sessionid``` value. (It should be an alphanumeric value)

## Docker
- Ensure your `.env` file exists and is populated with the correct values.
- Run `docker build -t gpt-discord-bot .` to build the image.
- Run `docker-compose up -d` to create a stack. This will mount the .env file to `/app/.env` within the container.

## Contributing
Feel free to fork this repo and submit pull requests for different features, fixes, and changes.
