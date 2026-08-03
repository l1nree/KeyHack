class GameReplica {
    constructor(localPlayerId) {
        // ID текущего клиента (строка или число), чтобы отличать свои узлы от чужих
        this.localPlayerId = localPlayerId; 
        
        // Главный слепок игрового мира. Изначально пуст.
        this.state = null; 
    }

    updateState(newState) {
        // Сервер прислал новый кадр симуляции — перезаписываем локальную копию
        this.state = newState;
    }

    getNodes() {
        // Если state существует, возвращаем массив узлов. Иначе — пустой массив.
        return this.state ? this.state.nodes : [];
    }
    
    getMe() {
        // Пример того, как мы можем достать данные именно нашего игрока
        return this.state ? this.state.players[this.localPlayerId] : null;
    }
}

export default GameReplica;