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

    updateEconomy(coins) {
        // Находим элемент панели игрока и выводим баланс
        // Допустим, в index.html у нас есть блок для монет
        let coinsElement = document.getElementById('player-coins');
        
        if (!coinsElement) {
            // Если элемента еще нет в HTML, создадим его динамически прямо в дашборде
            const dashboard = document.querySelector('.player-dashboard');
            if (dashboard) {
                const div = document.createElement('div');
                div.className = 'code-block';
                div.style.marginTop = '10px';
                div.innerHTML = `Баланс: <span id="player-coins" style="color: var(--color-primary);">${coins}</span> монет`;
                dashboard.appendChild(div);
            }
        } else {
            coinsElement.textContent = coins;
        }
    }

    // Теперь метод принимает два аргумента
    showHackModal(node, task) {
        this.targetNodeIdSpan.textContent = node.id;
        this.hackInput.value = '';
        
        // Защита на случай, если задача не передалась
        if (!task) {
            this.taskDescription.innerHTML = "<span style='color: var(--color-danger);'>Ошибка: Не удалось загрузить задачу!</span>";
            this.hackModal.style.display = 'block';
            return;
        }
        
        // Рендер для фишинга
        if (task.type === 'phishing') {
            this.taskDescription.innerHTML = `
                ${task.question}<br><br>
                1) <span style="font-family: var(--font-code);">${task.options[0]}</span><br>
                2) <span style="font-family: var(--font-code);">${task.options[1]}</span>
            `;
            this.hackInput.placeholder = "Введите безопасный домен...";
        
        // Рендер для шифра Цезаря
        } else if (task.type === 'caesar') {
            this.taskDescription.innerHTML = `
                ${task.question}<br><br>
                <span style="font-family: var(--font-code); font-size: 1.5em; color: var(--color-primary); letter-spacing: 4px; display: block; text-align: center; margin: 10px 0;">
                    ${task.encryptedWord}
                </span>
            `;
            this.hackInput.placeholder = "Введите расшифрованное слово...";
        }

        this.hackModal.style.display = 'block';
        this.hackInput.focus();
    }

    hideHackModal() {
        this.hackModal.style.display = 'none';
    }

}

export default UIView;