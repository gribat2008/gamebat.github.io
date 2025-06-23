// Общие переменные
let coins = 100;
const coinsDisplay = document.getElementById("coins");
const message = document.getElementById("message");
const modeSelect = document.getElementById("mode");
const playerNameDisplay = document.getElementById("player-name");

// Для режима hard
let hardSecret = null;
let hardTries = 7;

// Для режима bombs
const bombsCount = 3;
const totalCells = 20;
let bombsPositions = [];
let bombsTries = 5;
let bombsRevealed = new Set();

// Авторизация
let username = null;

// Статистика игрока
let stats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0
};

// Таблица рекордов (топ 5)
let leaderboard = [];

// --- Авторизация ---
function login() {
  const usernameInput = document.getElementById("username");
  const name = usernameInput.value.trim();

  if (!name) {
    alert("Введите имя пользователя");
    return;
  }

  username = name;
  localStorage.setItem("username", username);

  document.getElementById("login-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";

  playerNameDisplay.textContent = username;

  loadUserData(username);
  switchMode();
}

// Загрузка данных пользователя
function loadUserData(name) {
  const savedCoins = localStorage.getItem(`coins_${name}`);
  coins = savedCoins ? parseInt(savedCoins) : 100;

  const savedStats = localStorage.getItem(`stats_${name}`);
  if (savedStats) stats = JSON.parse(savedStats);
  else stats = {gamesPlayed:0, wins:0, losses:0};

  const savedBoard = localStorage.getItem("leaderboard");
  leaderboard = savedBoard ? JSON.parse(savedBoard) : [];

  updateCoinsDisplay();
  updateStatsDisplay();
  updateLeaderboardDisplay();
}

// Сохранение данных пользователя
function saveUserData() {
  if (!username) return;
  localStorage.setItem(`coins_${username}`, coins);
  localStorage.setItem(`stats_${username}`, JSON.stringify(stats));
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

// --- Переключение режима ---
function switchMode() {
  message.textContent = "";
  document.querySelectorAll(".mode-section").forEach(div => div.style.display = "none");

  if (modeSelect.value === "casino") {
    document.getElementById("casino-mode").style.display = "block";
  } else if (modeSelect.value === "hard") {
    document.getElementById("hard-mode").style.display = "block";
  } else if (modeSelect.value === "bombs") {
    document.getElementById("bombs-mode").style.display = "block";
    if (bombsPositions.length === 0) resetBombs();
  }
}

// --- Обновление баланса ---
function updateCoinsDisplay() {
  coinsDisplay.textContent = coins;
  saveUserData();
}

// --- Проверка баланса ---
function checkBalance() {
  if (coins <= 0) {
    message.textContent = "У тебя нет монет! Получи монеты через рекламу.";
  }
}

// --- Игра "Угадай число (1-10, ставка)" ---
function playCasino() {
  const guessInput = document.getElementById("casino-guess");
  const betInput = document.getElementById("casino-bet");

  let guess = parseInt(guessInput.value);
  let bet = parseInt(betInput.value);

  if (coins <= 0) {
    message.textContent = "У тебя нет монет! Получи монеты через рекламу.";
    return;
  }

  if (isNaN(guess) || guess < 1 || guess > 10) {
    message.textContent = "Введите число от 1 до 10!";
    return;
  }
  if (isNaN(bet) || bet <= 0) {
    message.textContent = "Введите корректную ставку!";
    return;
  }
  if (bet > coins) {
    message.textContent = "У тебя недостаточно монет для ставки.";
    return;
  }

  const randomNum = Math.floor(Math.random() * 10) + 1;
  let win = false;

  if (guess === randomNum) {
    const winAmount = bet * 5;
    coins += winAmount;
    message.textContent = `Поздравляем! Было число ${randomNum}. Вы выиграли ${winAmount} монет!`;
    win = true;
  } else {
    coins -= bet;
    message.textContent = `Увы! Было число ${randomNum}. Вы потеряли ${bet} монет.`;
  }

  updateCoinsDisplay();
  checkBalance();
  updateStats(win);
  updateLeaderboard();
}

// --- Игра "Угадай число (1-100, подсказки)" ---
function playHard() {
  if (hardSecret === null) {
    hardSecret = Math.floor(Math.random() * 100) + 1;
    hardTries = 7;
    document.getElementById("hard-tries").textContent = hardTries;
  }

  if (hardTries <= 0) {
    message.textContent = `Игра окончена! Число было ${hardSecret}. Нажми "Сбросить игру" для новой попытки.`;
    return;
  }

  const guessInput = document.getElementById("hard-guess");
  let guess = parseInt(guessInput.value);

  if (isNaN(guess) || guess < 1 || guess > 100) {
    message.textContent = "Введите число от 1 до 100!";
    return;
  }

  hardTries--;
  document.getElementById("hard-tries").textContent = hardTries;

  if (guess === hardSecret) {
    const reward = 20;
    coins += reward;
    updateCoinsDisplay();
    message.textContent = `Ура! Ты угадал число ${hardSecret} и получил ${reward} монет! Нажми "Сбросить игру" для новой игры.`;
    updateStats(true);
    updateLeaderboard();
    hardSecret = null; // сброс для новой игры
  } else if (hardTries === 0) {
    message.textContent = `Попытки закончились! Число было ${hardSecret}. Нажми "Сбросить игру" для новой игры.`;
    updateStats(false);
    hardSecret = null;
  } else if (guess < hardSecret) {
    message.textContent = `Загаданное число больше. Осталось попыток: ${hardTries}.`;
  } else {
    message.textContent = `Загаданное число меньше. Осталось попыток: ${hardTries}.`;
  }
}

// Сброс игры hard
function resetHard() {
  hardSecret = Math.floor(Math.random() * 100) + 1;
  hardTries = 7;
  document.getElementById("hard-tries").textContent = hardTries;
  message.textContent = "Игра сброшена. Угадывай число от 1 до 100!";
}

// --- Игра "Бомбы" ---
function resetBombs() {
  bombsTries = 5;
  bombsRevealed.clear();
  document.getElementById("bombs-tries").textContent = bombsTries;
  bombsPositions = [];

  // Случайно выбираем позиции бомб
  while (bombsPositions.length < bombsCount) {
    const pos = Math.floor(Math.random() * totalCells);
    if (!bombsPositions.includes(pos)) bombsPositions.push(pos);
  }

  // Создаём сетку
  const grid = document.getElementById("bombs-grid");
  grid.innerHTML = "";

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.classList.add("bomb-cell");
    cell.dataset.index = i;
    cell.textContent = "";
    cell.onclick = () => selectBombCell(i, cell);
    grid.appendChild(cell);
  }

  message.textContent = "Начни выбирать квадратики!";
}

function selectBombCell(index, cell) {
  if (bombsRevealed.has(index) || bombsTries <= 0) return;

  bombsRevealed.add(index);

  if (bombsPositions.includes(index)) {
    // Бомба
    cell.classList.add("bomb");
    message.textContent = "Упс! Ты наткнулся на бомбу. Игра окончена.";
    bombsTries = 0;
    updateStats(false);
  } else {
    // Безопасно
    cell.classList.add("safe");
    bombsTries--;
    document.getElementById("bombs-tries").textContent = bombsTries;
    message.textContent = "Отлично! Продолжай.";

    if (bombsTries === 0) {
      const reward = 30;
      coins += reward;
      updateCoinsDisplay();
      message.textContent = `Поздравляем! Ты выиграл ${reward} монет, избежав бомб!`;
      updateStats(true);
      updateLeaderboard();
    }
  }
}

// --- Статистика игрока и рекорды ---

// Обновление статистики при игре
function updateStats(win) {
  stats.gamesPlayed++;
  if (win) stats.wins++; else stats.losses++;
  saveUserData();
  updateStatsDisplay();
}

// Обновление отображения статистики
function updateStatsDisplay() {
  document.getElementById("stat-games").textContent = stats.gamesPlayed;
  document.getElementById("stat-wins").textContent = stats.wins;
  document.getElementById("stat-losses").textContent = stats.losses;
}

// Обновление таблицы рекордов
function updateLeaderboardDisplay() {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  leaderboard.sort((a,b) => b.coins - a.coins);
  leaderboard.slice(0,5).forEach(record => {
    const li = document.createElement("li");
    li.textContent = `${record.username}: ${record.coins} монет`;
    list.appendChild(li);
  });
}

// Обновление рекорда игрока
function updateLeaderboard() {
  const recordIndex = leaderboard.findIndex(r => r.username === username);
  if (recordIndex >= 0) {
    if (coins > leaderboard[recordIndex].coins) {
      leaderboard[recordIndex].coins = coins;
    }
  } else {
    leaderboard.push({username, coins});
  }
  saveUserData();
  updateLeaderboardDisplay();
}

// --- Кнопка "посмотреть рекламу" (условно) ---
function getFreeCoins() {
  message.textContent = "Реклама... Пожалуйста, подождите 5 секунд.";
  setTimeout(() => {
    const bonus = 20;
    coins += bonus;
    updateCoinsDisplay();
    message.textContent = `Спасибо за просмотр рекламы! Вы получили ${bonus} монет.`;
  }, 5000);
}

// --- Загрузка при старте страницы ---
window.onload = () => {
  const savedName = localStorage.getItem("username");
  if (savedName) {
    username = savedName;
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    playerNameDisplay.textContent = username;
    loadUserData(username);
    switchMode();
  }
};
