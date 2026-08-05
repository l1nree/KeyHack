import GameReplica from './models/GameReplica.js';
import CanvasView from './views/CanvasView.js';
import MockClient from './network/MockClient.js';
import UIView from './views/UIView.js';
import InputController from './controllers/InputController.js';
import TaskGenerator from './models/TaskGenerator.js'; // 1. Импортируем генератор

const gameModel = new GameReplica('player1');
const canvasView = new CanvasView('gameCanvas');
const uiView = new UIView();
const taskGenerator = new TaskGenerator(); // 2. Инициализируем генератор

// 3. Обновляем коллбэк контроллера
const inputController = new InputController(canvasView, gameModel, (node) => {
    // Генерируем легкую задачу при клике
    const task = taskGenerator.getTask('easy');
    
    // Выводим в консоль для отладки
    console.log(`Узел ${node.id} атакован! Задача:`, task);
    
    // Передаем и узел, и саму задачу в интерфейс
    uiView.showHackModal(node, task);
});

function handleStateReceived(newState) {
    gameModel.updateState(newState);
}

const client = new MockClient(handleStateReceived);
client.connect();

uiView.updateDashboard('10.0.0.99'); 

function gameLoop() {
    canvasView.render(gameModel.state);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

document.addEventListener("DOMContentLoaded", () => {
  const authScreen = document.getElementById("auth-screen");
  const gameScreen = document.getElementById("game-screen");
  const registerBtn = document.getElementById("register-btn");
  const nicknameInput = document.getElementById("nickname-input");

  const playerNameDisplay = document.getElementById("player-name-display");
  const playerIdDisplay = document.getElementById("player-id-display");

  // Проверяем, есть ли уже сохраненный аккаунт
  const savedPlayerId = localStorage.getItem("keyhack_player_id");
  const savedNickname = localStorage.getItem("keyhack_nickname");

  if (savedPlayerId && savedNickname) {
    showGameScreen(savedPlayerId, savedNickname);
  }

  registerBtn.addEventListener("click", async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      alert("Введите никнейм");
      return;
    }

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

        // Сохраняем данные локально
        localStorage.setItem("keyhack_player_id", data.player_id);
        localStorage.setItem("keyhack_nickname", data.nickname);

        showGameScreen(data.player_id, data.nickname);
      } else {
        alert("Ошибка при регистрации");
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
      alert("Не удалось подключиться к серверу");
    }
  });

  function showGameScreen(playerId, nickname) {
    authScreen.style.display = "none";
    gameScreen.style.display = "block";

    playerNameDisplay.textContent = nickname;
    playerIdDisplay.textContent = playerId;

    // Здесь мы в будущем будем передавать playerId при подключении к WebSocket
    // client.connect(playerId);
  }
});