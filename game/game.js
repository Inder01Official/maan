// Game Configuration - Matching InOut Games Jumper style
const CONFIG = {
    GRAVITY: 0.5,
    JUMP_FORCE: -11,
    GROUND_HEIGHT: 80,
    OBSTACLE_SPEED: 6,
    SPAWN_RATE: 75,
    COIN_SPAWN_RATE: 50,
    COLORS: {
        background: '#16202C',
        ground: '#212E3B',
        groundLine: '#F19E38',
        player: '#FFD700',
        playerOutline: '#FFA500',
        obstacle: ['#EA4248', '#FF6B6B', '#EE5A5A'],
        coin: '#FFD700',
        coinInner: '#FFA500',
        text: '#FFFFFF',
        accent: '#F19E38'
    }
};

// Game State
let gameState = {
    isPlaying: false,
    score: 0,
    frameCount: 0,
    speedMultiplier: 1,
    coinsCollected: 0,
    bestScore: parseInt(localStorage.getItem('jumperBestScore')) || 0
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');
const coinsCollectedElement = document.getElementById('coinsCollected');
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

// Player object - Character style like original
const player = {
    x: 60,
    y: 0,
    width: 36,
    height: 36,
    velocityY: 0,
    isJumping: false,
    rotation: 0,
    
    reset() {
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        this.velocityY = 0;
        this.isJumping = false;
        this.rotation = 0;
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
        
        // Rotation effect when jumping
        if (this.isJumping) {
            this.rotation += 0.15;
        } else {
            this.rotation = 0;
        }
        
        const groundLevel = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.isJumping = false;
            this.rotation = 0;
        }
    },
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Main body with gradient
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, CONFIG.COLORS.player);
        gradient.addColorStop(1, CONFIG.COLORS.playerOutline);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(-this.width/2, -this.height/2, this.width, this.height, 8);
        ctx.fill();
        
        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.roundRect(-this.width/2 + 4, -this.height/2 + 4, this.width - 8, 8, 4);
        ctx.fill();
        
        // Eyes - cute character style
        ctx.fillStyle = '#16202C';
        const eyeOffset = this.isJumping ? -2 : 0;
        ctx.beginPath();
        ctx.arc(-8, -4 + eyeOffset, 5, 0, Math.PI * 2);
        ctx.arc(8, -4 + eyeOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-6, -6 + eyeOffset, 2, 0, Math.PI * 2);
        ctx.arc(10, -6 + eyeOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile when on ground
        if (!this.isJumping) {
            ctx.strokeStyle = '#16202C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 2, 8, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
    }
};

// Obstacles array - Spike style like original game
let obstacles = [];

class Obstacle {
    constructor() {
        this.width = 35 + Math.random() * 15;
        this.height = 45 + Math.random() * 25;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        this.color = CONFIG.COLORS.obstacle[Math.floor(Math.random() * CONFIG.COLORS.obstacle.length)];
        this.markedForDeletion = false;
        this.points = this.generateSpikePoints();
    }
    
    generateSpikePoints() {
        const points = [];
        const spikeCount = 3;
        for (let i = 0; i <= spikeCount; i++) {
            points.push({
                x: (i / spikeCount) * this.width,
                y: i % 2 === 0 ? 0 : -15
            });
        }
        return points;
    }
    
    update() {
        this.x -= CONFIG.OBSTACLE_SPEED * gameState.speedMultiplier;
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        
        // Draw spike shape
        const spikeHeight = 20;
        const segments = 4;
        for (let i = 0; i <= segments; i++) {
            const x = this.x + (i / segments) * this.width;
            const y = i % 2 === 0 ? this.y + this.height : this.y;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + 10);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

// Coins array
let coins = [];

class Coin {
    constructor() {
        this.radius = 14;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - 70 - Math.random() * 80;
        this.color = CONFIG.COLORS.coin;
        this.markedForDeletion = false;
        this.rotation = 0;
        this.wobble = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.x -= CONFIG.OBSTACLE_SPEED * gameState.speedMultiplier;
        this.rotation += 0.08;
        this.wobble += 0.1;
        this.y += Math.sin(this.wobble) * 0.5;
        
        if (this.x + this.radius < 0) {
            this.markedForDeletion = true;
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Outer ring
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#FFF8DC');
        gradient.addColorStop(0.5, CONFIG.COLORS.coin);
        gradient.addColorStop(1, CONFIG.COLORS.coinInner);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = CONFIG.COLORS.coinInner;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Dollar sign or coin symbol
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 14px Montserrat, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        
        ctx.restore();
    }
}

// Background particles - Stars/dust effect
let particles = [];

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.twinkle = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.y -= this.speed;
        this.twinkle += 0.05;
        this.opacity = 0.1 + Math.abs(Math.sin(this.twinkle)) * 0.3;
        
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
for (let i = 0; i < 60; i++) {
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

// Draw ground with modern styling
function drawGround() {
    const groundY = canvas.height - CONFIG.GROUND_HEIGHT;
    
    // Ground gradient
    const gradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    gradient.addColorStop(0, CONFIG.COLORS.ground);
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, canvas.width, CONFIG.GROUND_HEIGHT);
    
    // Glowing ground line
    ctx.strokeStyle = CONFIG.COLORS.groundLine;
    ctx.lineWidth = 3;
    ctx.shadowColor = CONFIG.COLORS.groundLine;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Grid pattern on ground
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        const x = (i - gameState.frameCount * CONFIG.OBSTACLE_SPEED * gameState.speedMultiplier) % canvas.width;
        const adjustedX = x < 0 ? x + canvas.width : x;
        ctx.beginPath();
        ctx.moveTo(adjustedX, groundY);
        ctx.lineTo(adjustedX - 30, canvas.height);
        ctx.stroke();
    }
}

// Draw background with gradient matching original
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Calculate multiplier based on score
function getMultiplier() {
    if (gameState.score < 500) return 1.0;
    if (gameState.score < 1000) return 1.5;
    if (gameState.score < 2000) return 2.0;
    if (gameState.score < 3000) return 3.0;
    if (gameState.score < 5000) return 5.0;
    return 10.0;
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
            gameState.score += 100;
            gameState.coinsCollected++;
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
    
    // Calculate multiplier and display
    const multiplier = getMultiplier();
    const displayScore = Math.floor(gameState.score * multiplier);
    scoreElement.textContent = displayScore.toLocaleString();
    multiplierElement.textContent = `x${multiplier.toFixed(1)}`;
    
    // Increase difficulty
    if (gameState.score % 500 === 0) {
        gameState.speedMultiplier += 0.15;
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
        speedMultiplier: 1,
        coinsCollected: 0,
        bestScore: gameState.bestScore
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
    
    const finalScore = Math.floor(gameState.score * getMultiplier());
    
    // Update best score
    if (finalScore > gameState.bestScore) {
        gameState.bestScore = finalScore;
        localStorage.setItem('jumperBestScore', gameState.bestScore.toString());
    }
    
    finalScoreElement.textContent = finalScore.toLocaleString();
    bestScoreElement.textContent = gameState.bestScore.toLocaleString();
    coinsCollectedElement.textContent = gameState.coinsCollected;
    
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
        e.preventDefault();
    }
});

// Initial draw
function initialDraw() {
    resizeCanvas();
    drawBackground();
    drawGround();
    player.reset();
    player.draw();
    
    // Show best score on start screen
    bestScoreElement.textContent = gameState.bestScore.toLocaleString();
}

initialDraw();
