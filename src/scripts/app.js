const GAME_DURATION = 30;
const STATUS_OVERLAY_DURATION = 1500;
const START_COUNTDOWN_STEP_DURATION = 600;
const START_COUNTDOWN_STEPS = ['3', '2', '1', 'Go'];
const BEST_SCORE_KEY = 'whack-a-mole-best-score';
const DIFFICULTY_LEVELS = [
  {
    name: 'Easy',
    key: 'easy',
    spawnInterval: 700,
    hitResetDelay: 1200,
    princessSpawnProbability: 0.2,
  },
  {
    name: 'Medium',
    key: 'medium',
    spawnInterval: 530,
    hitResetDelay: 1000,
    princessSpawnProbability: 0.35,
  },
  {
    name: 'Hard',
    key: 'hard',
    spawnInterval: 380,
    hitResetDelay: 800,
    princessSpawnProbability: 0.5,
  },
];
const SOUND_FILES = {
  bgLoop: './assets/sounds/bg-loop.mp3',
  gameStart: './assets/sounds/game-start.mp3',
  pop: './assets/sounds/pop.mp3',
  hitMole: './assets/sounds/hit-mole.mp3',
  hitPrincess: './assets/sounds/hit-princess.mp3',
  gameOver: './assets/sounds/game-over.mp3',
};

const viewportStageElement = document.getElementById('viewport-stage');
const appShellElement = document.getElementById('app-shell');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const bestScoreElement = document.getElementById('best-score');
const statusOverlayElement = document.getElementById('status-overlay');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const difficultyMenuElement = document.getElementById('difficulty-menu');
const difficultyOptionElements = Array.from(document.querySelectorAll('.difficulty-option'));
const boardCells = Array.from(document.querySelectorAll('.board-cell'));
const sounds = createSoundBank();

const gameState = {
  score: 0,
  bestScore: Number(localStorage.getItem(BEST_SCORE_KEY)) || 0,
  timeLeft: GAME_DURATION,
  isRunning: false,
  activeCellIndex: null,
  activeCharacterType: null,
  countdownIntervalId: null,
  spawnIntervalId: null,
  hitResetTimeoutId: null,
  statusOverlayTimeoutId: null,
  startCountdownTimeoutId: null,
  isResolvingHit: false,
  isStarting: false,
  selectedDifficulty: DIFFICULTY_LEVELS[1],
};

function init() {
  renderStats();
  resetBoard();
  bindEvents();
  showStatusOverlay('Press Start Game', false);
  updateViewportScale();
}

function bindEvents() {
  startButton.addEventListener('click', startGame);
  resetButton.addEventListener('click', resetGame);
  difficultyOptionElements.forEach((option) => {
    option.addEventListener('click', () => handleDifficultySelect(option.dataset.difficulty));
  });

  boardCells.forEach((cell, index) => {
    cell.addEventListener('pointerdown', () => hitMole(index));
  });

  window.addEventListener('resize', updateViewportScale);
  window.addEventListener('orientationchange', updateViewportScale);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportScale);
    window.visualViewport.addEventListener('scroll', updateViewportScale);
  }

  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('gesturestart', blockGestureZoom);
  document.addEventListener('gesturechange', blockGestureZoom);
  document.addEventListener('gestureend', blockGestureZoom);
  document.addEventListener('touchmove', blockMultiTouchZoom, { passive: false });
}

function startGame() {
  if (gameState.isRunning || gameState.isStarting) {
    return;
  }

  toggleDifficultyMenu();
}

function handleDifficultySelect(difficultyKey) {
  const selectedDifficulty =
    DIFFICULTY_LEVELS.find((difficulty) => difficulty.key === difficultyKey) || DIFFICULTY_LEVELS[1];

  hideDifficultyMenu();

  resetBoard();
  gameState.score = 0;
  gameState.timeLeft = GAME_DURATION;
  gameState.isRunning = false;
  gameState.isStarting = true;
  gameState.isResolvingHit = false;
  gameState.selectedDifficulty = selectedDifficulty;
  renderStats();
  playSound(sounds.gameStart);
  runStartCountdown();
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
  gameState.isStarting = false;
  gameState.isResolvingHit = false;
  resetBoard();
  stopBackgroundLoop();

  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    localStorage.setItem(BEST_SCORE_KEY, String(gameState.bestScore));
  }

  renderStats();
  playSound(sounds.gameOver);
  showStatusOverlay('Game Over, Press Start Game to Play Again', false);
}

function resetGame() {
  clearTimers();
  gameState.score = 0;
  gameState.timeLeft = GAME_DURATION;
  gameState.isRunning = false;
  gameState.isStarting = false;
  gameState.isResolvingHit = false;
  resetBoard();
  renderStats();
  stopBackgroundLoop();
  hideDifficultyMenu();
  showStatusOverlay('Press Start Game', false);
}

function showRandomMole() {
  if (!gameState.isRunning || gameState.isResolvingHit || boardCells.length === 0) {
    return;
  }

  resetBoard();

  const nextIndex = pickRandomCellIndex();
  const targetCell = boardCells[nextIndex];
  const nextCharacterType =
    Math.random() < gameState.selectedDifficulty.princessSpawnProbability ? 'princess' : 'mole';

  gameState.activeCellIndex = nextIndex;
  gameState.activeCharacterType = nextCharacterType;
  targetCell.classList.add('is-active');
  targetCell.classList.add(nextCharacterType === 'princess' ? 'has-princess' : 'has-mole');
  playSound(sounds.pop);
}

function hitMole(index) {
  if (!gameState.isRunning || gameState.isResolvingHit || index !== gameState.activeCellIndex) {
    return;
  }

  const targetCell = boardCells[index];

  if (!targetCell) {
    return;
  }

  gameState.isResolvingHit = true;
  clearSpawnInterval();

  targetCell.classList.remove('is-active');
  targetCell.classList.add('is-hit');

  if (gameState.activeCharacterType === 'princess') {
    gameState.score -= 1;
    playSound(sounds.hitPrincess);
  } else {
    gameState.score += 1;
    playSound(sounds.hitMole);
  }

  renderStats();

  gameState.hitResetTimeoutId = window.setTimeout(() => {
    resetBoard();
    gameState.isResolvingHit = false;

    if (!gameState.isRunning) {
      return;
    }

    showRandomMole();
    gameState.spawnIntervalId = window.setInterval(showRandomMole, gameState.selectedDifficulty.spawnInterval);
  }, gameState.selectedDifficulty.hitResetDelay);
}

function pickRandomCellIndex() {
  let randomIndex = Math.floor(Math.random() * boardCells.length);

  if (boardCells.length > 1 && randomIndex === gameState.activeCellIndex) {
    randomIndex = (randomIndex + 1) % boardCells.length;
  }

  return randomIndex;
}

function clearTimers() {
  clearSpawnInterval();

  if (gameState.countdownIntervalId) {
    window.clearInterval(gameState.countdownIntervalId);
    gameState.countdownIntervalId = null;
  }

  if (gameState.hitResetTimeoutId) {
    window.clearTimeout(gameState.hitResetTimeoutId);
    gameState.hitResetTimeoutId = null;
  }

  if (gameState.statusOverlayTimeoutId) {
    window.clearTimeout(gameState.statusOverlayTimeoutId);
    gameState.statusOverlayTimeoutId = null;
  }

  if (gameState.startCountdownTimeoutId) {
    window.clearTimeout(gameState.startCountdownTimeoutId);
    gameState.startCountdownTimeoutId = null;
  }
}

function clearSpawnInterval() {
  if (gameState.spawnIntervalId) {
    window.clearInterval(gameState.spawnIntervalId);
    gameState.spawnIntervalId = null;
  }
}

function toggleDifficultyMenu() {
  if (!difficultyMenuElement || !startButton) {
    return;
  }

  const willOpen = difficultyMenuElement.hidden;
  difficultyMenuElement.hidden = !willOpen;
  startButton.setAttribute('aria-expanded', String(willOpen));
}

function hideDifficultyMenu() {
  if (!difficultyMenuElement || !startButton) {
    return;
  }

  difficultyMenuElement.hidden = true;
  startButton.setAttribute('aria-expanded', 'false');
}

function handleDocumentPointerDown(event) {
  if (!difficultyMenuElement || difficultyMenuElement.hidden) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (difficultyMenuElement.contains(target) || startButton.contains(target)) {
    return;
  }

  hideDifficultyMenu();
}

function blockGestureZoom(event) {
  event.preventDefault();
}

function blockMultiTouchZoom(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}

function resetBoard() {
  boardCells.forEach((cell) => {
    cell.classList.remove('is-active', 'is-hit', 'has-mole', 'has-princess');
  });

  gameState.activeCellIndex = null;
  gameState.activeCharacterType = null;
}

function renderStats() {
  scoreElement.textContent = String(gameState.score);
  timerElement.textContent = String(gameState.timeLeft);
  bestScoreElement.textContent = String(gameState.bestScore);
}

function showStatusOverlay(message, autoHide = true, variant = 'prompt') {
  if (!statusOverlayElement) {
    return;
  }

  statusOverlayElement.textContent = message;
  statusOverlayElement.classList.toggle('is-countdown', variant === 'countdown');
  statusOverlayElement.classList.add('is-visible');

  if (gameState.statusOverlayTimeoutId) {
    window.clearTimeout(gameState.statusOverlayTimeoutId);
    gameState.statusOverlayTimeoutId = null;
  }

  if (!autoHide) {
    return;
  }

  gameState.statusOverlayTimeoutId = window.setTimeout(() => {
    hideStatusOverlay();
  }, STATUS_OVERLAY_DURATION);
}

function hideStatusOverlay() {
  if (!statusOverlayElement) {
    return;
  }

  statusOverlayElement.classList.remove('is-visible');
  statusOverlayElement.classList.remove('is-countdown');

  if (gameState.statusOverlayTimeoutId) {
    window.clearTimeout(gameState.statusOverlayTimeoutId);
    gameState.statusOverlayTimeoutId = null;
  }
}

function runStartCountdown() {
  hideStatusOverlay();
  showCountdownStep(0);
}

function showCountdownStep(stepIndex) {
  const stepText = START_COUNTDOWN_STEPS[stepIndex];

  if (!stepText) {
    hideStatusOverlay();
    beginGameplay();
    return;
  }

  showStatusOverlay(stepText, false, 'countdown');

  gameState.startCountdownTimeoutId = window.setTimeout(() => {
    showCountdownStep(stepIndex + 1);
  }, START_COUNTDOWN_STEP_DURATION);
}

function beginGameplay() {
  gameState.startCountdownTimeoutId = null;
  gameState.isStarting = false;
  gameState.isRunning = true;
  startBackgroundLoop();
  showRandomMole();
  gameState.spawnIntervalId = window.setInterval(showRandomMole, gameState.selectedDifficulty.spawnInterval);
  gameState.countdownIntervalId = window.setInterval(tick, 1000);
}

function createSoundBank() {
  const bgLoop = new Audio(SOUND_FILES.bgLoop);
  bgLoop.loop = true;
  bgLoop.preload = 'auto';
  bgLoop.volume = 0.4;

  const gameStart = new Audio(SOUND_FILES.gameStart);
  gameStart.preload = 'auto';
  gameStart.volume = 0.8;

  const pop = new Audio(SOUND_FILES.pop);
  pop.preload = 'auto';
  pop.volume = 0.75;

  const hitMole = new Audio(SOUND_FILES.hitMole);
  hitMole.preload = 'auto';
  hitMole.volume = 0.85;

  const hitPrincess = new Audio(SOUND_FILES.hitPrincess);
  hitPrincess.preload = 'auto';
  hitPrincess.volume = 0.85;

  const gameOver = new Audio(SOUND_FILES.gameOver);
  gameOver.preload = 'auto';
  gameOver.volume = 0.85;

  return {
    bgLoop,
    gameStart,
    pop,
    hitMole,
    hitPrincess,
    gameOver,
  };
}

function playSound(audio) {
  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  const playPromise = audio.play();

  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function startBackgroundLoop() {
  if (!sounds.bgLoop) {
    return;
  }

  sounds.bgLoop.currentTime = 0;
  const playPromise = sounds.bgLoop.play();

  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function stopBackgroundLoop() {
  if (!sounds.bgLoop) {
    return;
  }

  sounds.bgLoop.pause();
  sounds.bgLoop.currentTime = 0;
}

function updateViewportScale() {
  if (!viewportStageElement || !appShellElement) {
    return;
  }

  const viewport = window.visualViewport;
  const viewportWidth = viewport ? viewport.width : window.innerWidth;
  const viewportHeight = viewport ? viewport.height : window.innerHeight;
  const viewportOffsetLeft = viewport ? viewport.offsetLeft : 0;
  const viewportOffsetTop = viewport ? viewport.offsetTop : 0;

  appShellElement.style.left = `${viewportOffsetLeft + viewportWidth / 2}px`;
  appShellElement.style.top = `${viewportOffsetTop + viewportHeight / 2}px`;
  appShellElement.style.transform = 'translate(-50%, -50%) scale(1)';

  const naturalWidth = appShellElement.offsetWidth;
  const naturalHeight = appShellElement.offsetHeight;

  if (!naturalWidth || !naturalHeight) {
    return;
  }

  const scale = Math.min(1, viewportWidth / naturalWidth, viewportHeight / naturalHeight);
  appShellElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

init();
