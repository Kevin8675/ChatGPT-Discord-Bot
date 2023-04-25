// Require the necessary node classes
const path = require('node:path');
// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// Require global functions
const { initPersonalities } = require(path.join(__dirname, "../common.js"));

// Reset bot command
module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('reset')
        .setDescription('Reset the memory of personalities.')
        .addStringOption( option =>
            option.setName('personality')
                .setDescription('The personality to delete the memory of or "all"')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && state.isPaused === true) {
            await interaction.reply(process.env.DISABLED_MSG);
            return;
        }
        // Delete all memories if option is "all"
        if (interaction.options.getString('personality') === "all" ) {
            initPersonalities(state.personalities, process.env);
            await interaction.reply(process.env.RESET_MSG)
        } else {
            // Check what personality's memory to delete
            for (let i = 0; i < state.personalities.length; i++) {
				let thisPersonality = state.personalities[i];
				if (interaction.options.getString('personality').toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
					state.personalities[i] = { "name": thisPersonality.name, "request" : [{"role": "system", "content": `${process.env["personality." + thisPersonality.name]}`}]};
					await interaction.reply(process.env.DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
					return;
				}
			}
            // Return error if reset message does not match any personality
			await interaction.reply(process.env.RESET_ERROR_MSG);
        }
    },
};
