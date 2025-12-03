/**
 * NPC (Non-Player Character) - Extends Entity with needs-based AI
 */
class NPC extends Entity {
    constructor(x = 0, y = 0, name = 'NPC') {
        super(x, y, 'npc');
        this.name = name;
        this.interactable = true;
        
        // Needs system (will be initialized after NeedsSystem is loaded)
        this.needsSystem = null;
        this.needs = null;
        this.initializeNeeds();
        
        // AI properties
        this.aiType = 'autonomous'; // 'autonomous', 'idle', 'patrol', 'wander'
        this.patrolPath = [];
        this.currentPatrolIndex = 0;
        this.patrolDirection = 1;
        
        // Current goal
        this.currentGoal = null; // {type: 'satisfy_need', needType: 'hunger', target: entity}
        this.targetItem = null; // Item entity to use
        this.usingItem = false; // Currently using an item
        this.useStartTime = 0;
        
        // Movement
        this.moveSpeed = 0.8;
        this.isMoving = false;
        this.targetTileX = this.tileX;
        this.targetTileY = this.tileY;
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;
        
        // Animation
        this.direction = 0;
        this.animationFrame = 0;
        this.lastAnimationTime = 0;
        this.animationSpeed = 150;
        
        // Dialogue
        this.dialogue = ['Hello!', 'How can I help you?'];
        this.dialogueIndex = 0;
        
        // Sprite (default to character sprite)
        this.sprite = {
            tileset: 'character',
            tileX: 0,
            tileY: 0
        };
        
        // AI timing
        this.lastAITime = 0;
        this.aiInterval = 1000; // Faster AI decisions for needs
        this.lastNeedUpdate = 0;
        this.needUpdateInterval = 100; // Update needs every 100ms
        
        // Relationships
        this.relationships = new Map(); // Map<entityId, relationshipData>
        this.interactionHistory = []; // Array of recent interactions
        
        // Personality (affects behavior)
        this.personality = {
            social: Math.random(), // 0-1, how social
            helpful: Math.random(), // 0-1, how helpful
            active: Math.random()  // 0-1, how active
        };
    }

    /**
     * Initialize needs system (called after NeedsSystem is loaded)
     */
    initializeNeeds() {
        if (window.needsSystem) {
            this.needsSystem = window.needsSystem;
            this.needs = this.needsSystem.initializeNeeds();
        } else {
            // Fallback: create a simple needs system if not available
            this.needsSystem = new NeedsSystem();
            this.needs = this.needsSystem.initializeNeeds();
        }
    }

    /**
     * Update NPC AI and movement
     * @param {number} deltaTime - Time in milliseconds
     */
    update(deltaTime) {
        if (!this.active) return;

        // Initialize needs if not done yet
        if (!this.needs || !this.needsSystem) {
            this.initializeNeeds();
        }

        if (!this.needs || !this.needsSystem) return; // Still not initialized

        const deltaSeconds = deltaTime / 1000; // Convert to seconds

        // Update needs with time-based modifiers
        const currentTime = Date.now();
        if (currentTime - this.lastNeedUpdate > this.needUpdateInterval) {
            // Apply time-based decay modifiers
            const timeSystem = window.timeSystem;
            if (timeSystem && this.needsSystem) {
                // Calculate time delta since last update
                const timeDelta = (currentTime - this.lastNeedUpdate) / 1000; // seconds
                
                for (const [needType, need] of Object.entries(this.needs)) {
                    const modifier = timeSystem.getNeedDecayModifier(needType);
                    const baseDecay = this.needsSystem.needTypes[needType]?.decayRate || 0.5;
                    const adjustedDecay = baseDecay * modifier;
                    
                    // Decay the need
                    need.value = Math.max(0, need.value - (adjustedDecay * timeDelta));
                    
                    // Recalculate priority
                    const percentage = need.value / need.max;
                    need.priority = 1 - percentage;
                }
            } else {
                // Fallback to normal update
                if (this.needsSystem) {
                    this.needsSystem.updateNeeds(this.needs, deltaSeconds);
                }
            }
            this.lastNeedUpdate = currentTime;
        }

        // Update item usage
        if (this.usingItem && this.targetItem) {
            const useDelta = (currentTime - this.useStartTime) / 1000; // seconds
            if (this.targetItem.updateUse(useDelta)) {
                // Item usage complete
                this.completeItemUse();
            }
        }

        // Update movement
        if (this.isMoving && !this.usingItem) {
            const dx = this.targetPixelX - this.pixelX;
            const dy = this.targetPixelY - this.pixelY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.moveSpeed) {
                this.pixelX = this.targetPixelX;
                this.pixelY = this.targetPixelY;
                this.tileX = Math.floor(this.pixelX / 32);
                this.tileY = Math.floor(this.pixelY / 32);
                this.isMoving = false;
                this.animationFrame = 0;
                
                // Check if we reached target item
                if (this.targetItem && this.isAtPosition(this.targetItem.tileX, this.targetItem.tileY)) {
                    this.startUsingItem(this.targetItem);
                }
            } else {
                const moveX = (dx / distance) * this.moveSpeed;
                const moveY = (dy / distance) * this.moveSpeed;
                this.pixelX += moveX;
                this.pixelY += moveY;
            }
        }

        // Update animation
        if (this.isMoving && !this.usingItem) {
            if (currentTime - this.lastAnimationTime > this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.lastAnimationTime = currentTime;
            }
        } else if (!this.usingItem) {
            this.animationFrame = 0;
        }

        // AI decision making (autonomous behavior)
        if (currentTime - this.lastAITime > this.aiInterval && !this.isMoving && !this.usingItem) {
            if (this.aiType === 'autonomous') {
                this.makeAutonomousDecision();
            } else {
                this.makeAIDecision();
            }
            this.lastAITime = currentTime;
        }
    }

    /**
     * Make autonomous decision based on needs
     */
    makeAutonomousDecision() {
        // Check if we can help other NPCs first (cooperation)
        if (this.tryHelpOthers()) {
            return;
        }

        // Check most urgent need
        const urgentNeed = this.needsSystem.getMostUrgentNeed(this.needs);
        
        if (urgentNeed) {
            // Try to find an item that satisfies this need
            const item = this.findItemForNeed(urgentNeed);
            if (item) {
                this.goToItem(item, urgentNeed);
            } else {
                // No item found, wander or try to help others
                this.wander();
            }
        } else {
            // All needs satisfied, socialize or wander
            if (Math.random() < 0.3) {
                this.trySocialize();
            } else {
                this.wander();
            }
        }
    }

    /**
     * Try to help other NPCs in the same area
     * @returns {boolean} True if helping
     */
    tryHelpOthers() {
        // Find nearby NPCs
        const nearbyNPCs = this.findNearbyNPCs(3); // 3 tile radius
        
        for (const npc of nearbyNPCs) {
            if (npc.id === this.id) continue;
            
            const urgentNeed = this.needsSystem.getMostUrgentNeed(npc.needs);
            if (urgentNeed && this.needsSystem.isCritical(npc.needs)) {
                // Find item for them
                const item = this.findItemForNeed(urgentNeed);
                if (item && item.isAvailable()) {
                    // Log helping action
                    if (window.activityLogger) {
                        window.activityLogger.logNPCAction(
                            this, 
                            'is helping', 
                            `${npc.name} find ${item.name}`
                        );
                    }
                    // Help by going to item and "pointing" it out (simplified)
                    this.goToItem(item, urgentNeed);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Find nearby NPCs
     * @param {number} radius - Tile radius
     * @returns {Array<NPC>}
     */
    findNearbyNPCs(radius) {
        // This will be called from entity manager context
        if (!window.mapRenderer || !window.mapRenderer.entityManager) {
            return [];
        }
        
        const allNPCs = window.mapRenderer.entityManager.getByType('npc');
        return allNPCs.filter(npc => {
            const distance = this.getDistance(npc);
            return distance <= radius && npc.id !== this.id;
        });
    }

    /**
     * Find an item that satisfies a need
     * @param {string} needType - Type of need
     * @returns {FunctionalItem|null}
     */
    findItemForNeed(needType) {
        if (!window.mapRenderer || !window.mapRenderer.entityManager) {
            return null;
        }
        
        const allItems = window.mapRenderer.entityManager.getByType('functional');
        let bestItem = null;
        let bestDistance = Infinity;
        
        for (const item of allItems) {
            if (item.canSatisfy(needType) && item.isAvailable()) {
                const distance = this.getDistance(item);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestItem = item;
                }
            }
        }
        
        return bestItem;
    }

    /**
     * Go to an item to use it
     * @param {FunctionalItem} item
     * @param {string} needType
     */
    goToItem(item, needType) {
        if (!item || !this.canMoveTo(item.tileX, item.tileY)) {
            return; // Can't reach item
        }
        
        this.currentGoal = {
            type: 'satisfy_need',
            needType: needType,
            target: item
        };
        this.targetItem = item;
        
        // Log to activity console
        if (window.activityLogger) {
            window.activityLogger.logSeekingItem(this, needType, item.name);
        }
        
        this.moveTo(item.tileX, item.tileY);
    }

    /**
     * Start using an item
     * @param {FunctionalItem} item
     */
    startUsingItem(item) {
        if (item.startUse(this.id)) {
            this.usingItem = true;
            this.useStartTime = Date.now();
            this.isMoving = false;
        }
    }

    /**
     * Complete using an item
     */
    completeItemUse() {
        if (this.targetItem && this.currentGoal) {
            // Satisfy the need
            const amount = this.targetItem.getSatisfactionAmount(this.currentGoal.needType);
            this.needsSystem.satisfyNeed(this.needs, this.currentGoal.needType, amount);
            
            // Log to activity console
            if (window.activityLogger) {
                window.activityLogger.logNeedSatisfaction(
                    this, 
                    this.currentGoal.needType, 
                    this.targetItem.name
                );
            }
            
            // Also satisfy other needs the item provides
            for (const [needType, needAmount] of Object.entries(this.targetItem.itemDef.satisfies)) {
                if (needType !== this.currentGoal.needType) {
                    this.needsSystem.satisfyNeed(this.needs, needType, needAmount);
                }
            }
        }
        
        this.usingItem = false;
        this.targetItem = null;
        this.currentGoal = null;
        this.useStartTime = 0;
    }

    /**
     * Try to socialize with nearby NPCs
     */
    trySocialize() {
        const nearbyNPCs = this.findNearbyNPCs(2);
        if (nearbyNPCs.length > 0) {
            // Choose a random nearby NPC to interact with
            const target = nearbyNPCs[Math.floor(Math.random() * nearbyNPCs.length)];
            this.interactWithNPC(target);
        } else {
            this.wander();
        }
    }

    /**
     * Interact with another NPC
     * @param {NPC} otherNPC
     */
    interactWithNPC(otherNPC) {
        if (!otherNPC || otherNPC.id === this.id) return;
        
        // Move towards the other NPC if not adjacent
        const distance = this.getDistance(otherNPC);
        if (distance > 1) {
            // Move closer
            const dx = otherNPC.tileX - this.tileX;
            const dy = otherNPC.tileY - this.tileY;
            
            // Move one step closer
            let newX = this.tileX;
            let newY = this.tileY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                newX += dx > 0 ? 1 : -1;
            } else {
                newY += dy > 0 ? 1 : -1;
            }
            
            if (this.canMoveTo(newX, newY)) {
                this.moveTo(newX, newY);
            }
            return;
        }
        
        // Adjacent - perform interaction
        this.performInteraction(otherNPC);
    }

    /**
     * Perform interaction with another NPC
     * @param {NPC} otherNPC
     */
    performInteraction(otherNPC) {
        // Update relationships
        this.updateRelationship(otherNPC, 5); // Positive interaction
        otherNPC.updateRelationship(this, 5);
        
        // Satisfy needs
        const socialGain = 10 + (this.personality.social * 5);
        const happinessGain = 5 + (this.personality.social * 3);
        
        this.needsSystem.satisfyNeed(this.needs, 'happiness', happinessGain);
        this.needsSystem.satisfyNeed(this.needs, 'social', socialGain);
        
        otherNPC.needsSystem.satisfyNeed(otherNPC.needs, 'happiness', happinessGain * 0.8);
        otherNPC.needsSystem.satisfyNeed(otherNPC.needs, 'social', socialGain * 0.8);
        
        // Record interaction
        this.recordInteraction(otherNPC, 'talk');
        otherNPC.recordInteraction(this, 'talk');
        
        // Log to activity console
        if (window.activityLogger) {
            window.activityLogger.logNPCInteraction(this, otherNPC, 'talked');
        }
        
        console.log(`${this.name} talked with ${otherNPC.name}`);
    }

    /**
     * Update relationship with another entity
     * @param {Entity} other
     * @param {number} change - Positive or negative change
     */
    updateRelationship(other, change) {
        if (!this.relationships.has(other.id)) {
            this.relationships.set(other.id, {
                value: 0,
                interactions: 0,
                lastInteraction: Date.now()
            });
        }
        
        const rel = this.relationships.get(other.id);
        rel.value = Math.max(-100, Math.min(100, rel.value + change));
        rel.interactions++;
        rel.lastInteraction = Date.now();
    }

    /**
     * Get relationship value with another entity
     * @param {Entity} other
     * @returns {number} -100 to 100
     */
    getRelationship(other) {
        if (!this.relationships.has(other.id)) {
            return 0;
        }
        return this.relationships.get(other.id).value;
    }

    /**
     * Record an interaction
     * @param {Entity} other
     * @param {string} type
     */
    recordInteraction(other, type) {
        this.interactionHistory.push({
            with: other.id,
            name: other.name,
            type: type,
            time: Date.now()
        });
        
        // Keep only last 20 interactions
        if (this.interactionHistory.length > 20) {
            this.interactionHistory.shift();
        }
    }

    /**
     * Get relationship status text
     * @param {number} value
     * @returns {string}
     */
    getRelationshipStatus(value) {
        if (value >= 80) return 'Best Friend';
        if (value >= 50) return 'Friend';
        if (value >= 20) return 'Acquaintance';
        if (value >= -20) return 'Neutral';
        if (value >= -50) return 'Unfriendly';
        return 'Enemy';
    }

    /**
     * Make AI decision based on AI type (legacy method)
     */
    makeAIDecision() {
        switch (this.aiType) {
            case 'patrol':
                this.patrol();
                break;
            case 'wander':
                this.wander();
                break;
            case 'idle':
            default:
                // Do nothing
                break;
        }
    }

    /**
     * Patrol along a path
     */
    patrol() {
        if (this.patrolPath.length === 0) return;
        
        const nextIndex = (this.currentPatrolIndex + this.patrolDirection) % this.patrolPath.length;
        if (nextIndex < 0) {
            this.currentPatrolIndex = this.patrolPath.length - 1;
            this.patrolDirection = -1;
        } else {
            const nextPoint = this.patrolPath[nextIndex];
            this.moveTo(nextPoint.x, nextPoint.y);
            this.currentPatrolIndex = nextIndex;
            
            // Reverse direction at ends
            if (nextIndex === 0 || nextIndex === this.patrolPath.length - 1) {
                this.patrolDirection *= -1;
            }
        }
    }

    /**
     * Wander randomly
     */
    wander() {
        const directions = [
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 },  // Right
            { x: 0, y: -1 }  // Up
        ];
        
        // Try random directions until we find a valid one
        const shuffled = directions.sort(() => Math.random() - 0.5);
        
        for (const dir of shuffled) {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            
            if (this.canMoveTo(newX, newY)) {
                this.moveTo(newX, newY);
                return;
            }
        }
        
        // If no valid direction, stay put
    }

    /**
     * Move to a tile position
     * @param {number} x
     * @param {number} y
     */
    moveTo(x, y) {
        if (this.isMoving) return;
        
        // Determine direction
        if (y > this.tileY) this.direction = 0; // Down
        else if (x < this.tileX) this.direction = 1; // Left
        else if (x > this.tileX) this.direction = 2; // Right
        else if (y < this.tileY) this.direction = 3; // Up
        
        this.targetTileX = x;
        this.targetTileY = y;
        this.targetPixelX = x * 32;
        this.targetPixelY = y * 32;
        this.isMoving = true;
        this.animationFrame = 0;
        this.lastAnimationTime = Date.now();
    }

    /**
     * Check if NPC can move to a position
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    canMoveTo(x, y) {
        // Check map bounds
        if (!window.mapRenderer) return false;
        
        if (x < 0 || x >= window.mapRenderer.mapWidth || 
            y < 0 || y >= window.mapRenderer.mapHeight) {
            return false;
        }
        
        // Check for blocking entities (can be expanded)
        const entitiesAtPos = window.mapRenderer.entityManager.getAtPosition(x, y);
        const blockingEntities = entitiesAtPos.filter(e => 
            e.type === 'functional' && e.inUse
        );
        
        // Don't move to position with blocking functional items
        if (blockingEntities.length > 0) {
            return false;
        }
        
        return true;
    }

    /**
     * Get sprite tile for rendering
     * @returns {Object} {x, y}
     */
    getSpriteTile() {
        return {
            x: this.animationFrame,
            y: this.direction
        };
    }

    /**
     * Handle interaction
     * @param {Entity} interactor
     * @returns {boolean}
     */
    onInteract(interactor) {
        // Cycle through dialogue
        const message = this.dialogue[this.dialogueIndex];
        this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogue.length;
        
        // Show dialogue (can be expanded with UI)
        console.log(`${this.name}: ${message}`);
        alert(`${this.name}: ${message}`);
        
        return true;
    }

    /**
     * Set dialogue
     * @param {Array<string>} dialogue
     */
    setDialogue(dialogue) {
        this.dialogue = dialogue;
        this.dialogueIndex = 0;
    }

    /**
     * Set patrol path
     * @param {Array<{x, y}>} path
     */
    setPatrolPath(path) {
        this.patrolPath = path;
        this.currentPatrolIndex = 0;
        this.patrolDirection = 1;
    }

    /**
     * Serialize NPC data
     * @returns {Object}
     */
    serialize() {
        const data = super.serialize();
        data.aiType = this.aiType;
        data.patrolPath = this.patrolPath;
        data.dialogue = this.dialogue;
        data.needs = this.needs;
        return data;
    }

    /**
     * Deserialize NPC data
     * @param {Object} data
     */
    deserialize(data) {
        super.deserialize(data);
        if (data.needs) {
            this.needs = data.needs;
        }
    }
}

