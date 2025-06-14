/**
 * main.js - Clean Game Bootstrap (AAA Architecture)
 *
 * ONLY handles core game initialization
 * NO blockchain, NO wallet, NO monetization
 * Those will be added as plugins later
 */

import { GameEngine } from './game-engine.js';
import { Renderer } from './renderer.js';
import { InputController } from './input-controller.js';
import { AudioSystem } from './audio-system.js';
import { Config } from './config.js';
import { GuidePanel } from './guide-panel.js';
import { ViewportManager } from './viewport-manager.js';
import { StatsPanel } from './stats-panel.js';
import { PlayerIdentity } from './player-identity.js';
import { LeaderboardSystem } from './leaderboard.js';
import { ArcadeLeaderboardUI } from './arcade-leaderboard-ui.js';
import { GameOverSequence } from './game-over-sequence.js';

class NeonDrop {
    constructor() {
        this.config = new Config();
        this.viewportManager = new ViewportManager();

        // Core game systems only
        this.engine = null;
        this.renderer = null;
        this.audio = null;
        this.input = null;

        // UI panels
        this.guidePanel = null;
        this.statsPanel = null;

        // Game state
        this.initialized = false;
        this.running = false;
        this.lastTime = performance.now();
        this.accumulator = 0;

        // Performance tracking
        this.frameTimings = {
            update: 0,
            render: 0,
            total: 0
        };
          // Plugin system for future features
        this.plugins = new Map();

        // Player identity and leaderboard
        this.playerIdentity = new PlayerIdentity();
        this.leaderboard = new LeaderboardSystem();
        window.leaderboard = this.leaderboard; // Make globally accessible
        window.leaderboardUI = new ArcadeLeaderboardUI(this.leaderboard);
        window.gameOverSequence = new GameOverSequence();
    }

    /**
     * Clean initialization - core game only
     */
    async initialize() {        try {
            // 1. Load configuration
            await this.config.load();

            // 2. Setup display
            await this.setupDisplay();

            // 3. Create game systems
            await this.createGameSystems();
              // 4. Setup UI
            await this.setupUI();

            // 5. Setup Game Over Sequence Event Listeners
            this.setupGameOverSequenceEvents();

            // 6. Check wallet connection (Sonic)
            await this.checkSonicConnection();
            // 7. Start game loop
            this.startGameLoop();

        } catch (error) {
            // Initialization failed silently
            this.showError('Failed to start game. Please refresh.');
        }
    }

    async setupDisplay() {
        // Get canvases
        const gameCanvas = document.getElementById('game');
        const bgCanvas = document.getElementById('bg');

        if (!gameCanvas || !bgCanvas) {
            throw new Error('Canvas elements not found');
        }

        // Calculate dimensions
        const dimensions = this.viewportManager.calculateOptimalDimensions(
            window.innerWidth,
            window.innerHeight
        );

        // Set canvas sizes
        gameCanvas.width = dimensions.canvasWidth;
        gameCanvas.height = dimensions.canvasHeight;
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;

        // Create renderer
        this.renderer = new Renderer(gameCanvas, bgCanvas, this.config, dimensions);
        this.renderer.viewportManager = this.viewportManager;
    }

    async createGameSystems() {
        // Audio system
        this.audio = new AudioSystem(this.config);

        // Game engine - pure game logic, no blockchain
        this.engine = new GameEngine(this.config, this.audio, null);

        // Input controller
        this.input = new InputController(
            this.handleAction.bind(this),
            () => this.engine.getState(),
            this.config
        );

        // Setup event handlers
        this.setupEventHandlers();

        // Listen for game over choices
        document.addEventListener('gameOverChoice', (e) => {
            switch(e.detail.action) {
                case 'leaderboard':
                    window.leaderboardUI.show(e.detail.score);
                    break;
                case 'play-again':
                    this.engine.handleInput({ type: 'START_GAME' });
                    break;
                case 'menu':
                    this.engine.returnToMenu();
                    break;
            }
        });

        // Initialize touch controls state
        this.initializeTouchControls();
    }

    async setupUI() {
        // Guide panel
        this.guidePanel = new GuidePanel();
        this.guidePanel.positionPanel();

        // Stats panel
        this.statsPanel = new StatsPanel();
        this.statsPanel.positionPanel();
    }

    startGameLoop() {
        this.initialized = true;
        this.running = true;
        this.lastTime = performance.now();

        // Initial render
        this.render();

        // Start loop
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.running) return;

        const now = performance.now();
        const deltaTime = Math.min(now - this.lastTime, 100);
        this.lastTime = now;

        // Fixed timestep with interpolation
        this.accumulator += deltaTime;
        const tickRate = this.config.get('game.tickRate');

        let updated = false;

        // Update with fixed timestep
        while (this.accumulator >= tickRate) {
            this.update(tickRate);
            this.accumulator -= tickRate;
            updated = true;
        }

        // Render if updated or animations playing
        if (updated || this.shouldAlwaysRender()) {
            this.render();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (!this.engine) return;

        try {
            this.engine.tick(deltaTime);

            // Update plugins
            this.plugins.forEach(plugin => {
                if (plugin.update) {
                    plugin.update(deltaTime);
                }
            });

        } catch (error) {
            // Update failed silently
        }
    }

    render() {
        if (!this.engine || !this.renderer) return;

        try {
            const state = this.engine.getState();
            const particles = this.engine.getParticles();

            // Starfield state (if enabled)
            const starfieldState = {
                enabled: this.config.get('graphics.starfield') || false,
                brightness: 1.0,
                stars: []
            };

            this.renderer.render(state, particles, starfieldState);

        } catch (error) {
            // Render failed silently
        }
    }

    shouldAlwaysRender() {
        const state = this.engine?.getState();
        return state && (
            state.phase === 'CLEARING' ||
            state.phase === 'COUNTDOWN' ||
            state.phase === 'GAME_OVER'
        );
    }

    /**
     * Handle input actions
     */
    handleAction(action) {
        if (!this.engine || !this.initialized) return;

        // Initialize audio on first interaction
        if (!this.audio.initialized) {
            this.audio.init();
        }

        // Let plugins handle actions first
        let handled = false;
        this.plugins.forEach(plugin => {
            if (plugin.handleAction && plugin.handleAction(action)) {
                handled = true;
            }
        });

        // If no plugin handled it, pass to engine
        if (!handled) {
            this.engine.handleInput(action);
        }
    }
      /**
     * Plugin system for future features
     */
    addPlugin(name, plugin) {
        this.plugins.set(name, plugin);

        if (plugin.initialize) {
            plugin.initialize(this);
        }
    }

    removePlugin(name) {
        const plugin = this.plugins.get(name);
        if (plugin && plugin.destroy) {
            plugin.destroy();
        }
        this.plugins.delete(name);
    }

    /**
     * Initialize touch controls visibility
     */
    initializeTouchControls() {
        // Check if we should show touch controls
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 768;
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Only show touch controls on actual mobile devices
        if (isMobile && hasTouch) {
            document.body.classList.add('touch-device');
        } else {
            document.body.classList.remove('touch-device');
        }
    }

    /**
     * Event handlers
     */
    setupEventHandlers() {
        // Window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 100);
        });

        // Pause when hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.engine) {
                const state = this.engine.getState();
                if (state.phase === 'PLAYING') {
                    this.engine.handleInput({ type: 'PAUSE' });
                }
            }
        });

        // Prevent navigation
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Backspace' || e.key === ' ') && e.target === document.body) {
                e.preventDefault();
            }
        });

        // Starfield easter egg
        this.setupStarfieldEasterEgg();
    }

    setupStarfieldEasterEgg() {
        const keys = new Set();

        document.addEventListener('keydown', (e) => {
            if (this.engine?.getState().phase !== 'MENU') return;

            const key = e.key.toUpperCase();
            if (['S', 'T', 'A', 'R'].includes(key)) {
                keys.add(key);
                  if (keys.size === 4) {
                    const enabled = !this.config.get('graphics.starfield');
                    this.config.set('graphics.starfield', enabled);
                    keys.clear();
                }
            }
        });
          document.addEventListener('keyup', (e) => {
            keys.delete(e.key.toUpperCase());
        });
    }

    /**
     * Setup Game Over Sequence Event Listeners
     */
    setupGameOverSequenceEvents() {
        // Listen for restart events from GameOverSequence
        window.addEventListener('gameOver', (e) => {
            if (e.detail.action === 'restart') {
                this.engine.handleInput({ type: 'START_GAME' });
            }
        });
    }

    handleResize() {
        if (!this.renderer || !this.viewportManager) return;

        const dimensions = this.viewportManager.calculateOptimalDimensions(
            window.innerWidth,
            window.innerHeight
        );

        // Update canvas sizes
        const gameCanvas = document.getElementById('game');
        const bgCanvas = document.getElementById('bg');

        gameCanvas.width = dimensions.canvasWidth;
        gameCanvas.height = dimensions.canvasHeight;
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;

        // Update renderer
        this.renderer.dimensions = dimensions;
        this.renderer.chicletRenderer.setBlockSize(dimensions.blockSize);
        this.renderer.chicletRenderer.clearCache();

        // Update UI panels
        this.guidePanel?.positionPanel();
        this.statsPanel?.positionPanel();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div>${message}</div>
            <button onclick="location.reload()">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    }

    /**
     * Public API for debugging
     */
    getState() {
        return this.engine?.getState();
    }

    getConfig() {
        return this.config;
    }

    getStats() {
        return {
            engine: this.engine?.getState(),
            performance: this.frameTimings,
            plugins: Array.from(this.plugins.keys())
        };
    }

    async checkSonicConnection() {
        const connectBtn = document.getElementById('connect-wallet');
        connectBtn?.addEventListener('click', async () => {
            alert('Sonic wallet integration coming soon! For now, enjoy with username.');

            if (!localStorage.getItem('neon_drop_username')) {
                const username = prompt('Choose your player name:');
                if (username) {
                    localStorage.setItem('neon_drop_username', username);
                    localStorage.setItem('neon_player_id', username.toLowerCase().replace(/\s/g, '_'));
                    this.updatePlayerStatus();
                }
            }
        });

        this.updatePlayerStatus();
    }

    async updatePlayerStatus() {
        const identity = await this.playerIdentity.getIdentity();
        const statusEl = document.querySelector('.player-name');
        if (statusEl) {
            statusEl.textContent = identity.displayName;
        }
    }
}

// Export for testing and external use
export { NeonDrop };

// Create debug interface
function createDebugInterface(game) {
    return {
        game: game,
        renderer: game.renderer,  // Expose renderer directly
        state: () => game.getState(),
        config: () => game.getConfig(),
        stats: () => game.getStats(),

        // Game controls
        start: () => game.engine?.handleInput({ type: 'START_GAME' }),
        pause: () => game.engine?.handleInput({ type: 'PAUSE' }),

        // Plugin management
        plugins: {
            list: () => Array.from(game.plugins.keys()),
            add: (name, plugin) => game.addPlugin(name, plugin),
            remove: (name) => game.removePlugin(name)
        }
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    if (!checkBrowserCompatibility()) {
        document.body.innerHTML = `
            <div class="error-message">
                <h2>Browser Not Supported</h2>
                <p>Please use a modern browser to play Neon Drop.</p>
            </div>
        `;
        return;
    }

    try {
        const game = new NeonDrop();
        await game.initialize();

        // Global debug access
        window.neonDrop = createDebugInterface(game);

        setTimeout(() => {
            if (!localStorage.getItem('neon_drop_username')) {
                const username = prompt('Choose your player name for the leaderboard:');
                if (username && username.trim()) {
                    localStorage.setItem('neon_drop_username', username.trim());
                    localStorage.setItem('neon_player_id', 'user_' + Date.now());
                }
            }
        }, 1000);
    } catch (error) {
        // Game initialization failed silently
        document.body.innerHTML = `
            <div class="error-message">
                <h2>Game Failed to Load</h2>
                <p>Error: ${error.message}</p>
                <button onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
}

// Check browser compatibility
function checkBrowserCompatibility() {
    const required = [
        typeof window.requestAnimationFrame === 'function',
        typeof window.performance?.now === 'function',
        'localStorage' in window
    ];

    return required.every(feature => feature);
}
