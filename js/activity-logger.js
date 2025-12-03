/**
 * Activity Logger - Logs NPC activities and events
 */
class ActivityLogger {
    constructor(maxEntries = 50) {
        this.entries = [];
        this.maxEntries = maxEntries;
        this.listeners = [];
    }

    /**
     * Log an activity
     * @param {string} message - Activity message
     * @param {string} type - Type: 'info', 'action', 'interaction', 'need'
     * @param {Object} data - Additional data
     */
    log(message, type = 'info', data = {}) {
        const entry = {
            timestamp: Date.now(),
            time: window.timeSystem ? window.timeSystem.getFormattedTime() : '',
            message: message,
            type: type,
            data: data
        };
        
        this.entries.push(entry);
        
        // Keep only last N entries
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
        
        // Notify listeners
        this.listeners.forEach(listener => listener(entry));
    }

    /**
     * Log NPC action
     * @param {NPC} npc
     * @param {string} action
     * @param {string} details
     */
    logNPCAction(npc, action, details = '') {
        const message = `${npc.name} ${action}${details ? ': ' + details : ''}`;
        this.log(message, 'action', { npcId: npc.id, npcName: npc.name });
    }

    /**
     * Log NPC interaction
     * @param {NPC} npc1
     * @param {NPC} npc2
     * @param {string} interactionType
     */
    logNPCInteraction(npc1, npc2, interactionType = 'talked') {
        const message = `${npc1.name} ${interactionType} with ${npc2.name}`;
        this.log(message, 'interaction', { 
            npc1Id: npc1.id, 
            npc2Id: npc2.id,
            npc1Name: npc1.name,
            npc2Name: npc2.name
        });
    }

    /**
     * Log need satisfaction
     * @param {NPC} npc
     * @param {string} needType
     * @param {string} itemName
     */
    logNeedSatisfaction(npc, needType, itemName) {
        const needNames = {
            hunger: 'ate',
            thirst: 'drank',
            sleep: 'slept',
            happiness: 'enjoyed',
            social: 'socialized'
        };
        const action = needNames[needType] || 'used';
        const message = `${npc.name} ${action} ${itemName}`;
        this.log(message, 'need', { npcId: npc.id, needType, itemName });
    }

    /**
     * Log NPC seeking item
     * @param {NPC} npc
     * @param {string} needType
     * @param {string} itemName
     */
    logSeekingItem(npc, needType, itemName) {
        const needNames = {
            hunger: 'hungry',
            thirst: 'thirsty',
            sleep: 'tired',
            happiness: 'unhappy',
            social: 'lonely'
        };
        const feeling = needNames[needType] || 'needs something';
        const message = `${npc.name} is ${feeling}, seeking ${itemName}`;
        this.log(message, 'action', { npcId: npc.id, needType, itemName });
    }

    /**
     * Add listener for new log entries
     * @param {Function} callback
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     * @param {Function} callback
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
        this.listeners.forEach(listener => listener(null)); // Notify of clear
    }

    /**
     * Get recent entries
     * @param {number} count
     * @returns {Array}
     */
    getRecent(count = 10) {
        return this.entries.slice(-count);
    }
}

