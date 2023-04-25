// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('disable')
        .setDescription('Disable the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        state.isPaused = true;
        await interaction.reply(process.env.DISABLE_MSG);
    },
};
