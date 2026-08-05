class UIView {
  constructor() {
    this.playerDashboard = document.querySelector(".player-dashboard");
    this.ipBlock = document.querySelector(".code-block");

    this.hackModal = document.getElementById("hack-modal");
    this.targetNodeIdSpan = document.getElementById("target-node-id");
    this.cancelBtn = document.getElementById("cancel-hack-btn");

    // Находим параграф с описанием и поле ввода внутри модального окна
    // Защита от null
    if (this.hackModal) {
      this.taskDescription = this.hackModal.querySelector("p");
    }
    this.hackInput = document.getElementById("hack-input");

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener("click", () => this.hideHackModal());
    }
  }

  updateDashboard(playerIp) {
    if (this.ipBlock) {
      this.ipBlock.textContent = `IP: ${playerIp}`;
    }
  }

  // Теперь метод принимает два аргумента
  showHackModal(node, task) {
    if (!this.hackModal) return;

    this.targetNodeIdSpan.textContent = node.id;

    // Очищаем поле ввода от прошлых попыток
    if (this.hackInput) {
      this.hackInput.value = "";
    }

    // Формируем текст задания
    if (task && task.type === "phishing" && this.taskDescription) {
      this.taskDescription.innerHTML = `
                ${task.question}<br><br>
                1) <span style="font-family: var(--font-code);">${task.options[0]}</span><br>
                2) <span style="font-family: var(--font-code);">${task.options[1]}</span>
            `;
      if (this.hackInput) {
        this.hackInput.placeholder = "Введите безопасный домен...";
      }
    }

    this.hackModal.style.display = "block";

    // Автоматически ставим курсор в поле ввода для удобства
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
