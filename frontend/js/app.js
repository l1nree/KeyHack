import GameReplica from './models/GameReplica.js';
import CanvasView from './views/CanvasView.js';
import MockClient from './network/MockClient.js';

const gameModel = new GameReplica('player1');

const canvasView = new CanvasView('gameCanvas');

function handleStateReceived(newState) {
    gameModel.updateState(newState);
    
    canvasView.render(gameModel.state); 
}

const client = new MockClient(handleStateReceived);

client.connect();