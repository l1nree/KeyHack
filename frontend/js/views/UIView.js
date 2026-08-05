class UIView {
  constructor() {
    this.playerDashboard = document.querySelector(".player-dashboard");
    this.ipBlock = document.querySelector(".code-block");

    this.hackModal = document.getElementById("hack-modal");
    this.targetNodeIdSpan = document.getElementById("target-node-id");
    this.cancelBtn = document.getElementById("cancel-hack-btn");
    this.hackInput = document.getElementById("hack-input");
    this.taskDescription = document.getElementById("hack-task-desc");

    // Фоллбэк: если по ID не нашли, ищем первый параграф в модалке
    if (!this.taskDescription && this.hackModal) {
      this.taskDescription = this.hackModal.querySelector("p");
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener("click", () => this.hideHackModal());
    }
  }

  updateDashboard(playerIp) {
    if (this.ipBlock) {
      this.ipBlock.textContent = `IP: ${playerIp}`;
    }
  }

  updateEconomy(coins) {
    let coinsElement = document.getElementById("player-coins");

    if (!coinsElement) {
      const dashboard = document.querySelector(".player-dashboard");
      if (dashboard) {
        const div = document.createElement("div");
        div.className = "code-block";
        div.style.marginTop = "10px";
        div.innerHTML = `Баланс: <span id="player-coins" style="color: var(--color-primary);">${coins}</span> монет`;
        dashboard.appendChild(div);
      }
    } else {
      coinsElement.textContent = coins;
    }
  }

  showHackModal(node, task) {
    if (!this.hackModal) return;

    if (this.targetNodeIdSpan) {
      this.targetNodeIdSpan.textContent = node.id;
    }

    if (this.hackInput) {
      this.hackInput.value = "";
    }

    if (!task) {
      if (this.taskDescription) {
        this.taskDescription.innerHTML =
          "<span style='color: var(--color-danger);'>Ошибка: Не удалось загрузить задачу!</span>";
      }
      this.hackModal.style.display = "block";
      return;
    }

    if (task.type === "phishing") {
      if (this.taskDescription) {
        this.taskDescription.innerHTML = `
                    ${task.question}<br><br>
                    1) <span style="font-family: var(--font-code);">${task.options[0]}</span><br>
                    2) <span style="font-family: var(--font-code);">${task.options[1]}</span>
                `;
      }
      if (this.hackInput) {
        this.hackInput.placeholder = "Введите безопасный домен...";
      }
    } else if (task.type === "caesar") {
      if (this.taskDescription) {
        this.taskDescription.innerHTML = `
                    ${task.question}<br><br>
                    <span style="font-family: var(--font-code); font-size: 1.5em; color: var(--color-primary); letter-spacing: 4px; display: block; text-align: center; margin: 10px 0;">
                        ${task.encryptedWord}
                    </span>
                `;
      }
      if (this.hackInput) {
        this.hackInput.placeholder = "Введите расшифрованное слово...";
      }
    }

    this.hackModal.style.display = "block";
    if (this.hackInput) {
      this.hackInput.focus();
    }
  }

  hideHackModal() {
    if (this.hackModal) {
      this.hackModal.style.display = "none";
    }
  }
}

export default UIView;
