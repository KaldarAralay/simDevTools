/**
 * Tileset Manager - Handles loading and managing tileset data
 */
class TilesetManager {
    constructor() {
        this.tilesets = {
            terrain: null,
            furniture: null,
            interior: null,
            character: null
        };
        this.tileSize = { width: 32, height: 32 };
        this.gridSize = { cols: 4, rows: 4 };
        this.selectedTileset = 'terrain';
        this.selectedTile = null;
    }

    /**
     * Load a tileset image from a File object
     * @param {string} tilesetName - Name of the tileset (terrain, furniture, character, interior)
     * @param {File} imageFile - The image file to load
     * @returns {Promise<Image>}
     */
    async loadTilesetImage(tilesetName, imageFile) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.tilesets[tilesetName] = {
                    image: img,
                    name: tilesetName,
                    width: img.width,
                    height: img.height
                };
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(imageFile);
        });
    }

    /**
     * Load a tileset image from a URL/path
     * @param {string} tilesetName - Name of the tileset
     * @param {string} imageUrl - URL or path to the image
     * @returns {Promise<Image>}
     */
    async loadTilesetFromUrl(tilesetName, imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.tilesets[tilesetName] = {
                    image: img,
                    name: tilesetName,
                    width: img.width,
                    height: img.height
                };
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load tileset ${tilesetName} from ${imageUrl}`);
                reject(new Error(`Failed to load ${tilesetName} tileset`));
            };
            img.src = imageUrl;
        });
    }

    /**
     * Load all default tilesets from resources folder
     * @returns {Promise<void>}
     */
    async loadDefaultTilesets() {
        const tilesetMapping = {
            terrain: 'resources/Terrain.png',
            furniture: 'resources/Misc.png',
            interior: 'resources/Interior.png',
            character: 'resources/Base_Female.png'
        };

        const loadPromises = Object.entries(tilesetMapping).map(async ([name, path]) => {
            try {
                await this.loadTilesetFromUrl(name, path);
                console.log(`Loaded tileset: ${name}`);
            } catch (error) {
                console.warn(`Could not load ${name} tileset:`, error.message);
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * Get a specific tile from a tileset
     * @param {string} tilesetName - Name of the tileset
     * @param {number} tileX - X position in the grid (0-based)
     * @param {number} tileY - Y position in the grid (0-based)
     * @param {Object} customSize - Optional custom size {width, height} for character sprites
     * @returns {Object|null} Tile data or null if not found
     */
    getTile(tilesetName, tileX, tileY, customSize = null) {
        const tileset = this.tilesets[tilesetName];
        if (!tileset) return null;

        const size = customSize || this.tileSize;
        const { width, height } = size;
        const x = tileX * width;
        const y = tileY * height;

        if (x >= tileset.width || y >= tileset.height) return null;

        return {
            tileset: tilesetName,
            x: tileX,
            y: tileY,
            pixelX: x,
            pixelY: y,
            width: width,
            height: height
        };
    }

    /**
     * Get a character sprite (32x48) from the character tileset
     * @param {number} tileX - X position in the grid (0-based)
     * @param {number} tileY - Y position in the grid (0-based)
     * @returns {Object|null} Tile data or null if not found
     */
    getCharacterSprite(tileX, tileY) {
        return this.getTile('character', tileX, tileY, { width: 32, height: 48 });
    }

    /**
     * Draw a tile to a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} tile - Tile data object
     * @param {number} destX - Destination X position
     * @param {number} destY - Destination Y position
     * @param {number} scale - Scale factor (default: 1)
     */
    drawTile(ctx, tile, destX, destY, scale = 1) {
        if (!tile) return;

        const tileset = this.tilesets[tile.tileset];
        if (!tileset) return;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            tileset.image,
            tile.pixelX, tile.pixelY, tile.width, tile.height,
            destX, destY, tile.width * scale, tile.height * scale
        );
    }

    /**
     * Draw the entire tileset grid to a canvas
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    drawTilesetGrid(canvas) {
        const tileset = this.tilesets[this.selectedTileset];
        if (!tileset) {
            canvas.width = 0;
            canvas.height = 0;
            return;
        }

        const ctx = canvas.getContext('2d');
        // Use character sprite size for character tileset, otherwise use tile size
        let { width, height } = this.tileSize;
        if (this.selectedTileset === 'character') {
            width = 32;
            height = 48;
        }
        const { cols, rows } = this.gridSize;

        canvas.width = cols * width;
        canvas.height = rows * height;

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * width, 0);
            ctx.lineTo(x * width, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * height);
            ctx.lineTo(canvas.width, y * height);
            ctx.stroke();
        }

        // Draw tiles
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const srcX = x * width;
                const srcY = y * height;

                if (srcX < tileset.width && srcY < tileset.height) {
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(
                        tileset.image,
                        srcX, srcY, width, height,
                        x * width, y * height, width, height
                    );
                }
            }
        }

        // Reset tile size if we changed it for character tileset
        if (this.selectedTileset === 'character') {
            // Keep the character size for this display
        }

        // Highlight selected tile
        if (this.selectedTile) {
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 2;
            // Use the actual tile size for highlighting
            const tileWidth = this.selectedTileset === 'character' ? 32 : width;
            const tileHeight = this.selectedTileset === 'character' ? 48 : height;
            ctx.strokeRect(
                this.selectedTile.x * tileWidth,
                this.selectedTile.y * tileHeight,
                tileWidth,
                tileHeight
            );
        }
    }

    /**
     * Get tile at pixel coordinates
     * @param {number} pixelX - Pixel X coordinate
     * @param {number} pixelY - Pixel Y coordinate
     * @returns {Object|null} Tile data or null
     */
    getTileAtPixel(pixelX, pixelY) {
        // Use character sprite size for character tileset
        let { width, height } = this.tileSize;
        if (this.selectedTileset === 'character') {
            width = 32;
            height = 48;
        }
        const tileX = Math.floor(pixelX / width);
        const tileY = Math.floor(pixelY / height);
        
        // Use custom size for character tileset
        if (this.selectedTileset === 'character') {
            return this.getCharacterSprite(tileX, tileY);
        }
        return this.getTile(this.selectedTileset, tileX, tileY);
    }

    /**
     * Export tileset data as JSON
     * @returns {Object} Tileset data
     */
    exportTilesetData() {
        const tileset = this.tilesets[this.selectedTileset];
        if (!tileset) return null;

        return {
            name: this.selectedTileset,
            tileSize: this.tileSize,
            gridSize: this.gridSize,
            imageWidth: tileset.width,
            imageHeight: tileset.height,
            tiles: []
        };
    }
}

