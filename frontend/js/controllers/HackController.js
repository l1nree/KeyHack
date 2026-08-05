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

        // Сохраняем ссылку на функцию обработки ввода, чтобы 
        // иметь возможность безопасно добавлять и удалять слушатель
        this.boundHandleInput = (e) => this.handleInput(e);
        
        // Слушаем отмену взлома со стороны UI
        if (this.uiView.cancelBtn) {
            this.uiView.cancelBtn.addEventListener('click', () => this.failHack());
        }
    }

    startHack(node, task) {
        this.targetNode = node;
        this.currentTask = task;
        this.timeLeft = 10.0; // 10 секунд на взлом

        // 1. Обновляем и показываем UI
        this.uiView.showHackModal(node, task);

        // 2. ДИНАМИЧЕСКАЯ ПРИВЯЗКА ПОЛЯ ВВОДА
        // Ищем актуальный тег <input> прямо внутри открытого модального окна
        const actualInput = this.uiView.hackModal ? this.uiView.hackModal.querySelector('input') : this.uiView.hackInput;
        
        if (actualInput) {
            // Очищаем старые слушатели (если были) и вешаем новый
            actualInput.removeEventListener('input', this.boundHandleInput);
            actualInput.addEventListener('input', this.boundHandleInput);
            this.uiView.hackInput = actualInput; // Синхронизируем ссылку
        }

        // 3. ДИНАМИЧЕСКИЙ ПОИСК ТАЙМЕРА
        this.timerElement = document.getElementById('hack-timer');
        // Умный фоллбэк: если ID не совпал, ищем любой элемент со словом "сек" или "10.0"
        if (!this.timerElement && this.uiView.hackModal) {
            const textElements = this.uiView.hackModal.querySelectorAll('span, div, p');
            for (let el of textElements) {
                if (el.textContent.includes('сек') || el.textContent.includes('10.0')) {
                    this.timerElement = el;
                    break;
                }
            }
        }

        // 4. Запускаем таймер
        this.updateTimerUI();
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

        // Проверяем ввод. Если игрок ввел 'data' для шифра 'EBUB' (со сдвигом +1), защита падает
        if (playerInput === correctAnswer) {
            this.succeedHack();
        }
    }

    updateTimerUI() {
        if (this.timerElement) {
            // Записываем обновленное время, сохраняя приписку "сек" для красоты
            this.timerElement.textContent = Math.max(0, this.timeLeft).toFixed(1) + " сек";
        } else {
            // Резервный вариант, если умный поиск ничего не нашел
            const timerSpan = document.getElementById('hack-timer');
            if (timerSpan) {
                timerSpan.textContent = Math.max(0, this.timeLeft).toFixed(1);
            }
        }
    }

    succeedHack() {
        console.log(`Успех! Узел ${this.targetNode.id} захвачен.`);
        
        // Меняем владельца узла локально (цветовая отрисовка обновится на следующем тике CanvasView)
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
        // Очищаем интервал
        clearInterval(this.timerInterval);
        
        // Безопасно снимаем слушатель с поля ввода, чтобы он не конфликтовал при следующих задачах
        if (this.uiView.hackInput) {
            this.uiView.hackInput.removeEventListener('input', this.boundHandleInput);
        }
        
        this.uiView.hideHackModal();
        this.currentTask = null;
        this.targetNode = null;
    }
}

export default HackController;