# ChatGPT Discord Bot
A ChatGPT powered Discord chatbot built with NodeJS.

## Public Discord
You can join the public Discord to try the bot or communicate with me here: https://discord.gg/wMtMXDVhn2

## Features
* Multiple Personality Support: Add multiple personalities and depending on how you call the bot, it will respond differently.
* Enable/Disable/Reset commands for admins.
* Memory: Bot will remember conversations until restarted or reset.
* Message splitter for longer messages that exceed 2000 characters.

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
2. Create a [Discord Application Bot](https://discord.com/developers/applications/). You can follow [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) tutorial. Make sure to enable the "Message Content Intent" under the "Priveralged Gateway Intents" section in the "Bot" tab. Copy the bot token somewhere for usage later.
3. Invite the bot to your server. You can follow [this](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) tutorial.
4. Install [NodeJS](https://nodejs.org/) for your system. Refer to Google for installation based on OS.
5. Download Source Code from releases or clone this repo for dev build.
6. If you downloaded a release, extract the zip and open the extracted zip folder in a terminal. If you cloned repo, open the repo directory in a terminal.
7. Run `npm ci` to install NPM dependencies.
8. Copy `.env.example` to `.env` and add your bot token and insert your API key and token into `.env`. Add 1 or more personalities. Change other options to your liking.
9. Run node `deploy-commands.js` to deploy the bot's slash commands to discord. See [below](#deploying-commands) for additional details.
10. Finally, run `node index.js` or `nodejs index.js` depending on your NodeJS installation.
11. **OPTIONAL** Install [PM2](https://pm2.keymetrics.io/) if you want to keep your bot active. Run `pm2 start index.js --watch` to start it.

## Usage
Once the server is started, simply send a message containing the personality name you put in the `.env` file and a question, comment, etc. and the bot will respond!
### Commands
* `/enable`: Enables the bot.
* `/disable`: Disables the bot.
* `/reset [all,<personality_name>]`: Resets the memory of all personalities or a single personality. If personality is ephemeral, sets its prompt to `undefined`.
* `/personalities`: Lists available personalities and their prompts.
* `/add-personality`: Adds an ephemeral personality to the bot, it will be lost when the bot restarts. Can also update `undefined` prompts.
  - Usage: `/add-personality <name> <prompt>`

### Deploying Commands
<details>
  <summary>Click to expand</summary>
To use the deploy/delete script, run `node ./deploy-commands.js` followed by one or more arguments. The available arguments are:

*   `[env]` (optional): the name of the `.env` file to use. If not specified, the script will use `.env` by default.
*   `-d [command]` (optional): the name of the command to delete. If specified, the script will delete the command with the given name instead of deploying all commands.
*   `-x [file]` (optional): the name of a command file to ignore. If specified, the script will not deploy the command with the given name.

To deploy all commands using the default `.env` file, run:

```bash
node ./deploy-commands.js
```

To deploy all commands using a custom `.env` file named `bot2.env`, run:

```bash
node ./deploy-commands.js bot2.env
```

To delete a command, find its command id, then run:

```bash
node ./deploy-commands.js bot2.env -d COMMAND_ID
```

To deploy all commands except the command in `ignore.js`, run:

```bash
node ./deploy-commands.js bot2.env -x ignore.js
```
</details>

## Contributing
Feel free to fork this repo and submit pull requests for different features, fixes, and changes.
