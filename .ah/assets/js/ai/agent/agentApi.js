class AgentManager {

    async getAgentList() {
        return await ApiCall.call('GET', `/api/v1/agents/list`);
    }

    async getAgentByCode(agentCode) {
        return await ApiCall.call('GET', `/api/v1/agent/getbycode/${agentCode}`);
    }

    async getPublicAgentByCode(agentCode) {
        return await ApiCall.call('GET', `/public/api/v1/agent/getbycode/${agentCode}`);
    }

}
const agentManager = new AgentManager();
window.agentManager = agentManager;