// Game Configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    GROUND_HEIGHT: 100,
    OBSTACLE_SPEED: 5,
    SPAWN_RATE: 90, // frames between spawns
    COIN_SPAWN_RATE: 60
};

// Game State
let gameState = {
    isPlaying: false,
    score: 0,
    frameCount: 0,
    speedMultiplier: 1
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Resize canvas to fit container
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Player object
const player = {
    x: 80,
    y: 0,
    width: 40,
    height: 40,
    velocityY: 0,
    isJumping: false,
    color: '#FFD700',
    
    reset() {
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        this.velocityY = 0;
        this.isJumping = false;
    },
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = CONFIG.JUMP_FORCE;
            this.isJumping = true;
        }
    },
    
    update() {
        this.velocityY += CONFIG.GRAVITY;
        this.y += this.velocityY;
        
        const groundLevel = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.isJumping = false;
        }
    },
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 8);
        ctx.fill();
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 5, this.width - 10, 10, 4);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 15, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 28, this.y + 15, 4, 0, Math.PI * 2);
        ctx.fill();
    }
};

// Obstacles array
let obstacles = [];

class Obstacle {
    constructor() {
        this.width = 30 + Math.random() * 20;
        this.height = 40 + Math.random() * 30;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        this.color = `hsl(${Math.random() * 60 + 300}, 70%, 50%)`;
        this.markedForDeletion = false;
    }
    
    update() {
        this.x -= CONFIG.OBSTACLE_SPEED * gameState.speedMultiplier;
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
            gameState.score += 10;
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fill();
        
        // Spike effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y + 10);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.fill();
    }
}

// Coins array
let coins = [];

class Coin {
    constructor() {
        this.radius = 15;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - 80 - Math.random() * 100;
        this.color = '#FFD700';
        this.markedForDeletion = false;
        this.rotation = 0;
    }
    
    update() {
        this.x -= CONFIG.OBSTACLE_SPEED * gameState.speedMultiplier;
        this.rotation += 0.1;
        if (this.x + this.radius < 0) {
            this.markedForDeletion = true;
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        
        ctx.restore();
    }
}

// Background particles
let particles = [];

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    
    update() {
        this.y -= this.speed;
        if (this.y < 0) {
            this.reset();
        }
    }
    
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize particles
for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCircleCollision(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.width / 2);
    const distY = Math.abs(circle.y - rect.y - rect.height / 2);
    
    if (distX > (rect.width / 2 + circle.radius)) return false;
    if (distY > (rect.height / 2 + circle.radius)) return false;
    
    if (distX <= (rect.width / 2)) return true;
    if (distY <= (rect.height / 2)) return true;
    
    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

// Draw ground
function drawGround() {
    const groundY = canvas.height - CONFIG.GROUND_HEIGHT;
    
    // Ground gradient
    const gradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    gradient.addColorStop(0, '#2d3436');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, canvas.width, CONFIG.GROUND_HEIGHT);
    
    // Ground line
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
}

// Draw background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    if (!gameState.isPlaying) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update and draw particles
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    // Draw ground
    drawGround();
    
    // Spawn obstacles
    if (gameState.frameCount % Math.floor(CONFIG.SPAWN_RATE / gameState.speedMultiplier) === 0) {
        obstacles.push(new Obstacle());
    }
    
    // Spawn coins
    if (gameState.frameCount % Math.floor(CONFIG.COIN_SPAWN_RATE / gameState.speedMultiplier) === 0) {
        coins.push(new Coin());
    }
    
    // Update and draw obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        
        // Check collision with player
        if (checkCollision(player, obstacle)) {
            gameOver();
        }
        
        // Remove off-screen obstacles
        if (obstacle.markedForDeletion) {
            obstacles.splice(index, 1);
        }
    });
    
    // Update and draw coins
    coins.forEach((coin, index) => {
        coin.update();
        coin.draw();
        
        // Check collision with player
        if (checkCircleCollision(coin, player)) {
            gameState.score += 50;
            coin.markedForDeletion = true;
        }
        
        // Remove off-screen coins
        if (coin.markedForDeletion) {
            coins.splice(index, 1);
        }
    });
    
    // Update and draw player
    player.update();
    player.draw();
    
    // Update score
    gameState.score++;
    scoreElement.textContent = `Score: ${gameState.score}`;
    
    // Increase difficulty
    if (gameState.score % 500 === 0) {
        gameState.speedMultiplier += 0.1;
    }
    
    gameState.frameCount++;
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameState = {
        isPlaying: true,
        score: 0,
        frameCount: 0,
        speedMultiplier: 1
    };
    
    player.reset();
    obstacles = [];
    coins = [];
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    gameLoop();
}

// Game over
function gameOver() {
    gameState.isPlaying = false;
    finalScoreElement.textContent = `Score: ${gameState.score}`;
    gameOverScreen.style.display = 'flex';
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Jump on click/tap
canvas.addEventListener('click', () => {
    if (gameState.isPlaying) {
        player.jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying) {
        player.jump();
    }
});

// Jump on spacebar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.isPlaying) {
        player.jump();
    }
});

// Initial draw
function initialDraw() {
    resizeCanvas();
    drawBackground();
    drawGround();
    player.reset();
    player.draw();
}

initialDraw();
