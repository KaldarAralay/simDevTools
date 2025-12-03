/**
 * Functional Item - Items that can satisfy NPC needs
 */
class FunctionalItem extends Item {
    constructor(x = 0, y = 0, name = 'Item', itemDef = null) {
        super(x, y, name);
        this.type = 'functional';
        
        // Item definition (what it does)
        this.itemDef = itemDef || this.getDefaultDefinition();
        
        // Usage properties
        this.inUse = false;
        this.usedBy = null; // Entity ID using this item
        this.useTime = 0; // Time spent using (seconds)
        this.maxUseTime = this.itemDef.useTime || 5; // Seconds to use
        
        // Visual state
        this.bobbing = false; // Functional items don't bob
    }

    /**
     * Get default item definition
     * @returns {Object}
     */
    getDefaultDefinition() {
        return {
            name: 'Item',
            category: 'furniture',
            satisfies: {}, // {hunger: 20, sleep: 0, etc.}
            useTime: 5,
            sprite: { tileset: 'furniture', tileX: 0, tileY: 0 }
        };
    }

    /**
     * Check if item can satisfy a need
     * @param {string} needType - Type of need
     * @returns {boolean}
     */
    canSatisfy(needType) {
        return this.itemDef.satisfies && this.itemDef.satisfies[needType] > 0;
    }

    /**
     * Get satisfaction amount for a need
     * @param {string} needType - Type of need
     * @returns {number}
     */
    getSatisfactionAmount(needType) {
        return this.itemDef.satisfies[needType] || 0;
    }

    /**
     * Start using the item
     * @param {string} entityId - ID of entity using it
     * @returns {boolean} Success
     */
    startUse(entityId) {
        if (this.inUse) return false;
        this.inUse = true;
        this.usedBy = entityId;
        this.useTime = 0;
        return true;
    }

    /**
     * Update item usage
     * @param {number} deltaTime - Time in seconds
     * @returns {boolean} True if usage complete
     */
    updateUse(deltaTime) {
        if (!this.inUse) return false;
        
        this.useTime += deltaTime;
        
        if (this.useTime >= this.maxUseTime) {
            this.completeUse();
            return true;
        }
        return false;
    }

    /**
     * Complete using the item
     */
    completeUse() {
        this.inUse = false;
        this.usedBy = null;
        this.useTime = 0;
    }

    /**
     * Stop using the item (interrupted)
     */
    stopUse() {
        this.inUse = false;
        this.usedBy = null;
        this.useTime = 0;
    }

    /**
     * Check if item is available (not in use)
     * @returns {boolean}
     */
    isAvailable() {
        return !this.inUse;
    }

    /**
     * Handle interaction
     * @param {Entity} interactor
     * @returns {boolean}
     */
    onInteract(interactor) {
        // Functional items are used by NPCs, not directly by player
        return false;
    }

    /**
     * Serialize item data
     * @returns {Object}
     */
    serialize() {
        const data = super.serialize();
        data.itemDef = this.itemDef;
        data.type = 'functional';
        return data;
    }

    /**
     * Deserialize item data
     * @param {Object} data
     */
    deserialize(data) {
        super.deserialize(data);
        if (data.itemDef) {
            this.itemDef = data.itemDef;
            this.maxUseTime = this.itemDef.useTime || 5;
        }
    }
}

/**
 * Item Definitions - Predefined items that satisfy needs
 */
class ItemDefinitions {
    static getDefinitions() {
        return {
            // Food items
            apple: {
                name: 'Apple',
                category: 'food',
                satisfies: { hunger: 30, happiness: 5 },
                useTime: 2,
                sprite: { tileset: 'furniture', tileX: 0, tileY: 0 }
            },
            meal: {
                name: 'Meal',
                category: 'food',
                satisfies: { hunger: 60, happiness: 10 },
                useTime: 5,
                sprite: { tileset: 'furniture', tileX: 1, tileY: 0 }
            },
            
            // Drink items
            water: {
                name: 'Water',
                category: 'drink',
                satisfies: { thirst: 40 },
                useTime: 1,
                sprite: { tileset: 'furniture', tileX: 2, tileY: 0 }
            },
            juice: {
                name: 'Juice',
                category: 'drink',
                satisfies: { thirst: 50, happiness: 10 },
                useTime: 2,
                sprite: { tileset: 'furniture', tileX: 3, tileY: 0 }
            },
            
            // Sleep items
            bed: {
                name: 'Bed',
                category: 'furniture',
                satisfies: { sleep: 80, happiness: 5 },
                useTime: 10,
                sprite: { tileset: 'furniture', tileX: 0, tileY: 1 }
            },
            couch: {
                name: 'Couch',
                category: 'furniture',
                satisfies: { sleep: 30, happiness: 15, social: 10 },
                useTime: 5,
                sprite: { tileset: 'furniture', tileX: 1, tileY: 1 }
            },
            
            // Entertainment
            tv: {
                name: 'TV',
                category: 'entertainment',
                satisfies: { happiness: 40, social: 20 },
                useTime: 8,
                sprite: { tileset: 'furniture', tileX: 2, tileY: 1 }
            },
            book: {
                name: 'Book',
                category: 'entertainment',
                satisfies: { happiness: 25 },
                useTime: 6,
                sprite: { tileset: 'furniture', tileX: 3, tileY: 1 }
            },
            
            // Social
            table: {
                name: 'Table',
                category: 'furniture',
                satisfies: { social: 30, happiness: 10 },
                useTime: 5,
                sprite: { tileset: 'furniture', tileX: 0, tileY: 2 }
            },
            
            // More food options
            sandwich: {
                name: 'Sandwich',
                category: 'food',
                satisfies: { hunger: 40, happiness: 8 },
                useTime: 3,
                sprite: { tileset: 'furniture', tileX: 4, tileY: 0 }
            },
            pizza: {
                name: 'Pizza',
                category: 'food',
                satisfies: { hunger: 70, happiness: 20 },
                useTime: 6,
                sprite: { tileset: 'furniture', tileX: 5, tileY: 0 }
            },
            
            // More drink options
            coffee: {
                name: 'Coffee',
                category: 'drink',
                satisfies: { thirst: 30, sleep: -10, happiness: 15 },
                useTime: 2,
                sprite: { tileset: 'furniture', tileX: 6, tileY: 0 }
            },
            soda: {
                name: 'Soda',
                category: 'drink',
                satisfies: { thirst: 45, happiness: 12 },
                useTime: 2,
                sprite: { tileset: 'furniture', tileX: 7, tileY: 0 }
            },
            
            // More furniture
            chair: {
                name: 'Chair',
                category: 'furniture',
                satisfies: { sleep: 15, happiness: 5 },
                useTime: 3,
                sprite: { tileset: 'furniture', tileX: 2, tileY: 2 }
            },
            desk: {
                name: 'Desk',
                category: 'furniture',
                satisfies: { happiness: 10, social: 5 },
                useTime: 4,
                sprite: { tileset: 'furniture', tileX: 3, tileY: 2 }
            },
            
            // More entertainment
            computer: {
                name: 'Computer',
                category: 'entertainment',
                satisfies: { happiness: 50, social: 15 },
                useTime: 10,
                sprite: { tileset: 'furniture', tileX: 4, tileY: 1 }
            },
            game: {
                name: 'Game Console',
                category: 'entertainment',
                satisfies: { happiness: 60, social: 25 },
                useTime: 12,
                sprite: { tileset: 'furniture', tileX: 5, tileY: 1 }
            }
        };
    }

    /**
     * Create a functional item from definition
     * @param {string} defKey - Definition key
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {FunctionalItem}
     */
    static createItem(defKey, x, y) {
        const definitions = this.getDefinitions();
        const def = definitions[defKey];
        
        if (!def) {
            console.warn(`Item definition not found: ${defKey}`);
            return null;
        }
        
        const item = new FunctionalItem(x, y, def.name, def);
        item.setSprite(def.sprite.tileset, def.sprite.tileX, def.sprite.tileY);
        return item;
    }
}

