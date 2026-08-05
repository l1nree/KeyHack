class CanvasView {

    resize() {
        // Обновляем физические размеры холста до текущих размеров окна
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Вычисляем новую центральную точку
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    clear() {
        this.ctx.fillStyle = '#0F172A'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getCartesian(radius, angleDegrees) {
        // Переводим градусы в радианы
        const angleRadians = angleDegrees * (Math.PI / 180);
        
        // Считаем смещение от центра холста
        const x = this.centerX + radius * Math.cos(angleRadians);
        const y = this.centerY + radius * Math.sin(angleRadians);
        
        return { x, y };
    }

    render(gameState) {
        this.clear();

        if (!gameState || !gameState.nodes) return;

        // --- НОВЫЙ БЛОК: Отрисовка топологии сети ---
        // Задаем цвет ребер графа (чуть светлее фона для контраста)
        this.ctx.strokeStyle = '#1E293B'; 
        this.ctx.lineWidth = 2;

        // Шаг 1: Группируем узлы (как в Python словарях)
        const rings = {}; // Для концентрических колец (группируем по радиусу)
        const rays = {};  // Для радиальных лучей (группируем по углу)

        for (let i = 1; i < gameState.nodes.length; i++) {
            const node = gameState.nodes[i];
            
            // Если ключа еще нет — создаем пустой массив, затем добавляем узел
            if (!rings[node.radius]) rings[node.radius] = [];
            rings[node.radius].push(node);

            if (!rays[node.angle]) rays[node.angle] = [];
            rays[node.angle].push(node);
        }

        // Шаг 2: Рисуем независимые кольца (орбиты)
        for (const radius in rings) {
            this.ctx.beginPath();
            const orbitNodes = rings[radius];
            for (let j = 0; j < orbitNodes.length; j++) {
                const { x, y } = this.getCartesian(orbitNodes[j].radius, orbitNodes[j].angle);
                if (j === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath(); // Замыкаем каждое кольцо отдельно!
            this.ctx.stroke();
        }

        // Шаг 3: Рисуем лучи от центрального сервера
        const core = gameState.nodes[0];
        const { x: cx, y: cy } = this.getCartesian(core.radius, core.angle);

        for (const angle in rays) {
            const angleNodes = rays[angle];
            
            // Находим самый дальний узел на этой линии (максимальный радиус)
            const outerNode = angleNodes.reduce((prev, curr) => 
                prev.radius > curr.radius ? prev : curr
            );
            
            const { x, y } = this.getCartesian(outerNode.radius, outerNode.angle);
            
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy); // Ставим кисть в центр
            this.ctx.lineTo(x, y);   // Проводим линию до самого дальнего узла орбиты
            this.ctx.stroke();
        }

        for (const node of gameState.nodes) {
            const { x, y } = this.getCartesian(node.radius, node.angle);
            
            if (node.owner === 'player1') {
                this.ctx.fillStyle = '#4F46E5'; // Индиго (наш игрок)
            } else if (node.owner === 'player2') {
                this.ctx.fillStyle = '#E11D48'; // Коралловый (соперник)
            } else {
                this.ctx.fillStyle = '#F8FAFC'; // Светло-серый (нейтральный)
            }

            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2); 
            this.ctx.fill();
        }
    }
}

export default CanvasView;