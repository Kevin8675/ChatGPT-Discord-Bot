# ChatGPT Discord Bot
A GPT powered Discord Bot built with NodeJS.


## Features
* Multiple Personality Support: Add multiple personalities and depending on how you call the bot, it will respond differently.
* Enable/Disable/Reset commands for admins.
* Memory: Bot will remember conversations until restarted or reset.
* Message splitter for longer messages that exceed 2000 characters
* TTS: Bot will generate TTS clips from messages using Azure TTS and Sentiment analysis to select the proper voice and style.

## Dependencies
* nodejs
* npm
   * dotenv
   * discord.js
   * openai
   * microsoft-cognitiveservices-speech-sdk
   * @azure/ai-text-analytics
* [OpenAI API Key](https://platform.openai.com/account/api-keys)
* [Discord Application Bot](https://discord.com/developers/applications/)
* [Azure TTS](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) [Key/Region](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account#get-the-keys-for-your-resource)
* [Azure Cognitive Services](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextAnalytics) [Language Key/Endpoint](https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/sentiment-opinion-mining/quickstart?tabs=windows&pivots=programming-language-javascript)

## Setup/Installation
1. Create an [OpenAI API Key](https://platform.openai.com/account/api-keys). Copy the key somewhere for usage later.
2. Create a [Discord Application Bot](https://discord.com/developers/applications/). You can follow [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) tutorial. Copy the bot token somewhere for usage later.
3. Create an Azure [Cognitive Services](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account?tabs=multiservice%2Canomaly-detector%2Clanguage-service%2Ccomputer-vision%2Cwindows#get-the-keys-for-your-resource) 
Speech Service resource (free). Copy the key and region to your .env file.
4. Create an Azure [Cognitive Services](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account?tabs=multiservice%2Canomaly-detector%2Clanguage-service%2Ccomputer-vision%2Cwindows#get-the-keys-for-your-resource) 
Language resource (free). Copy the language key and endpoint to your .env file.
5. Invite the bot to your server. You can follow [this](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) tutorial.
6. Install [NodeJS](https://nodejs.org/) for your system. Refer to Google for installation based on OS.
7. Download Source Code from releases or clone this repo for dev build.
8. If you downloaded release, extract zip and cd into folder in a terminal. If you cloned repo, cd into repo directory.
9. Run `npm ci` to install NPM dependencies.
10. Copy `.env.example` to `.env` and add your bot token and insert your API key and token into `.env`. Add 1 or more personalities. Change other options to your liking.
11. Finally, run `node index.js` or `nodejs index.js` depending on your NodeJS installation.
12. **OPTIONAL** Install [PM2](https://pm2.keymetrics.io/) if you want to keep your bot active. Run `pm2 start index.js --watch` to start it.

## Usage
Once the server is started, simply send a message containing the personality name you put in the `.env` file and a question, comment, etc. and the bot will respond!
### Commands
* `!enable`: Enables the bot.
* `!disable`: Disables the bot.
* `!reset [all,<personality_name>]`: Resets the memory of all personalities or a single personality.
* `!personality`: Displays all personalities and their prompts.
* `!tts [how many bot replies ago to generate TTS for]`: Generates TTS for a bot message. By default uses the last message sent by the bot, but specify NUMBER for that many messages back. eg: `!tts 2`, generates TTS for the bot message 2 messages back.

## Contributing
Feel free to fork this repo and submit pull requests for different features, fixes, and changes.
