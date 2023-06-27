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
        .addStringOption(option =>
            option.setName('capitalization')
                .setDescription('The capitalization of the new personality ("upper" or "lower" or leave blank).'))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description of the new personality.'))
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
        let description = interaction.options.getString('description');
        let caseMode = interaction.options.getString('capitalization');

        // If no description provided, use prompt
        if (description == null) description = prompt.substring(0, 1024);

        // Set case mode to default if null
        switch (caseMode) {
            case null:
                caseMode = "";
                break;
            case "upper":
                break;
            case "lower":
                break;
            default:
                await interaction.reply(process.env.INVALID_CASE_MODE);
                return; 
        }

        // Check if personality already exists
        const existingPersonality = state.personalities.find(p => p.name.toUpperCase() === name.toUpperCase());
        if (existingPersonality) {
            // If the existing prompt is undefined and a new prompt is provided, update it
            if (existingPersonality.description == 'undefined' && prompt) {
                existingPersonality.request = [{
                    "role": "system",
                    "content": `${prompt}`
                }];
                existingPersonality.description = description;
                existingPersonality.caseMode = caseMode;
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
            }],
            description: description,
            caseMode: caseMode
        });

        await interaction.reply(process.env.ADDED_PERSONALITY_MSG.replace("<n>", name));
    },
};