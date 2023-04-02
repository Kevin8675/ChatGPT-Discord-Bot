// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('token-count')
        .setDescription('Show amount of tokens used since bot was started.'),
    async execute(interaction, state) {
        // Commands to execute
        let message = process.env.TOKEN_COUNT_MSG.replace("<t>", state.totalTokenCount);
        message = message.replace("<d>", state.startTime.toLocaleDateString());
        await interaction.reply(message);
    },
};
