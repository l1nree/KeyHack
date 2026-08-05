class HackController {
    constructor(uiView, gameModel, onHackComplete) {
        this.uiView = uiView;
        this.gameModel = gameModel;
        this.onHackComplete = onHackComplete;
        
        // Внутреннее состояние контроллера
        this.currentTask = null;
        this.targetNode = null;
        this.timerInterval = null;
        this.timeLeft = 0;

        // Привязываем обработчик ввода (слушаем нажатие клавиш в поле ввода)
        this.uiView.hackInput.addEventListener('input', (e) => this.handleInput(e));
        
        // Слушаем отмену взлома со стороны UI
        this.uiView.cancelBtn.addEventListener('click', () => this.failHack());
    }

    startHack(node, task) {
        this.targetNode = node;
        this.currentTask = task;
        this.timeLeft = 10.0; // 10 секунд на взлом

        // Обновляем UI
        this.uiView.showHackModal(node, task);
        this.updateTimerUI();

        // Запускаем таймер (срабатывает каждые 100 мс)
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft -= 0.1;
            this.updateTimerUI();

            if (this.timeLeft <= 0) {
                this.failHack();
            }
        }, 100);
    }

    handleInput(event) {
        if (!this.currentTask) return;

        const playerInput = event.target.value.trim().toLowerCase();
        const correctAnswer = this.currentTask.correctAnswer.toLowerCase();

        // Если игрок ввел правильный домен
        if (playerInput === correctAnswer) {
            this.succeedHack();
        }
    }

    updateTimerUI() {
        // Ищем элемент таймера и обновляем его с одним знаком после запятой
        const timerSpan = document.getElementById('hack-timer');
        if (timerSpan) {
            timerSpan.textContent = Math.max(0, this.timeLeft).toFixed(1);
        }
    }

    succeedHack() {
        console.log(`Успех! Узел ${this.targetNode.id} захвачен.`);
        
        // Временно меняем владельца узла локально (потом это будет делать сервер)
        this.targetNode.owner = this.gameModel.localPlayerId; 
        
        // Сообщаем наверх, что взлом удался
        if (this.onHackComplete) this.onHackComplete(this.targetNode);

        this.cleanup();
    }

    failHack() {
        if (this.targetNode) {
            console.log(`Провал! Не удалось захватить узел ${this.targetNode.id}.`);
        }
        
        this.cleanup();
    }
    cleanup() {
        // Останавливаем таймер и прячем окно
        clearInterval(this.timerInterval);
        this.uiView.hideHackModal();
        this.currentTask = null;
        this.targetNode = null;
    }
}

export default HackController;