/**
 * Map Renderer - Handles rendering the game map with tiles
 */
class MapRenderer {
    constructor(tilesetManager) {
        this.tilesetManager = tilesetManager;
        this.canvas = document.getElementById('map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.map = null;
        this.mapWidth = 20;
        this.mapHeight = 20;
        this.tileSize = 32;
        this.zoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.selectedTile = null;
        this.activeLayer = 'ground'; // Layer to place tiles on
        this.layers = {
            ground: true,
            items: true,
            characters: true
        };

        // Character system
        this.player = null;
        this.inputHandler = null;
        this.gameMode = false;  // false = edit mode, true = play mode
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.cameraFollowsPlayer = true;

        // Entity system
        this.entityManager = new EntityManager();
        this.selectedEntityType = 'npc'; // 'npc', 'item'
        this.selectedItemDef = null; // Selected item definition for placement
        this.customItemSprite = null; // Custom sprite override {tileset, tileX, tileY}
        this.selectedNPC = null; // Currently selected NPC for viewing details

        this.initializeMap();
        this.initializeEventListeners();
    }

    initializeMap() {
        this.map = {
            ground: [],
            items: [],
            characters: []
        };

        // Initialize empty map
        for (let y = 0; y < this.mapHeight; y++) {
            this.map.ground[y] = [];
            this.map.items[y] = [];
            this.map.characters[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map.ground[y][x] = null;
                this.map.items[y][x] = null;
                this.map.characters[y][x] = null;
            }
        }

        this.updateCanvasSize();
    }

    initializeEventListeners() {
        // Map size
        document.getElementById('create-map').addEventListener('click', () => {
            this.createNewMap();
        });

        // Active layer selection
        document.querySelectorAll('input[name="active-layer"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.activeLayer = e.target.value;
                }
            });
        });

        // Layer visibility
        document.getElementById('show-ground').addEventListener('change', (e) => {
            this.layers.ground = e.target.checked;
            this.render();
        });

        document.getElementById('show-items').addEventListener('change', (e) => {
            this.layers.items = e.target.checked;
            this.render();
        });

        document.getElementById('show-characters').addEventListener('change', (e) => {
            this.layers.characters = e.target.checked;
            this.render();
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.zoom = Math.min(this.zoom + 0.1, 3.0);
            this.updateZoomDisplay();
            this.render();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.zoom = Math.max(this.zoom - 0.1, 0.5);
            this.updateZoomDisplay();
            this.render();
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            this.zoom = 1.0;
            this.offsetX = 0;
            this.offsetY = 0;
            this.updateZoomDisplay();
            this.render();
        });

        // Canvas interaction
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const tilePos = this.getTileAtMousePosition(e.clientX, e.clientY);
            if (tilePos) {
                this.removeTile(tilePos.x, tilePos.y);
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            if (!this.gameMode) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.zoom = Math.max(0.5, Math.min(3.0, this.zoom + delta));
                this.updateZoomDisplay();
                this.render();
            }
        });

        // Game mode toggle (initialize after DOM is ready)
        const toggleButton = document.getElementById('toggle-game-mode');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleGameMode();
            });
        }

        // Spawn player button
        const spawnButton = document.getElementById('spawn-player');
        if (spawnButton) {
            spawnButton.addEventListener('click', () => {
                this.spawnPlayer();
            });
        }

        // Entity controls
        const entityTypeSelect = document.getElementById('entity-type-select');
        const itemDefContainer = document.getElementById('item-def-container');
        
        entityTypeSelect.addEventListener('change', (e) => {
            this.selectedEntityType = e.target.value;
            itemDefContainer.style.display = e.target.value === 'item' ? 'block' : 'none';
        });

        document.getElementById('spawn-entity').addEventListener('click', () => {
            this.spawnEntity();
        });

        document.getElementById('select-item-mode').addEventListener('click', () => {
            this.enterItemPlacementMode();
        });

        document.getElementById('preview-item-sprite').addEventListener('click', () => {
            this.previewItemSprite();
        });

        document.getElementById('item-sprite-tileset').addEventListener('change', () => {
            this.updateItemSpritePreview();
        });

        document.getElementById('item-sprite-x').addEventListener('input', () => {
            this.updateItemSpritePreview();
        });

        document.getElementById('item-sprite-y').addEventListener('input', () => {
            this.updateItemSpritePreview();
        });

        document.getElementById('clear-item-selection').addEventListener('click', () => {
            this.clearItemSelection();
        });

        document.getElementById('clear-entities').addEventListener('click', () => {
            this.clearEntities();
        });

        // Update NPC stats display periodically
        setInterval(() => {
            this.updateNPCStats();
            this.updateActivityConsole();
        }, 500);

        // Time system controls
        document.getElementById('pause-time').addEventListener('click', () => {
            this.toggleTimePause();
        });

        document.getElementById('speed-time').addEventListener('click', () => {
            this.cycleTimeSpeed();
        });

        // Console controls
        document.getElementById('clear-console').addEventListener('click', () => {
            this.clearActivityConsole();
        });

        // Make canvas focusable for keyboard input
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.addEventListener('click', () => {
            if (this.gameMode) {
                this.canvas.focus();
            }
        });
    }

    createNewMap() {
        const width = parseInt(document.getElementById('map-width').value);
        const height = parseInt(document.getElementById('map-height').value);

        this.mapWidth = width;
        this.mapHeight = height;
        this.initializeMap();
        this.render();
    }

    updateCanvasSize() {
        const scaledTileSize = this.tileSize * this.zoom;
        this.canvas.width = this.mapWidth * scaledTileSize;
        this.canvas.height = this.mapHeight * scaledTileSize;
    }

    getTileAtMousePosition(mouseX, mouseY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = mouseX - rect.left;
        const y = mouseY - rect.top;

        const tileX = Math.floor((x - this.offsetX) / (this.tileSize * this.zoom));
        const tileY = Math.floor((y - this.offsetY) / (this.tileSize * this.zoom));

        if (tileX >= 0 && tileX < this.mapWidth && tileY >= 0 && tileY < this.mapHeight) {
            return { x: tileX, y: tileY };
        }
        return null;
    }

    handleMouseDown(e) {
        // In game mode, don't handle map editing
        if (this.gameMode) {
            this.canvas.focus();  // Ensure canvas has focus for keyboard input
            return;
        }

        const tilePos = this.getTileAtMousePosition(e.clientX, e.clientY);

        // Left click handling
        if (e.button === 0) {
            if (tilePos) {
                // Priority: Item placement > NPC selection > Tile placement > Tile selection
                if (this.selectedItemDef) {
                    // Place functional item
                    this.placeFunctionalItem(tilePos.x, tilePos.y);
                    return;
                } else if (this.selectedTile) {
                    // In edit mode, place tile
                    this.placeTile(tilePos.x, tilePos.y);
                    return;
                } else {
                    // Check for NPC at this position
                    const entities = this.entityManager.getAtPosition(tilePos.x, tilePos.y);
                    const npc = entities.find(e => e.type === 'npc');
                    if (npc) {
                        this.selectNPC(npc);
                        return;
                    }
                    
                    // Select tile from map
                    this.selectMapTile(tilePos.x, tilePos.y);
                    return;
                }
            } else {
                // No tile position - start dragging if no selection
                if (!this.selectedTile && !this.selectedItemDef) {
                    this.isDragging = true;
                    this.dragStartX = e.clientX - this.offsetX;
                    this.dragStartY = e.clientY - this.offsetY;
                }
            }
        } else if (e.button === 1) {
            // Middle mouse button - always allow dragging
            if (!tilePos) {
                this.isDragging = true;
                this.dragStartX = e.clientX - this.offsetX;
                this.dragStartY = e.clientY - this.offsetY;
            }
        }
    }

    handleMouseMove(e) {
        if (this.isDragging && !this.gameMode) {
            this.offsetX = e.clientX - this.dragStartX;
            this.offsetY = e.clientY - this.dragStartY;
            this.render();
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    placeTile(mapX, mapY) {
        if (!this.selectedTile) {
            // If no tile selected, try to select from map
            this.selectMapTile(mapX, mapY);
            return;
        }

        // Use the active layer for placement
        const layer = this.activeLayer;

        // Only place if layer is visible
        if (this.layers[layer]) {
            this.map[layer][mapY][mapX] = {
                tileset: this.selectedTile.tileset,
                tileX: this.selectedTile.x,
                tileY: this.selectedTile.y
            };
            this.render();
        }
    }

    removeTile(mapX, mapY) {
        // Remove tile from the active layer
        if (this.map[this.activeLayer][mapY][mapX]) {
            this.map[this.activeLayer][mapY][mapX] = null;
            this.render();
        }
    }

    selectMapTile(mapX, mapY) {
        // Select tile from map for editing
        const tile = this.map.ground[mapY][mapX] || 
                    this.map.items[mapY][mapX] || 
                    this.map.characters[mapY][mapX];
        
        if (tile) {
            this.selectedTile = this.tilesetManager.getTile(tile.tileset, tile.tileX, tile.tileY);
            this.updateSelectedTilePreview();
        }
    }

    getActiveLayer() {
        if (this.layers.ground) return 'ground';
        if (this.layers.items) return 'items';
        if (this.layers.characters) return 'characters';
        return 'ground';
    }

    setSelectedTile(tile) {
        this.selectedTile = tile;
        this.updateSelectedTilePreview();
    }

    updateSelectedTilePreview() {
        const previewCanvas = document.getElementById('selected-tile-preview');
        const previewCtx = previewCanvas.getContext('2d');
        const nameDisplay = document.getElementById('selected-tile-name');

        previewCtx.fillStyle = '#2a2a2a';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        if (this.selectedTile) {
            this.tilesetManager.drawTile(previewCtx, this.selectedTile, 0, 0);
            nameDisplay.textContent = `${this.selectedTile.tileset} (${this.selectedTile.x}, ${this.selectedTile.y})`;
        } else {
            nameDisplay.textContent = 'None';
        }
    }

    render() {
        this.updateCanvasSize();
        const ctx = this.ctx;
        const scaledTileSize = this.tileSize * this.zoom;

        // Clear canvas
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update camera to follow player
        if (this.gameMode && this.cameraFollowsPlayer && this.player) {
            this.updateCamera();
        }

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);

        // Draw grid (only in edit mode)
        if (!this.gameMode) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            for (let x = 0; x <= this.mapWidth; x++) {
                ctx.beginPath();
                ctx.moveTo(x * scaledTileSize, 0);
                ctx.lineTo(x * scaledTileSize, this.mapHeight * scaledTileSize);
                ctx.stroke();
            }
            for (let y = 0; y <= this.mapHeight; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * scaledTileSize);
                ctx.lineTo(this.mapWidth * scaledTileSize, y * scaledTileSize);
                ctx.stroke();
            }
        }

        // Draw layers
        if (this.layers.ground) {
            this.renderLayer('ground', scaledTileSize);
        }
        if (this.layers.items) {
            this.renderLayer('items', scaledTileSize);
        }
        if (this.layers.characters) {
            this.renderLayer('characters', scaledTileSize);
        }

        // Draw player character
        if (this.player && this.layers.characters) {
            this.renderCharacter(this.player, scaledTileSize);
        }

        // Draw entities
        if (this.layers.items || this.layers.characters) {
            this.renderEntities(scaledTileSize);
        }

        ctx.restore();
    }

    renderEntities(scaledTileSize) {
        const entities = this.entityManager.getAll();
        
        for (const entity of entities) {
            if (!entity.visible || !entity.active) continue;
            
            // Determine which layer to render on
            if (entity.layer === 'items' && !this.layers.items) continue;
            if (entity.layer === 'characters' && !this.layers.characters) continue;
            
            this.renderEntity(entity, scaledTileSize);
        }
    }

    renderEntity(entity, scaledTileSize) {
        if (!entity.sprite) return;
        
        const pos = entity.getPixelPosition();
        const tilesetManager = this.tilesetManager;
        
        // Handle different entity types
        if (entity.type === 'npc' && entity.getSpriteTile) {
            // NPC with animation
            const spriteTile = entity.getSpriteTile();
            const sprite = tilesetManager.getCharacterSprite(spriteTile.x, spriteTile.y);
            if (sprite) {
                const renderY = (pos.y * this.zoom) - (16 * this.zoom);
                tilesetManager.drawTile(
                    this.ctx,
                    sprite,
                    pos.x * this.zoom,
                    renderY,
                    this.zoom
                );
            }
        } else if (entity.type === 'functional' || entity.type === 'item') {
            // Functional item or regular item with sprite
            const tile = tilesetManager.getTile(
                entity.sprite.tileset,
                entity.sprite.tileX,
                entity.sprite.tileY,
                { width: 32, height: 32 }
            );
            
            if (tile) {
                // Show visual indicator if item is in use
                if (entity.inUse) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.6;
                }
                
                tilesetManager.drawTile(
                    this.ctx,
                    tile,
                    pos.x * this.zoom,
                    pos.y * this.zoom,
                    this.zoom
                );
                
                if (entity.inUse) {
                    this.ctx.restore();
                    
                    // Draw progress indicator
                    const progress = entity.useTime / entity.maxUseTime;
                    const barWidth = 32 * this.zoom;
                    const barHeight = 4 * this.zoom;
                    const barX = pos.x * this.zoom;
                    const barY = (pos.y * this.zoom) - (8 * this.zoom);
                    
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(barX, barY, barWidth, barHeight);
                    this.ctx.fillStyle = '#4a9eff';
                    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                }
            }
        }
    }

    renderCharacter(character, scaledTileSize) {
        const spriteTile = character.getSpriteTile();
        // Use getCharacterSprite to get 32x48 sprite instead of 32x32 tile
        const sprite = this.tilesetManager.getCharacterSprite(spriteTile.x, spriteTile.y);
        
        if (sprite) {
            const pos = character.getPixelPosition();
            // Offset Y position so character appears to stand on the tile
            // Character is 48px tall, tile is 32px, so offset by -16px
            const renderY = (pos.y * this.zoom) - (16 * this.zoom);
            
            this.tilesetManager.drawTile(
                this.ctx,
                sprite,
                pos.x * this.zoom,
                renderY,
                this.zoom
            );
        }
    }

    updateCamera() {
        if (!this.player) return;

        const pos = this.player.getPixelPosition();
        const scaledTileSize = this.tileSize * this.zoom;
        
        // Center camera on player (account for character height offset)
        const targetOffsetX = (this.canvas.width / 2) - (pos.x * this.zoom);
        // Offset Y to center on character sprite center (not tile center)
        const targetOffsetY = (this.canvas.height / 2) - (pos.y * this.zoom) + (8 * this.zoom);

        // Smooth camera movement
        this.offsetX += (targetOffsetX - this.offsetX) * 0.1;
        this.offsetY += (targetOffsetY - this.offsetY) * 0.1;

        // Clamp camera to map bounds
        const maxOffsetX = 0;
        const minOffsetX = this.canvas.width - (this.mapWidth * scaledTileSize);
        const maxOffsetY = 0;
        const minOffsetY = this.canvas.height - (this.mapHeight * scaledTileSize);

        this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.offsetX));
        this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.offsetY));
    }

    renderLayer(layerName, scaledTileSize) {
        const layer = this.map[layerName];
        if (!layer) return;

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileData = layer[y][x];
                if (tileData) {
                    // Get tile with correct size - always use 32x32 for non-character tilesets
                    let tile;
                    if (tileData.tileset === 'character') {
                        tile = this.tilesetManager.getCharacterSprite(tileData.tileX, tileData.tileY);
                    } else {
                        // Force 32x32 for all other tilesets (terrain, furniture, interior)
                        tile = this.tilesetManager.getTile(tileData.tileset, tileData.tileX, tileData.tileY, { width: 32, height: 32 });
                    }
                    
                    if (tile) {
                        // Ensure tiles are rendered at exact tile boundaries (no sub-pixel positioning)
                        const renderX = x * scaledTileSize;
                        const renderY = y * scaledTileSize;
                        this.tilesetManager.drawTile(
                            this.ctx,
                            tile,
                            renderX,
                            renderY,
                            this.zoom
                        );
                    }
                }
            }
        }
    }

    updateZoomDisplay() {
        document.getElementById('zoom-level').textContent = `${this.zoom.toFixed(1)}x`;
    }

    show() {
        this.updateEntityCount();
        // Start game loop if not already running
        if (!this.animationFrameId) {
            this.startGameLoop();
        }
        this.updateActivityConsole();
        this.render();
    }

    // Character and game mode methods
    spawnPlayer(x = null, y = null) {
        if (x === null) x = Math.floor(this.mapWidth / 2);
        if (y === null) y = Math.floor(this.mapHeight / 2);

        this.player = new Character(x, y);
        
        if (!this.inputHandler) {
            this.inputHandler = new InputHandler();
        }

        // Center camera on player
        const pos = this.player.getPixelPosition();
        const scaledTileSize = this.tileSize * this.zoom;
        this.offsetX = (this.canvas.width / 2) - (pos.x * this.zoom);
        this.offsetY = (this.canvas.height / 2) - (pos.y * this.zoom);

        this.render();
    }

    toggleGameMode() {
        this.gameMode = !this.gameMode;
        const button = document.getElementById('toggle-game-mode');
        const statusText = document.getElementById('game-mode-status');
        
        if (this.gameMode) {
            // Ensure player exists
            if (!this.player) {
                this.spawnPlayer();
            }
            
            button.textContent = 'Exit Play Mode';
            button.style.background = '#ff4444';
            if (statusText) statusText.textContent = 'Play Mode - Use WASD/Arrow Keys';
            
            // Focus canvas for keyboard input
            this.canvas.focus();
            this.startGameLoop();
        } else {
            button.textContent = 'Enter Play Mode';
            button.style.background = '#4a9eff';
            if (statusText) statusText.textContent = 'Edit Mode';
            // Don't stop game loop - keep it running for time/entity updates
        }
    }

    startGameLoop() {
        // Always run game loop for time/entity updates, even in edit mode
        if (this.animationFrameId) return;
        
        this.lastFrameTime = performance.now();
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            this.update(deltaTime);
            this.render();

            // Always continue loop (entities and time need to update)
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        this.animationFrameId = requestAnimationFrame(gameLoop);
    }

    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    update(deltaTime) {
        // Update time system (always, even in edit mode)
        if (window.timeSystem) {
            window.timeSystem.update(deltaTime);
            this.updateTimeDisplay();
        }

        // Update entities (always, so NPCs can manage needs)
        this.entityManager.update(deltaTime);

        if (!this.player || !this.inputHandler) return;

        // Update character
        this.player.update(deltaTime);

        // Handle input
        const direction = this.inputHandler.getMovementDirection();
        if (direction !== null && !this.player.isMoving) {
            this.player.move(direction, (x, y) => {
                // Collision check - can be expanded later
                return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
            });
        }
    }

    canMoveTo(x, y) {
        // Basic bounds check
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return false;
        }

        // Check for blocking tiles (can be expanded)
        // For now, allow movement anywhere within bounds
        return true;
    }

    // Entity management methods
    spawnEntity(x = null, y = null) {
        if (x === null) x = Math.floor(this.mapWidth / 2);
        if (y === null) y = Math.floor(this.mapHeight / 2);
        
        let entity;
        
        if (this.selectedEntityType === 'npc') {
            entity = new NPC(x, y, this.generateNPCName());
            entity.aiType = 'autonomous'; // Autonomous needs-based AI
        } else if (this.selectedEntityType === 'item') {
            // Spawn functional item from selected definition
            const itemDefKey = document.getElementById('item-def-select')?.value || 'apple';
            entity = ItemDefinitions.createItem(itemDefKey, x, y);
            if (!entity) {
                // Fallback to basic item
                entity = new Item(x, y, 'Item');
                entity.setSprite('furniture', 0, 0);
            }
        }
        
        if (entity) {
            this.entityManager.add(entity);
            this.updateEntityCount();
            this.render();
        }
    }

    enterItemPlacementMode() {
        const itemDefKey = document.getElementById('item-def-select')?.value;
        if (!itemDefKey) {
            alert('Please select an item type first');
            return;
        }
        
        this.selectedItemDef = itemDefKey;
        
        // Check for custom sprite
        const customTileset = document.getElementById('item-sprite-tileset').value;
        const customX = parseInt(document.getElementById('item-sprite-x').value);
        const customY = parseInt(document.getElementById('item-sprite-y').value);
        
        if (!isNaN(customX) && !isNaN(customY) && customX >= 0 && customY >= 0) {
            this.customItemSprite = {
                tileset: customTileset,
                tileX: customX,
                tileY: customY
            };
        } else {
            this.customItemSprite = null;
        }
        
        document.getElementById('select-item-mode').style.display = 'none';
        document.getElementById('clear-item-selection').style.display = 'block';
        
        // Update cursor to show placement mode
        this.canvas.style.cursor = 'crosshair';
        
        this.updateItemPlacementPreview();
        
        console.log('Item placement mode active. Click on map to place items.');
    }

    updateItemPlacementPreview() {
        const itemDefKey = this.selectedItemDef;
        const itemDef = ItemDefinitions.getDefinitions()[itemDefKey];
        
        if (!itemDef) return;
        
        const preview = document.getElementById('selected-tile-preview');
        const previewCtx = preview.getContext('2d');
        previewCtx.fillStyle = '#2a2a2a';
        previewCtx.fillRect(0, 0, preview.width, preview.height);
        
        // Use custom sprite if set, otherwise use default
        const sprite = this.customItemSprite || itemDef.sprite;
        
        const tile = this.tilesetManager.getTile(
            sprite.tileset,
            sprite.tileX,
            sprite.tileY,
            { width: 32, height: 32 }
        );
        
        if (tile) {
            this.tilesetManager.drawTile(previewCtx, tile, 0, 0);
        }
        
        document.getElementById('selected-tile-name').textContent = itemDef.name + (this.customItemSprite ? ' (Custom)' : '');
    }

    previewItemSprite() {
        const tileset = document.getElementById('item-sprite-tileset').value;
        const tileX = parseInt(document.getElementById('item-sprite-x').value);
        const tileY = parseInt(document.getElementById('item-sprite-y').value);
        
        if (isNaN(tileX) || isNaN(tileY) || tileX < 0 || tileY < 0) {
            alert('Please enter valid tile coordinates (X and Y)');
            return;
        }
        
        const preview = document.getElementById('item-sprite-preview');
        const previewCtx = preview.getContext('2d');
        previewCtx.fillStyle = '#2a2a2a';
        previewCtx.fillRect(0, 0, preview.width, preview.height);
        
        const tile = this.tilesetManager.getTile(
            tileset,
            tileX,
            tileY,
            { width: 32, height: 32 }
        );
        
        if (tile) {
            this.tilesetManager.drawTile(previewCtx, tile, 0, 0);
        } else {
            alert('Sprite not found. Check tileset and coordinates.');
        }
    }

    updateItemSpritePreview() {
        // Auto-update preview when sprite inputs change
        const tileX = parseInt(document.getElementById('item-sprite-x').value);
        const tileY = parseInt(document.getElementById('item-sprite-y').value);
        
        if (!isNaN(tileX) && !isNaN(tileY) && tileX >= 0 && tileY >= 0) {
            this.previewItemSprite();
        }
    }

    clearItemSelection() {
        this.selectedItemDef = null;
        this.customItemSprite = null;
        document.getElementById('select-item-mode').style.display = 'block';
        document.getElementById('clear-item-selection').style.display = 'none';
        this.canvas.style.cursor = 'crosshair'; // Reset to default
        this.updateSelectedTilePreview();
        console.log('Item placement mode cleared');
    }

    placeFunctionalItem(x, y) {
        if (!this.selectedItemDef) {
            console.warn('No item definition selected');
            return;
        }
        
        // Check map bounds
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            console.warn(`Position out of bounds: (${x}, ${y})`);
            return;
        }
        
        // Check if position is already occupied
        const existing = this.entityManager.getAtPosition(x, y);
        if (existing.length > 0) {
            // Remove existing entity at this position
            existing.forEach(e => this.entityManager.remove(e.id));
        }
        
        const entity = ItemDefinitions.createItem(this.selectedItemDef, x, y);
        if (!entity) {
            console.error('Failed to create item:', this.selectedItemDef);
            return;
        }
        
        // Apply custom sprite if set
        if (this.customItemSprite) {
            entity.setSprite(
                this.customItemSprite.tileset,
                this.customItemSprite.tileX,
                this.customItemSprite.tileY
            );
        }
        
        this.entityManager.add(entity);
        this.updateEntityCount();
        this.render();
        
        console.log(`Placed ${entity.name} at (${x}, ${y})`);
    }

    generateNPCName() {
        const firstNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Kai', 'Logan', 'Noah'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${firstName} ${lastName}`;
    }

    clearEntities() {
        if (confirm('Clear all entities?')) {
            this.entityManager.clear();
            this.updateEntityCount();
            this.render();
        }
    }

    updateEntityCount() {
        const count = this.entityManager.getAll().length;
        document.getElementById('entity-count').textContent = `Entities: ${count}`;
    }

    selectNPC(npc) {
        this.selectedNPC = npc;
        this.updateSelectedNPCInfo();
    }

    updateSelectedNPCInfo() {
        const infoDiv = document.getElementById('selected-npc-info');
        if (!this.selectedNPC || !this.selectedNPC.needs) {
            infoDiv.innerHTML = '<p style="color: #888;">Click an NPC to view details</p>';
            return;
        }

        const npc = this.selectedNPC;
        const needs = npc.needs;
        const needsSystem = npc.needsSystem;
        
        if (!needsSystem) return;
        
        let html = `<div style="margin-bottom: 0.5rem;">`;
        html += `<strong style="color: #4a9eff; font-size: 1rem;">${npc.name}</strong>`;
        html += `<div style="font-size: 0.75rem; color: #b0b0b0; margin-top: 0.25rem;">`;
        html += `Position: (${npc.tileX}, ${npc.tileY})<br>`;
        html += `Social: ${(npc.personality.social * 100).toFixed(0)}% | `;
        html += `Helpful: ${(npc.personality.helpful * 100).toFixed(0)}% | `;
        html += `Active: ${(npc.personality.active * 100).toFixed(0)}%`;
        html += `</div>`;
        html += `</div>`;
        
        // Show needs as bars
        html += `<div style="margin-top: 0.5rem;">`;
        html += `<strong style="font-size: 0.85rem; color: #4a9eff;">Needs:</strong>`;
        for (const [needType, need] of Object.entries(needs)) {
            const config = needsSystem.needTypes[needType];
            if (!config) continue;
            const percentage = (need.value / need.max) * 100;
            const color = percentage > 50 ? config.color : percentage > 20 ? '#ffa500' : '#ff4444';
            
            html += `<div style="margin-top: 0.25rem;">`;
            html += `<span style="font-size: 0.75rem;">${config.icon} ${config.name}: ${percentage.toFixed(0)}%</span>`;
            html += `<div style="background: #555; height: 8px; border-radius: 4px; margin-top: 0.1rem; overflow: hidden;">`;
            html += `<div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>`;
            html += `</div>`;
            html += `</div>`;
        }
        html += `</div>`;
        
        // Show relationships
        if (npc.relationships && npc.relationships.size > 0) {
            html += `<div style="margin-top: 0.5rem;">`;
            html += `<strong style="font-size: 0.85rem; color: #4a9eff;">Relationships:</strong>`;
            const allNPCs = this.entityManager.getByType('npc');
            for (const otherNPC of allNPCs) {
                if (otherNPC.id === npc.id) continue;
                const relValue = npc.getRelationship(otherNPC);
                if (relValue !== 0 || npc.relationships.has(otherNPC.id)) {
                    const status = npc.getRelationshipStatus(relValue);
                    const relColor = relValue > 0 ? '#4a9eff' : relValue < 0 ? '#ff4444' : '#888';
                    html += `<div style="font-size: 0.75rem; margin-top: 0.25rem;">`;
                    html += `<span style="color: ${relColor};">${otherNPC.name}: ${status} (${relValue > 0 ? '+' : ''}${relValue.toFixed(0)})</span>`;
                    html += `</div>`;
                }
            }
            html += `</div>`;
        }
        
        // Show current action
        html += `<div style="margin-top: 0.5rem; font-size: 0.75rem;">`;
        html += `<strong style="color: #4a9eff;">Status:</strong> `;
        if (npc.usingItem && npc.targetItem) {
            html += `<span style="color: #4a9eff;">Using ${npc.targetItem.name}</span>`;
        } else if (npc.isMoving) {
            html += `<span style="color: #4a9eff;">Moving...</span>`;
        } else if (npc.currentGoal) {
            html += `<span style="color: #4a9eff;">Seeking: ${npc.currentGoal.needType}</span>`;
        } else {
            html += `<span style="color: #888;">Idle</span>`;
        }
        html += `</div>`;
        
        infoDiv.innerHTML = html;
    }

    updateNPCStats() {
        const statsList = document.getElementById('npc-stats-list');
        const npcs = this.entityManager.getByType('npc');
        
        if (npcs.length === 0) {
            statsList.innerHTML = '<p style="color: #888;">No NPCs on map</p>';
            return;
        }
        
        let html = '';
        for (const npc of npcs) {
            if (!npc.needs || !npc.needsSystem) continue;
            
            const needs = npc.needs;
            const needsSystem = npc.needsSystem;
            const isSelected = this.selectedNPC && this.selectedNPC.id === npc.id;
            
            html += `<div style="margin-bottom: 0.75rem; padding: 0.5rem; background: ${isSelected ? '#4a4a4a' : '#3a3a3a'}; border-radius: 4px; ${isSelected ? 'border: 2px solid #4a9eff;' : ''} cursor: pointer;" onclick="window.mapRenderer.selectNPC(window.mapRenderer.entityManager.get('${npc.id}'))">`;
            html += `<strong style="color: #4a9eff;">${npc.name}</strong>`;
            
            // Show most urgent need
            const urgentNeed = needsSystem.getMostUrgentNeed(needs);
            if (urgentNeed) {
                const need = needs[urgentNeed];
                const config = needsSystem.needTypes[urgentNeed];
                if (config) {
                    const percentage = (need.value / need.max) * 100;
                    html += `<div style="font-size: 0.7rem; color: #ffa500; margin-top: 0.25rem;">⚠ ${config.name}: ${percentage.toFixed(0)}%</div>`;
                }
            }
            
            // Show current action
            if (npc.usingItem && npc.targetItem) {
                html += `<div style="margin-top: 0.25rem; font-size: 0.7rem; color: #4a9eff;">Using: ${npc.targetItem.name}</div>`;
            } else if (npc.isMoving) {
                html += `<div style="margin-top: 0.25rem; font-size: 0.7rem; color: #4a9eff;">Moving...</div>`;
            }
            
            html += `</div>`;
        }
        
        statsList.innerHTML = html;
        
        // Update selected NPC info if one is selected
        if (this.selectedNPC) {
            this.updateSelectedNPCInfo();
        }
    }

    updateTimeDisplay() {
        if (!window.timeSystem) return;
        
        const timeSystem = window.timeSystem;
        const timeText = document.getElementById('time-text');
        const timeOfDayText = document.getElementById('time-of-day');
        const progressFill = document.getElementById('time-progress-fill');
        
        if (!timeText || !timeOfDayText || !progressFill) return;
        
        timeText.textContent = timeSystem.getFormattedTime();
        
        const timeOfDay = timeSystem.getTimeOfDay();
        const timeOfDayNames = {
            'dawn': 'Dawn',
            'morning': 'Morning',
            'noon': 'Noon',
            'afternoon': 'Afternoon',
            'evening': 'Evening',
            'night': 'Night',
            'midnight': 'Midnight'
        };
        timeOfDayText.textContent = timeOfDayNames[timeOfDay] || 'Day';
        
        const progress = timeSystem.getDayProgress() * 100;
        progressFill.style.width = `${progress}%`;
        
        // Update time progress bar color based on time of day
        if (timeSystem.isNighttime()) {
            progressFill.style.background = '#6b46c1'; // Purple for night
        } else {
            progressFill.style.background = '#4a9eff'; // Blue for day
        }
    }

    toggleTimePause() {
        if (!window.timeSystem) return;
        
        window.timeSystem.setPaused(!window.timeSystem.isPaused);
        const button = document.getElementById('pause-time');
        if (button) {
            button.textContent = window.timeSystem.isPaused ? 'Resume' : 'Pause';
        }
    }

    cycleTimeSpeed() {
        if (!window.timeSystem) return;
        
        const speeds = [1, 2, 5, 10, 30, 60];
        const currentSpeed = window.timeSystem.getTimeScale();
        const currentIndex = speeds.findIndex(s => s >= currentSpeed);
        const nextIndex = currentIndex >= 0 && currentIndex < speeds.length - 1 ? currentIndex + 1 : 0;
        const nextSpeed = speeds[nextIndex];
        
        window.timeSystem.setTimeScale(nextSpeed);
        const button = document.getElementById('speed-time');
        if (button) {
            button.textContent = `Speed: ${nextSpeed}x`;
        }
    }

    updateActivityConsole() {
        if (!window.activityLogger) return;
        
        const consoleContent = document.getElementById('console-content');
        if (!consoleContent) return;
        
        const entries = window.activityLogger.entries;
        
        if (entries.length === 0) {
            consoleContent.innerHTML = '<p class="console-message info">Waiting for activity...</p>';
            return;
        }
        
        let html = '';
        // Show last 20 entries (most recent at bottom)
        const recentEntries = entries.slice(-20);
        
        for (const entry of recentEntries) {
            const timestamp = entry.time || new Date(entry.timestamp).toLocaleTimeString();
            html += `<div class="console-message ${entry.type}">`;
            html += `<span class="console-timestamp">[${timestamp}]</span>`;
            html += `<span>${entry.message}</span>`;
            html += `</div>`;
        }
        
        consoleContent.innerHTML = html;
        
        // Auto-scroll to bottom
        consoleContent.scrollTop = consoleContent.scrollHeight;
    }

    clearActivityConsole() {
        if (window.activityLogger) {
            window.activityLogger.clear();
            this.updateActivityConsole();
        }
    }

    saveMap() {
        const mapData = {
            width: this.mapWidth,
            height: this.mapHeight,
            tileSize: this.tileSize,
            map: this.map,
            player: this.player ? {
                tileX: this.player.tileX,
                tileY: this.player.tileY
            } : null,
            entities: this.entityManager.serialize()
        };

        const json = JSON.stringify(mapData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const mapData = JSON.parse(event.target.result);
                        this.mapWidth = mapData.width;
                        this.mapHeight = mapData.height;
                        this.tileSize = mapData.tileSize || 32;
                        this.map = mapData.map;
                        
                        // Restore player position if saved
                        if (mapData.player && mapData.player.tileX !== undefined) {
                            if (!this.player) {
                                this.player = new Character();
                            }
                            this.player.setPosition(mapData.player.tileX, mapData.player.tileY);
                        }
                        
                        // Restore entities
                        if (mapData.entities && Array.isArray(mapData.entities)) {
                            this.entityManager.deserialize(mapData.entities, (data) => {
                                let entity;
                                if (data.type === 'npc') {
                                    entity = new NPC(data.tileX || 0, data.tileY || 0, data.name || 'NPC');
                                } else if (data.type === 'functional') {
                                    // Restore functional item
                                    if (data.itemDef) {
                                        entity = new FunctionalItem(data.tileX || 0, data.tileY || 0, data.name || 'Item', data.itemDef);
                                    } else {
                                        entity = new Item(data.tileX || 0, data.tileY || 0, data.name || 'Item');
                                    }
                                } else if (data.type === 'item') {
                                    entity = new Item(data.tileX || 0, data.tileY || 0, data.name || 'Item');
                                } else {
                                    entity = new Entity(data.tileX || 0, data.tileY || 0, data.type || 'entity');
                                }
                                return entity;
                            });
                        }
                        
                        this.updateEntityCount();
                        this.render();
                    } catch (error) {
                        console.error('Error loading map:', error);
                        alert('Failed to load map file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

