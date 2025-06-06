class Leaderboard {
    constructor(container) {
        this.container = container;
    }

    hide() {
        this.container.style.display = 'none';
    }

    show() {
        this.container.style.display = 'block';
    }

    // ...existing methods...
}