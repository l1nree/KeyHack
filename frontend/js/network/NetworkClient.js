export class NetworkClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.socket = null;
    this.onMessageCallback = null;
  }

  connect(playerId) {
    console.log("NetworkClient: Подключение к серверу...");
    const urlWithAuth = `${this.baseUrl}?player_id=${playerId}`;
    this.socket = new WebSocket(urlWithAuth);

    this.socket.onopen = () => {
      console.log("NetworkClient: WebSocket подключен.");
      this.updateStatus("ПОДКЛЮЧЕНО", "lime");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("NetworkClient: Ответ от сервера:", data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (error) {
        console.error("NetworkClient: Ошибка парсинга JSON:", event.data);
      }
    };

    this.socket.onclose = (event) => {
      console.log("NetworkClient: WebSocket отключен. Код:", event.code);
      if (event.code === 1008) {
        this.updateStatus("ОШИБКА АВТОРИЗАЦИИ", "red");
        localStorage.clear();
        alert("Ваш профиль не найден на сервере. Пожалуйста, войдите заново.");
        location.reload();
      } else {
        this.updateStatus("ПОТЕРЯ СВЯЗИ", "red");
        setTimeout(() => this.connect(playerId), 5000);
      }
    };
  }

  sendAction(type, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      this.socket.send(message);
    } else {
      console.warn("NetworkClient: WebSocket не подключен.");
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  updateStatus(text, color) {
    const statusEl = document.getElementById("ws-status");
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.style.color = color;
    }
  }
}
