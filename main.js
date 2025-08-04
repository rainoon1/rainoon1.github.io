// 下班倒计时逻辑（支持用户自定义下班时间）
function getUserOffWorkTime() {
  const saved = localStorage.getItem('offWorkTime');
  if (saved) {
    try {
      const { hour, minute } = JSON.parse(saved);
      return { hour, minute };
    } catch {}
  }
  return { hour: 17, minute: 30 };
}

function setUserOffWorkTime(hour, minute) {
  localStorage.setItem('offWorkTime', JSON.stringify({ hour, minute }));
}

function getOffWorkTime() {
  const { hour, minute } = getUserOffWorkTime();
  const now = new Date();
  const offWork = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  if (now > offWork) {
    // 明天上班时间（假设9:00）
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
  }
  return offWork;
}

function updateCountdown() {
  const { hour, minute } = getUserOffWorkTime();
  const now = new Date();
  const offWork = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  let text = '';
  if (now < offWork) {
    let diff = Math.max(0, offWork - now);
    let hours = Math.floor(diff / 3600000);
    let minutes = Math.floor((diff % 3600000) / 60000);
    let seconds = Math.floor((diff % 60000) / 1000);
    text = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  } else {
    text = '00:00:00';
  }
  document.querySelector('.countdown').textContent = text;
}

function renderOffWorkTimeInput() {
  const { hour, minute } = getUserOffWorkTime();
  let container = document.querySelector('.offwork-setup');
  if (!container) {
    container = document.createElement('div');
    container.className = 'offwork-setup';
    container.style.textAlign = 'center';
    container.style.margin = '12px 0';
    document.querySelector('.countdown').insertAdjacentElement('afterend', container);
  }
  container.innerHTML = `
    <label style="font-size:1em;vertical-align:middle;">下班时间：
      <input type="text" id="offwork-hour" value="${hour.toString().padStart(2,'0')}" style="width:3em;font-size:1em;vertical-align:middle;text-align:center;" placeholder="17" maxlength="2"> :
      <input type="text" id="offwork-minute" value="${minute.toString().padStart(2,'0')}" style="width:3em;font-size:1em;vertical-align:middle;text-align:center;" placeholder="30" maxlength="2">
    </label>
    <button class="button" id="save-offwork">保存</button>
  `;
  
  // 添加输入验证
  const hourInput = document.getElementById('offwork-hour');
  const minuteInput = document.getElementById('offwork-minute');
  
  hourInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value > 23) value = 23;
    e.target.value = value;
  });
  
  minuteInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value > 59) value = 59;
    e.target.value = value;
  });
  
  document.getElementById('save-offwork').onclick = () => {
    const h = parseInt(hourInput.value, 10);
    const m = parseInt(minuteInput.value, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      alert('请输入有效的时间！\n小时：0-23\n分钟：0-59');
      return;
    }
    setUserOffWorkTime(h, m);
    updateCountdown();
    // 更新显示格式
    hourInput.value = h.toString().padStart(2,'0');
    minuteInput.value = m.toString().padStart(2,'0');
  };
}

// 统计功能 - 显示四个游戏默认模式下的成绩
function updateStats() {
  const games = ['puzzle', 'stopwatch', 'mouse', 'reaction'];
  const gameNames = ['拼图游戏', '3秒挑战', '鼠标轨迹', '反应测试'];
  const gameIcons = ['🧩', '⏱️', '🖱️', '⚡'];
  const gameModes = ['3×3数字拼图', '3秒动态秒表', '默认模式', '挑战1次'];
  
  games.forEach((game, index) => {
    let score = localStorage.getItem(`record_${game}`) || '--';
    
    // 格式化成绩显示
    if (score !== '--') {
      switch (game) {
        case 'puzzle':
          // 拼图游戏显示完成时间
          score = `${score}秒`;
          break;
        case 'stopwatch':
          // 3秒挑战显示误差值
          score = `${score}秒`;
          break;
        case 'mouse':
          // 鼠标轨迹显示完成度
          score = `${score}%`;
          break;
        case 'reaction':
          // 反应测试显示反应时间
          score = `${score}ms`;
          break;
      }
    }
    
    const statCard = document.querySelector(`#stat-${game}`);
    if (statCard) {
      statCard.innerHTML = `
        <div class="stat-icon">${gameIcons[index]}</div>
        <div class="stat-number">${score}</div>
        <div class="stat-label">${gameNames[index]}</div>
        <div class="stat-mode">${gameModes[index]}</div>
      `;
    }
  });
}

function recordGamePlay(gameKey, duration = 0) {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
  
  if (!stats[today]) {
    stats[today] = {
      gamesPlayed: 0,
      totalTime: 0,
      lastPlayed: null
    };
  }
  
  stats[today].gamesPlayed++;
  stats[today].totalTime += duration;
  stats[today].lastPlayed = new Date().toISOString();
  
  localStorage.setItem('gameStats', JSON.stringify(stats));
  updateStats();
}

function getBestScore() {
  const games = ['puzzle', 'stopwatch', 'mouse', 'reaction'];
  let best = '--';
  
  games.forEach(game => {
    const score = localStorage.getItem(`record_${game}`);
    if (score && score !== '--') {
      if (best === '--' || parseFloat(score) < parseFloat(best)) {
        best = score;
      }
    }
  });
  
  return best;
}

// 导航功能
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .footer-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      if (section) {
        showSection(section);
        updateActiveNavLink(section);
      }
    });
  });
}

function showSection(sectionName) {
  // 隐藏所有section
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // 显示目标section
  const targetSection = document.getElementById(`${sectionName}-section`);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // 特殊处理游戏section
  if (sectionName === 'games') {
    renderGameHall();
  }
}

function updateActiveNavLink(sectionName) {
  // 移除所有active类
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // 添加active类到当前section的链接
  const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// 游戏大厅数据
const games = [
  { key: 'puzzle', name: '拼图游戏', icon: '🧩', best: null, description: '挑战你的空间思维能力' },
  { key: 'stopwatch', name: '3秒挑战', icon: '⏱️', best: null, description: '测试你的时间感知能力' },
  { key: 'mouse', name: '鼠标轨迹', icon: '🖱️', best: null, description: '锻炼你的鼠标控制技巧' },
  { key: 'reaction', name: '反应测试', icon: '⚡', best: null, description: '测试你的反应速度' },
];

function loadBestScores() {
  games.forEach(g => {
    g.best = localStorage.getItem(`record_${g.key}`) || '--';
  });
}

function renderGameHall() {
  loadBestScores();
  const hall = document.querySelector('.game-hall');
  const gameModes = ['3×3数字拼图', '3秒动态秒表', '默认模式', '挑战1次'];
  
  hall.innerHTML = games.map((g, index) => {
    let href = '';
    if (g.key === 'puzzle') href = 'games/puzzle/puzzle.html';
    else if (g.key === 'stopwatch') href = 'games/stopwatch/stopwatch.html';
    else if (g.key === 'mouse') href = 'games/mouse/mouse.html';
    else if (g.key === 'reaction') href = 'games/reaction/reaction.html';
    
    // 格式化成绩显示
    let formattedScore = g.best;
    if (g.best !== '--') {
      switch (g.key) {
        case 'puzzle':
          formattedScore = `${g.best}秒`;
          break;
        case 'stopwatch':
          formattedScore = `${g.best}秒`;
          break;
        case 'mouse':
          formattedScore = `${g.best}%`;
          break;
        case 'reaction':
          formattedScore = `${g.best}ms`;
          break;
      }
    }
    
    return `
      <div class="game-card" onclick="window.open('${href}', '_blank')">
        <div style="font-size:3em;margin-bottom:15px;">${g.icon}</div>
        <div style="font-size:1.3em;font-weight:bold;margin-bottom:10px;">${g.name}</div>
        <div style="font-size:0.9em;opacity:0.8;margin-bottom:10px;">${g.description}</div>
        <div style="font-size:0.8em;opacity:0.6;margin-bottom:8px;font-style:italic;">${gameModes[index]}</div>
        <div style="font-size:0.9em;opacity:0.7;">最佳成绩: ${formattedScore}</div>
      </div>
    `;
  }).join('');
}

// 页面初始化
function initPage() {
  updateCountdown();
  renderOffWorkTimeInput();
  updateStats();
  initNavigation();
  showSection('home');
  
  // 设置定时器
  setInterval(updateCountdown, 1000);
  
  // 添加一些交互效果
  addInteractiveEffects();
}

function addInteractiveEffects() {
  // 为统计卡片添加点击效果
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    });
  });
  
  // 为游戏卡片添加点击效果
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    });
  });
}

// 显示视图函数（保持兼容性）
function showView(view) {
  if (view === 'puzzle') {
    document.getElementById('puzzle-view').style.display = 'block';
    document.querySelector('.main-content').style.display = 'none';
    if (window.renderPuzzleView) window.renderPuzzleView();
  } else {
    document.getElementById('puzzle-view').style.display = 'none';
    document.querySelector('.main-content').style.display = 'block';
  }
}

function handleHashChange() {
  if (location.hash === '#puzzle') {
    showView('puzzle');
  } else {
    showView('hall');
  }
}

// 事件监听器
window.addEventListener('DOMContentLoaded', () => {
  initPage();
  handleHashChange();
});

window.addEventListener('hashchange', handleHashChange);

// 导出函数供其他模块使用
window.recordGamePlay = recordGamePlay;
window.updateStats = updateStats; 