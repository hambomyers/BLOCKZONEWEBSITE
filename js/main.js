// Countdown timer
function updateTimer() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('timer').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update pool
function updatePool() {
    const poolEl = document.getElementById('pool');
    let amount = parseFloat(poolEl.textContent.replace(',', ''));
    amount += 0.25;
    poolEl.textContent = amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

// Update players
function updatePlayers() {
    const playersEl = document.getElementById('players');
    const current = parseInt(playersEl.textContent.replace(',', ''));
    if (Math.random() > 0.7) {
        playersEl.textContent = (current + 1).toLocaleString();
    }
}

// Initialize
setInterval(updateTimer, 1000);
setInterval(updatePool, 3200);
setInterval(updatePlayers, 5000);

updateTimer();