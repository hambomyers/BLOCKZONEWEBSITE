/* Daily Tournament UI Component */

class DailyTournament {
  constructor() {
    this.apiBase = "/api";
    this.playerId = this.generatePlayerId();
    this.isEntered = false;
    this.init();
  }

  generatePlayerId() {
    return localStorage.getItem("playerId") || 
           (() => {
             const id = "player_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
             localStorage.setItem("playerId", id);
             return id;
           })();
  }

  async init() {
    await this.loadTournamentStatus();
    this.render();
    this.bindEvents();
    
    // Auto-refresh every 30 seconds
    setInterval(() => this.loadLeaderboard(), 30000);
  }

  async loadTournamentStatus() {
    try {
      const response = await fetch(`${this.apiBase}/tournament-status`);
      this.tournamentStatus = await response.json();
    } catch (error) {
      console.error("Failed to load tournament status:", error);
    }
  }

  async loadLeaderboard() {
    try {
      const response = await fetch(`${this.apiBase}/leaderboard`);
      this.leaderboard = await response.json();
      this.updateLeaderboardDisplay();
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
  }

  async enterTournament(paymentType) {
    try {
      const response = await fetch(`${this.apiBase}/enter-tournament`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: this.playerId,
          paymentType: paymentType,
          transactionId: "mock_" + Date.now()
        })
      });
      
      const result = await response.json();
      if (result.success) {
        this.isEntered = true;
        this.render();
      }
    } catch (error) {
      console.error("Failed to enter tournament:", error);
    }
  }

  async submitScore(score) {
    try {
      const response = await fetch(`${this.apiBase}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: this.playerId,
          score: score
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await this.loadLeaderboard();
      }
      return result;
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  }

  render() {
    const container = document.getElementById("tournament-container") || 
                     (() => {
                       const div = document.createElement("div");
                       div.id = "tournament-container";
                       document.body.appendChild(div);
                       return div;
                     })();

    container.innerHTML = `
      <div class="tournament-card">
        <h2>Daily Leaderboard Challenge</h2>
        <div class="tournament-timer">
          <div id="countdown"></div>
        </div>
        
        ${!this.isEntered ? `
          <div class="entry-options">
            <button class="entry-btn daily" onclick="tournament.enterTournament(
'
daily
'
)">
              All Day Pass - $2.50
            </button>
            <button class="entry-btn pergame" onclick="tournament.enterTournament(
'
pergame
'
)">
              Per Game - $0.25
            </button>
          </div>
        ` : `
          <div class="entered-status">
            <p> Entered! Good luck!</p>
            <button onclick="tournament.startGame()">Play Game</button>
          </div>
        `}
        
        <div class="leaderboard">
          <h3>Top Players</h3>
          <div id="leaderboard-list">Loading...</div>
        </div>
      </div>
    `;
    
    this.updateCountdown();
    this.loadLeaderboard();
  }

  updateCountdown() {
    const updateTimer = () => {
      if (!this.tournamentStatus) return;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0);
      if (now > today) today.setDate(today.getDate() + 1);
      
      const diff = today - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const countdownEl = document.getElementById("countdown");
      if (countdownEl) {
        countdownEl.textContent = `${hours}h ${minutes}m ${seconds}s until reset`;
      }
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  updateLeaderboardDisplay() {
    const listEl = document.getElementById("leaderboard-list");
    if (!listEl || !this.leaderboard) return;
    
    listEl.innerHTML = this.leaderboard.slice(0, 10).map((entry, index) => `
      <div class="leaderboard-entry ${entry.playerId === this.playerId ? 
'
current-player
'
 : 
'

'
}">
        <span class="rank">${index + 1}</span>
        <span class="player">${entry.playerId === this.playerId ? 
'
You
'
 : `Player ${entry.playerId.slice(-4)}`}</span>
        <span class="score">${entry.score.toLocaleString()}</span>
      </div>
    `).join("");
  }

  bindEvents() {
    // Game integration would happen here
  }

  startGame() {
    // This would trigger the actual game start
    console.log("Starting game for player:", this.playerId);
    // Integration with your existing game logic
  }
}

// Initialize tournament when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.tournament = new DailyTournament();
});
