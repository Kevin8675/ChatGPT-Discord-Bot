// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('personalities')
        .setDescription('List the name of all personalities.'),
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
            .setDescription('Here are the personalities and their prompts'); // set the description of the embed
        
        // Add personality names and prompts to fields
        for (let i = 0; i < state.personalities.length; i++) {
            let thisPersonality = state.personalities[i];
            // Find the prompt from the request array
            let prompt = thisPersonality.request.find(item => item.role === 'system').content;
            // Truncate the prompt to 1024 characters if it's longer than that
            let truncatedPrompt = prompt.substring(0, 1024);
            persEmbed.addFields({ name: thisPersonality.name, value: truncatedPrompt });
        }
		// Send variable
        interaction.reply({ embeds: [persEmbed] });
    },
};
