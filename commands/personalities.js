// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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
        // Create message variable
		persMsg = process.env.PERSONALITY_MSG + "\n";
		// Add personality names to variable
		for (let i = 0; i < state.personalities.length; i++) {
			let thisPersonality = state.personalities[i];
			persMsg += "- " + thisPersonality.name + "\n"
		}
		// Send variable
		interaction.reply(persMsg);
    },
};
