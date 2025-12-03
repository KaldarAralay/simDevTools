/**
 * Main entry point for the Sim Development Tools application
 */
(async function() {
    // Initialize managers
    const tilesetManager = new TilesetManager();
    const mapRenderer = new MapRenderer(tilesetManager);
    const tilesetEditor = new TilesetEditor(tilesetManager);
    const client = new Client(tilesetManager, mapRenderer);

    // Initialize the client
    client.initialize();

    // Load default tilesets from resources folder
    console.log('Loading default tilesets...');
    try {
        await tilesetManager.loadDefaultTilesets();
        console.log('Default tilesets loaded successfully');
        
        // Refresh editor to show loaded tilesets
        tilesetEditor.onTilesetsLoaded();
    } catch (error) {
        console.error('Error loading default tilesets:', error);
    }

    // Show initial view
    tilesetEditor.show();

    // Initialize needs system
    window.needsSystem = new NeedsSystem();

    // Initialize time system
    window.timeSystem = new TimeSystem();

    // Initialize activity logger
    window.activityLogger = new ActivityLogger(50);
    
    // Update console when new entries are added
    window.activityLogger.addListener(() => {
        mapRenderer.updateActivityConsole();
    });

    // Make managers globally available for debugging
    window.tilesetManager = tilesetManager;
    window.mapRenderer = mapRenderer;
    window.tilesetEditor = tilesetEditor;
    window.client = client;

    console.log('Sim Development Tools initialized');
})();

