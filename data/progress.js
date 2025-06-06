// Track user progress through the educational levels

const userProgress = {
    currentLevel: 0,
    completedLevels: [],

    updateProgress(level) {
        if (!this.completedLevels.includes(level)) {
            this.completedLevels.push(level);
        }
        this.currentLevel = Math.max(this.currentLevel, level);
        console.log('Progress updated:', this);
    },

    getProgress() {
        return {
            currentLevel: this.currentLevel,
            completedLevels: this.completedLevels
        };
    }
};
