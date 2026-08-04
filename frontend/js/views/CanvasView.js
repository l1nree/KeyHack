class CanvasView {

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Автоматически подстраиваем размер холста под окно браузера
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Вычисляем центр координат (наш Core Server будет здесь)
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

        // 1. Рисуем орбитальное кольцо (соединяем узлы с 1 по 6)[cite: 1]
        this.ctx.beginPath();
        for (let i = 1; i < gameState.nodes.length; i++) {
            const { x, y } = this.getCartesian(gameState.nodes[i].radius, gameState.nodes[i].angle);
            if (i === 1) {
                this.ctx.moveTo(x, y); // Ставим кисть на первый узел
            } else {
                this.ctx.lineTo(x, y); // Ведем линию к следующим
            }
        }
        this.ctx.closePath(); // Замыкаем кольцо от последнего узла обратно к первому
        this.ctx.stroke(); // Отрисовываем контур

        // 2. Рисуем лучи от центрального Core Server к орбите[cite: 1]
        const core = gameState.nodes[0];
        const { x: cx, y: cy } = this.getCartesian(core.radius, core.angle);
        
        this.ctx.beginPath();
        for (let i = 1; i < gameState.nodes.length; i++) {
            const { x, y } = this.getCartesian(gameState.nodes[i].radius, gameState.nodes[i].angle);
            this.ctx.moveTo(cx, cy); // Возвращаемся в центр
            this.ctx.lineTo(x, y);   // Проводим луч к узлу
        }
        this.ctx.stroke();

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