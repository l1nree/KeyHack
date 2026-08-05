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