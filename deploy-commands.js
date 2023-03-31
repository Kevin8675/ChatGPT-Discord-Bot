// Use this file to deploy or delete bot commands
//      node deploy-commands.js                                  - deploy all commands in ./commands/ using .env
//      node deploy-commands.js bot2.env                         - deploy all commands using bot2.env
//      node deploy-commands.js bot2.env -x ignore.js      - deploy all commands but ignore ignore.js command
//      node deploy-commands.js bot2.env -d 10910978101259986993 - delete a global command with id
//      Args Usage:
//          -x <filename>: Ignore a specific file when deploying commands.
//          -d <command_id>: Delete a command by its ID.
const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits } = require('discord.js');

const args = process.argv.slice(2);
let envFile = '.env';
let ignoreFile = '';
let deleteCommand = '';

args.forEach((arg, index) => {
    if (arg === '-x' && args[index + 1]) {
        ignoreFile = args[index + 1];
    } else if (arg === '-d' && args[index + 1]) {
        deleteCommand = args[index + 1];
    } else if (index === 0) {
        envFile = `${arg}`;
    }
});

dotenv.config({ path: envFile });

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== ignoreFile);

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.CLIENT_TOKEN);

let clientId;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
    clientId = client.user.id;

    (async () => {
        if (deleteCommand) {
            try {
                console.log('Deleting specified command...');
                await rest.delete(Routes.applicationCommand(clientId, deleteCommand));
                console.log('Successfully deleted application command');
            } catch (error) {
                console.error(error);
            }
        } else {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);

                const data = await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands },
                );

                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (error) {
                console.error(error);
            }
        }
    })();

    client.destroy();
});

client.login(process.env.CLIENT_TOKEN);