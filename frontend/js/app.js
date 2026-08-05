import GameReplica from './models/GameReplica.js';
import CanvasView from './views/CanvasView.js';
import MockClient from './network/MockClient.js';
import UIView from './views/UIView.js'; // 1. Импортируем новый класс

const gameModel = new GameReplica('player1');
const canvasView = new CanvasView('gameCanvas');
const uiView = new UIView(); // 2. Инициализируем UI-слой

function handleStateReceived(newState) {
    gameModel.updateState(newState);
}

const client = new MockClient(handleStateReceived);
client.connect();

// 3. Тестируем динамическое обновление
// Передаем новый IP. Если всё работает, на экране изменится 192.168.1.42 на этот адрес:
uiView.updateDashboard('10.0.0.99'); 

function gameLoop() {
    canvasView.render(gameModel.state);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);