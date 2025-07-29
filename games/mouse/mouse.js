// 鼠标轨迹挑战游戏
class MouseTrackGame {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.isMobile = window.innerWidth <= 700;
    this.route = [];
    this.track = [];
    this.started = false;
    this.finished = false;
    this.canvas = null;
    this.ctx = null;
    this.width = 400;
    this.height = 320;
    // 路线宽度、轨迹宽度减小
    this.routeWidth = 10;
    // 轨迹宽度进一步减小
    this.trackWidth = 3;
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    // 标题和按钮区
    const topRow = document.createElement('div');
    topRow.style.textAlign = 'center';
    topRow.style.margin = '0 0 18px 0';
    const againBtn = document.createElement('button');
    againBtn.className = 'button';
    againBtn.textContent = '再来一条路线';
    againBtn.onclick = () => this.reset();
    topRow.appendChild(againBtn);
    this.container.appendChild(topRow);
    // canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.background = '#f8fff5';
    this.canvas.style.borderRadius = '16px';
    this.canvas.style.boxShadow = '0 2px 8px rgba(76,175,80,0.08)';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    // 说明
    const tips = document.createElement('div');
    tips.style.textAlign = 'center';
    tips.style.margin = '18px 0 0 0';
    tips.style.color = '#388e3c';
    tips.style.fontSize = '1.08em';
    tips.innerHTML = '请按住起点，沿路线滑动到终点，偏离越小分数越高！';
    this.container.appendChild(tips);
    // 事件
    this.bindEvents();
    // 生成路线
    this.reset();
  }

  reset() {
    this.route = this.generateRoute();
    this.track = [];
    this.started = false;
    this.finished = false;
    this.render();
  }

  generateRoute() {
    // 生成无交叉、起点终点距离远的螺旋曲线路径
    const points = [];
    const n = 36;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    let angle = Math.random() * Math.PI * 2; // 随机起始角度
    let radius = 20;
    const maxRadius = Math.min(this.width, this.height) / 2 - 20;
    const angleStep = Math.PI * 2.5 / n; // 螺旋更快
    const radiusStep = (maxRadius - 20) / (n - 1);
    for (let i = 0; i < n; i++) {
      // angle和radius都单调递增，扰动很小
      angle += angleStep + (Math.random() - 0.5) * 0.05;
      radius += radiusStep + (Math.random() - 0.5) * 1.5;
      radius = Math.max(20, Math.min(radius, maxRadius));
      let x = centerX + Math.cos(angle) * radius;
      let y = centerY + Math.sin(angle) * radius;
      x = Math.min(Math.max(x, 16), this.width - 16);
      y = Math.min(Math.max(y, 16), this.height - 16);
      points.push([x, y]);
    }
    // 采样平滑曲线点
    const smooth = [];
    for (let t = 0; t < 1; t += 1 / (n * 18)) {
      let pt = this.getBezierPoint(points, t);
      smooth.push(pt);
    }
    return smooth;
  }

  // 贝塞尔曲线插值（Catmull-Rom样条近似）
  getBezierPoint(pts, t) {
    const n = pts.length;
    const p = t * (n - 1);
    const i = Math.floor(p);
    const u = p - i;
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[Math.min(n - 1, i + 1)];
    const p3 = pts[Math.min(n - 1, i + 2)];
    // Catmull-Rom to Bezier
    const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * u * u + (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * u * u * u);
    const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * u * u + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * u * u * u);
    return [x, y];
  }

  bindEvents() {
    // PC
    this.canvas.onmousedown = (e) => this.handleStart(e.offsetX, e.offsetY);
    this.canvas.onmousemove = (e) => this.handleMove(e.offsetX, e.offsetY, e.buttons);
    this.canvas.onmouseup = (e) => this.handleEnd();
    this.canvas.onmouseleave = (e) => this.handleEnd();
    // Mobile
    this.canvas.ontouchstart = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        this.handleStart(x, y);
      }
    };
    this.canvas.ontouchmove = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        this.handleMove(x, y, 1);
      }
      e.preventDefault();
    };
    this.canvas.ontouchend = (e) => this.handleEnd();
    this.canvas.ontouchcancel = (e) => this.handleEnd();
  }

  handleStart(x, y) {
    if (this.finished) return;
    // 必须从起点附近开始
    const [sx, sy] = this.route[0];
    if (this.track.length === 0 && this.dist(x, y, sx, sy) > this.routeWidth) return;
    this.started = true;
    this.track = [[x, y]];
    this.render();
  }

  handleMove(x, y, btn) {
    if (!this.started || this.finished) return;
    if (btn === 0) return; // 鼠标未按下
    this.track.push([x, y]);
    this.render();
    // 到达终点附近自动结束
    const [ex, ey] = this.route[this.route.length - 1];
    if (this.dist(x, y, ex, ey) < this.routeWidth) {
      this.handleEnd();
    }
  }

  handleEnd() {
    if (!this.started || this.finished) return;
    this.started = false;
    this.finished = true;
    this.render();
    if (this.track.length > 5) {
      const score = this.calcScore();
      const comment = this.getComment(score);
      this.showResultDialog('挑战结果', `你的得分：<b>${score}</b> 分<br><span style='color:#1b5e20;font-size:1.1em;'>${comment}</span>`);
    }
  }

  dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  // 计算轨迹与路线的平均偏离，转为分数
  calcScore() {
    let sum = 0;
    let cnt = 0;
    const w = this.routeWidth; // 路线宽度
    for (let i = 0; i < this.track.length; i += 1) {
      const [tx, ty] = this.track[i];
      if (tx < 0 || tx > this.width || ty < 0 || ty > this.height) {
        sum += w * 8; // 出界惩罚为路线宽度的8倍
        cnt++;
        continue;
      }
      let minDist = Infinity;
      for (let j = 0; j < this.route.length - 1; j++) {
        const d = this.pointToSegmentDist(tx, ty, this.route[j], this.route[j + 1]);
        if (d < minDist) minDist = d;
      }
      sum += minDist;
      cnt++;
    }
    const avg = sum / cnt;
    // 评分区间与路线宽度一致
    // 满分区间：w/2内，60分区间：w~2.5w，最低分10分
    let score = 100;
    if (avg > w/2 && avg <= w) {
      score = 100 - ((avg - w/2) / (w/2)) * 40; // 100~60
    } else if (avg > w && avg <= 2.5*w) {
      score = 60 - ((avg - w) / (1.5*w)) * 50; // 60~10
    } else if (avg > 2.5*w) {
      score = 10;
    }
    return Math.round(score);
  }

  // 点到线段距离
  pointToSegmentDist(px, py, [x1, y1], [x2, y2]) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return this.dist(px, py, xx, yy);
  }

  getComment(score) {
    if (score >= 95) return '轨迹大师！';
    if (score >= 85) return '非常稳健！';
    if (score >= 75) return '不错哦！';
    if (score >= 60) return '还需练习！';
    return '多多练习吧~';
  }

  showResultDialog(title, html) {
    let dialog = document.getElementById('mouse-result-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'mouse-result-dialog';
      dialog.style.position = 'fixed';
      dialog.style.left = '0';
      dialog.style.top = '0';
      dialog.style.width = '100vw';
      dialog.style.height = '100vh';
      dialog.style.background = 'rgba(0,0,0,0.55)';
      dialog.style.zIndex = '30000';
      dialog.style.display = 'flex';
      dialog.style.alignItems = 'center';
      dialog.style.justifyContent = 'center';
      dialog.innerHTML = `
        <div style='background:#fff;padding:18px 16px 14px 16px;border-radius:16px;max-width:96vw;max-height:90vh;box-shadow:0 4px 24px rgba(0,0,0,0.18);position:relative;display:flex;flex-direction:column;align-items:center;'>
          <div style='font-weight:bold;font-size:1.18em;text-align:center;margin-bottom:12px;color:#388e3c;'>${title}</div>
          <div style='margin-bottom:18px;width:100%;text-align:center;font-size:1.15em;'>${html}</div>
          <button class='button' id='mouse-result-close' style='margin:0 auto;font-size:1.08em;padding:8px 32px;border-radius:8px;'>关闭</button>
        </div>
      `;
      document.body.appendChild(dialog);
      document.getElementById('mouse-result-close').onclick = () => dialog.remove();
      dialog.onclick = e => { if (e.target === dialog) dialog.remove(); };
    }
  }

  render() {
    // 清空
    this.ctx.clearRect(0, 0, this.width, this.height);
    // 路线
    this.ctx.save();
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = this.routeWidth;
    this.ctx.beginPath();
    for (let i = 0; i < this.route.length; i++) {
      const [x, y] = this.route[i];
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    // 起点终点
    const [sx, sy] = this.route[0];
    const [ex, ey] = this.route[this.route.length - 1];
    this.ctx.fillStyle = '#388e3c';
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, this.routeWidth / 2, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.fillStyle = '#e53935';
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, this.routeWidth / 2, 0, 2 * Math.PI);
    this.ctx.fill();
    // 轨迹
    if (this.track.length > 1) {
      this.ctx.strokeStyle = '#1976d2';
      this.ctx.lineWidth = this.trackWidth;
      this.ctx.beginPath();
      for (let i = 0; i < this.track.length; i++) {
        const [x, y] = this.track[i];
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.mouseTrackGame = new MouseTrackGame('#mouse-view');
}); 