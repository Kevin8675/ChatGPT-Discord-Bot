// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-personality')
        .setDescription('Add a new personality to the bot.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the new personality.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt for the new personality.')
                .setRequired(true))
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && state.isPaused === true) {
            await interaction.reply(process.env.DISABLED_MSG);
            return;
        }
        const name = interaction.options.getString('name');
        const prompt = interaction.options.getString('prompt');

        // Check if personality already exists
        const existingPersonality = state.personalities.find(p => p.name.toUpperCase() === name.toUpperCase());
        if (existingPersonality) {
            // If the existing prompt is undefined and a new prompt is provided, update it
            if (typeof existingPersonality.prompt === 'undefined' && prompt) {
                existingPersonality.prompt = prompt;
                existingPersonality.request = [{
                    "role": "system",
                    "content": `${prompt}`
                }];
                await interaction.reply(process.env.UPDATE_PERSONALITY_MSG.replace("<n>", name));
            } else {
                await interaction.reply(process.env.UPDATE_PERS_ERROR_MSG);
            }
            return;
        }

        // Add the new personality
        state.personalities.push({
            name: name,
            request: [{
                "role": "system",
                "content": `${prompt}`
            }]
        });

        await interaction.reply(process.env.ADDED_PERSONALITY_MSG.replace("<n>", name));
    },
};