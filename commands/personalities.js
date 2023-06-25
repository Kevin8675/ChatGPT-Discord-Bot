// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('personalities')
        .setDescription('List the name of all personalities and their prompts.')
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && state.isPaused === true) {
            await interaction.reply(process.env.DISABLED_MSG);
            return;
        }
        // Create an embed object
        let persEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // set the color of the embed
            .setTitle(process.env.PERSONALITY_MSG) // set the title of the embed
        // Add personality names and prompts to fields
        for (let i = 0; i < state.personalities.length; i++) {
            let thisPersonality = state.personalities[i];
            persEmbed.addFields({ name: thisPersonality.name, value: thisPersonality.description });
        }
		// Send variable
        interaction.reply({ embeds: [persEmbed] });
    },
};
