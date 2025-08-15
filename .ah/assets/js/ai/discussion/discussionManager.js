class DiscussionManager {
    async getDiscussionLast() {
        return await ApiCall.call('GET', `/api/v1/discussion/last`);
    }

    async getDiscussionComplete() {
        return await ApiCall.call('GET', `/api/v1/discussion/complete`);
    }

    async getDiscussionByKey(key) {
        return await ApiCall.call('GET', `/api/v1/discussion/one/${key}`);
    }

    async toggleFavorite(key) {
        return await ApiCall.call('POST', `/api/v1/discussion/toggle-favorite`, {
            discussionKey: key
        });
    }
}
const discussionManager = new DiscussionManager();
window.discussionManager = discussionManager;