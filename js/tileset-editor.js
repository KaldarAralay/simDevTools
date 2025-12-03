/**
 * Tileset Editor - Handles the tileset editing interface
 */
class TilesetEditor {
    constructor(tilesetManager) {
        this.tilesetManager = tilesetManager;
        this.canvas = document.getElementById('tileset-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tileset selection
        document.getElementById('tileset-select').addEventListener('change', (e) => {
            this.tilesetManager.selectedTileset = e.target.value;
            
            // Set default tile size for character sprites
            if (e.target.value === 'character') {
                document.getElementById('tile-width').value = 32;
                document.getElementById('tile-height').value = 48;
                this.tilesetManager.tileSize = { width: 32, height: 48 };
            } else {
                // Default to 32x32 for other tilesets (terrain, furniture, interior)
                document.getElementById('tile-width').value = 32;
                document.getElementById('tile-height').value = 32;
                this.tilesetManager.tileSize = { width: 32, height: 32 };
            }
            
            // Show status if tileset is not loaded
            const isLoaded = this.tilesetManager.tilesets[e.target.value] !== null;
            if (!isLoaded) {
                console.warn(`Tileset ${e.target.value} is not loaded. Please load it from the resources folder or upload manually.`);
            }
            
            this.refresh();
        });

        // File upload
        document.getElementById('tileset-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const tilesetName = this.tilesetManager.selectedTileset;
                try {
                    await this.tilesetManager.loadTilesetImage(tilesetName, file);
                    // Update selector to show loaded status
                    const option = document.querySelector(`#tileset-select option[value="${tilesetName}"]`);
                    if (option && !option.textContent.includes('✓')) {
                        option.textContent = option.textContent + ' ✓';
                    }
                    this.refresh();
                } catch (error) {
                    console.error('Error loading tileset:', error);
                    alert('Failed to load tileset image');
                }
            }
        });

        // Settings
        document.getElementById('apply-settings').addEventListener('click', () => {
            this.applySettings();
        });

        // Export
        document.getElementById('export-tileset').addEventListener('click', () => {
            this.exportTileset();
        });

        // Canvas click - select tile
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.selectTile(x, y);
        });

        // Clear selection
        document.getElementById('clear-selection').addEventListener('click', () => {
            this.tilesetManager.selectedTile = null;
            this.refresh();
            this.updateTileInfo();
        });

        // Save tile
        document.getElementById('save-tile').addEventListener('click', () => {
            this.saveTileData();
        });
    }

    applySettings() {
        const tileWidth = parseInt(document.getElementById('tile-width').value);
        const tileHeight = parseInt(document.getElementById('tile-height').value);
        const gridCols = parseInt(document.getElementById('grid-cols').value);
        const gridRows = parseInt(document.getElementById('grid-rows').value);

        this.tilesetManager.tileSize = { width: tileWidth, height: tileHeight };
        this.tilesetManager.gridSize = { cols: gridCols, rows: gridRows };

        this.refresh();
    }

    selectTile(pixelX, pixelY) {
        const tile = this.tilesetManager.getTileAtPixel(pixelX, pixelY);
        if (tile) {
            this.tilesetManager.selectedTile = tile;
            this.refresh();
            this.updateTileInfo();
            
            // Dispatch event for tile selection
            window.dispatchEvent(new CustomEvent('tileSelected', {
                detail: { tile: tile }
            }));
        }
    }

    updateTileInfo() {
        const infoDiv = document.getElementById('tile-info');
        const tile = this.tilesetManager.selectedTile;

        if (tile) {
            infoDiv.innerHTML = `
                <p><strong>Tileset:</strong> ${tile.tileset}</p>
                <p><strong>Position:</strong> (${tile.x}, ${tile.y})</p>
                <p><strong>Pixel:</strong> (${tile.pixelX}, ${tile.pixelY})</p>
                <p><strong>Size:</strong> ${tile.width}x${tile.height}</p>
            `;
        } else {
            infoDiv.innerHTML = '<p>No tile selected</p>';
        }
    }

    refresh() {
        this.tilesetManager.drawTilesetGrid(this.canvas);
        this.updateTileInfo();
    }

    /**
     * Refresh when tilesets are loaded
     */
    onTilesetsLoaded() {
        // Update tileset selector to show loaded status
        const selector = document.getElementById('tileset-select');
        const tilesets = ['terrain', 'furniture', 'interior', 'character'];
        
        tilesets.forEach(tilesetName => {
            const option = selector.querySelector(`option[value="${tilesetName}"]`);
            if (option) {
                const isLoaded = this.tilesetManager.tilesets[tilesetName] !== null;
                if (isLoaded) {
                    option.textContent = option.textContent.replace(' ✓', '') + ' ✓';
                }
            }
        });

        // Auto-select first loaded tileset if current one isn't loaded
        if (!this.tilesetManager.tilesets[this.tilesetManager.selectedTileset]) {
            const firstLoaded = tilesets.find(name => this.tilesetManager.tilesets[name]);
            if (firstLoaded) {
                this.tilesetManager.selectedTileset = firstLoaded;
                selector.value = firstLoaded;
                
                // Apply correct tile size for character tileset
                if (firstLoaded === 'character') {
                    document.getElementById('tile-width').value = 32;
                    document.getElementById('tile-height').value = 48;
                    this.tilesetManager.tileSize = { width: 32, height: 48 };
                } else {
                    document.getElementById('tile-width').value = 32;
                    document.getElementById('tile-height').value = 32;
                    this.tilesetManager.tileSize = { width: 32, height: 32 };
                }
            }
        }
        
        this.refresh();
    }

    exportTileset() {
        const data = this.tilesetManager.exportTilesetData();
        if (!data) {
            alert('No tileset loaded');
            return;
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.tilesetManager.selectedTileset}-tileset.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    saveTileData() {
        const tile = this.tilesetManager.selectedTile;
        if (!tile) {
            alert('No tile selected');
            return;
        }

        // In a real implementation, this would save to a database or file
        console.log('Tile data:', tile);
        alert(`Tile data saved:\nTileset: ${tile.tileset}\nPosition: (${tile.x}, ${tile.y})`);
    }

    show() {
        this.refresh();
    }
}

