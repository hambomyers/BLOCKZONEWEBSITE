// Main entry point for the game
import LeaderboardSystem from './modules/leaderboard-ui.js';
import { PlayerIdentity } from '../../shared/identity.js';

const identity = new PlayerIdentity();
const leaderboard = new LeaderboardSystem(document.getElementById('leaderboard-container'));

// Example API usage
fetch('https://leaderboard.hambomyers.workers.dev/api')
    .then(response => response.json())
    .then(data => {
        console.log('Leaderboard data:', data);
        // Update leaderboard UI with data
    })
    .catch(error => console.error('Error fetching leaderboard data:', error));

// Initialize game logic here
console.log('Game initialized');
