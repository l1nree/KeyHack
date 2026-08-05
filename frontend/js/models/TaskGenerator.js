class TaskGenerator {
    constructor() {
        // Пул данных для фишинга (можно будет легко пополнять)
        this.phishingDomains = [
            { safe: 'github.com', fake: 'githuh.com' },
            { safe: 'microsoft.com', fake: 'rnicrosoft.com' },
            { safe: 'google.com', fake: 'g00gle.com' }
        ];
        
        this.cryptoWords = ['ROOT', 'HACK', 'NODE', 'DATA'];
    }

    getTask(difficulty) {
        if (difficulty === 'easy') {
            return this.generateEasyTask();
        }
    }

    generateEasyTask() {
        // Временно жестко задаем 0, чтобы всегда тестировать только фишинг.
        // Когда напишем шифр Цезаря, заменим на: Math.floor(Math.random() * 2)
        const taskType = 0; 

        if (taskType === 0) {
            return this.generatePhishingTask();
        } else {
            // Заглушка для будущей криптографии
            return null;
        }
    }

    generatePhishingTask() {
        // 1. Получаем случайный индекс от 0 до длины массива
        const randomIndex = Math.floor(Math.random() * this.phishingDomains.length);
        const pair = this.phishingDomains[randomIndex];

        // 2. Создаем массив с вариантами ответов
        let options = [pair.safe, pair.fake];

        // 3. Бросаем "виртуальную монетку" для перемешивания.
        // Math.random() выдает число от 0 до 1. Если оно больше 0.5 — меняем элементы местами.
        if (Math.random() > 0.5) {
            options.reverse();
        }

        // 4. Возвращаем полностью готовый объект (payload) для интерфейса
        return {
            type: 'phishing',
            difficulty: 'easy',
            question: "Критическая угроза! Какая из этих ссылок безопасна?",
            options: options,
            correctAnswer: pair.safe
        };
    }
}

export default TaskGenerator;