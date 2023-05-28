// Requre the necessary discord.js classes
const { ActionRowBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, ModalBuilder, PermissionFlagsBits } = require('discord.js');
// Require modules for updating .env
const fs = require("fs");
const os = require("os");

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('config')
        .setDescription('Configure simple settings for the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute

        // Writing to env file function
        function setEnvValue(key, value) {

            // Read env file and split into array by line break
            const ENV_VARS = fs.readFileSync(state.envFile, "utf8").split(os.EOL);
        
            // Find line based on var name
            const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
                return line.match(new RegExp(key));
            }));
        
            // Replace the key/value with the new value
            ENV_VARS.splice(target, 1, `${key}=${value}`);
        
            // Write everything back to the file system
            fs.writeFileSync(state.envFile, ENV_VARS.join(os.EOL));
        
        }

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

        // Create action row
        const firstActionRow = new ActionRowBuilder().addComponents(channelInput);

        // Add components to modal
        modal.addComponents(firstActionRow);

        // Show modal to user
        await interaction.showModal(modal);

        // Wait for submission
        const submitted = await interaction.awaitModalSubmit({
            time: 300000,
            filter: i => i.user.id === interaction.user.id
        }).catch(error => {
            console.log(error);
            return null;
        });

        if (submitted) {
            await submitted.reply("Configuration Updated.");
            const channelIds = submitted.fields.getTextInputValue('channelInput');
            state.channelIds = channelIds?.split(',');
            setEnvValue("CHANNELS", state.channelIds.join(","));
        } else {
            await interaction.followUp({ content: "Modal submission cancelled or timed out.", ephemeral: true });
        }
    },
};