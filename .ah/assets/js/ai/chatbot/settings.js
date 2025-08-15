class ChatbotSettings extends BaseClass {
    constructor() {
        super();

        // Cached selectors
        this.settingsButtonId = '#settings_button';
        this.$settingsButton  = $(this.settingsButtonId);
        this.$popup           = $('#chatbot-settings');
        this.$saveButton      = $('#save_settings_button');
        this.$teamTextarea    = $('#custom-instructions-input-team');
        this.$userTextarea    = $('#custom-instructions-input');
        this.$saveSettingsMsg = $('#save_settings_msg'); // new cached selector

        // Agent data reference
        this.agent = null;

        // Initialize if not a public environment
        if (!$('body').hasClass('public')) {
            this.initEvents();
            this.subscribe('loadAgent', (agent) => this.loadAgent(agent));
        }
    }

    /**
     * Attach event handlers
     */
    initEvents() {
        // Open the settings popup
        this.$settingsButton.on('click', (e) => {
            e.preventDefault();
            Popup.open('chatbot-settings');
        });

        // Save settings
        this.$saveButton.on('click', (e) => {
            e.preventDefault();
            this.updateSettings();
        });
    }

    /**
     * When an agent is loaded, initialize the settings popup
     * @param {Object} agent - The agent data
     */
    loadAgent(agent) {
        this.agent = agent;
        const {
            name,
            isUserManager = false,
            customInstruction = {},
        } = agent;

        // Destructure the custom instructions from the agent
        const {
            user: userInstruction = '',
            default: teamInstruction = '',
        } = customInstruction;

        // Remove any existing custom instruction class patterns
        this.updateCustomInstructionClasses();

        // Determine the custom instruction type
        const customType = AgentTool.getConfigurationValue(agent, 'customInstruction', 'user');
        // Show or hide the settings button based on the customType
        document.getElementById('settings_button').style.display =
            customType === 'no' ? 'none' : '';

        // Add custom instruction type as a class to the popup
        this.$popup.addClass(`customInstruction-${customType}`);

        // Update title to reflect the agent's name
        this.$popup.find('h2 .agent-name').text(name);

        // Update instructions text inside the popup
        this.updateInstructionInfo('custom-instructions', name);
        this.updateInstructionInfo('custom-instructions-team', name);

        // Show or hide the team section based on user manager status or existing team instruction
        const teamSection = this.$popup.find('#custom-instructions-team');
        const hasTeamInfo = Boolean(teamInstruction);

        if (!isUserManager && !hasTeamInfo) {
            teamSection.hide();
        } else {
            teamSection.show();
            // Enable or disable team textarea based on user manager rights
            this.updateTeamTextareaState(isUserManager);
        }

        // Populate textareas
        this.$userTextarea.val(userInstruction);
        this.$teamTextarea.val(teamInstruction);
    }

    /**
     * Remove the existing customInstruction-related classes
     */
    updateCustomInstructionClasses() {
        const classPattern = /(^|\s)customInstruction-\S+/g;
        const classList = this.$popup.attr('class')?.match(classPattern) || [];
        if (classList.length) {
            this.$popup.removeClass(classList.join(' '));
        }
    }

    /**
     * Update the instruction info text in the popup
     * @param {String} sectionId - The ID for the section (e.g., custom-instructions, custom-instructions-team)
     * @param {String} agentName - The agent's name
     */
    updateInstructionInfo(sectionId, agentName) {
        // Decide which translation key to use
        const translationKey = sectionId === 'custom-instructions'
            ? 'messages.chatbot.settings.customInfos'
            : 'messages.chatbot.settings.customInfosTeam';

        // Replace placeholder with agent name
        const infoText = translations[translationKey].replace('%AGENTNAME%', agentName);
        this.$popup.find(`#${sectionId} .infos`).html(infoText);
    }

    /**
     * Enable or disable the team textarea
     * @param {Boolean} isEnabled - True if the user can edit the team textarea
     */
    updateTeamTextareaState(isEnabled) {
        this.$teamTextarea.prop('disabled', !isEnabled).css({
            opacity: isEnabled ? '1' : '0.7',
            cursor : isEnabled ? 'default' : 'not-allowed',
        });
    }

    /**
     * Update the agent's settings via an API call
     */
    async updateSettings() {
        if (!this.agent) {
            console.warn('No agent loaded. Cannot save settings.');
            return;
        }

        // Prepare settings data
        const settingsData = {
            agent_code      : this.agent.code,
            user_instruction: this.$userTextarea.val().trim(),
            team_instruction: this.$teamTextarea.val().trim(),
        };

        try {
            const response = await ApiCall.call(
                'POST',
                '/api/v1/user/update-agent-settings',
                settingsData
            );

            // Check response
            if (response.status !== 200) {
                console.warn('Saving settings failed', response);
                this.showMessage('messages.chatbot.settings.error');
                return;
            }

            // Successfully saved
            this.showMessage('messages.chatbot.settings.success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('messages.chatbot.settings.error');
        }
    }

    /**
     * Show a success or error message in the UI
     * @param {String} translationKey - The key to look up in `translations`
     */
    showMessage(translationKey) {
        this.$saveSettingsMsg.html(`${translations[translationKey]}<br/><br/>`);
        // Clear the message after 2 seconds
        setTimeout(() => {
            this.$saveSettingsMsg.text('');
        }, 2000);
    }
}

// Autoload
const chatbotSettings = new ChatbotSettings();
window.chatbotSettings = ChatbotSettings;
