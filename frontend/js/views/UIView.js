class UIView {
    constructor() {
        // Находим элементы в DOM при инициализации
        this.playerDashboard = document.querySelector('.player-dashboard');
        this.ipBlock = document.querySelector('.code-block');
    }

    updateDashboard(playerIp) {
        // Динамически меняем текст внутри HTML-тега
        this.ipBlock.textContent = `IP: ${playerIp}`;
    }
}

export default UIView;