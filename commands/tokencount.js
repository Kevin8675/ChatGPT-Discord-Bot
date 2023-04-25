// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('token-count')
        .setDescription('Show amount of tokens used since bot was started.')
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        let message = process.env.TOKEN_COUNT_MSG.replace("<t>", state.totalTokenCount);
        message = message.replace("<d>", state.startTime.toLocaleDateString());
        message = message.replace("<c>", "$" + Math.round(state.totalTokenCount * 0.0002) / 100);
        await interaction.reply(message);
    },
};
