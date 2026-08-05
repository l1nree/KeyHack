class TaskGenerator {
    constructor() {
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
        // Теперь генератор бросает монетку: 0 - фишинг, 1 - криптография
        const taskType = Math.floor(Math.random() * 2); 

        if (taskType === 0) {
            return this.generatePhishingTask();
        } else {
            return this.generateCaesarTask();
        }
    }

    generatePhishingTask() {
        const randomIndex = Math.floor(Math.random() * this.phishingDomains.length);
        const pair = this.phishingDomains[randomIndex];

        let options = [pair.safe, pair.fake];
        if (Math.random() > 0.5) {
            options.reverse();
        }

        return {
            type: 'phishing',
            difficulty: 'easy',
            question: "Критическая угроза! Какая из этих ссылок безопасна?",
            options: options,
            correctAnswer: pair.safe
        };
    }

    // НОВЫЙ МЕТОД: Генерация шифра Цезаря
    generateCaesarTask() {
        const word = this.cryptoWords[Math.floor(Math.random() * this.cryptoWords.length)];
        const shift = 1; // Задаем сдвиг Цезаря +1
        let encrypted = "";
        
        for (let i = 0; i < word.length; i++) {
            const charCode = word.charCodeAt(i);
            
            // Если символ — заглавная английская буква (коды ASCII от 65 до 90)
            if (charCode >= 65 && charCode <= 90) {
                // Вычисляем новый символ с учетом закольцованности алфавита
                encrypted += String.fromCharCode(((charCode - 65 + shift) % 26) + 65);
            } else {
                encrypted += word[i];
            }
        }

        return {
            type: 'caesar',
            difficulty: 'easy',
            question: `Расшифруйте перехваченный пакет (Сдвиг +${shift}):`,
            encryptedWord: encrypted,
            correctAnswer: word // Игрок должен ввести оригинальное слово
        };
    }
}

export default TaskGenerator;