import GameReplica from "./models/GameReplica.js";
import CanvasView from "./views/CanvasView.js";
import MockClient from "./network/MockClient.js";
import UIView from "./views/UIView.js";
import InputController from "./controllers/InputController.js";
import TaskGenerator from "./models/TaskGenerator.js";
import { NetworkClient } from "./network/NetworkClient.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Элементы UI ---
  const authScreen = document.getElementById("auth-screen");
  const gameScreen = document.getElementById("game-screen");
  const registerBtn = document.getElementById("register-btn");
  const nicknameInput = document.getElementById("nickname-input");
  const pingBtn = document.getElementById("pingBtn");

  // Новые элементы управления лобби
  const createLobbyBtn = document.getElementById("create-lobby-btn");
  const joinLobbyBtn = document.getElementById("join-lobby-btn");
  const joinLobbyInput = document.getElementById("join-lobby-input");

  const playerNameDisplay = document.getElementById("player-name-display");
  const playerIdDisplay = document.getElementById("player-id-display");

  // --- 2. Инициализация игры (Графика) ---
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

  // --- 3. Инициализация сети ---
  const netClient = new NetworkClient("wss://keyhack.albov.net/ws");

  netClient.onMessage((data) => {
    if (data.type === "pong") {
      alert(data.payload.message);
    } else if (data.type === "lobby_created") {
      alert(
        `Сессия успешно создана! Ваш КОД лобби: ${data.payload.lobby_code}`,
      );
      console.log("Данные лобби:", data.payload.lobby_data);
    }
  });

  if (pingBtn) {
    pingBtn.addEventListener("click", () => {
      netClient.sendAction("ping", { test: "Сигнал от оператора" });
    });
  }

  // Обработка кнопки "Создать лобби"
  if (createLobbyBtn) {
    createLobbyBtn.addEventListener("click", () => {
      netClient.sendAction("create_lobby", { max_players: 4 });
    });
  }

  const mockClient = new MockClient(handleStateReceived);

  // --- 4. Авторизация ---
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
        resetAuthButton();
      }
    } catch (error) {
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

    try {
      uiView.updateDashboard("10.0.0.99");
    } catch (e) {}

    netClient.connect(playerId);
    mockClient.connect();
  }
});
