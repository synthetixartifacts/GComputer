/**
 * This class serves as a base class for other classes in the application. It provides a simple
 * event management system, allowing child classes to subscribe to, unsubscribe from, and trigger events.
 *
 * Events are identified by a string name and are associated with a callback function provided by the child class.
 * The event manager holds a dictionary of events, where each key is an event name and each value is an array of
 * callback functions.
 *
 * The subscribe method adds a callback function to the list of callbacks for a particular event.
 * The unsubscribe method removes a callback function from the list of callbacks for a particular event.
 * The trigger method executes all callback functions associated with an event, passing through any provided data.
 */
class BaseClass {
    constructor() {
        this.eventManager = eventManager;
    }

    subscribe(event, callback) {
        this.eventManager.subscribe(event, callback);
    }

    unsubscribe(event, callback) {
        this.eventManager.unsubscribe(event, callback);
    }

    trigger(event, data) {
        this.eventManager.trigger(event, data);
    }

    handleItemClick(e, normalClickCallback) {
        const target = e.target.closest('a, [data-href]');
        if (!target) return;

        e.preventDefault();
        const url = target.href || target.dataset.href;

        if (e.ctrlKey || e.which === 2) {
            // ctrl+click or middle mouse => open in a new tab
            window.open(url, '_blank');
        } else {
            // Normal click => execute your desired logic
            normalClickCallback();
        }
    }

    throttle = (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
}

window.BaseClass = BaseClass;