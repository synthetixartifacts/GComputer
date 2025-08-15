/**
 * Main application controller that handles agents, discussions, and routing.
 */
class App extends BaseClass {
    constructor() {
        super();
        // Data storage
        this.agentList = [];
        this.discussionList = [];

        // Centralized event subscriptions
        const subscriptions = [
            ['updateUrlTitle',           this.updateUrlTitle.bind(this)],
            ['loadAgentList',            this.loadAgentList.bind(this)],
            ['loadAgentByCode',          this.loadAgentByCode.bind(this)],
            ['loadConversationByCode',   this.loadConversationByCode.bind(this)],
            ['loadAllConversations',     this.loadAllConversations.bind(this)],
            ['loadConversation',         this.loadConversation.bind(this)],
            ['newConversationWithAgent', this.newConversationWithAgent.bind(this)],
            ['loadAccount',              this.loadAccount.bind(this)],
            ['loading',                  this.loading.bind(this)],
            ['finishLoading',            this.finishLoading.bind(this)]
        ];
        subscriptions.forEach(([event, handler]) => this.subscribe(event, handler));

        // Initialize DOM events
        this.initEvents();
    }

    /**
     * Attach window/DOM event handlers.
     */
    initEvents() {
        this.loading();
        window.addEventListener('popstate', event => this.loadUrl(event));

        // Handle favorite icon click
        $(document).on('click', '.favorite-icon', (e) => {
            e.preventDefault();
            this.trigger('toggleFavorite');
        });
    }

    /**
     * Entry point: called once on page load.
     */
    async init() {
        if ($('body').hasClass('logged')) {
            const [agentListResponse, discussionListResponse] = await Promise.all([
                agentManager.getAgentList(),
                discussionManager.getDiscussionLast()
            ]);
            this.agentList = agentListResponse.response;
            this.discussionList = discussionListResponse.response;
            this.trigger('agentListLoaded', this.agentList);
            this.trigger('discussionLastLoaded', this.discussionList);
        }
        this.finishLoading();
        this.loadUrl();
    }

    /**
     * Show loading state.
     */
    loading() {
        $('body').addClass('loading');
    }

    /**
     * Hide loading state.
     */
    finishLoading() {
        $('body').removeClass('loading');
    }

    /**
     * Reset and unload all UI sections.
     */
    resetWindow() {
        // Trigger unload events
        ['unloadChatBot', 'unloadMyAccount', 'unloadAgentList', 'unloadAllDiscussions']
            .forEach(event => this.trigger(event));
        // Remove page-specific classes in one call
        $('body').removeClass('page-profile page-discussion page-new-discussion page-agent-list');

        // Always hide the favorite icon when resetting the window state
        $('.favorite-icon').hide();
    }

    /**
     * Evaluate the current URL and load the appropriate content.
     */
    loadUrl() {
        const currentUrl = window.location.pathname;
        const routes = {
            static: {
                '/':            () => this.loadAgentList(),
                '/agent-list':  () => this.loadAgentList(),
                '/discussions': () => this.loadAllConversations()
            },
            dynamic: [
                {
                    pattern: /^\/discussions\/(.+)$/,
                    handler: matches => this.trigger('loadConversationByCode', matches[1])
                },
                {
                    pattern: /^\/discussion\/(.+)$/,
                    handler: matches => this.trigger('loadConversationByCode', matches[1])
                },
                {
                    pattern: /^\/agent\/(.+)$/,
                    handler: matches => this.trigger('newConversationWithAgent', matches[1])
                },
                {
                    pattern: /^\/account\/(.+)$/,
                    handler: matches => this.trigger('loadAccount', matches[1])
                },
                {
                    pattern: /^\/public\/agent\/(.+)$/,
                    handler: matches => this.trigger('newConversationWithAgent', matches[1])
                }
            ]
        };

        if (routes.static[currentUrl]) {
            return routes.static[currentUrl]();
        }

        for (const route of routes.dynamic) {
            const matches = currentUrl.match(route.pattern);
            if (matches) return route.handler(matches);
        }
    }

    /**
     * Load the user account page.
     * @param {String} page - The specific account page or section.
     */
    loadAccount(page) {
        this.resetWindow();
        this.trigger('loadMyAccount');
        this.trigger('updateUrlTitle', {
            h1:    'Account',
            title: 'My Account',
            page:  'account',
            url:   `/account/${page}`
        });
        $('body').addClass('page-profile');
        // Ensure heart icon is hidden on account pages
        $('.favorite-icon').hide();
    }

    /**
     * Load the agent list view.
     */
    loadAgentList() {
        this.resetWindow();
        this.trigger('printAgentList');
        const agentListTitle = translations['messages.chatbot.agent.list'];
        this.trigger('updateUrlTitle', {
            h1:    agentListTitle,
            title: agentListTitle,
            page:  'agent-list',
            url:   '/'
        });
        $('body').addClass('page-agent-list');
        // Ensure heart icon is hidden on agent list pages
        $('.favorite-icon').hide();
    }

    /**
     * Load agent data by code.
     * @param {String} code - Agent code.
     */
    loadAgentByCode(code) {
        const agent = this.agentList.find(agent => agent.code === code);
        agent ? this.trigger('newConversationWithAgent', agent) : this.loadAgentList();
    }

    /**
     * Load all conversations.
     */
    loadAllConversations() {
        this.resetWindow();
        this.trigger('updateUrlTitle', {
            h1:    'Discussions',
            title: 'Discussions',
            page:  'discussions',
            url:   '/discussions'
        });
        this.trigger('loadAllDiscussions');
        // Ensure heart icon is hidden on all discussions page
        $('.favorite-icon').hide();
    }

    /**
     * Load a specific conversation by code.
     * @param {String} code - Discussion code.
     */
    loadConversationByCode(code) {
        this.resetWindow();
        $('body').addClass('page-discussion');
        const discussion = this.discussionList.find(discussion => discussion.key === code);
        discussion ? this.trigger('loadConversation', discussion) : this.loadAgentList();
    }

    /**
     * Update the page title and browser URL.
     * @param {Object} info - Contains h1, title, page, url.
     */
    updateUrlTitle(info) {
        $('#main_title').hide().show(100)
            .find('h1').html(messageFormatter.escapeHtml(info.h1));
        document.title = info.title;
        history.pushState({ page: info.page }, info.title, info.url);
    }

    /**
     * Create a new conversation with an agent by code.
     * @param {String} code - Agent code.
     */
    async newConversationWithAgent(code) {
        this.resetWindow();
        this.trigger('loading');

        // Fetch the latest agent data
        const response = await agentManager.getAgentByCode(code);
        if (response.status === 404) {
            console.error(`Agent with code ${code} not found.`);
            this.trigger('loadAgentList');
            this.trigger('finishLoading');
            return;
        }

        const agent = response.response;
        this.trigger('loadAgent', agent);
        this.trigger('newDiscussion', agent);
        this.trigger('finishLoading');
        $('body').addClass('page-new-discussion');
    }

    /**
     * Load an existing conversation.
     * @param {Object} discussion - Discussion object with agent_code, key, etc.
     */
    async loadConversation(discussion) {
        this.resetWindow();
        $('body').addClass('page-discussion');

        // Reload the latest agent data
        const response = await agentManager.getAgentByCode(discussion.agent_code);
        if (response.status === 404) {
            console.error(`Agent with code ${discussion.agent_code} not found.`);
            this.trigger('loadAgentList');
            return;
        }

        const agent = response.response;
        this.trigger('loadAgent', agent);
        this.trigger('loadDiscussion', discussion);
    }
}

// Make the class available globally
window.App = App;
const $app = new App();

$(function() {
    $app.init();
});

// Expose app instance for debugging
window.$app = $app;
