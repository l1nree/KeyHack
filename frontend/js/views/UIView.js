class UIView {
    constructor() {
        this.playerDashboard = document.querySelector('.player-dashboard');
        this.ipBlock = document.querySelector('.code-block');

        this.hackModal = document.getElementById('hack-modal');
        this.targetNodeIdSpan = document.getElementById('target-node-id');
        this.cancelBtn = document.getElementById('cancel-hack-btn');
        
        // Находим параграф с описанием и поле ввода внутри модального окна
        this.taskDescription = this.hackModal.querySelector('p');
        this.hackInput = document.getElementById('hack-input');

        this.cancelBtn.addEventListener('click', () => this.hideHackModal());
    }

    updateDashboard(playerIp) {
        this.ipBlock.textContent = `IP: ${playerIp}`;
    }

    // Теперь метод принимает два аргумента
    showHackModal(node, task) {
        this.targetNodeIdSpan.textContent = node.id;
        
        // Очищаем поле ввода от прошлых попыток
        this.hackInput.value = '';
        
        // Формируем текст задания
        if (task && task.type === 'phishing') {
            this.taskDescription.innerHTML = `
                ${task.question}<br><br>
                1) <span style="font-family: var(--font-code);">${task.options[0]}</span><br>
                2) <span style="font-family: var(--font-code);">${task.options[1]}</span>
            `;
            this.hackInput.placeholder = "Введите безопасный домен...";
        }

        this.hackModal.style.display = 'block';
        
        // Автоматически ставим курсор в поле ввода для удобства
        this.hackInput.focus();
    }

    hideHackModal() {
        this.hackModal.style.display = 'none';
    }
}

export default UIView;