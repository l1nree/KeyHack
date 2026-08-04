class MockClient {
    constructor(onStateReceived) {
        this.onStateReceived = onStateReceived;
        
        // Инициализируем стартовое состояние один раз при создании клиента
        this.currentState = this.generateInitialState();
    }

    connect() {
        console.log("MockClient: Подключение к серверу...");
        
        setInterval(() => {
            console.log("MockClient: Новое поколение узлов рассчитано!");
            
            // 1. Вызываем метод симуляции (он обновит this.currentState внутри себя)
            this.simulateTick();
            
            // 2. Отправляем обновленное состояние в app.js
            this.onStateReceived(this.currentState);
        }, 1000); // 1000 мс = 1 секунда
    }

    generateInitialState() {
        const nodes = [];
        nodes.push({ id: 0, radius: 0, angle: 0, owner: 'neutral' });

        const nodeCount = 6;
        const orbitRadius = 150; 

        for (let i = 0; i < nodeCount; i++) {
            const angle = (360 / nodeCount) * i;
            let nodeOwner = 'neutral';
            
            // Расставляем двух игроков симметрично
            if (i === 0) nodeOwner = 'player1';
            if (i === nodeCount / 2) nodeOwner = 'player2'; 
            
            nodes.push({ id: i + 1, radius: orbitRadius, angle, owner: nodeOwner });
        }
        return { nodes: nodes };
    }

    simulateTick() {
        const nodes = this.currentState.nodes;
        
        // 1. Создаем буфер нового поколения (копируем текущих владельцев)
        const nextGenerationOwners = nodes.map(node => node.owner);

        // 2. Рассчитываем правила для каждого узла
        for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].owner !== 'neutral') {
                
                // Целимся в следующий узел по часовой стрелке
                let nextIndex = i + 1;
                if (nextIndex >= nodes.length) nextIndex = 1;

                // Взлом происходит, только если следующий узел нейтральный
                if (nodes[nextIndex].owner === 'neutral') {
                    // Записываем результат атаки в БУФЕР, а не в саму клетку
                    nextGenerationOwners[nextIndex] = nodes[i].owner;
                }
            }
        }

        // 3. Применяем новое поколение ко всей сетке одновременно
        for (let i = 1; i < nodes.length; i++) {
            nodes[i].owner = nextGenerationOwners[i];
        }
    }
}

export default MockClient;