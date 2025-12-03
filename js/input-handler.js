/**
 * Input Handler - Manages keyboard and mouse input
 */
class InputHandler {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        this.mouse = {
            x: 0,
            y: 0,
            buttons: {}
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keysPressed[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Prevent default for arrow keys and WASD
        window.addEventListener('keydown', (e) => {
            const preventKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
            if (preventKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });

        // Mouse events
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
        });
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key to check (e.g., 'w', 'arrowup')
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    /**
     * Check if a key was just pressed (only true once per press)
     * @param {string} key - Key to check
     * @returns {boolean}
     */
    wasKeyPressed(key) {
        const pressed = this.keysPressed[key.toLowerCase()] || false;
        if (pressed) {
            this.keysPressed[key.toLowerCase()] = false;  // Reset
        }
        return pressed;
    }

    /**
     * Get movement direction from pressed keys
     * @returns {number|null} Direction (0=down, 1=left, 2=right, 3=up) or null
     */
    getMovementDirection() {
        // Arrow keys or WASD
        if (this.isKeyPressed('arrowdown') || this.isKeyPressed('s')) {
            return 0;  // Down
        }
        if (this.isKeyPressed('arrowleft') || this.isKeyPressed('a')) {
            return 1;  // Left
        }
        if (this.isKeyPressed('arrowright') || this.isKeyPressed('d')) {
            return 2;  // Right
        }
        if (this.isKeyPressed('arrowup') || this.isKeyPressed('w')) {
            return 3;  // Up
        }
        return null;
    }

    /**
     * Clear all key states
     */
    clear() {
        this.keys = {};
        this.keysPressed = {};
    }
}

