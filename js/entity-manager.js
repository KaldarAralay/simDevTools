/**
 * Entity Manager - Manages all entities on the map
 */
class EntityManager {
    constructor() {
        this.entities = new Map(); // Map<id, Entity>
        this.entitiesByType = new Map(); // Map<type, Set<Entity>>
        this.entitiesByPosition = new Map(); // Map<"x,y", Set<Entity>>
    }

    /**
     * Add an entity
     * @param {Entity} entity
     */
    add(entity) {
        this.entities.set(entity.id, entity);
        
        // Index by type (use 'functional' for functional items)
        const type = entity.type === 'functional' ? 'functional' : entity.type;
        if (!this.entitiesByType.has(type)) {
            this.entitiesByType.set(type, new Set());
        }
        this.entitiesByType.get(type).add(entity);
        
        // Index by position
        this.indexEntityPosition(entity);
        
        return entity.id;
    }

    /**
     * Remove an entity
     * @param {string} id
     */
    remove(id) {
        const entity = this.entities.get(id);
        if (!entity) return;
        
        this.entities.delete(id);
        
        // Remove from type index
        const typeSet = this.entitiesByType.get(entity.type);
        if (typeSet) {
            typeSet.delete(entity);
        }
        
        // Remove from position index
        this.unindexEntityPosition(entity);
    }

    /**
     * Get entity by ID
     * @param {string} id
     * @returns {Entity|null}
     */
    get(id) {
        return this.entities.get(id) || null;
    }

    /**
     * Get all entities
     * @returns {Array<Entity>}
     */
    getAll() {
        return Array.from(this.entities.values());
    }

    /**
     * Get entities by type
     * @param {string} type
     * @returns {Array<Entity>}
     */
    getByType(type) {
        const set = this.entitiesByType.get(type);
        return set ? Array.from(set) : [];
    }

    /**
     * Get entities at a position
     * @param {number} x
     * @param {number} y
     * @returns {Array<Entity>}
     */
    getAtPosition(x, y) {
        const key = `${x},${y}`;
        const set = this.entitiesByPosition.get(key);
        return set ? Array.from(set) : [];
    }

    /**
     * Get interactable entity at position
     * @param {number} x
     * @param {number} y
     * @returns {Entity|null}
     */
    getInteractableAt(x, y) {
        const entities = this.getAtPosition(x, y);
        return entities.find(e => e.interactable && e.active) || null;
    }

    /**
     * Update all entities
     * @param {number} deltaTime
     */
    update(deltaTime) {
        const toRemove = [];
        
        for (const entity of this.entities.values()) {
            if (entity.markedForRemoval) {
                toRemove.push(entity.id);
            } else if (entity.active) {
                entity.update(deltaTime);
                // Re-index position if entity moved
                this.updateEntityPosition(entity);
            }
        }
        
        // Remove marked entities
        toRemove.forEach(id => this.remove(id));
    }

    /**
     * Index entity by position
     * @param {Entity} entity
     */
    indexEntityPosition(entity) {
        const key = `${entity.tileX},${entity.tileY}`;
        if (!this.entitiesByPosition.has(key)) {
            this.entitiesByPosition.set(key, new Set());
        }
        this.entitiesByPosition.get(key).add(entity);
    }

    /**
     * Unindex entity from position
     * @param {Entity} entity
     */
    unindexEntityPosition(entity) {
        const key = `${entity.tileX},${entity.tileY}`;
        const set = this.entitiesByPosition.get(key);
        if (set) {
            set.delete(entity);
            if (set.size === 0) {
                this.entitiesByPosition.delete(key);
            }
        }
    }

    /**
     * Update entity position index
     * @param {Entity} entity
     */
    updateEntityPosition(entity) {
        // Check if position changed
        const oldKey = `${Math.floor(entity.pixelX / 32)},${Math.floor(entity.pixelY / 32)}`;
        const newKey = `${entity.tileX},${entity.tileY}`;
        
        if (oldKey !== newKey) {
            this.unindexEntityPosition(entity);
            this.indexEntityPosition(entity);
        }
    }

    /**
     * Clear all entities
     */
    clear() {
        this.entities.clear();
        this.entitiesByType.clear();
        this.entitiesByPosition.clear();
    }

    /**
     * Serialize all entities
     * @returns {Array<Object>}
     */
    serialize() {
        return Array.from(this.entities.values())
            .filter(e => !e.markedForRemoval)
            .map(e => e.serialize());
    }

    /**
     * Deserialize entities
     * @param {Array<Object>} data
     * @param {Function} entityFactory - Function to create entities from data
     */
    deserialize(data, entityFactory) {
        this.clear();
        data.forEach(entityData => {
            const entity = entityFactory(entityData);
            if (entity) {
                entity.deserialize(entityData);
                this.add(entity);
            }
        });
    }
}

