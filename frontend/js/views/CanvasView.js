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
        this.clear(); // Очищаем старый кадр

        if (!gameState || !gameState.nodes) return;

        // Светло-серый цвет для комфортного отображения нейтральных узлов[cite: 1]
        this.ctx.fillStyle = '#F8FAFC'; 

        for (const node of gameState.nodes) {
            // Получаем x и y с помощью нашего нового метода
            const { x, y } = this.getCartesian(node.radius, node.angle);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2); 
            this.ctx.fill();
        }
    }
}

export default CanvasView;