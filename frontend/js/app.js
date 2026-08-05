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
  const lobbyScreen = document.getElementById("lobby-screen");

  const registerBtn = document.getElementById("register-btn");
  const nicknameInput = document.getElementById("nickname-input");
  const pingBtn = document.getElementById("pingBtn");

  const createLobbyBtn = document.getElementById("create-lobby-btn");
  const joinLobbyBtn = document.getElementById("join-lobby-btn");
  const joinLobbyInput = document.getElementById("join-lobby-input");
  const readyBtn = document.getElementById("ready-btn");

  const playerNameDisplay = document.getElementById("player-name-display");
  const playerIdDisplay = document.getElementById("player-id-display");

  const lobbyCodeDisplay = document.getElementById("lobby-code-display");
  const lobbyCount = document.getElementById("lobby-count");
  const lobbyPlayersList = document.getElementById("lobby-players-list");

  // Глобальные переменные сессии
  let currentPlayerId = null;
  let currentLobbyCode = null;
  let isPlayerReady = false;

  // --- 2. Инициализация игры (Графика и Логика) ---
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
    } else if (data.type === "lobby_update") {
      const lobbyData = data.payload.lobby_data;
      currentLobbyCode = data.payload.lobby_code;

      if (gameScreen) gameScreen.style.display = "none";

      if (lobbyScreen) {
        lobbyScreen.style.display = "block";
        lobbyCodeDisplay.textContent = currentLobbyCode;

        const players = Object.values(lobbyData.players);
        lobbyCount.textContent = players.length;

        lobbyPlayersList.innerHTML = "";
        players.forEach((p) => {
          const statusColor = p.is_ready ? "lime" : "gray";
          const statusText = p.is_ready ? "Готов" : "Ожидание";

          lobbyPlayersList.innerHTML += `
                        <div class="player-list-item" style="background: rgba(255,255,255,0.1); padding: 10px; margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between;">
                            <span>${p.nickname}</span>
                            <span style="color: ${statusColor};">${statusText}</span>
                        </div>
                    `;
        });

        // Синхронизируем состояние кнопки готовности
        if (currentPlayerId && lobbyData.players[currentPlayerId]) {
          isPlayerReady = lobbyData.players[currentPlayerId].is_ready;
          if (isPlayerReady) {
            readyBtn.textContent = "ОТМЕНИТЬ ГОТОВНОСТЬ";
            readyBtn.style.background = "rgba(0, 255, 0, 0.2)";
          } else {
            readyBtn.textContent = "ПОДТВЕРДИТЬ ГОТОВНОСТЬ";
            readyBtn.style.background = "rgba(0, 255, 204, 0.1)";
          }
        }
      }
    } else if (data.type === "match_start") {
      // ИГРА НАЧАЛАСЬ
      if (lobbyScreen) lobbyScreen.style.display = "none";
      alert(data.payload.message);
      // Тут мы открываем саму карту (она уже на фоне, так что мы просто убрали лишние меню)
    } else if (data.type === "error") {
      alert("Ошибка: " + data.payload.message);
    }
  });

  // Обработка кнопок
  if (pingBtn) {
    pingBtn.addEventListener("click", () => {
      netClient.sendAction("ping", { test: "Сигнал от оператора" });
    });
  }

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

  if (readyBtn) {
    readyBtn.addEventListener("click", () => {
      if (!currentLobbyCode) return;
      // Отправляем инвертированное состояние на сервер
      netClient.sendAction("set_ready", {
        lobby_code: currentLobbyCode,
        is_ready: !isPlayerReady,
      });
    });
  }

  const mockClient = new MockClient(handleStateReceived);

  // --- 4. Авторизация ---
  const savedPlayerId = localStorage.getItem("keyhack_player_id");
  const savedNickname = localStorage.getItem("keyhack_nickname");

  if (savedPlayerId && savedNickname) {
    currentPlayerId = savedPlayerId;
    showGameScreen(savedPlayerId, savedNickname);
  }

  if (registerBtn) {
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
          currentPlayerId = data.player_id;
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
  }

  function resetAuthButton() {
    if (registerBtn) {
      registerBtn.textContent = "ИНИЦИАЛИЗАЦИЯ";
      registerBtn.disabled = false;
    }
  }

  function showGameScreen(playerId, nickname) {
    if (authScreen) authScreen.style.display = "none";
    if (gameScreen) gameScreen.style.display = "block";

    if (playerNameDisplay) playerNameDisplay.textContent = nickname;
    if (playerIdDisplay) playerIdDisplay.textContent = playerId;

    try {
      uiView.updateDashboard("10.0.0.99");
    } catch (e) {}

    netClient.connect(playerId);
    mockClient.connect();
  }
});
