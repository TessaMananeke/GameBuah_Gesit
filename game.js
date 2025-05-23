const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameContainer = document.getElementById("gameContainer");
const gameOverText = document.getElementById("gameOverText");

const instructionBtn = document.getElementById("instructionBtn");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Sound effects
const collectSound = document.getElementById("collectSound");
const bombSound = document.getElementById("bombSound");
const bonusSound = document.getElementById("bonusSound");

let player, items, score, gameOver, keys, gameStarted, level, lastSpawnTime, spawnInterval;
let gameSpeed = 3;
let particles = [];
let canvasWidth, canvasHeight;

const emojiBuah = ["🍎", "🍌", "🍊", "🍉", "🍓"];
const emojiBomb = ["💣", "🪨"];
const emojiBonus = ["🍒", "⭐"];

function resizeCanvas() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  if (player) {
    // Adjust player position on resize
    player.y = canvasHeight - 70;
    player.x = Math.min(player.x, canvasWidth - player.width);
  }
}

function initGame() {
  resizeCanvas();
  
  player = {
    x: canvasWidth / 2 - 40,
    y: canvasHeight - 70,
    width: 80,
    height: 30,
    speed: 10,
    color: "#4cc9f0",
    emoji: "🧺"
  };
  
  items = [];
  score = 0;
  level = 1;
  gameOver = false;
  keys = {};
  gameStarted = true;
  gameSpeed = 3;
  spawnInterval = 800;
  lastSpawnTime = 0;
  
  scoreDisplay.textContent = "Skor: 0";
  levelDisplay.textContent = "Level: 1";
  restartBtn.style.display = "none";
  gameOverText.textContent = "";
  
  // Reset canvas class
  canvas.className = "";
}

function spawnItem(timestamp) {
  if (timestamp - lastSpawnTime < spawnInterval) return;
  lastSpawnTime = timestamp;
  
  const rand = Math.random();
  let symbol, isBomb, isBonus, points;
  
  if (rand < 0.15) {
    // Spawn bomb
    symbol = emojiBomb[Math.floor(Math.random() * emojiBomb.length)];
    isBomb = true;
    isBonus = false;
    points = -5;
  } else if (rand < 0.25) {
    // Spawn bonus
    symbol = emojiBonus[Math.floor(Math.random() * emojiBonus.length)];
    isBomb = false;
    isBonus = true;
    points = 10;
  } else {
    // Spawn normal fruit
    symbol = emojiBuah[Math.floor(Math.random() * emojiBuah.length)];
    isBomb = false;
    isBonus = false;
    points = 1;
  }
  
  const x = Math.random() * (canvasWidth - 40);
  const size = isBonus ? 40 : 32;
  const speed = isBonus ? gameSpeed + 1 : gameSpeed;
  
  items.push({ 
    x, 
    y: -40, 
    symbol, 
    isBomb, 
    isBonus,
    points,
    size,
    speed
  });
}

function drawPlayer() {
  // Draw basket
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#ff6b6b";
  ctx.fillRect(player.x + 8, player.y - 8, player.width - 16, 8);
  
  // Draw player emoji
  ctx.font = "36px Arial";
  ctx.fillText(player.emoji, player.x + player.width/2 - 18, player.y - 12);
}

function drawItems() {
  for (let item of items) {
    ctx.font = `${item.size}px Arial`;
    
    // Add shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    if (item.isBomb) {
      ctx.fillStyle = "#333";
    } else if (item.isBonus) {
      ctx.fillStyle = "#ffd700";
    } else {
      ctx.fillStyle = "#ff6b6b";
    }
    
    ctx.fillText(item.symbol, item.x, item.y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
  }
}

function updateItems() {
  for (let i = items.length - 1; i >= 0; i--) {
    items[i].y += items[i].speed;
    
    // Check collision with player
    if (
      items[i].y + items[i].size >= player.y &&
      items[i].x + items[i].size >= player.x &&
      items[i].x <= player.x + player.width
    ) {
      if (items[i].isBomb) {
        gameOver = true;
        bombSound.currentTime = 0;
        bombSound.play();
        createExplosion(items[i].x + 20, items[i].y + 20);
        restartBtn.style.display = "block";
        canvas.classList.add("game-over");
        gameOverText.innerHTML = "Game Over!<br>Skor Akhir: " + score + "<br>Level: " + level;
      } else {
        if (items[i].isBonus) {
          bonusSound.currentTime = 0;
          bonusSound.play();
          createParticles(items[i].x + 20, items[i].y + 20, 20, "#ffd700");
        } else {
          collectSound.currentTime = 0;
          collectSound.play();
          createParticles(items[i].x + 20, items[i].y + 20, 15, "#ff6b6b");
        }
        score += items[i].points;
        scoreDisplay.textContent = `Skor: ${score}`;
        
        // Level up every 20 points
        if (score > 0 && score % 20 === 0) {
          levelUp();
        }
      }
      items.splice(i, 1);
    } else if (items[i].y > canvasHeight) {
      items.splice(i, 1);
    }
  }
}

function levelUp() {
  level++;
  gameSpeed += 0.5;
  spawnInterval = Math.max(200, spawnInterval - 50);
  levelDisplay.textContent = `Level: ${level}`;
  
  // Flash level display
  levelDisplay.style.transform = "scale(1.2)";
  setTimeout(() => {
    levelDisplay.style.transform = "scale(1)";
  }, 300);
  
  // Change player color temporarily
  const originalColor = player.color;
  player.color = "#ffd700";
  setTimeout(() => {
    player.color = originalColor;
  }, 500);
}

function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      size: Math.random() * 8 + 3,
      color: color,
      speedX: Math.random() * 8 - 4,
      speedY: Math.random() * 8 - 4,
      life: 40 + Math.random() * 30
    });
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: x,
      y: y,
      size: Math.random() * 12 + 5,
      color: `hsl(${Math.random() * 30 + 10}, 100%, 50%)`,
      speedX: Math.random() * 15 - 7.5,
      speedY: Math.random() * 15 - 7.5,
      life: 50 + Math.random() * 40
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].speedX;
    particles[i].y += particles[i].speedY;
    particles[i].life--;
    
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (let particle of particles) {
    ctx.globalAlpha = particle.life / 100;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function updatePlayer() {
  if ((keys["ArrowLeft"] || keys["a"] || keys["A"]) && player.x > 0) {
    player.x -= player.speed;
  }
  if ((keys["ArrowRight"] || keys["d"] || keys["D"]) && player.x + player.width < canvasWidth) {
    player.x += player.speed;
  }
}

function drawBackground() {
  // Draw cloud-like background elements
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i < 5; i++) {
    const x = (Date.now() * 0.02 + i * 150) % (canvasWidth + 200) - 100;
    const y = 80 + i * 150;
    drawCloud(x, y, 100, 30);
  }
}

function drawCloud(x, y, width, height) {
  ctx.beginPath();
  ctx.arc(x, y, height, 0, Math.PI * 2);
  ctx.arc(x + width * 0.3, y - height * 0.3, height * 0.9, 0, Math.PI * 2);
  ctx.arc(x + width * 0.6, y, height * 0.8, 0, Math.PI * 2);
  ctx.arc(x + width, y, height, 0, Math.PI * 2);
  ctx.fill();
}

function loop(timestamp) {
  if (!gameStarted) return;

  if (!gameOver) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw background pattern
    drawBackground();
    
    updatePlayer();
    spawnItem(timestamp);
    updateItems();
    updateParticles();
    
    drawItems();
    drawParticles();
    drawPlayer();
    
    requestAnimationFrame(loop);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawBackground();
    
    // Dark overlay for game over
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}

// Event listeners
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  // Prevent arrow keys from scrolling the page
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'A', 'd', 'D'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener("keyup", e => keys[e.key] = false);

// Mobile touch controls
leftBtn.addEventListener("touchstart", (e) => {
  keys["ArrowLeft"] = true;
  e.preventDefault();
}, { passive: false });

leftBtn.addEventListener("touchend", () => {
  keys["ArrowLeft"] = false;
});

rightBtn.addEventListener("touchstart", (e) => {
  keys["ArrowRight"] = true;
  e.preventDefault();
}, { passive: false });

rightBtn.addEventListener("touchend", () => {
  keys["ArrowRight"] = false;
});

// Button events
instructionBtn.addEventListener("click", () => {
  const info = document.getElementById("info");
  info.style.display = info.style.display === "none" ? "block" : "none";
  
  // Hide score and level displays when instructions are shown
  if (info.style.display === "block") {
    scoreDisplay.style.display = "none";
    levelDisplay.style.display = "none";
  } else {
    scoreDisplay.style.display = "block";
    levelDisplay.style.display = "block";
  }
});

startBtn.addEventListener("click", () => {
  initGame();
  requestAnimationFrame(loop);
});

restartBtn.addEventListener("click", () => {
  initGame();
  requestAnimationFrame(loop);
});

// Handle window resize
window.addEventListener("resize", () => {
  if (gameStarted && !gameOver) {
    resizeCanvas();
  }
});

// Preload emojis to avoid rendering delay
window.onload = function() {
  const preload = document.createElement('div');
  preload.style.position = 'absolute';
  preload.style.left = '-9999px';
  
  // Preload all emojis
  [...emojiBuah, ...emojiBomb, ...emojiBonus].forEach(emoji => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.style.fontSize = '40px';
    preload.appendChild(span);
  });
  
  document.body.appendChild(preload);
};