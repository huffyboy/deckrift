// Profile Management Module
export class ProfileManager {
    constructor(gameState) {
        this.gameState = gameState;
    }
    
    createProfile(name, slotIndex = null) {
        const newProfile = {
            id: this.gameState.generateProfileId(),
            name: name,
            slotIndex: slotIndex || this.findAvailableSlot(),
            createdAt: Date.now(),
            lastPlayed: Date.now(),
            totalRuns: 0,
            bestScore: 0,
            totalPlaytime: 0
        };
        
        // Insert at correct position
        if (newProfile.slotIndex < this.gameState.gameData.profiles.length) {
            this.gameState.gameData.profiles.splice(newProfile.slotIndex, 0, newProfile);
        } else {
            this.gameState.gameData.profiles.push(newProfile);
        }
        
        this.gameState.saveGameData();
        return newProfile;
    }
    
    findAvailableSlot() {
        for (let i = 0; i < 10; i++) {
            if (!this.gameState.gameData.profiles[i]) {
                return i;
            }
        }
        return this.gameState.gameData.profiles.length;
    }
    
    selectProfile(profileId) {
        this.gameState.gameData.activeProfileId = profileId;
        this.gameState.currentProfile = this.gameState.gameData.profiles.find(p => p.id === profileId);
        this.gameState.saveGameData();
    }
    
    deleteProfile(profileId) {
        const index = this.gameState.gameData.profiles.findIndex(p => p.id === profileId);
        if (index !== -1) {
            this.gameState.gameData.profiles.splice(index, 1);
            
            // If this was the active profile, clear it
            if (this.gameState.gameData.activeProfileId === profileId) {
                this.gameState.gameData.activeProfileId = null;
                this.gameState.currentProfile = null;
            }
            
            this.gameState.saveGameData();
            return true;
        }
        return false;
    }
    
    updateProfileStats(runData) {
        if (!this.gameState.currentProfile) return;
        
        this.gameState.currentProfile.totalRuns++;
        this.gameState.currentProfile.lastPlayed = Date.now();
        
        if (runData.score > this.gameState.currentProfile.bestScore) {
            this.gameState.currentProfile.bestScore = runData.score;
        }
        
        this.gameState.saveGameData();
    }
    
    formatPlaytime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
} 