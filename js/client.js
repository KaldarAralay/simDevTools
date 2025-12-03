/**
 * Client - Main client application logic
 */
class Client {
    constructor(tilesetManager, mapRenderer) {
        this.tilesetManager = tilesetManager;
        this.mapRenderer = mapRenderer;
        this.currentView = 'editor';
    }

    initialize() {
        // Tab switching
        document.getElementById('editor-tab').addEventListener('click', () => {
            this.switchView('editor');
        });

        document.getElementById('client-tab').addEventListener('click', () => {
            this.switchView('client');
        });

        // Save/Load map buttons
        document.getElementById('save-map').addEventListener('click', () => {
            this.mapRenderer.saveMap();
        });

        document.getElementById('load-map').addEventListener('click', () => {
            this.mapRenderer.loadMap();
        });

        // Connect tileset editor selection to map renderer
        this.setupTileSelectionBridge();
    }

    setupTileSelectionBridge() {
        // Listen for tile selection events from the editor
        window.addEventListener('tileSelected', (e) => {
            if (e.detail && e.detail.tile) {
                this.mapRenderer.setSelectedTile(e.detail.tile);
            }
        });
        
        // This will be called when switching views to sync selected tile
        this.syncSelectedTile = () => {
            if (this.tilesetManager.selectedTile) {
                this.mapRenderer.setSelectedTile(this.tilesetManager.selectedTile);
            }
        };
    }

    switchView(viewName) {
        this.currentView = viewName;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        if (viewName === 'editor') {
            document.getElementById('editor-tab').classList.add('active');
            document.getElementById('editor-view').classList.add('active');
        } else if (viewName === 'client') {
            document.getElementById('client-tab').classList.add('active');
            document.getElementById('client-view').classList.add('active');
            this.syncSelectedTile();
            this.mapRenderer.show();
            // Ensure game loop is running for time/entity updates
            if (!this.mapRenderer.animationFrameId) {
                this.mapRenderer.startGameLoop();
            }
        }
    }
}

