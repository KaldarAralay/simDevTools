# Sim Development Tools

A Sims-like game development toolkit featuring autonomous NPCs with needs, wants, and social interactions. NPCs operate independently, managing their hunger, thirst, sleep, happiness, and social needs by interacting with functional items in their world.

## Features

### Tileset Editor
- Load and view tileset images (Terrain, Furniture, Interior, Character sprites)
- Configure tile size and grid dimensions
- Select individual tiles from the tileset
- Export tileset metadata as JSON
- Visual grid overlay for easy tile identification
- Automatic loading of default tilesets from resources folder

### Map Editor & Client View
- Display and edit maps using loaded tilesets
- Multi-layer support (Ground, Items, Characters)
- Zoom controls (0.5x to 3.0x)
- Pan/drag viewport
- Save and load map files
- Place tiles by clicking on the map
- Spawn NPCs and functional items
- Custom sprite assignment for items

### NPC System
- **Autonomous AI**: NPCs make decisions based on their needs
- **Needs System**: Hunger, thirst, sleep, happiness, and social needs
- **Personality Traits**: Each NPC has unique personality (Social, Helpful, Active)
- **Cooperation**: NPCs help each other when needs are critical
- **Relationships**: NPCs build relationships through interactions
- **Time-based Decay**: Needs decay over time with modifiers based on time of day

### Functional Items
- **Item Definitions**: Pre-configured items that satisfy specific needs
  - Food items (satisfy hunger)
  - Drinks (satisfy thirst)
  - Beds (satisfy sleep)
  - Entertainment (satisfy happiness)
  - Social items (satisfy social needs)
- **Custom Sprites**: Assign custom sprites to items when placing them
- **Usage System**: Items have use times and availability states

### Time System
- **Day/Night Cycle**: 24-hour in-game time system
- **Time Controls**: Pause, speed up, or slow down time
- **Time-based Modifiers**: Needs decay differently based on time of day
- **Visual Indicator**: Time display with day progress bar

### Activity Console
- Real-time logging of NPC activities
- Color-coded messages by activity type
- Timestamps for all events
- Shows when NPCs seek items, use items, interact, and help each other

### NPC Interaction
- Click NPCs to view detailed stats and needs
- View relationships between NPCs
- See current actions and goals
- Monitor all NPCs in a list view

## Getting Started

1. Open `index.html` in a modern web browser
2. In the **Tileset Editor** tab:
   - Tilesets are automatically loaded from the `resources` folder
   - Select a tileset type (Terrain, Furniture, Interior, or Character)
   - Adjust tile size if needed (auto-set to 32x48 for characters)
   - Click on tiles to select them

3. Switch to the **Client View** tab:
   - Create a new map with your desired dimensions
   - Place tiles by clicking on the map
   - Use zoom controls to adjust view
   - **Spawn NPCs**: Click "Spawn Entity" to add NPCs to the center of the map
   - **Place Items**: Select an item type, optionally set a custom sprite, then click on the map to place functional items
   - Use time controls to pause or speed up the simulation
   - Click on NPCs to view their stats and relationships
   - Watch the Activity Console to see what NPCs are doing
   - Save your map when done

## File Structure

```
orpgTest1/
├── index.html              # Main HTML file
├── styles.css              # Application styles
├── resources/              # Default tileset images
│   ├── terrain.png
│   ├── furniture.png
│   ├── interior.png
│   └── character.png
├── js/
│   ├── main.js             # Application entry point
│   ├── tileset-manager.js  # Tileset loading and management
│   ├── tileset-editor.js   # Tileset editor UI
│   ├── map-renderer.js     # Map rendering and editing
│   ├── client.js           # Main client logic
│   ├── entity.js           # Base entity class
│   ├── npc.js              # NPC class with AI and needs
│   ├── item.js             # Item class
│   ├── functional-item.js  # Functional items with need satisfaction
│   ├── entity-manager.js    # Entity management system
│   ├── needs-system.js     # Needs system for NPCs
│   ├── time-system.js      # Time and day/night cycle
│   ├── activity-logger.js  # Activity logging system
│   └── character.js        # Player character
└── README.md               # This file
```

## Tileset Format

Your tileset images should be organized in a grid:
- **Character sprites**: 32x48 pixels, 4x4 grid (4 directions × 4 animation frames)
- **Terrain tiles**: 32x32 pixels, variable grid based on your tileset
- **Furniture/Items**: 32x32 pixels, variable grid based on your tileset
- **Interior tiles**: 32x32 pixels, variable grid based on your tileset

The editor allows you to configure the grid size to match your sprite sheets.

## NPC Needs System

NPCs have five core needs that decay over time:
- **Hunger**: Satisfied by food items
- **Thirst**: Satisfied by drinks
- **Sleep**: Satisfied by beds (more effective at night)
- **Happiness**: Satisfied by entertainment items
- **Social**: Satisfied by interacting with other NPCs

NPCs autonomously seek items to satisfy their most urgent needs. When multiple NPCs are nearby, they may help each other find items.

## Functional Items

Items can be placed on the map and will satisfy NPC needs when used:
- **Food**: Apple, Meal, Snack
- **Drinks**: Water, Juice, Coffee
- **Furniture**: Bed, Chair, Sofa
- **Entertainment**: TV, Game, Book

Each item has:
- Needs it satisfies (with amounts)
- Use time (how long NPCs take to use it)
- Custom sprite support

## Time System

The game features a 24-hour day/night cycle:
- **Morning** (6:00 AM - 12:00 PM): Normal need decay
- **Afternoon** (12:00 PM - 6:00 PM): Normal need decay
- **Evening** (6:00 PM - 12:00 AM): Slower need decay
- **Night** (12:00 AM - 6:00 AM): Sleep is more effective, other needs decay slower

Time can be paused or sped up (1x, 2x, 5x, 10x, 30x, 60x).

## Browser Compatibility

Requires a modern browser with:
- HTML5 Canvas support
- ES6 JavaScript support
- File API support

Tested on Chrome, Firefox, Edge, and Safari.
