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
const GRAVITY_DIST = 200;
const GRAVITY_STRENGTH = 0.25;
const MAX_SPEED = 3.2;
const GRAVITY_POINT_DURATION = 30000; // 引力点持续时间30秒
const GRAVITY_POINT_INTERVAL = 30000; // 每30秒生成一个新的引力点

let balls = [];
let gravityPoint = null;
let lastGravityPointTime = 0;

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

function createGravityPoint() {
  const margin = 100; // 距离边缘的最小距离
  return {
    x: margin + Math.random() * (width - 2 * margin),
    y: margin + Math.random() * (height - 2 * margin),
    createdAt: Date.now(),
    strength: 0.8 + Math.random() * 0.4 // 随机强度
  };
}

function updateGravityPoint() {
  const now = Date.now();
  
  // 检查是否需要创建新的引力点
  if (!gravityPoint && now - lastGravityPointTime > GRAVITY_POINT_INTERVAL) {
    gravityPoint = createGravityPoint();
    lastGravityPointTime = now;
  }
  
  // 检查当前引力点是否过期
  if (gravityPoint && now - gravityPoint.createdAt > GRAVITY_POINT_DURATION) {
    gravityPoint = null;
  }
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  resetBalls();
  // 重置引力点
  gravityPoint = null;
  lastGravityPointTime = 0;
});

function updateBalls() {
  for (let b of balls) {
    // 边缘反弹
    if (b.x - b.r < 0 && b.vx < 0) b.vx *= -1;
    if (b.x + b.r > width && b.vx > 0) b.vx *= -1;
    if (b.y - b.r < 0 && b.vy < 0) b.vy *= -1;
    if (b.y + b.r > height && b.vy > 0) b.vy *= -1;
    
    // 引力点效果
    if (gravityPoint) {
      const dx = gravityPoint.x - b.x;
      const dy = gravityPoint.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < GRAVITY_DIST) {
        const force = (1 - dist / GRAVITY_DIST) * GRAVITY_STRENGTH * gravityPoint.strength;
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
  
  // 绘制引力点（如果存在）
  if (gravityPoint) {
    const age = Date.now() - gravityPoint.createdAt;
    const progress = age / GRAVITY_POINT_DURATION;
    const alpha = 0.3 * (1 - progress * 0.5); // 随时间逐渐变淡
    
    // 绘制引力点光环
    ctx.beginPath();
    ctx.arc(gravityPoint.x, gravityPoint.y, GRAVITY_DIST, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制引力点中心
    ctx.beginPath();
    ctx.arc(gravityPoint.x, gravityPoint.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 绘制脉冲效果
    const pulseSize = 15 + Math.sin(age * 0.01) * 5;
    ctx.beginPath();
    ctx.arc(gravityPoint.x, gravityPoint.y, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 绘制小球
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
  updateGravityPoint();
  updateBalls();
  drawBalls();
  requestAnimationFrame(animate);
}
animate(); 