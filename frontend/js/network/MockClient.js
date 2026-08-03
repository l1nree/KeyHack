class MockClient {
    constructor(onStateReceived) {
        this.onStateReceived = onStateReceived;
    }

    connect() {
        console.log("MockClient: Подключение к серверу...");
        
        setTimeout(() => {
            console.log("MockClient: Состояние получено!");
            const mockState = this.generateInitialState();
            this.onStateReceived(mockState);
        }, 500);
    }

    generateInitialState() {
        const nodes = [];
        
        // Центральный Core Server[cite: 1]
        nodes.push({ id: 0, radius: 0, angle: 0, owner: 'neutral' });

        const nodeCount = 6;
        const orbitRadius = 150; 

        for (let i = 0; i < nodeCount; i++) {
            const angle = (360 / nodeCount) * i;
            nodes.push({ id: i + 1, radius: orbitRadius, angle, owner: 'neutral' });
        }

        return { nodes: nodes };
    }
}

export default MockClient;