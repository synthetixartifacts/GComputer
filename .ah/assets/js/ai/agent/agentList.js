
// AgentList Page
class AgentList extends BaseClass {
    constructor() {
        super();

        this.$div = $('#agent_list');

        // Subscribe event
        this.subscribe('agentListLoaded', agentList => this.updateAgentList(agentList));
        this.subscribe('loadAgent', agent => this.loadAgent(agent));
        this.subscribe('printAgentList', () => this.printAgentList());
        this.subscribe('unloadAgentList', () => this.unloadAgentList());
        this.subscribe('discussionLastLoaded', list => this.updateAgentPositionByDiscussion(list));
    }

    printAgentList() {
        this.$div.css('display', 'flex');
    }

    unloadAgentList() {
        this.$div.css('display', 'none');
    }

    loadAgent() {
        this.$div.hide(50);
    }

    updateAgentList(agentList) {
        // Clear the current list
        this.$div.empty();

        // Loop through each agent in the agentList array
        agentList.forEach(agent => {
            // Create a new element for each agent
            var $agentItem = $('<a>', { class: 'acl-' + agent.code + ' agent-item-main agent-item bubble_div button_type2', href: "/agent/" + agent.code });
            var $agentName = $('<div>', { class: 'name', text: agent.name });
            var $agentDesc = $('<div>', { class: 'description', text: agent.description });

            // Bind the click event directly to the $agentItem
            $agentItem.on('click', (e) => {
                this.handleItemClick(e, () => {
                    this.trigger('newConversationWithAgent', agent.code);
                });
            });

            // Add Image
            if (agent.image && agent.image != '') {
                const $agentImage = $('<div>', { class: 'image' }).append($('<img>', { src: agent.image }));
                $agentItem.append($agentImage);
            }

            // Append the name to the agent item
            $agentItem.append($agentName);
            $agentItem.append($agentDesc);

            // Append the agent item to the agent list wrapper
            this.$div.append($agentItem);
        });

    }

    updateAgentPositionByDiscussion(discussions) {
        const agentCounts = {};

        discussions.forEach(discussion => {
            const agentCode = discussion.agent_code;
            if (agentCode) {
                agentCounts[agentCode] = (agentCounts[agentCode] || 0) + 1;
            }
        });

        $('.agent-item-main').css('order', '999');
        const sortedAgents = Object.entries(agentCounts).sort((a, b) => b[1] - a[1]);

        sortedAgents.forEach(([agentCode, count], index) => {
            $(`.acl-${agentCode}`).css('order', index + 1);
        });
    }
}
const agentList = new AgentList();
