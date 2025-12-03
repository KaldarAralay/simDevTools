/**
 * Base Entity class - Represents any interactive object on the map
 */
class Entity {
    constructor(x = 0, y = 0, type = 'entity') {
        this.id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type; // 'npc', 'monster', 'item', 'player', etc.
        
        // Position
        this.tileX = x;
        this.tileY = y;
        this.pixelX = x * 32;
        this.pixelY = y * 32;
        
        // Visual properties
        this.sprite = null; // Sprite data {tileset, tileX, tileY}
        this.width = 32;
        this.height = 32;
        this.visible = true;
        this.layer = 'items'; // Which layer to render on
        
        // Interaction
        this.interactable = false;
        this.name = 'Entity';
        this.description = '';
        
        // State
        this.active = true;
        this.markedForRemoval = false;
    }

    /**
     * Update entity (called every frame)
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        // Override in subclasses
    }

    /**
     * Get pixel position for rendering
     * @returns {Object} {x, y}
     */
    getPixelPosition() {
        return {
            x: this.pixelX,
            y: this.pixelY
        };
    }

    /**
     * Set position
     * @param {number} x - Tile X
     * @param {number} y - Tile Y
     */
    setPosition(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.pixelX = x * 32;
        this.pixelY = y * 32;
    }

    /**
     * Check if entity is at a specific tile position
     * @param {number} x - Tile X
     * @param {number} y - Tile Y
     * @returns {boolean}
     */
    isAtPosition(x, y) {
        return this.tileX === x && this.tileY === y;
    }

    /**
     * Get distance to another entity or position
     * @param {Entity|Object} target - Entity or {tileX, tileY}
     * @returns {number} Distance in tiles
     */
    getDistance(target) {
        const targetX = target.tileX !== undefined ? target.tileX : target.x;
        const targetY = target.tileY !== undefined ? target.tileY : target.y;
        
        const dx = this.tileX - targetX;
        const dy = this.tileY - targetY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Handle interaction (clicked by player)
     * @param {Entity} interactor - Entity that interacted (usually player)
     * @returns {boolean} True if interaction was handled
     */
    onInteract(interactor) {
        // Override in subclasses
        return false;
    }

    /**
     * Get interaction text
     * @returns {string}
     */
    getInteractionText() {
        return this.name;
    }

    /**
     * Mark entity for removal
     */
    remove() {
        this.markedForRemoval = true;
        this.active = false;
    }

    /**
     * Serialize entity data for saving
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            tileX: this.tileX,
            tileY: this.tileY,
            name: this.name,
            sprite: this.sprite,
            interactable: this.interactable
        };
    }

    /**
     * Deserialize entity data
     * @param {Object} data
     */
    deserialize(data) {
        this.id = data.id || this.id;
        this.type = data.type || this.type;
        this.setPosition(data.tileX || 0, data.tileY || 0);
        this.name = data.name || this.name;
        this.sprite = data.sprite || this.sprite;
        this.interactable = data.interactable !== undefined ? data.interactable : this.interactable;
    }
}

