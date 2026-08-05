class MockClient {
    constructor(onStateReceived) {
        this.onStateReceived = onStateReceived;
        
        // ИСПРАВЛЕНИЕ 1: Теперь мы сохраняем результат работы функции в gameState
        this.gameState = this.generateInitialState();
    }

    connect() {
        console.log("MockClient: Подключение к серверу...");
        
        // Так как this.gameState теперь гарантированно содержит узлы, условие сработает
        if (this.onStateReceived && this.gameState.nodes.length > 0) {
            this.onStateReceived(this.gameState);
            console.log("MockClient: Стартовое состояние успешно отправлено!");
        }
    }

  generateInitialState() {
    const nodes = [];
    nodes.push({ id: 0, radius: 0, angle: 0, owner: "neutral" });

        const orbits = 3; // Количество концентрических колец
        const baseRadius = 80; // Расстояние (шаг) между кольцами
        const nodesPerOrbit = 8; // Количество серверов на каждом кольце

        let currentId = 1; // Глобальный счетчик ID для узлов

        // Внешний цикл: перебираем номера орбит от 1 до 3
        for (let r = 1; r <= orbits; r++) {
            
            // Внутренний цикл: расставляем 8 узлов на текущей орбите
            for (let i = 0; i < nodesPerOrbit; i++) {
                
                // Вычисляем геометрию
                const currentRadius = r * baseRadius;
                const angle = (360 / nodesPerOrbit) * i;
                
                let nodeOwner = 'neutral';
                
                // Спавним игроков только на самой внешней орбите
                if (r === orbits && i === 0) {
                    nodeOwner = 'player1';
                }
                if (r === orbits && i === nodesPerOrbit / 2) {
                    nodeOwner = 'player2';
                }

                nodes.push({ 
                    id: currentId, 
                    radius: currentRadius, 
                    angle: angle, 
                    owner: nodeOwner 
                });
                
                currentId++;
            }
        }

        return { nodes: nodes };
    }

    simulateTick() {
        // ИСПРАВЛЕНИЕ 2: currentState заменен на gameState
        const nodes = this.gameState.nodes;
        
        const nextGenerationOwners = nodes.map(node => node.owner);

        for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].owner !== 'neutral') {
                
                let nextIndex = i + 1;
                if (nextIndex >= nodes.length) nextIndex = 1;

                if (nodes[nextIndex].owner === 'neutral') {
                    nextGenerationOwners[nextIndex] = nodes[i].owner;
                }
            }
        }

        for (let i = 1; i < nodes.length; i++) {
            nodes[i].owner = nextGenerationOwners[i];
        }
    }
}

export default MockClient;
