

class AgentTool {

    static getConfigurationValue(agent, configName, defaultValue) {
        const config = agent.configuration;

        // Check if 'config' is an object first (most common case)
        if (typeof config === 'object' && config !== null) {
            // Direct property lookup
            if (config.hasOwnProperty(configName)) {
                return config[configName];
            }

            // Nested property lookup
            if (typeof configName === 'string') {
                const value = configName.split('.').reduce((obj, key) =>
                    (obj && obj[key] !== undefined) ? obj[key] : undefined, config);
                return value !== undefined ? value : defaultValue;
            }
        }

        // Array checks (if needed)
        if (Array.isArray(config)) {
            if (Number.isInteger(Number(configName)) && configName >= 0 && configName < config.length) {
                return config[configName];
            }
            const index = parseInt(configName, 10);
            if (!isNaN(index) && index >= 0 && index < config.length) {
                return config[index];
            }
        }

        return defaultValue;
    }

    ///////////////////////////////////////////////////
    // CALL /////////
    ///////////////////////////////////////////////////
    static async talk(agent, msg, discussionKey, fileIds, dataParam = [], stream = false, callable) {
        const urlTalk = stream ? `/api/v1/agent/stream/${agent.code}` : `/api/v1/agent/talk/${agent.code}`;
        const method  = 'POST';
        const data    = {
            message      : msg,
            discussionKey: discussionKey,
            fileIds      : fileIds
        };

        // Merge dataParam into data object
        Object.assign(data, dataParam);

        if (stream) {
            await ApiCall.streamCall(method, urlTalk, data, callable);
        } else {
            const response = await ApiCall.call(method, urlTalk, data);
            this.handleResponse(response);
        }
    }

    static async handleResponse(responseMsg) {
        return responseMsg;
    }
}
window.AgentTool = AgentTool;