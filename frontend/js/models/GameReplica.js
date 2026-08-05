class GameReplica {
    constructor(localPlayerId) {
        this.localPlayerId = localPlayerId;
        
        // Экономика игрока
        this.coins = 150; 
        
        this.state = {
            nodes: []
        };
    }

    // Метод для инициализации или обновления состояния от сервера/клиента
    setState(newState) {
        this.state = newState;
        
        this.state.nodes.forEach(node => {
            if (node.defenseLevel === undefined) {
                node.defenseLevel = 0; 
            }
        });
    }

    // Добавляем метод-алиас, который ждет app.js
    updateState(newState) {
        this.setState(newState);
    }

    // Проверка, хватает ли монет на покупку защиты
    canAfford(amount) {
        return this.coins >= amount;
    }

    // Потратить монеты
    spendCoins(amount) {
        if (this.canAfford(amount)) {
            this.coins -= amount;
            return true;
        }
        return false;
    }

    // Добавить монеты (пассивный доход или награда за захват)
    addCoins(amount) {
        this.coins += amount;
    }
}

export default GameReplica;