// Sidebar
class Sidebar extends BaseClass {
    constructor() {
        super();

        this.$menuIcon        = $('#menu_burger');
        this.$sidebar         = $('#sidebarMain');
        this.rightOutDistance = 30;  // Mouse out
        this.defaultSize      = 60;   // Default mouse in distance

        // A map (code -> agent object)
        this.agentsMap        = {};

        // Initialize the event listeners
        if (!$('body').hasClass('guest')) {
            this.initEvents();
            this.initMouseMovement();

            // Subscribe event
            this.subscribe('agentListLoaded', list => this.updateAgentList(list));
            this.subscribe('discussionLastLoaded', list => this.updateDiscussionList(list));
            this.subscribe('loadAgent', agent => this.loadAgent(agent));
            this.subscribe('loadDiscussion', discussion => this.loadDiscussion(discussion));
            this.subscribe('addDiscussion', discussion => this.addDiscussion(discussion));
            this.subscribe('unloadChatBot', () => this.unloadChatBot());
            this.subscribe('loadAccount', () => this.loadAccount());
            this.subscribe('closeSidebar', () => this.closeSidebar());

        }
    }

    initEvents() {
        this.$menuIcon.on('click', () => this.openSidebar());

        $('#sidebar_my_account').on('click', (e) => {
            this.handleItemClick(e, () => {
                this.closeSidebar();
                this.trigger('loadAccount', 'profile');
            });
        });

        $('#sidebar_all_agent_top, #sidebar_all_agent').on('click', (e) => {
            this.handleItemClick(e, () => {
                this.closeSidebar();
                this.trigger('loadAgentList');
            });
        });

        $('#sidebar_all_discussions_top, #sidebar_all_discussions').on('click', (e) => {
            this.handleItemClick(e, () => {
                this.closeSidebar();
                this.trigger('loadAllConversations');
            });
        });

        $(document).on('click', (e) => {
            if ($(window).width() <= 1000) {
                const sidebarWidth = this.$sidebar.outerWidth();
                const clickX = e.clientX;

                if (clickX > sidebarWidth) {
                    this.closeSidebar();
                }
            }
        });
    }

    unloadChatBot() {
        this.$sidebar.find('.discussion_list .selected').removeClass('selected');
        this.$sidebar.find('.agent-item.selected').removeClass('selected');
    }

    // AGENT
    updateAgentList(agentList) {
        var $agentListWrap = this.$sidebar.find('.agent_list');

        // Clear the current list
        $agentListWrap.empty();

        // Clear and rebuild the map
        this.agentsMap = {};

        // Loop through each agent in the agentList.response array
        agentList.forEach(agent => {
            this.agentsMap[agent.code] = agent;

            // Create a new element for each agent
            var $agentItem = $('<a>', {
                class: 'acl-side-' + agent.code + ' agent-side agent-item button_type2',
                href: "/agent/" + agent.code
            });
            var $agentName = $('<div>', {
                class: 'name',
                text: agent.name,
                code: agent.code
            });

            // Bind the click event directly to the $agentItem
            $agentItem.on('click', (e) => {
                const target = e.target.closest('a, [data-href]');

                if (target) {
                    e.preventDefault();
                    const url = target.href || target.dataset.href;

                    // Check if it's a ctrl+click or middle mouse click
                    if (e.ctrlKey || e.which === 2) {
                        window.open(url, '_blank');
                    } else {
                        // Normal click behavior
                        this.trigger('newConversationWithAgent', agent.code);
                    }
                }
            });

            $agentItem.append($agentName);

            // Add Image
            if (agent.image && agent.image != '') {
                const $agentImage = $('<div>', { class: 'image' }).append($('<img>', { src: agent.image }));
                $agentItem.append($agentImage);
            }

            $agentListWrap.append($agentItem);
        });
    }

    loadAgent(agent) {
        this.closeSidebar();

        // Add selected class
        this.$sidebar.find('.agent-item').each(function() {
            if ($(this).find('.name').text() === agent.name) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });

        this.$sidebar.find('.discussion_list .selected').removeClass('selected');
    }


    // DISCUSSION
    updateDiscussionList(list) {
        const $listWrap = this.$sidebar.find('.discussion_list');
        $listWrap.empty();

        const agentCounts = {};

        // Add discussion
        list.forEach(discussion => {
            this.addDiscussion(discussion);

            // Count discussion per agent
            if (discussion.agent_code) {
                agentCounts[discussion.agent_code] = (agentCounts[discussion.agent_code] || 0) + 1;
            }
        });

        // Rearange agent list based on most frequent
        const sortedAgents = Object.entries(agentCounts).sort((a, b) => b[1] - a[1]);

        // First, hide all agents and set default order
        $('.agent-side').css({ display: 'none', order: '999' });

        // Show only the top 4 most active agents
        sortedAgents.slice(0, 4).forEach(([agentCode], index) => {
            $(`.acl-side-${agentCode}`)
                .css({ order: index + 1, display: '' })
                .attr('hitNumber', agentCounts[agentCode]);
        });

        // If we have less than 4 agents with discussions, show empty agents to complete
        const availableAgents = $('.agent-side').not('[style*="display: none"]').length;
        if (availableAgents < 4) {
            $('.agent-side[style*="display: none"]')
                .slice(0, 4 - availableAgents)
                .each(function(index) {
                    $(this)
                        .css({
                            display: '',
                            order: availableAgents + index + 1
                        })
                        .attr('hitNumber', 0);
                });
        }
    }

    addDiscussion(discussion) {
        const $listWrap = this.$sidebar.find('.discussion_list');

        // Create the discussion item container
        const $item  = $('<div>', { class: 'item' });

        // Discussion title link
        const $title = $('<a>', {
            class: 'name',
            text: discussion.title,
            key : discussion.key,
            href: "/discussion/" + discussion.key
        });

        // Append the title link first
        $item.append($title);

        // Retrieve the agent object from your map (assuming discussion.agent_code is available)
        const agent = this.agentsMap[discussion.agent_code];

        // If agent (and agent.image) is found, append the image after the discussion title
        if (agent && agent.image) {
            const $agentImage = $('<div>', { class: 'image' })
                .append($('<img>', { src: agent.image }));
            $item.append($agentImage);
        }

        // Handle click event on the discussion item
        $item.on('click', (e) => {
            const target = e.target.closest('a, [data-href]');
            if (target) {
                e.preventDefault();
                const url = target.href || target.dataset.href;

                // Check if it's a ctrl+click or middle mouse click
                if (e.ctrlKey || e.which === 2) {
                    window.open(url, '_blank');
                } else {
                    // Normal click behavior
                    this.trigger('loadConversation', discussion);
                }
            }
        });

        // If it's a new discussion, prepend and mark as selected
        if (discussion.new) {
            this.unloadChatBot();
            $item.addClass('selected');
            $listWrap.prepend($item);
        } else {
            // Otherwise just append to the bottom
            $listWrap.append($item);
        }
    }


    loadDiscussion(discussion) {
        this.closeSidebar();

        // Add selected class
        this.$sidebar.find('.discussion_list .item').each(function() {
            if ($(this).find('.name').attr('key') === discussion.key) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });

        // Remove selected agent in case
        this.$sidebar.find('.agent-item.selected').removeClass('selected');
    }

    loadAccount() {
        this.closeSidebar();
    }

    initMouseMovement() {
        // Detect mouse movement
        $(document).mousemove((event) => {
            // If mobile size - Return
            if ($(window).width() <= 1000) {
                return;
            }

            let size           = this.getSizeBasedOnWindowWidth();
            let sidebarWidth   = this.$sidebar.outerWidth();
            let sidebarVisible = this.$sidebar.hasClass('sidebar-visible');

            // Check if the mouse is within the defined area from the left
            if (event.pageX <= size) {
                this.openSidebar();
            }
            // Check if the mouse is at least rightOutDistance px to the right of the sidebar
            else if (sidebarVisible && event.pageX > sidebarWidth + this.rightOutDistance) {
                this.closeSidebar();
            }
        });
        // Add mouse leave detection
        $(document).mouseleave((e) => {
            // Close sidebar when mouse leaves the window
            this.closeSidebar();
        });
    }

    openSidebar() {
        this.$sidebar.addClass('sidebar-visible').removeClass('sidebar-left');
    }

    closeSidebar() {
        this.$sidebar.removeClass('sidebar-visible').addClass('sidebar-left');
    }

    getSizeBasedOnWindowWidth() {
        if ($(window).width() >= 1400) {
            return 100;
        }
        if ($(window).width() >= 1600) {
            return 250;
        }

        return this.defaultSize;
    }
}

// Instantiate the Sidebar class
const sidebar = new Sidebar();
