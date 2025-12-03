/**
 * Item Entity - Represents collectible or interactive items
 */
class Item extends Entity {
    constructor(x = 0, y = 0, name = 'Item') {
        super(x, y, 'item');
        this.name = name;
        this.interactable = true;
        
        // Item properties
        this.itemType = 'collectible'; // 'collectible', 'container', 'door', etc.
        this.stackable = false;
        this.quantity = 1;
        
        // Sprite
        this.sprite = null; // Should be set when creating item
        
        // Visual effects
        this.bobbing = true; // Bob up and down
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
        this.bobAmount = 2;
    }

    /**
     * Update item animation
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.active) return;

        // Bobbing animation
        if (this.bobbing) {
            this.bobOffset = Math.sin(Date.now() * this.bobSpeed) * this.bobAmount;
        }
    }

    /**
     * Get pixel position with bobbing offset
     * @returns {Object} {x, y}
     */
    getPixelPosition() {
        return {
            x: this.pixelX,
            y: this.pixelY + this.bobOffset
        };
    }

    /**
     * Handle interaction (pick up item)
     * @param {Entity} interactor
     * @returns {boolean}
     */
    onInteract(interactor) {
        if (this.itemType === 'collectible') {
            // Item is collected
            console.log(`Collected: ${this.name} x${this.quantity}`);
            this.remove();
            return true;
        }
        return false;
    }

    /**
     * Set item sprite
     * @param {string} tileset
     * @param {number} tileX
     * @param {number} tileY
     */
    setSprite(tileset, tileX, tileY) {
        this.sprite = {
            tileset: tileset,
            tileX: tileX,
            tileY: tileY
        };
    }

    /**
     * Serialize item data
     * @returns {Object}
     */
    serialize() {
        const data = super.serialize();
        data.itemType = this.itemType;
        data.quantity = this.quantity;
        return data;
    }
}

