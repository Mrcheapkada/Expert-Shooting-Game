// Select the canvas and set its size
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Function to resize canvas dynamically
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gunX = canvas.width / 2;  // Recenter the gun after resizing
}

// Set initial canvas size
resizeCanvas();

// Resize the canvas when the window resizes
window.addEventListener("resize", resizeCanvas);

let bombs = [];
let bullets = [];
let explosions = [];
let gunX = canvas.width / 2;
const gunWidth = 50;
const gunHeight = 10;
let score = 0;
let speed = 2;
let bombsDestroyed = 0;
let highScore = localStorage.getItem("highScore") || 0;
let wrongAttempts = 0;
const maxWrongAttempts = 10;
let gameOver = false;

// Load background
const backgroundImage = new Image();
backgroundImage.src = "background.jpg";

// Load Sounds
const shootSound = new Audio("shoot.mp3");
const explosionSound = new Audio("explosion.mp3");

// Function to create popup
function showGameOverPopup() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    let popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "#333";
    popup.style.color = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "10px";
    popup.style.textAlign = "center";
    popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    
    popup.innerHTML = `
        <h2>Game Over!</h2>
        <p>Your Score: <b>${score}</b></p>
        <p>High Score: <b>${highScore}</b></p>
        <button id="restartBtn" style="padding:10px 20px; font-size:16px; background:red; color:white; border:none; cursor:pointer; border-radius:5px;">Restart Game</button>
    `;

    document.body.appendChild(popup);

    document.getElementById("restartBtn").addEventListener("click", () => {
        location.reload();
    });
}

// Generate random alphabet
function getRandomLetter() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return letters[Math.floor(Math.random() * letters.length)];
}

// Create bomb object
function createBomb() {
    if (gameOver) return;
    let bomb = {
        x: Math.random() * (canvas.width - 30),
        y: 0,
        speed: speed,
        letter: getRandomLetter()
    };
    bombs.push(bomb);
}

// Move bombs down
function updateBombs() {
    for (let i = 0; i < bombs.length; i++) {
        bombs[i].y += bombs[i].speed;

        if (bombs[i].y > canvas.height - 20) {
            gameOver = true;
            showGameOverPopup();
            return;
        }
    }
}

// Move bullets toward the correct bomb
function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];

        if (bullet.target) {
            let dx = bullet.target.x - bullet.x;
            let dy = bullet.target.y - bullet.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let bulletSpeed = 6;

            bullet.x += (dx / distance) * bulletSpeed;
            bullet.y += (dy / distance) * bulletSpeed;

            if (distance < 10) {
                explosionSound.play();
                explosions.push({ x: bullet.target.x, y: bullet.target.y, radius: 10, opacity: 1 });

                bombs = bombs.filter(b => b !== bullet.target);
                bullets.splice(i, 1);
                score += 10;
                bombsDestroyed++;

                if (bombsDestroyed % 10 === 0) {
                    speed += 0.5;
                }
            }
        } else {
            bullet.x += bullet.dx;
            bullet.y -= 5;

            if (bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) {
                bullets.splice(i, 1);
            }
        }
    }
}

// Check if key matches a bomb
function shootBullet(key) {
    if (gameOver) return;

    let targetBomb = bombs.find(bomb => bomb.letter === key);
    shootSound.play();

    if (targetBomb) {
        bullets.push({ x: gunX, y: canvas.height - gunHeight - 20, target: targetBomb });
    } else {
        bullets.push({ 
            x: gunX, 
            y: canvas.height - gunHeight - 20, 
            dx: Math.random() * 6 - 3, 
            target: null 
        });

        wrongAttempts++;

        if (wrongAttempts >= maxWrongAttempts) {
            gameOver = true;
            showGameOverPopup();
        }
    }
}

// Draw game elements
function drawGame() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Draw gun as a grey triangle
    ctx.fillStyle = "grey";
    ctx.beginPath();
    ctx.moveTo(gunX, canvas.height - gunHeight - 20);
    ctx.lineTo(gunX - gunWidth / 2, canvas.height - 10);
    ctx.lineTo(gunX + gunWidth / 2, canvas.height - 10);
    ctx.closePath();
    ctx.fill();

    // Draw bombs
    bombs.forEach(bomb => {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(bomb.letter, bomb.x, bomb.y + 5);
    });

    // Draw bullets
    ctx.fillStyle = "yellow";
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 10);
    });

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Score: " + score, canvas.width / 2, 30);

    // Draw high score
    ctx.textAlign = "right";
    ctx.fillText("High Score: " + highScore, canvas.width - 20, 30);

    // Draw wrong attempts
    ctx.textAlign = "left";
    ctx.fillText("Wrong Attempts: " + wrongAttempts + "/" + maxWrongAttempts, 20, 30);
}

// Detect keypress and shoot bullet
document.addEventListener("keydown", (event) => {
    let keyPressed = event.key.toUpperCase();
    shootBullet(keyPressed);
});

// Game loop
function gameLoop() {
    updateBombs();
    updateBullets();
    drawGame();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Start game
setInterval(createBomb, 1000);
gameLoop();
