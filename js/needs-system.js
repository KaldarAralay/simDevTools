/**
 * Needs System - Manages NPC needs and their satisfaction
 */
class NeedsSystem {
    constructor() {
        // Need types and their properties
        this.needTypes = {
            hunger: {
                name: 'Hunger',
                max: 100,
                decayRate: 0.5, // Per second
                color: '#ff6b6b',
                icon: '🍔'
            },
            thirst: {
                name: 'Thirst',
                max: 100,
                decayRate: 0.4,
                color: '#4ecdc4',
                icon: '💧'
            },
            sleep: {
                name: 'Sleep',
                max: 100,
                decayRate: 0.3,
                color: '#95e1d3',
                icon: '😴'
            },
            happiness: {
                name: 'Happiness',
                max: 100,
                decayRate: 0.2,
                color: '#fce38a',
                icon: '😊'
            },
            social: {
                name: 'Social',
                max: 100,
                decayRate: 0.25,
                color: '#aa96da',
                icon: '👥'
            }
        };
    }

    /**
     * Initialize needs for an NPC
     * @returns {Object} Needs object
     */
    initializeNeeds() {
        const needs = {};
        for (const [key, config] of Object.entries(this.needTypes)) {
            needs[key] = {
                value: config.max, // Start at max
                max: config.max,
                priority: 0 // Calculated priority based on how low the need is
            };
        }
        return needs;
    }

    /**
     * Update needs (decay over time)
     * @param {Object} needs - Needs object
     * @param {number} deltaTime - Time in seconds
     */
    updateNeeds(needs, deltaTime) {
        for (const [key, need] of Object.entries(needs)) {
            const config = this.needTypes[key];
            if (config) {
                // Decay the need
                need.value = Math.max(0, need.value - (config.decayRate * deltaTime));
                
                // Calculate priority (lower value = higher priority)
                const percentage = need.value / need.max;
                need.priority = 1 - percentage; // 0 = full, 1 = empty
            }
        }
    }

    /**
     * Satisfy a need
     * @param {Object} needs - Needs object
     * @param {string} needType - Type of need
     * @param {number} amount - Amount to satisfy
     */
    satisfyNeed(needs, needType, amount) {
        if (needs[needType]) {
            needs[needType].value = Math.min(
                needs[needType].max,
                needs[needType].value + amount
            );
        }
    }

    /**
     * Get the most urgent need
     * @param {Object} needs - Needs object
     * @returns {string|null} Need type with highest priority
     */
    getMostUrgentNeed(needs) {
        let maxPriority = 0;
        let urgentNeed = null;
        
        for (const [key, need] of Object.entries(needs)) {
            if (need.priority > maxPriority) {
                maxPriority = need.priority;
                urgentNeed = key;
            }
        }
        
        // Only return if priority is above threshold (30% depleted)
        return maxPriority > 0.3 ? urgentNeed : null;
    }

    /**
     * Get need value as percentage
     * @param {Object} needs - Needs object
     * @param {string} needType - Type of need
     * @returns {number} Percentage (0-100)
     */
    getNeedPercentage(needs, needType) {
        if (!needs[needType]) return 0;
        return (needs[needType].value / needs[needType].max) * 100;
    }

    /**
     * Check if NPC is in critical state (any need below 20%)
     * @param {Object} needs - Needs object
     * @returns {boolean}
     */
    isCritical(needs) {
        for (const [key, need] of Object.entries(needs)) {
            if (need.value / need.max < 0.2) {
                return true;
            }
        }
        return false;
    }
}

