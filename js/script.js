class DinoGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.dino = document.getElementById('dino');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.finalScoreElement = document.getElementById('final-score');
        this.finalHighScoreElement = document.getElementById('final-high-score');

        this.gameSpeed = 8;
        this.gravity = 0.9;
        this.isJumping = false;
        this.velocity = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('dinoHighScore') || 0;
        this.gameRunning = false;
        this.obstacles = [];
        this.clouds = [];
        this.gameLoopId = null;
        this.gameObstacleIterator = 1;
        this.gameObstaclePause = this.gameObstacleIterator + 1;

        this.setupEventListeners();
        this.updateHighScoreDisplay();
    }

    setupEventListeners() {
        // Прыжок по пробелу
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning && !this.isJumping) {
                this.jump();
                e.preventDefault();
            }

            // Перезапуск по Enter
            if (e.code === 'Enter' && !this.gameRunning && this.gameOverScreen.style.display === 'block') {
                this.restart();
            }
        });

        // Прыжок по клику/тапу
        this.container.addEventListener('click', (e) => {
            if (this.gameRunning && e.target.id !== 'mobile-controls' && !e.target.classList.contains('jump-btn')) {
                this.jump();
            }
        });

        // Обработка касаний для мобильных устройств
        this.container.addEventListener('touchstart', (e) => {
            if (this.gameRunning && e.target.id !== 'mobile-controls' && !e.target.classList.contains('jump-btn')) {
                this.jump();
                e.preventDefault();
            }
        });

        // Полноэкранный режим по F11
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });

        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    start() {
        this.gameRunning = true;
        this.score = 0;
        this.gameSpeed = 8;
        this.obstacles = [];
        this.clouds = [];
        this.updateScore();
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.dino.classList.add('dino-run');

        // Создаем несколько облаков в начале
        for (let i = 0; i < 5; i++) {
            this.createCloud(Math.random() * window.innerWidth);
        }

        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.updateGame();
        this.render();

        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    updateGame() {
        // Гравитация и прыжок
        if (this.isJumping) {
            this.velocity -= this.gravity;
            const currentBottom = parseInt(this.dino.style.bottom) || 5;
            this.dino.style.bottom = (currentBottom + this.velocity) + 'vh';

            if (parseInt(this.dino.style.bottom) <= 5) {
                this.dino.style.bottom = '5vh';
                this.isJumping = false;
                this.velocity = 0;
                this.dino.classList.add('dino-run');
                this.dino.classList.remove('dino-jump');
            }
        }

        // Создание препятствий
        if (Math.random() < 0.02 && this.gameObstacleIterator > this.gameObstaclePause) {
            this.createObstacle();
        }
        this.gameObstacleIterator > this.gameObstaclePause ? this.gameObstacleIterator = 0 : this.gameObstacleIterator++;

        // Создание облаков
        if (Math.random() < 0.008) {
            this.createCloud();
        }

        // Движение препятствий
        this.obstacles.forEach((obstacle, index) => {
            obstacle.x -= this.gameSpeed;
            obstacle.element.style.left = obstacle.x + 'px';

            // Удаление вышедших за экран препятствий
            if (obstacle.x < -100) {
                obstacle.element.remove();
                this.obstacles.splice(index, 1);
                this.score += 5;
                this.updateScore();
            }

            // Проверка столкновений
            if (this.checkCollision(this.dino, obstacle.element)) {
                this.gameOver();
            }
        });

        // Движение облаков
        this.clouds.forEach((cloud, index) => {
            cloud.x -= this.gameSpeed * 0.3;
            cloud.element.style.left = cloud.x + 'px';

            // Удаление вышедших за экран облаков
            if (cloud.x < -100) {
                cloud.element.remove();
                this.clouds.splice(index, 1);
            }
        });

        // Увеличение скорости игры
        if (this.score > 0 && this.score % 100 === 0) {
            this.gameSpeed = 8 + Math.floor(this.score / 100) * 0.5;
        }
    }

    render() {
        // Обновление позиций уже происходит в updateGame
    }

    jump() {
        if (!this.isJumping && this.gameRunning) {
            this.isJumping = true;
            this.velocity = 12;
            this.dino.classList.remove('dino-run');
            this.dino.classList.add('dino-jump');

            // Звуковой эффект (опционально)
            this.playJumpSound();
        }
    }

    playJumpSound() {
        // Простой звуковой эффект с помощью Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 200;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'cactus';
        obstacle.style.left = window.innerWidth + 'px';

        const height = 4 + Math.random() * 6;
        obstacle.style.height = height + 'vmin';

        this.container.appendChild(obstacle);

        this.obstacles.push({
            element: obstacle,
            x: window.innerWidth
        });
    }

    createCloud(startX = window.innerWidth) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';

        const size = 8 + Math.random() * 12;
        const height = 10 + Math.random() * 40;

        cloud.style.width = size + 'vmin';
        cloud.style.height = (size * 0.6) + 'vmin';
        cloud.style.left = startX + 'px';
        cloud.style.top = height + 'vh';

        this.container.appendChild(cloud);

        this.clouds.push({
            element: cloud,
            x: startX
        });
    }

    checkCollision(dino, obstacle) {
        const dinoRect = dino.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();

        // Уменьшаем зону столкновения для более справедливой игры
        const collisionPadding = 10;

        return !(dinoRect.right - collisionPadding < obstacleRect.left + collisionPadding ||
            dinoRect.left + collisionPadding > obstacleRect.right - collisionPadding ||
            dinoRect.bottom - collisionPadding < obstacleRect.top + collisionPadding ||
            dinoRect.top + collisionPadding > obstacleRect.bottom - collisionPadding);
    }

    updateScore() {
        this.scoreElement.textContent = `Очки: ${this.score}`;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dinoHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
    }

    updateHighScoreDisplay() {
        this.highScoreElement.textContent = `Рекорд: ${this.highScore}`;
    }

    gameOver() {
        this.gameRunning = false;
        cancelAnimationFrame(this.gameLoopId);

        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.gameOverScreen.style.display = 'block';
        this.container.classList.add('shake');

        setTimeout(() => {
            this.container.classList.remove('shake');
        }, 500);
    }

    restart() {
        // Очистка препятствий и облаков
        this.obstacles.forEach(obstacle => obstacle.element.remove());
        this.clouds.forEach(cloud => cloud.element.remove());

        this.obstacles = [];
        this.clouds = [];

        // Сброс позиции динозавра
        this.dino.style.bottom = '5vh';
        this.dino.classList.remove('dino-jump');
        this.isJumping = false;
        this.velocity = 0;

        this.start();
    }

    handleResize() {
        // Пересоздаем облака при изменении размера окна
        this.clouds.forEach(cloud => cloud.element.remove());
        this.clouds = [];

        for (let i = 0; i < 5; i++) {
            this.createCloud(Math.random() * window.innerWidth);
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Ошибка полноэкранного режима: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// Создание экземпляра игры
const game = new DinoGame();

// Глобальные функции для кнопок
function startGame() {
    game.start();
}

function restartGame() {
    game.restart();
}