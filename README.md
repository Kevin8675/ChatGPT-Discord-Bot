# ChatGPT Discord Bot
A simple ChatGPT Discord Bot built with NodeJS.

## Features
* Multiple Personality Support: Add multiple personalities and depending on how you call the bot, it will respond differently.
* Enable/Disable/Reset commands for admins.
* Memory: Bot will remember conversations until restarted or reset.

## Dependencies
* nodejs
* npm
   * dotenv
   * discord.js
   * openai
* [OpenAI API Key](https://platform.openai.com/account/api-keys)
* [Discord Application Bot](https://discord.com/developers/applications/)

## Setup/Installation
1. Create an [OpenAI API Key](https://platform.openai.com/account/api-keys). Copy the key somewhere for usage later.
2. Create a [Discord Application Bot](https://discord.com/developers/applications/). You can follow [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) tutorial. Copy the bot token somewhere for usage later.
3. Invite the bot to your server. You can follow [this](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) tutorial.
4. Install [NodeJS](https://nodejs.org/) for your system. Refer to Google for installation based on OS.
5. Download Source Code from releases or clone this repo for dev build.
6. If you downloaded release, extract zip and cd into folder in a terminal. If you cloned repo, cd into repo directory.
7. Run `npm ci` to install NPM dependencies.
8. Copy `.env.example` to `.env` and add your bot token and insert your API key and token into `.env`. Add your personal Discord Account ID and add a personality.
9. Finally, run `node index.js` or `nodejs index.js` depending on your NodeJS installation.
10. **OPTIONAL** Install [PM2](https://pm2.keymetrics.io/) if you want to keep your bot active. Run `pm2 start index.js --watch` to start it.

## Usage
Once the server is started, simply send a message containing the personality name you put in the `.env` file and a question, comment, etc. and the bot will respond!
### Commands
* `!enable`: Enables the bot.
* `!disable`: Disables the bot.
* `!reset`: Resets the bot's memory.

## Contributing
Feel free to fork this repo and submit pull requests for different features, fixes, and changes.
