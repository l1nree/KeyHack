// Импорты для локальной отрисовки и логики
import GameReplica from "./models/GameReplica.js";
import CanvasView from "./views/CanvasView.js";
import MockClient from "./network/MockClient.js";
import UIView from "./views/UIView.js";
import InputController from "./controllers/InputController.js";
import TaskGenerator from "./models/TaskGenerator.js";

// Импорт нового клиента для связи с сервером
import { NetworkClient } from "./network/NetworkClient.js";

// --- ИНИЦИАЛИЗАЦИЯ ИГРОВОЙ ГРАФИКИ ---
const gameModel = new GameReplica("player1");
const canvasView = new CanvasView("gameCanvas");
const uiView = new UIView();
const taskGenerator = new TaskGenerator();

const inputController = new InputController(canvasView, gameModel, (node) => {
  const task = taskGenerator.getTask("easy");
  console.log(`Узел ${node.id} атакован! Задача:`, task);
  uiView.showHackModal(node, task);
});

// Коллбэк для обновления локального состояния
function handleStateReceived(newState) {
  gameModel.updateState(newState);
}

// Запускаем игровой цикл отрисовки
function gameLoop() {
  canvasView.render(gameModel.state);
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// --- ЛОГИКА АВТОРИЗАЦИИ И СЕТИ ---
document.addEventListener("DOMContentLoaded", () => {
  const authScreen = document.getElementById("auth-screen");
  const gameScreen = document.getElementById("game-screen");
  const registerBtn = document.getElementById("register-btn");
  const nicknameInput = document.getElementById("nickname-input");
  const pingBtn = document.getElementById("pingBtn"); // Получаем кнопку пинга из DOM

  const playerNameDisplay = document.getElementById("player-name-display");
  const playerIdDisplay = document.getElementById("player-id-display");

  // Инициализируем сетевого клиента
  const netClient = new NetworkClient("wss://keyhack.albov.net/ws");

  // Настраиваем обработчик ответов от сервера
  netClient.onMessage((data) => {
    if (data.type === "pong") {
      alert(data.payload.message);
    }
  });

  // Привязываем кнопку проверки канала
  if (pingBtn) {
    pingBtn.addEventListener("click", () => {
      netClient.sendAction("ping", { test: "Сигнал от оператора" });
    });
  }

  // Инициализируем локальную симуляцию (моковый клиент)
  const mockClient = new MockClient(handleStateReceived);

  // Проверяем, есть ли уже сохраненный аккаунт
  const savedPlayerId = localStorage.getItem("keyhack_player_id");
  const savedNickname = localStorage.getItem("keyhack_nickname");

  if (savedPlayerId && savedNickname) {
    showGameScreen(savedPlayerId, savedNickname);
  }

  // Логика нажатия на "Инициализация" (Регистрация)
  registerBtn.addEventListener("click", async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      alert("Введите позывной");
      return;
    }

    registerBtn.textContent = "ПОДКЛЮЧЕНИЕ...";
    registerBtn.disabled = true;

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: nickname }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("keyhack_player_id", data.player_id);
        localStorage.setItem("keyhack_nickname", data.nickname);
        showGameScreen(data.player_id, data.nickname);
      } else {
        alert("Ошибка при регистрации. Возможно сервер недоступен.");
        resetAuthButton();
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
      alert("Не удалось подключиться к серверу");
      resetAuthButton();
    }
  });

  function resetAuthButton() {
    registerBtn.textContent = "ИНИЦИАЛИЗАЦИЯ";
    registerBtn.disabled = false;
  }

  function showGameScreen(playerId, nickname) {
    authScreen.style.display = "none";
    gameScreen.style.display = "block";

    playerNameDisplay.textContent = nickname;
    playerIdDisplay.textContent = playerId;

    // Обновляем IP в Dashboard (если нужно)
    uiView.updateDashboard("10.0.0.99");

    // 1. Подключаемся к реальному серверу через WebSocket
    netClient.connect(playerId);

    // 2. Запускаем локальную генерацию узлов для визуала
    mockClient.connect();
  }
});
