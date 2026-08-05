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
        // Центральный Core Server
        nodes.push({ id: 0, radius: 0, angle: 0, owner: 'neutral' });

        const orbits = 3; // Количество концентрических колец
        const baseRadius = 80; // Расстояние (шаг) между кольцами
        const nodesPerOrbit = 8; // Количество серверов на каждом кольце

        let currentId = 1; // Глобальный счетчик ID для узлов

        // 1. Внешний цикл: перебираем номера орбит от 1 до 3
        for (let r = 1; r <= orbits; r++) {
            
            // 2. Внутренний цикл: расставляем 8 узлов на текущей орбите
            for (let i = 0; i < nodesPerOrbit; i++) {
                
                // Вычисляем геометрию
                const currentRadius = r * baseRadius;
                const angle = (360 / nodesPerOrbit) * i;
                
                let nodeOwner = 'neutral';
                
                // Спавним игроков только на самой внешней орбите (когда r === orbits)
                if (r === orbits && i === 0) {
                    nodeOwner = 'player1';
                }
                // i === 4 (половина от 8), расстановка симметрично на противоположной стороне
                if (r === orbits && i === nodesPerOrbit / 2) {
                    nodeOwner = 'player2';
                }

                // Добавляем готовый узел в массив
                nodes.push({ 
                    id: currentId, 
                    radius: currentRadius, 
                    angle: angle, 
                    owner: nodeOwner 
                });
                
                currentId++; // Увеличиваем ID для следующего узла
            }
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