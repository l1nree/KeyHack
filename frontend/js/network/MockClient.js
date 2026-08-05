class MockClient {
  constructor(onStateReceived) {
    this.onStateReceived = onStateReceived;
    // Инициализируем стартовое состояние один раз при создании клиента
    this.currentState = this.generateInitialState();
  }

  connect() {
    console.log("MockClient: Запуск локальной симуляции...");
    setInterval(() => {
      this.simulateTick();
      this.onStateReceived(this.currentState);
    }, 1000);
  }

  generateInitialState() {
    const nodes = [];
    nodes.push({ id: 0, radius: 0, angle: 0, owner: "neutral" });

    const orbits = 3;
    const baseRadius = 80;
    const nodesPerOrbit = 8;
    let currentId = 1;

    for (let r = 1; r <= orbits; r++) {
      for (let i = 0; i < nodesPerOrbit; i++) {
        const currentRadius = r * baseRadius;
        const angle = (360 / nodesPerOrbit) * i;
        let nodeOwner = "neutral";

        if (r === orbits && i === 0) {
          nodeOwner = "player1";
        }
        if (r === orbits && i === nodesPerOrbit / 2) {
          nodeOwner = "player2";
        }

        nodes.push({
          id: currentId,
          radius: currentRadius,
          angle: angle,
          owner: nodeOwner,
        });
        currentId++;
      }
    }
    return { nodes: nodes };
  }

  simulateTick() {
    const nodes = this.currentState.nodes;
    const nextGenerationOwners = nodes.map((node) => node.owner);

    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].owner !== "neutral") {
        let nextIndex = i + 1;
        if (nextIndex >= nodes.length) nextIndex = 1;
        if (nodes[nextIndex].owner === "neutral") {
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
