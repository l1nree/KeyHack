// frontend/js/app.js
import GameReplica from './models/GameReplica.js';
import CanvasView from './views/CanvasView.js';
import MockClient from './network/MockClient.js';
import UIView from './views/UIView.js';
import InputController from './controllers/InputController.js';
import TaskGenerator from './models/TaskGenerator.js';
import HackController from './controllers/HackController.js'; // 1. Новый импорт

const gameModel = new GameReplica('player1');
const canvasView = new CanvasView('gameCanvas');
const uiView = new UIView();
const taskGenerator = new TaskGenerator();

// 2. Инициализируем контроллер взлома
const hackController = new HackController(uiView, gameModel, (node) => {
    // Награда за успешный захват узла
    const reward = 40;
    gameModel.addCoins(reward);
    console.log(`Успех! Узел ${node.id} захвачен. Награда: +${reward} монет`);
    
    // Обновляем отображение баланса в UI
    uiView.updateEconomy(gameModel.coins);
    
    // Перерисовываем холст, чтобы увидеть новый цвет узла
    canvasView.render(gameModel.state);
});

// 3. Обновляем InputController: теперь он передает эстафету HackController'у
const inputController = new InputController(canvasView, gameModel, (node) => {
    
    // СЛУЧАЙ 1: Клик по СВОЕМУ узлу -> Улучшаем защиту
    if (node.owner === gameModel.localPlayerId) {
        const upgradeCost = (node.defenseLevel + 1) * 50; // 50, 100, 150 монет за уровень
        
        if (node.defenseLevel >= 3) {
            console.log(`Узел ${node.id} уже имеет максимальный уровень защиты!`);
            return;
        }

        if (gameModel.spendCoins(upgradeCost)) {
            node.defenseLevel++;
            console.log(`Защита узла ${node.id} повышена до уровня ${node.defenseLevel}! Списано монет: ${upgradeCost}`);
            
            // Обновляем UI баланса
            uiView.updateEconomy(gameModel.coins);
            canvasView.render(gameModel.state);
        } else {
            console.log(`Недостаточно монет для улучшения защиты! Требуется: ${upgradeCost}`);
        }
        return;
    }

    // СЛУЧАЙ 2: Клик по ЧУЖОМУ или НЕЙТРАЛЬНОМУ узлу -> Атака / Взломы
    // Определяем сложность задачи на основе уровня защиты узла
    let taskDifficulty = 'easy';
    if (node.defenseLevel === 2) taskDifficulty = 'medium';
    if (node.defenseLevel >= 3) taskDifficulty = 'hard';

    // Генерация задачи нужной сложности (пока у нас написаны только easy, 
    // но TaskGenerator выдаст заглушку или легкую задачу для остальных)
    const task = taskGenerator.getTask(taskDifficulty);
    
    hackController.startHack(node, task);
});

// Пассивный доход каждые 3 секунды
setInterval(() => {
    // Считаем, сколько узлов принадлежит нашему игроку
    const ownedNodes = gameModel.state.nodes.filter(node => node.owner === gameModel.localPlayerId);
    
    if (ownedNodes.length > 0) {
        // Допустим, каждый узел приносит 5 монет за тик
        const income = ownedNodes.length * 5; 
        
        gameModel.addCoins(income);
        uiView.updateEconomy(gameModel.coins);
        
        // Для отладки в консоли
        // console.log(`Пассивный доход: +${income} монет (узлов под контролем: ${ownedNodes.length})`);
    }
}, 3000);

function handleStateReceived(newState) {
    gameModel.updateState(newState);
}

const client = new MockClient(handleStateReceived);
client.connect();

uiView.updateEconomy(gameModel.coins);
uiView.updateDashboard('10.0.0.99'); 

function gameLoop() {
    
    canvasView.render(gameModel.state);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);