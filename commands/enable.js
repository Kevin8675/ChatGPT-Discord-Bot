// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('enable')
        .setDescription('Enable the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        state.isPaused = false;
        await interaction.reply(process.env.ENABLE_MSG);
    },
};
