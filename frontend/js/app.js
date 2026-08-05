import GameReplica from './models/GameReplica.js';
import CanvasView from './views/CanvasView.js';
import MockClient from './network/MockClient.js';
import UIView from './views/UIView.js';
import InputController from './controllers/InputController.js'; // 1. Импортируем контроллер

const gameModel = new GameReplica('player1');
const canvasView = new CanvasView('gameCanvas');
const uiView = new UIView();

// 2. Инициализируем контроллер ввода
const inputController = new InputController(canvasView, gameModel, (node) => {
    console.log(`app.js принял сигнал! Открываем интерфейс взлома для узла: ${node.id}`);
    
    // Передаем команду в UI-слой показать модальное окно
    uiView.showHackModal(node);
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