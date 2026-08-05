import GameReplica from "./models/GameReplica.js";
import CanvasView from "./views/CanvasView.js";
import MockClient from "./network/MockClient.js";
import UIView from "./views/UIView.js";
import InputController from "./controllers/InputController.js";
import TaskGenerator from "./models/TaskGenerator.js";
import { NetworkClient } from "./network/NetworkClient.js";

document.addEventListener("DOMContentLoaded", () => {
  // UI элементы
  const authScreen = document.getElementById("auth-screen");
  const gameScreen = document.getElementById("game-screen");
  const lobbyScreen = document.getElementById("lobby-screen");

  const registerBtn = document.getElementById("register-btn");
  const nicknameInput = document.getElementById("nickname-input");

  const createLobbyBtn = document.getElementById("create-lobby-btn");
  const joinLobbyBtn = document.getElementById("join-lobby-btn");
  const joinLobbyInput = document.getElementById("join-lobby-input");

  const playerNameDisplay = document.getElementById("player-name-display");
  const playerIdDisplay = document.getElementById("player-id-display");

  const lobbyCodeDisplay = document.getElementById("lobby-code-display");
  const lobbyCount = document.getElementById("lobby-count");
  const lobbyPlayersList = document.getElementById("lobby-players-list");

  // Графика
  const gameModel = new GameReplica("player1");
  const canvasView = new CanvasView("gameCanvas");
  const uiView = new UIView();
  const taskGenerator = new TaskGenerator();
  const inputController = new InputController(canvasView, gameModel, (node) => {
    const task = taskGenerator.getTask("easy");
    uiView.showHackModal(node, task);
  });

  function handleStateReceived(newState) {
    gameModel.updateState(newState);
  }
  function gameLoop() {
    canvasView.render(gameModel.state);
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // Сеть
  const netClient = new NetworkClient("wss://keyhack.albov.net/ws");

  // Обработка сообщений от сервера
  netClient.onMessage((data) => {
    if (data.type === "pong") {
      alert(data.payload.message);
    } else if (data.type === "lobby_update") {
      // Пришло обновление лобби (кто-то зашел/создал)
      const lobbyData = data.payload.lobby_data;

      // Прячем меню, показываем лобби
      gameScreen.style.display = "none";
      lobbyScreen.style.display = "block";

      // Заполняем данные
      lobbyCodeDisplay.textContent = data.payload.lobby_code;

      const players = Object.values(lobbyData.players);
      lobbyCount.textContent = players.length;

      // Отрисовываем список игроков
      lobbyPlayersList.innerHTML = "";
      players.forEach((p) => {
        const statusColor = p.is_ready ? "lime" : "gray";
        const statusText = p.is_ready ? "Готов" : "Ожидание";

        lobbyPlayersList.innerHTML += `
                    <div class="player-list-item">
                        <span>${p.nickname}</span>
                        <span style="color: ${statusColor};">${statusText}</span>
                    </div>
                `;
      });

      if (data.payload.message) {
        console.log(data.payload.message);
      }
    } else if (data.type === "error") {
      alert("Ошибка: " + data.payload.message);
    }
  });

  // Обработка кнопок
  if (createLobbyBtn) {
    createLobbyBtn.addEventListener("click", () => {
      netClient.sendAction("create_lobby", { max_players: 4 });
    });
  }

  if (joinLobbyBtn) {
    joinLobbyBtn.addEventListener("click", () => {
      const code = joinLobbyInput.value.trim();
      if (code.length !== 4) {
        alert("Код лобби должен состоять из 4 символов");
        return;
      }
      netClient.sendAction("join_lobby", { lobby_code: code });
    });
  }

  const mockClient = new MockClient(handleStateReceived);

  // Авторизация
  const savedPlayerId = localStorage.getItem("keyhack_player_id");
  const savedNickname = localStorage.getItem("keyhack_nickname");

  if (savedPlayerId && savedNickname) {
    showGameScreen(savedPlayerId, savedNickname);
  }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("keyhack_player_id", data.player_id);
        localStorage.setItem("keyhack_nickname", data.nickname);
        showGameScreen(data.player_id, data.nickname);
      } else {
        alert("Ошибка при регистрации.");
        registerBtn.textContent = "ИНИЦИАЛИЗАЦИЯ";
        registerBtn.disabled = false;
      }
    } catch (error) {
      alert("Не удалось подключиться к серверу");
      registerBtn.textContent = "ИНИЦИАЛИЗАЦИЯ";
      registerBtn.disabled = false;
    }
  });

  function showGameScreen(playerId, nickname) {
    authScreen.style.display = "none";
    gameScreen.style.display = "block";
    playerNameDisplay.textContent = nickname;
    playerIdDisplay.textContent = playerId;

    try {
      uiView.updateDashboard("10.0.0.99");
    } catch (e) {}

    netClient.connect(playerId);
    mockClient.connect();
  }
});
