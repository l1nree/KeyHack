import GameReplica from './models/GameReplica.js';
import CanvasView from './views/CanvasView.js';
import MockClient from './network/MockClient.js';

const gameModel = new GameReplica('player1');

const canvasView = new CanvasView('gameCanvas');

function handleStateReceived(newState) {
    gameModel.updateState(newState);
    

}

const client = new MockClient(handleStateReceived);

client.connect();

function gameLoop() {
    canvasView.render(gameModel.state);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);