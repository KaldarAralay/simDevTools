/**
 * Time System - Manages day/night cycle and time-based effects
 */
class TimeSystem {
    constructor() {
        // Time settings
        this.timeScale = 60; // 1 real second = 60 game seconds (1 minute per second)
        this.dayLength = 24 * 60; // 24 hours in minutes (1440 minutes)
        this.currentTime = 6 * 60; // Start at 6:00 AM (360 minutes)
        
        // Time of day thresholds (in minutes from midnight)
        this.dawn = 6 * 60;      // 6:00 AM
        this.morning = 9 * 60;    // 9:00 AM
        this.noon = 12 * 60;      // 12:00 PM
        this.afternoon = 15 * 60; // 3:00 PM
        this.evening = 18 * 60;   // 6:00 PM
        this.night = 21 * 60;     // 9:00 PM
        this.midnight = 0;        // 12:00 AM
        
        this.isPaused = false;
        this.lastUpdate = Date.now();
    }

    /**
     * Update time system
     * @param {number} deltaTime - Time in milliseconds
     */
    update(deltaTime) {
        if (this.isPaused) return;
        
        const deltaMinutes = (deltaTime / 1000) * (this.timeScale / 60); // Convert to game minutes
        this.currentTime += deltaMinutes;
        
        // Wrap around at end of day
        if (this.currentTime >= this.dayLength) {
            this.currentTime = this.currentTime % this.dayLength;
        }
    }

    /**
     * Get current time of day
     * @returns {string} 'dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'
     */
    getTimeOfDay() {
        const time = this.currentTime;
        
        if (time >= this.night || time < this.dawn) {
            return 'night';
        } else if (time >= this.evening) {
            return 'evening';
        } else if (time >= this.afternoon) {
            return 'afternoon';
        } else if (time >= this.noon) {
            return 'noon';
        } else if (time >= this.morning) {
            return 'morning';
        } else if (time >= this.dawn) {
            return 'dawn';
        }
        
        return 'night';
    }

    /**
     * Get formatted time string
     * @returns {string} "HH:MM AM/PM"
     */
    getFormattedTime() {
        const hours = Math.floor(this.currentTime / 60);
        const minutes = Math.floor(this.currentTime % 60);
        const hour12 = hours % 12 || 12;
        const ampm = hours < 12 ? 'AM' : 'PM';
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    /**
     * Get time as percentage of day (0-1)
     * @returns {number}
     */
    getDayProgress() {
        return this.currentTime / this.dayLength;
    }

    /**
     * Check if it's nighttime
     * @returns {boolean}
     */
    isNighttime() {
        const timeOfDay = this.getTimeOfDay();
        return timeOfDay === 'night' || timeOfDay === 'midnight';
    }

    /**
     * Check if it's daytime
     * @returns {boolean}
     */
    isDaytime() {
        return !this.isNighttime();
    }

    /**
     * Get need decay modifier based on time of day
     * @param {string} needType - Type of need
     * @returns {number} Multiplier for decay rate
     */
    getNeedDecayModifier(needType) {
        const timeOfDay = this.getTimeOfDay();
        
        switch (needType) {
            case 'sleep':
                // Sleep decays faster during day, slower at night
                if (this.isNighttime()) {
                    return 0.3; // Much slower at night
                } else {
                    return 1.5; // Faster during day
                }
            case 'hunger':
            case 'thirst':
                // Basic needs decay normally
                return 1.0;
            case 'happiness':
            case 'social':
                // Social needs decay slower at night (less social activity)
                if (this.isNighttime()) {
                    return 0.7;
                }
                return 1.0;
            default:
                return 1.0;
        }
    }

    /**
     * Get activity preference based on time
     * @returns {Object} Activity preferences
     */
    getActivityPreferences() {
        const timeOfDay = this.getTimeOfDay();
        
        if (this.isNighttime()) {
            return {
                preferSleep: true,
                preferSocial: false,
                preferEntertainment: true,
                preferFood: false
            };
        } else {
            return {
                preferSleep: false,
                preferSocial: true,
                preferEntertainment: true,
                preferFood: true
            };
        }
    }

    /**
     * Set time
     * @param {number} hours - Hour (0-23)
     * @param {number} minutes - Minutes (0-59)
     */
    setTime(hours, minutes) {
        this.currentTime = (hours * 60) + minutes;
        if (this.currentTime >= this.dayLength) {
            this.currentTime = this.currentTime % this.dayLength;
        }
    }

    /**
     * Pause/unpause time
     * @param {boolean} paused
     */
    setPaused(paused) {
        this.isPaused = paused;
    }

    /**
     * Get time scale
     * @returns {number}
     */
    getTimeScale() {
        return this.timeScale;
    }

    /**
     * Set time scale
     * @param {number} scale
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(1, Math.min(3600, scale)); // Clamp between 1 and 3600
    }
}

