class InputController {
    constructor(canvasView, gameModel, onNodeClicked) {
        this.canvasView = canvasView;
        this.gameModel = gameModel;
        
        // Эта функция будет вызывать наше UI-окно при успешном клике
        this.onNodeClicked = onNodeClicked; 

        // Слушаем клики по холсту
        this.canvasView.canvas.addEventListener('click', (event) => this.handleMouseClick(event));
    }

    handleMouseClick(event) {
        // 1. Получаем точные координаты клика внутри холста
        const rect = this.canvasView.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Текущее состояние серверов
        const nodes = this.gameModel.state.nodes;
        if (!nodes) return;

        for (const node of nodes) {
            // Деструктуризация: сразу достаем x и y из возвращаемого объекта
            const { x, y } = this.canvasView.getCartesian(node.radius, node.angle);
            
            const dx = clickX - x;
            const dy = clickY - y;
            const hypot = Math.hypot(dx, dy);
            
            if (hypot <= 10) { 
                console.log(`Обнаружен взлом! Узел ID: ${node.id}`);
                this.onNodeClicked(node); // Передаем данные об узле наверх
                return; // Прерываем цикл, цель найдена
            }
        }

    }
}

export default InputController;