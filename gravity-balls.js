// Gravity Balls 全局背景效果
const canvas = document.getElementById('gravity-bg');
const ctx = canvas.getContext('2d');
let width = window.innerWidth, height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const BALL_NUM = 72;
const BALL_SIZES = [20, 17, 14, 11, 9, 7]; // 6档大小
const BALL_COLORS = [
  'rgba(255,182,193,0.7)',   // 淡粉色（大）
  'rgba(173,216,230,0.7)',   // 淡蓝色
  'rgba(255,235,59,0.7)',    // 黄色
  'rgba(76,175,80,0.7)',     // 绿色
  'rgba(135,206,250,0.7)',   // 天蓝色
  'rgba(244,67,54,0.7)'      // 红色（小）
];
const GRAVITY_DIST = 180;
const GRAVITY_STRENGTH = 0.22;
const MAX_SPEED = 3.2;

let balls = [];
let mouse = { x: width/2, y: height/2, lastX: width/2, lastY: width/2, lastMove: Date.now(), fast: false };

function randomBall() {
  // 随机分配一个档位
  const idx = Math.floor(Math.random() * BALL_SIZES.length);
  const r = BALL_SIZES[idx];
  const color = BALL_COLORS[idx];
  const angle = Math.random() * Math.PI * 2;
  const speed = 1.2 + Math.random() * 1.8;
  return {
    x: Math.random() * (width - 2*r) + r,
    y: Math.random() * (height - 2*r) + r,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r,
    color
  };
}

function resetBalls() {
  balls = [];
  for (let i = 0; i < BALL_NUM; i++) balls.push(randomBall());
}
resetBalls();

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  resetBalls();
});

canvas.addEventListener('mousemove', e => {
  const now = Date.now();
  const dx = e.clientX - mouse.lastX;
  const dy = e.clientY - mouse.lastY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  mouse.fast = dist > 60;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.lastX = e.clientX;
  mouse.lastY = e.clientY;
  mouse.lastMove = now;
});
canvas.addEventListener('mouseleave', () => {
  mouse.x = width/2;
  mouse.y = height/2;
  mouse.fast = false;
});

function updateBalls() {
  for (let b of balls) {
    // 边缘反弹
    if (b.x - b.r < 0 && b.vx < 0) b.vx *= -1;
    if (b.x + b.r > width && b.vx > 0) b.vx *= -1;
    if (b.y - b.r < 0 && b.vy < 0) b.vy *= -1;
    if (b.y + b.r > height && b.vy > 0) b.vy *= -1;
    // 引力效果
    if (!mouse.fast) {
      const dx = mouse.x - b.x;
      const dy = mouse.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < GRAVITY_DIST) {
        const force = (1 - dist / GRAVITY_DIST) * GRAVITY_STRENGTH;
        b.vx += force * dx / dist;
        b.vy += force * dy / dist;
      }
    }
    // 限速
    const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
    if (speed > MAX_SPEED) {
      b.vx = b.vx / speed * MAX_SPEED;
      b.vy = b.vy / speed * MAX_SPEED;
    }
    b.x += b.vx;
    b.y += b.vy;
  }
}

function drawBalls() {
  ctx.clearRect(0, 0, width, height);
  for (let b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function animate() {
  updateBalls();
  drawBalls();
  requestAnimationFrame(animate);
}
animate(); 