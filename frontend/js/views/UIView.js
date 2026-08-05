class UIView {
    constructor() {
        // Элементы дашборда
        this.playerDashboard = document.querySelector('.player-dashboard');
        this.ipBlock = document.querySelector('.code-block');

        // --- НОВЫЙ БЛОК: Элементы модального окна взлома ---
        this.hackModal = document.getElementById('hack-modal');
        this.targetNodeIdSpan = document.getElementById('target-node-id');
        this.cancelBtn = document.getElementById('cancel-hack-btn');

        // Привязываем клик по кнопке "Отмена" к методу скрытия окна
        this.cancelBtn.addEventListener('click', () => this.hideHackModal());
    }

    updateDashboard(playerIp) {
        this.ipBlock.textContent = `IP: ${playerIp}`;
    }

    // Метод для отображения окна
    showHackModal(node) {
        // Подставляем ID выбранного узла в заголовок
        this.targetNodeIdSpan.textContent = node.id;
        // Показываем окно
        this.hackModal.style.display = 'block';
    }

    // Метод для скрытия окна
    hideHackModal() {
        this.hackModal.style.display = 'none';
    }
}

export default UIView;