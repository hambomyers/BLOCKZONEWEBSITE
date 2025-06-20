/**
 * GameRegistry.js - Platform Game Registration & Discovery System
 * Updated with standardized imports
 */

// Use centralized path constants
import { UTILS_PATHS } from '../../utils/ImportPaths.js';
import EventEmitter from '../../utils/EventEmitter.js';

class GameRegistry extends EventEmitter {
    constructor() {
        super();
        this.games = new Map();
        this.currentGame = null;
        this.initializeRegistry();
    }

    initializeRegistry() {
        // Register Neon Drop
        this.registerGame({
            id: 'neondrop',
            name: 'Neon Drop',
            version: '1.0.0',
            path: '/games/neondrop/',
            type: 'arcade',
            features: ['tournaments', 'daily-rewards', 'leaderboards'],
            config: {
                hasWallet: true,
                hasPayments: true,
                hasTournaments: true,
                entryCost: 'QUARTERS',
                rewardToken: 'USDC'
            },
            ui: {
                card: 'EverythingCard',
                leaderboard: 'TournamentLeaderboard'
            },
            status: 'active'        });

        this.emit('registry:initialized', { gameCount: this.games.size });
        console.log(`✅ GameRegistry initialized with ${this.games.size} games`);
    }

    registerGame(gameConfig) {
        if (!gameConfig.id || !gameConfig.name) {
            throw new Error('Game must have id and name');
        }        this.games.set(gameConfig.id, {
            ...gameConfig,
            registeredAt: new Date().toISOString()
        });

        this.emit('game:registered', gameConfig);
        console.log(`📝 Registered game: ${gameConfig.name} (${gameConfig.id})`);
        return true;
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    getAllGames() {
        return Array.from(this.games.values());
    }

    getActiveGames() {
        return this.getAllGames().filter(game => game.status === 'active');
    }    setCurrentGame(gameId) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }
        this.currentGame = game;
        this.emit('game:current-changed', game);
        console.log(`🎮 Current game set to: ${game.name}`);
        return game;
    }

    getCurrentGame() {
        return this.currentGame;
    }

    // Future games can be registered here
    // registerPlatformPuzzle() { ... }
    // registerCryptoTrader() { ... }
    // registerDefiDashboard() { ... }
}

// Export singleton instance
const gameRegistry = new GameRegistry();
export default gameRegistry;
