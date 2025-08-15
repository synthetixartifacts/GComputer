/**
 * EventManager class is used to handle custom events and their subscriptions.
 * It allows you to subscribe to an event with a callback function, unsubscribe from it, and trigger the event.
 */
class EventManager {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to a specific event with the provided callback function.
     * @param {string} event - The name of the event to subscribe to.
     * @param {function} callback - The function to be called when the event is triggered.
     */
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Unsubscribe a callback function from a specific event.
     * @param {string} event - The name of the event to unsubscribe from.
     * @param {function} callback - The function to be removed from the event's subscribers list.
     */
    unsubscribe(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Trigger a specific event, which will cause all subscribed callback functions to be called.
     * @param {string} event - The name of the event to trigger.
     * @param {*} data - The data to be passed to the callback functions.
     */
    trigger(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

const eventManager  = new EventManager();
window.eventManager = eventManager;