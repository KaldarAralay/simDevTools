/**
 * Character - Represents a playable or NPC character
 */
class Character {
    constructor(x = 0, y = 0) {
        this.tileX = x;  // Current tile position
        this.tileY = y;
        this.pixelX = x * 32;  // Current pixel position (for smooth movement)
        this.pixelY = y * 32;
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;
        
        this.direction = 0;  // 0=down, 1=left, 2=right, 3=up
        this.animationFrame = 0;  // 0-3 for walking animation
        this.isMoving = false;
        this.moveSpeed = 1.2;  // Pixels per frame (slower to show all animation frames)
        
        this.lastAnimationTime = 0;
        this.animationSpeed = 80;  // Milliseconds per frame (faster cycling to see all frames)
        
        // Character sprite data
        this.tileset = 'character';
        this.spriteWidth = 32;
        this.spriteHeight = 48;  // Character sprites are taller than tiles
    }

    /**
     * Get the current sprite tile coordinates
     * @returns {Object} Tile coordinates {x, y}
     */
    getSpriteTile() {
        // Row is direction (0=down, 1=left, 2=right, 3=up)
        // Column is animation frame (0-3)
        return {
            x: this.animationFrame,
            y: this.direction
        };
    }

    /**
     * Update character position and animation
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        // Handle movement
        if (this.isMoving) {
            const dx = this.targetPixelX - this.pixelX;
            const dy = this.targetPixelY - this.pixelY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.moveSpeed) {
                // Reached target
                this.pixelX = this.targetPixelX;
                this.pixelY = this.targetPixelY;
                this.tileX = Math.floor(this.pixelX / 32);
                this.tileY = Math.floor(this.pixelY / 32);
                this.isMoving = false;
                this.animationFrame = 0;  // Reset to idle frame
            } else {
                // Move towards target
                const moveX = (dx / distance) * this.moveSpeed;
                const moveY = (dy / distance) * this.moveSpeed;
                this.pixelX += moveX;
                this.pixelY += moveY;
            }
        }

        // Update animation - cycle through all 4 frames while moving
        if (this.isMoving) {
            const currentTime = Date.now();
            if (currentTime - this.lastAnimationTime > this.animationSpeed) {
                // Cycle through frames 0, 1, 2, 3, then back to 0
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.lastAnimationTime = currentTime;
            }
        } else {
            // When not moving, show idle frame (frame 0)
            this.animationFrame = 0;
        }
    }

    /**
     * Move character in a direction
     * @param {number} direction - 0=down, 1=left, 2=right, 3=up
     * @param {Function} canMoveTo - Callback to check if movement is allowed
     */
    move(direction, canMoveTo = null) {
        if (this.isMoving) return;  // Already moving
        
        this.direction = direction;
        
        let newTileX = this.tileX;
        let newTileY = this.tileY;
        
        switch (direction) {
            case 0: // Down
                newTileY += 1;
                break;
            case 1: // Left
                newTileX -= 1;
                break;
            case 2: // Right
                newTileX += 1;
                break;
            case 3: // Up
                newTileY -= 1;
                break;
        }
        
        // Check if movement is allowed
        if (canMoveTo && !canMoveTo(newTileX, newTileY)) {
            return;
        }
        
        // Start movement
        this.targetPixelX = newTileX * 32;
        this.targetPixelY = newTileY * 32;
        this.isMoving = true;
        this.animationFrame = 0;  // Start from frame 0 to cycle through all frames
        this.lastAnimationTime = Date.now();
    }

    /**
     * Set character position directly
     * @param {number} x - Tile X position
     * @param {number} y - Tile Y position
     */
    setPosition(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.pixelX = x * 32;
        this.pixelY = y * 32;
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;
        this.isMoving = false;
    }

    /**
     * Get pixel position for rendering
     * @returns {Object} {x, y} pixel coordinates
     */
    getPixelPosition() {
        return {
            x: this.pixelX,
            y: this.pixelY
        };
    }
}

