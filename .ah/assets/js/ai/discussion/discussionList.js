class ChatbotDiscussionList extends BaseClass {
    constructor() {
        super();

        // DOM references
        this.$listDiv          = $('#discussion_list');
        this.$listDivReal      = $('#discussion_list_real');
        this.$searchContainer  = $('#discussion_search_container');
        this.$searchSentinel   = $('#discussion_search_sentinel');
        this.$searchInput      = $('#discussion_search_input');
        this.$searchClear      = $('#discussion_search_clear');
        this.$agentSelect      = $('#discussion_search_agent');
        this.$favoriteToggle   = $('#discussion_favorite_toggle');
        this.$sortToggle       = $('#discussion_sort_toggle');

        // Data placeholders
        this.agentList         = null;
        this.allDiscussions    = [];
        this.selectedAgent     = 'all'; // default agent filter
        this.selectedFavorite  = 'all'; // default favorite filter (all/favorites)
        this.selectedSort      = 'date_desc'; // default sort

        this.subscribe('loadAllDiscussions', () => this.loadAllDiscussions());
        this.subscribe('unloadAllDiscussions', () => this.unloadAllDiscussions());
        this.subscribe('updateDiscussionFavorite', (data) => this.updateDiscussionFavorite(data));

        // Initialize search & sticky logic
        this.setupSearch();
        this.setupStickySearch();
    }

    getAgentByCodeLocal(agentCode) {
        if (!this.agentList) return null;
        return this.agentList.find(agent => agent.code === agentCode);
    }

    unloadAllDiscussions() {
        this.$listDiv.hide();
        this.$searchContainer.hide();
    }

    async loadAllDiscussions() {
        this.trigger('loading');
        this.$searchContainer.css('display', 'flex');

        // 1) Fetch discussion data
        const discussionList = await discussionManager.getDiscussionComplete();
        this.allDiscussions  = discussionList.response;

        // 2) Fetch agents (only if needed)
        if (!this.agentList) {
            const response = await agentManager.getAgentList();
            this.agentList = response.response;
            // Populate the dropdown with agents
            this.populateAgentDropdown();
        }

        // 3) Render discussions
        this.$listDivReal.empty();
        this.$listDiv.show();
        this.renderDiscussions(this.allDiscussions);
        this.trigger('finishLoading');
    }

    populateAgentDropdown() {
        // Clear out old options except for the "All"
        this.$agentSelect.find('option:not([value="all"])').remove();

        // For each agent, add an option
        this.agentList.forEach((agent) => {
            this.$agentSelect.append(
                $('<option>', {
                    value: agent.code,
                    text: agent.name,
                })
            );
        });
    }

    renderDiscussions(discussions) {
        this.$listDivReal.empty();
        discussions.forEach((discussion) => {
            this.addDiscussionItem(discussion);
        });
    }

    addDiscussionItem(discussion) {
        const $item = $('<div>', {
            class: 'item discussion-row',
            'data-key': discussion.key,
        });

        const $date = $('<div>', {
            class: 'discussion-date',
            text: new Date(discussion.updated_at.date).toLocaleDateString(),
        });

        const $title = $('<a>', {
            class: 'discussion-title',
            text: discussion.title,
            href: `/discussion/${discussion.key}`,
        });

        // Add favorite indicator (always present, filled or empty)
        const $favoriteIcon = $('<span>', {
            class: `favorite-indicator ${discussion.favorite ? 'favorited' : 'not-favorited'}`,
            html: discussion.favorite ? '&#10084;' : '&#9825;', // filled heart vs empty heart
            'data-key': discussion.key,
            title: discussion.favorite ? 'Remove from favorites' : 'Add to favorites' // tooltip
        });

        // Add click handler for favorite toggle
        $favoriteIcon.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDiscussionFavorite(discussion.key);
        });

        $title.prepend($favoriteIcon);

        // Retrieve local agent
        const agent = this.getAgentByCodeLocal(discussion.agent_code);

        if (agent) {
            const $agent = $('<div>', {
                class: 'discussion-agent',
                text: agent.name,
            });

            $item.on('click', (e) => {
                this.handleItemClick(e, () => {
                    this.trigger('loadConversation', discussion);
                });
            });

            $item.append($date, $title, $agent);
            // Prepend so newest appear at top
            this.$listDivReal.prepend($item);
        }
    }

    setupSearch() {
        // Watch changes in the text input
        this.$searchInput.on('input', () => this.handleSearch());
        // Clear button
        this.$searchClear.on('click', () => this.clearSearch());
        // Agent dropdown
        this.$agentSelect.on('change', () => {
            this.selectedAgent = this.$agentSelect.val();
            this.handleSearch();
        });

        // Sort toggle (replaces dropdown)
        this.$sortToggle.on('click', () => {
            // Toggle between 'date_asc' and 'date_desc'
            this.selectedSort = this.selectedSort === 'date_desc' ? 'date_asc' : 'date_desc';

            // Update visual state
            this.$sortToggle.attr('data-sort', this.selectedSort);

            // Apply the sort
            this.handleSearch();
        });

        // Favorite toggle (div element now)
        this.$favoriteToggle.on('click', () => {
            // Toggle between 'all' and 'favorites'
            this.selectedFavorite = this.selectedFavorite === 'all' ? 'favorites' : 'all';

            // Update visual state
            this.$favoriteToggle.attr('data-state', this.selectedFavorite);

            // Apply the filter
            this.handleSearch();
        });
    }

    handleSearch() {
        const searchTerm = this.$searchInput.val().toLowerCase().trim();
        const agentCode  = this.selectedAgent;
        const favoriteFilter = this.selectedFavorite;

        // Filter logic
        let filtered = this.allDiscussions.filter(discussion => {
            const matchesSearch = discussion.title.toLowerCase().includes(searchTerm);
            const matchesAgent  = agentCode === 'all' || discussion.agent_code === agentCode;
            const matchesFavorite = favoriteFilter === 'all' ||
                                  (favoriteFilter === 'favorites' && discussion.favorite);
            return matchesSearch && matchesAgent && matchesFavorite;
        });

        // Apply sorting
        filtered = this.sortDiscussions(filtered);

        // Render filtered + sorted list
        this.renderDiscussions(filtered);
    }

    clearSearch() {
        this.$searchInput.val('');
        this.selectedAgent = 'all';
        this.$agentSelect.val('all');
        this.selectedFavorite = 'all';
        this.$favoriteToggle.attr('data-state', 'all');
        this.selectedSort = 'date_desc';
        this.$sortToggle.attr('data-sort', 'date_desc');
        this.renderDiscussions(this.allDiscussions);
        this.$searchInput.focus();
    }

    async toggleDiscussionFavorite(discussionKey) {
        try {
            // Call the API to toggle favorite status
            const response = await discussionManager.toggleFavorite(discussionKey);

            if (response.status == 200) {
                // Update local discussion data
                const discussion = this.allDiscussions.find(d => d.key === discussionKey);
                if (discussion) {
                    discussion.favorite = !discussion.favorite;

                    // Update the UI immediately
                    const $favoriteIcon = $(`.favorite-indicator[data-key="${discussionKey}"]`);
                    if (discussion.favorite) {
                        $favoriteIcon.html('&#10084;') // filled heart
                                   .removeClass('not-favorited')
                                   .addClass('favorited')
                                   .attr('title', 'Remove from favorites');
                    } else {
                        $favoriteIcon.html('&#9825;') // empty heart
                                   .removeClass('favorited')
                                   .addClass('not-favorited')
                                   .attr('title', 'Add to favorites');
                    }

                    // Re-filter if we're viewing favorites only
                    if (this.selectedFavorite === 'favorites') {
                        this.handleSearch();
                    }

                    // Trigger event for other components
                    this.trigger('updateDiscussionFavorite', {
                        key: discussionKey,
                        favorite: discussion.favorite
                    });
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    updateDiscussionFavorite(data) {
        // Update favorite status in local discussion list
        const discussion = this.allDiscussions.find(d => d.key === data.key);
        if (discussion) {
            discussion.favorite = data.favorite;

            // Re-filter if we're viewing favorites only
            if (this.selectedFavorite === 'favorites') {
                this.handleSearch();
            }
        }
    }

    sortDiscussions(discussions) {
        switch (this.selectedSort) {
            case 'date_asc':
                return discussions.sort((a, b) => {
                    return new Date(b.updated_at.date) - new Date(a.updated_at.date);
                });
            case 'date_desc':
                return discussions.sort((a, b) => {
                    return new Date(a.updated_at.date) - new Date(b.updated_at.date);
                });
            case 'title_asc':
                return discussions.sort((a, b) => {
                    return b.title.localeCompare(a.title);
                });
            case 'title_desc':
                return discussions.sort((a, b) => {
                    return a.title.localeCompare(b.title);
                });
            default:
                return discussions;
        }
    }

    /* ===========================================
     *         STICKY LOGIC VIA OBSERVER
     * ===========================================
     */
    setupStickySearch() {
        // Create the Intersection Observer
        const observer = new IntersectionObserver(
            ([entry]) => {
                this.$searchContainer.toggleClass('sticky', !entry.isIntersecting);
            },
            {
                threshold: 0,
                rootMargin: '-1px 0px 0px 0px' // Trigger as soon as sentinel leaves viewport
            }
        );

        if (this.$searchSentinel[0]) {
            // Start observing the sentinel
            observer.observe(this.$searchSentinel[0]);
        }
    }
}

window.ChatbotDiscussionList = ChatbotDiscussionList;
const chatbotDiscussionList = new ChatbotDiscussionList();