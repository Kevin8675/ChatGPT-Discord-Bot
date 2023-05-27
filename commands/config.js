// Requre the necessary discord.js classes
const { ActionRowBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, ModalBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('config')
        .setDescription('Configure simple settings for the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('configModal')
            .setTitle('Configuration');
        
        // Add modal components

        // Create Channel option
        const channelInput = new TextInputBuilder()
            .setCustomId('channelInput')
            .setLabel("Bot Channels (Sep. by comma):")
            .setStyle(TextInputStyle.Short)
            .setValue(state.channelIds?.join());

        const firstActionRow = new ActionRowBuilder().addComponents(channelInput);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({time: 300000});

        if (submitted) {
            await submitted.reply("Configuration Updated.");
            const channelIds = submitted.fields.getTextInputValue('channelInput');
            state.channelIds = channelIds?.split(',');
        }
    },
};