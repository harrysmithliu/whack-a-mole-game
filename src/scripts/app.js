const GAME_DURATION = 30;
const BEST_SCORE_KEY = 'whack-a-mole-best-score';
const HIT_FLASH_DURATION = 180;

const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const bestScoreElement = document.getElementById('best-score');
const statusTextElement = document.getElementById('status-text');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const boardCells = Array.from(document.querySelectorAll('.board-cell'));

const gameState = {
  score: 0,
  bestScore: Number(localStorage.getItem(BEST_SCORE_KEY)) || 0,
  timeLeft: GAME_DURATION,
  isRunning: false,
  countdownIntervalId: null,
};

function init() {
  renderStats();
  updateStatus('Press “Start Game” to begin.');
  bindEvents();
}

function bindEvents() {
  startButton.addEventListener('click', startGame);
  resetButton.addEventListener('click', resetGame);

  boardCells.forEach((cell, index) => {
    cell.addEventListener('pointerdown', () => hitMole(index));
  });
}

function startGame() {
  if (gameState.isRunning) {
    return;
  }

  resetBoard();
  gameState.score = 0;
  gameState.timeLeft = GAME_DURATION;
  gameState.isRunning = true;
  renderStats();
  updateStatus('Game started. Tap the moles!');

  gameState.countdownIntervalId = window.setInterval(tick, 1000);
}

function tick() {
  gameState.timeLeft -= 1;
  renderStats();

  if (gameState.timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  clearTimers();
  gameState.isRunning = false;

  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    localStorage.setItem(BEST_SCORE_KEY, String(gameState.bestScore));
  }

  renderStats();
  updateStatus(`Game over. Final score: ${gameState.score}.`);
}

function resetGame() {
  clearTimers();
  gameState.score = 0;
  gameState.timeLeft = GAME_DURATION;
  gameState.isRunning = false;
  resetBoard();
  renderStats();
  updateStatus('Game reset. Press “Start Game” to play again.');
}

function hitMole(index) {
  const targetCell = boardCells[index];

  if (!targetCell) {
    return;
  }

  if (targetCell.dataset.hitTimeoutId) {
    window.clearTimeout(Number(targetCell.dataset.hitTimeoutId));
  }

  targetCell.classList.add('is-hit');
  const hitTimeoutId = window.setTimeout(() => {
    targetCell.classList.remove('is-hit');
    delete targetCell.dataset.hitTimeoutId;
  }, HIT_FLASH_DURATION);

  targetCell.dataset.hitTimeoutId = String(hitTimeoutId);

  if (!gameState.isRunning) {
    return;
  }

  gameState.score += 1;
  renderStats();
  updateStatus(`Nice! Score: ${gameState.score}.`);
}

function clearTimers() {
  if (gameState.countdownIntervalId) {
    window.clearInterval(gameState.countdownIntervalId);
    gameState.countdownIntervalId = null;
  }
}

function resetBoard() {
  boardCells.forEach((cell) => {
    cell.classList.remove('is-hit');

    if (cell.dataset.hitTimeoutId) {
      window.clearTimeout(Number(cell.dataset.hitTimeoutId));
      delete cell.dataset.hitTimeoutId;
    }
  });
}

function renderStats() {
  scoreElement.textContent = String(gameState.score);
  timerElement.textContent = String(gameState.timeLeft);
  bestScoreElement.textContent = String(gameState.bestScore);
}

function updateStatus(message) {
  statusTextElement.textContent = message;
}

init();
