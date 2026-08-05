export class DevTools {
  /**
   * @param {Object} netClient - Клиент для взаимодействия с реальным сервером
   * @param {Object} mockClient - Локальный тестовый клиент
   * @param {HTMLCanvasElement} gameCanvas - Элемент canvas игрового поля
   */
  constructor(netClient, mockClient, gameCanvas) {
    this.netClient = netClient;
    this.mockClient = mockClient;
    this.gameCanvas = gameCanvas;
    this.panel = null;
  }

  /**
   * Инициализация панели разработчика и привязка обработчиков событий
   */
  init() {
    // Создаем панель разработчика
    this.panel = document.createElement("div");
    this.panel.id = "dev-panel";
    this.panel.style.cssText = `
            position: fixed; top: 20px; left: 20px; width: 350px;
            background: rgba(10, 10, 20, 0.95); border: 1px solid #ff00ff;
            color: #ff00ff; padding: 15px; border-radius: 8px;
            font-family: 'JetBrains Mono', monospace; font-size: 12px;
            z-index: 9999; box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
            display: flex; flex-direction: column; gap: 10px;
        `;

    this.panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ff00ff; padding-bottom: 5px;">
                <strong>DEV TOOLS [ROOT]</strong>
                <span id="dev-close" style="cursor: pointer; color: red;">[X]</span>
            </div>
            
            <button id="dev-btn-canvas" style="padding: 8px; background: rgba(255,0,255,0.1); border: 1px solid #ff00ff; color: #ff00ff; cursor: pointer;">
                1. Открыть игровое поле (Тест 1 игрока)
            </button>
            
            <button id="dev-btn-logs" style="padding: 8px; background: rgba(255,0,255,0.1); border: 1px solid #ff00ff; color: #ff00ff; cursor: pointer;">
                2. Очистить окно логов
            </button>

            <button id="dev-btn-reset" style="padding: 8px; background: rgba(255,0,0,0.1); border: 1px solid red; color: red; cursor: pointer;">
                3. Очистить кэш (Выход в обычный режим)
            </button>
            
            <div id="dev-logs" style="height: 150px; overflow-y: auto; background: #000; padding: 5px; color: #00ff00; border: 1px solid #333;">
                > Админ-терминал активирован.<br>
            </div>
        `;

    document.body.appendChild(this.panel);

    // --- ЛОГИКА КНОПОК ПУЛЬТА ---

    // 1. Активация игрового поля в безопасном тестовом режиме
    document.getElementById("dev-btn-canvas").addEventListener("click", () => {
      this.activateTestMode();
    });

    // 2. Очистить логи
    document.getElementById("dev-btn-logs").addEventListener("click", () => {
      const logsBox = document.getElementById("dev-logs");
      if (logsBox) logsBox.innerHTML = "";
      this.log("Логи очищены.");
    });

    // 3. Очистить кэш и перезагрузить
    document.getElementById("dev-btn-reset").addEventListener("click", () => {
      this.log("Сброс админ-сессии...");
      localStorage.clear();
      location.reload();
    });

    // Скрыть саму панель
    document.getElementById("dev-close").addEventListener("click", () => {
      this.panel.style.display = "none";
    });
  }

  /**
   * Безопасный запуск тестового режима игрового поля
   */
  activateTestMode() {
    if (!this.gameCanvas) {
      this.log("Ошибка: холст (gameCanvas) не найден.");
      return;
    }

    // 1. Скрываем только экраны входа и лобби. Экран 'game-screen' должен быть виден,
    // чтобы интерфейс задач и захвата узлов не блокировался.
    const screensToHide = ["auth-screen", "lobby-screen"];
    screensToHide.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    // Отображаем основной игровой экран
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      gameScreen.style.display = "block";
    }

    // Включаем отображение холста
    this.gameCanvas.style.display = "block";

    // 2. Подключаем mockClient для имитации работы бэкенда
    this.mockClient.connect();

    // 3. Отправляем событие активации с передачей mockClient в подробностях (detail)
    document.dispatchEvent(
      new CustomEvent("devModeActivateCanvas", {
        detail: {
          mockClient: this.mockClient,
          useMock: true,
        },
      })
    );

    // 4. Обновляем размер холста для корректной обработки координат клика
    window.dispatchEvent(new Event("resize"));

    this.log("Игровое поле активировано. Тестовый режим включен, интерфейс активен.");
  }

  /**
   * Вывод сообщений в консоль панели разработчика
   * @param {string} message - Текст сообщения
   */
  log(message) {
    if (!this.panel) return;
    const logBox = document.getElementById("dev-logs");
    if (logBox) {
      logBox.innerHTML += `> ${message}<br>`;
      logBox.scrollTop = logBox.scrollHeight;
    }
  }
}