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
  let label = '';
  
  if (now < offWork) {
    // 还没到下班时间，显示倒计时
    let diff = Math.max(0, offWork - now);
    let hours = Math.floor(diff / 3600000);
    let minutes = Math.floor((diff % 3600000) / 60000);
    let seconds = Math.floor((diff % 60000) / 1000);
    text = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    label = '距离下班还有';
  } else {
    // 已经过了下班时间，显示下班快乐
    text = '下班快乐！';
    label = '';
  }
  
  document.querySelector('.countdown').textContent = text;
  document.querySelector('.countdown-label').textContent = label;
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
  const games = ['number_puzzle', 'image_puzzle', 'stopwatch', 'mouse', 'reaction'];
  const gameNames = ['数字拼图', '图片拼图', '3秒挑战', '鼠标轨迹', '反应测试'];
  const gameIcons = ['🧩', '🖼️', '⏱️', '🖱️', '⚡'];
  const gameModes = ['3×3数字拼图', '4×4图片拼图', '3秒动态秒表', '默认模式', '挑战1次'];
  
  games.forEach((game, index) => {
    let score = '--';
    
    // 从 gameHistoryManager 获取成绩
    if (window.gameHistoryManager) {
      try {
        const bestScore = window.gameHistoryManager.getGameBestScoreCompatible(game, 'default');
        if (bestScore !== null) {
          score = bestScore;
        }
      } catch (e) {
        console.log(`无法从 gameHistoryManager 获取 ${game} 的成绩:`, e);
      }
    }
    
    // 格式化成绩显示
    if (score !== '--') {
      switch (game) {
        case 'number_puzzle':
          // 数字拼图显示完成时间（只保留秒级）
          score = `${Math.round(score)}秒`;
          break;
        case 'image_puzzle':
          // 图片拼图显示完成时间（只保留秒级）
          score = `${Math.round(score)}秒`;
          break;
        case 'stopwatch':
          // 3秒挑战显示误差值（毫秒级）
          score = `${Math.round(score)}ms`;
          break;
        case 'mouse':
          // 鼠标轨迹显示完成度
          score = `${score}%`;
          break;
        case 'reaction':
          // 反应测试显示反应时间（毫秒级，精度到毫秒）
          score = `${Math.round(score)}ms`;
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
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      `;
      
      // 添加点击事件，跳转到对应游戏
      statCard.onclick = () => {
        let gameUrl = '';
        switch (game) {
          case 'number_puzzle':
            gameUrl = 'games/number-puzzle/number-puzzle.html';
            break;
          case 'image_puzzle':
            gameUrl = 'games/image-puzzle/image-puzzle.html';
            break;
          case 'stopwatch':
            gameUrl = 'games/stopwatch/stopwatch.html';
            break;
          case 'mouse':
            gameUrl = 'games/mouse/mouse.html';
            break;
          case 'reaction':
            gameUrl = 'games/reaction/reaction.html';
            break;
        }
        
        if (gameUrl) {
          // 添加点击反馈效果
          statCard.style.transform = 'scale(0.95)';
          setTimeout(() => {
            statCard.style.transform = '';
            // 跳转到游戏页面
            window.open(gameUrl, '_blank');
          }, 150);
        }
      };
      
      // 添加鼠标悬停效果
      statCard.style.cursor = 'pointer';
      statCard.title = `点击开始${gameNames[index]}`;
    }
  });
  
  // 更新进度条
  updateStatProgress();
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
  const games = ['number_puzzle', 'image_puzzle', 'stopwatch', 'mouse', 'reaction'];
  let best = '--';
  let bestGame = '';
  
  games.forEach(game => {
    let score = null;
    
    // 从新格式获取成绩
    if (window.gameHistoryManager) {
      try {
        score = window.gameHistoryManager.getGameBestScoreCompatible(game, 'default');
      } catch (e) {
        console.log(`无法从 gameHistoryManager 获取 ${game} 的成绩:`, e);
      }
    }
    
    if (score !== null && score !== '--') {
      let normalizedScore = score;
      
      // 根据游戏类型标准化成绩（越小越好）
      switch (game) {
        case 'number_puzzle':
        case 'image_puzzle':
          // 拼图游戏：完成时间，越小越好
          if (best === '--' || normalizedScore < parseFloat(best)) {
            best = score;
            bestGame = game;
          }
          break;
        case 'stopwatch':
          // 3秒挑战：误差值，越小越好
          if (best === '--' || normalizedScore < parseFloat(best)) {
            best = score;
            bestGame = game;
          }
          break;
        case 'mouse':
          // 鼠标轨迹：完成度，越大越好，但这里我们找最小的（100-完成度）
          const mouseScore = 100 - normalizedScore;
          if (best === '--' || mouseScore < parseFloat(best)) {
            best = score;
            bestGame = game;
          }
          break;
        case 'reaction':
          // 反应测试：反应时间，越小越好
          if (best === '--' || normalizedScore < parseFloat(best)) {
            best = score;
            bestGame = game;
          }
          break;
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
  { 
    key: 'number_puzzle', 
    name: '数字拼图', 
    icon: '🧩', 
    best: null, 
    description: '将数字按顺序排列，挑战空间思维',
    difficulty: 'medium',
    category: 'puzzle',
    estimatedTime: '2-4分钟',
    tags: ['益智', '空间思维']
  },
  { 
    key: 'image_puzzle', 
    name: '图片拼图', 
    icon: '🖼️', 
    best: null, 
    description: '将图片碎片拼回原图，考验视觉记忆',
    difficulty: 'hard',
    category: 'puzzle',
    estimatedTime: '3-5分钟',
    tags: ['益智', '视觉记忆']
  },
  { 
    key: 'stopwatch', 
    name: '3秒挑战', 
    icon: '⏱️', 
    best: null, 
    description: '测试你的时间感知能力',
    difficulty: 'easy',
    category: 'reaction',
    estimatedTime: '1-2分钟',
    tags: ['反应', '时间感知']
  },
  { 
    key: 'mouse', 
    name: '鼠标轨迹', 
    icon: '🖱️', 
    best: null, 
    description: '锻炼你的鼠标控制技巧',
    difficulty: 'medium',
    category: 'skill',
    estimatedTime: '2-3分钟',
    tags: ['技巧', '鼠标控制']
  },
  { 
    key: 'reaction', 
    name: '反应测试', 
    icon: '⚡', 
    best: null, 
    description: '测试你的反应速度',
    difficulty: 'easy',
    category: 'reaction',
    estimatedTime: '1-2分钟',
    tags: ['反应', '速度测试']
  },
];

function loadBestScores() {
  games.forEach(g => {
    // 从新格式获取最佳成绩
    if (window.gameHistoryManager) {
      try {
        const bestScore = window.gameHistoryManager.getGameBestScoreCompatible(g.key, 'default');
        if (bestScore !== null) {
          g.best = bestScore;
          return;
        }
      } catch (e) {
        console.log(`无法从 gameHistoryManager 获取 ${g.key} 的成绩:`, e);
      }
    }
    
    g.best = '--';
  });
}

function renderGameHall() {
  loadBestScores();
  const hall = document.querySelector('.game-hall');
  const gameModes = ['3×3数字拼图', '4×4图片拼图', '3秒动态秒表', '默认模式', '挑战1次'];
  
  // 获取筛选条件
  const difficultyFilter = document.getElementById('difficulty-filter')?.value || 'all';
  const categoryFilter = document.getElementById('category-filter')?.value || 'all';
  
  // 筛选游戏
  let filteredGames = games.filter(game => {
    if (difficultyFilter !== 'all' && game.difficulty !== difficultyFilter) return false;
    if (categoryFilter !== 'all' && game.category !== categoryFilter) return false;
    return true;
  });
  
  hall.innerHTML = filteredGames.map((g, index) => {
    let href = '';
    if (g.key === 'number_puzzle') href = 'games/number-puzzle/number-puzzle.html';
    else if (g.key === 'image_puzzle') href = 'games/image-puzzle/image-puzzle.html';
    else if (g.key === 'stopwatch') href = 'games/stopwatch/stopwatch.html';
    else if (g.key === 'mouse') href = 'games/mouse/mouse.html';
    else if (g.key === 'reaction') href = 'games/reaction/reaction.html';
    
    // 格式化成绩显示
    let formattedScore = g.best;
    if (g.best !== '--') {
      switch (g.key) {
        case 'number_puzzle':
          // 数字拼图只保留秒级
          formattedScore = `${Math.round(g.best)}秒`;
          break;
        case 'image_puzzle':
          // 图片拼图只保留秒级
          formattedScore = `${Math.round(g.best)}秒`;
          break;
        case 'stopwatch':
          formattedScore = `${Math.round(g.best)}ms`;
          break;
        case 'mouse':
          formattedScore = `${g.best}%`;
          break;
        case 'reaction':
          // 反应测试精度到毫秒级
          formattedScore = `${Math.round(g.best)}ms`;
          break;
      }
    }
    
    // 难度标签
    const difficultyLabels = {
      'easy': '简单',
      'medium': '中等', 
      'hard': '困难'
    };
    
    const difficultyColors = {
      'easy': 'rgba(76, 175, 80, 0.3)',    // 绿色
      'medium': 'rgba(255, 152, 0, 0.3)',  // 橙色
      'hard': 'rgba(244, 67, 54, 0.3)'     // 红色
    };
    
    return `
      <div class="game-card">
        <div style="font-size:3em;margin-bottom:15px;">${g.icon}</div>
        <div style="font-size:1.3em;font-weight:bold;margin-bottom:10px;">${g.name}</div>
        <div style="font-size:0.9em;opacity:0.8;margin-bottom:10px;">${g.description}</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-bottom:10px;">
          <span style="background:${difficultyColors[g.difficulty]};padding:2px 8px;border-radius:10px;font-size:0.8em;border:1px solid rgba(255,255,255,0.2);">${difficultyLabels[g.difficulty]}</span>
          <span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:10px;font-size:0.8em;">${g.estimatedTime}</span>
        </div>
        <div style="font-size:0.8em;opacity:0.6;margin-bottom:8px;font-style:italic;">${gameModes[index]}</div>
        <div style="font-size:0.9em;opacity:0.7;margin-bottom:10px;">最佳成绩: ${formattedScore}</div>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="game-play-btn" onclick="window.open('${href}', '_blank')" style="flex:1;padding:8px 12px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.9em;transition:all 0.3s ease;font-weight:600;box-shadow:0 2px 8px rgba(102,126,234,0.3);">
            🎮 开始游戏
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // 如果没有游戏匹配筛选条件
  if (filteredGames.length === 0) {
    hall.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:white;padding:40px;">
        <div style="font-size:3em;margin-bottom:20px;">🔍</div>
        <h3>没有找到匹配的游戏</h3>
        <p style="opacity:0.8;margin-top:10px;">请尝试调整筛选条件</p>
      </div>
    `;
  }
}

// 更新今日统计
function updateDailyStats() {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
  const todayStats = stats[today] || { gamesPlayed: 0, totalTime: 0 };
  
  document.getElementById('today-games').textContent = todayStats.gamesPlayed;
  document.getElementById('today-time').textContent = Math.round(todayStats.totalTime / 60);
  
  // 获取今日最佳成绩
  const games = ['number_puzzle', 'image_puzzle', 'stopwatch', 'mouse', 'reaction'];
  let bestScore = '--';
  let bestGame = '';
  
  games.forEach(game => {
    let score = null;
    
    // 从新格式获取成绩
    if (window.gameHistoryManager) {
      try {
        score = window.gameHistoryManager.getGameBestScoreCompatible(game, 'default');
      } catch (e) {
        console.log(`无法从 gameHistoryManager 获取 ${game} 的成绩:`, e);
      }
    }
    
    if (score !== null && score !== '--') {
      if (bestScore === '--' || score < parseFloat(bestScore)) {
        bestScore = score;
        bestGame = game;
      }
    }
  });
  
  if (bestScore !== '--') {
    const gameNames = { 
      number_puzzle: '数字拼图', 
      image_puzzle: '图片拼图',
      stopwatch: '3秒挑战', 
      mouse: '鼠标轨迹', 
      reaction: '反应测试' 
    };
    
    // 根据游戏类型添加单位
    let formattedScore = bestScore;
    switch (bestGame) {
      case 'number_puzzle':
      case 'image_puzzle':
        // 拼图游戏只保留秒级
        formattedScore = `${Math.round(bestScore)}秒`;
        break;
      case 'stopwatch':
        formattedScore = `${Math.round(bestScore)}ms`;
        break;
      case 'mouse':
        formattedScore = `${bestScore}%`;
        break;
      case 'reaction':
        // 反应测试精度到毫秒级
        formattedScore = `${Math.round(bestScore)}ms`;
        break;
    }
    
    document.getElementById('today-best').textContent = `${gameNames[bestGame]} ${formattedScore}`;
  }
}

// 更新统计卡片进度条
function updateStatProgress() {
  const games = ['number_puzzle', 'image_puzzle', 'stopwatch', 'mouse', 'reaction'];
  
  games.forEach(game => {
    let score = null;
    
    // 从新格式获取最佳成绩
    if (window.gameHistoryManager) {
      try {
        score = window.gameHistoryManager.getGameBestScoreCompatible(game, 'default');
      } catch (e) {
        console.log(`无法从 gameHistoryManager 获取 ${game} 的成绩:`, e);
      }
    }
    
    const progressBar = document.querySelector(`#stat-${game} .progress-fill`);
    
    if (progressBar && score !== null && score !== '--') {
      // 根据游戏类型设置不同的进度计算方式
      let progress = 0;
      switch (game) {
        case 'number_puzzle':
          // 数字拼图（中等难度）：时间越短越好，假设45秒为满分
          progress = Math.max(0, Math.min(100, (45 - score) / 45 * 100));
          break;
        case 'image_puzzle':
          // 图片拼图（困难难度）：时间越短越好，假设90秒为满分
          progress = Math.max(0, Math.min(100, (90 - score) / 90 * 100));
          break;
        case 'stopwatch':
          // 3秒挑战（简单难度）：误差越小越好，假设300ms为满分
          progress = Math.max(0, Math.min(100, (300 - score) / 300 * 100));
          break;
        case 'mouse':
          // 鼠标轨迹（中等难度）：完成度越高越好
          progress = Math.min(100, score);
          break;
        case 'reaction':
          // 反应测试（简单难度）：时间越短越好，假设150ms为满分
          progress = Math.max(0, Math.min(100, (150 - score) / 150 * 100));
          break;
      }
      progressBar.style.width = `${progress}%`;
    }
  });
}

// 页面初始化
function initPage() {
  updateCountdown();
  renderOffWorkTimeInput();
  updateStats();
  updateDailyStats();
  updateStatProgress();
  initNavigation();
  initGameFilters();
  initThemeToggle();
  showSection('home');
  
  // 设置定时器
  setInterval(updateCountdown, 1000);
  
  // 添加一些交互效果
  addInteractiveEffects();
  
  // 初始化游戏历史管理器
  initGameHistory();
}

// 初始化游戏筛选器
function initGameFilters() {
  const difficultyFilter = document.getElementById('difficulty-filter');
  const categoryFilter = document.getElementById('category-filter');
  if (difficultyFilter) {
    difficultyFilter.addEventListener('change', renderGameHall);
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', renderGameHall);
  }
  
  // 为推荐卡片添加点击事件
  document.querySelectorAll('.recommendation-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      const recommendations = [
        () => showSection('games'), // 热门游戏 - 显示所有游戏
        () => {
          // 快速游戏 - 推荐简单难度的游戏
          const easyGames = games.filter(g => g.difficulty === 'easy');
          if (easyGames.length > 0) {
            const randomGame = easyGames[Math.floor(Math.random() * easyGames.length)];
            if (randomGame.key === 'stopwatch') {
              window.open('games/stopwatch/stopwatch.html', '_blank');
            } else if (randomGame.key === 'reaction') {
              window.open('games/reaction/reaction.html', '_blank');
            }
          }
        },
        () => {
          // 挑战模式 - 推荐困难难度的游戏
          const hardGames = games.filter(g => g.difficulty === 'hard');
          if (hardGames.length > 0) {
            const randomGame = hardGames[Math.floor(Math.random() * hardGames.length)];
            if (randomGame.key === 'image_puzzle') {
              window.open('games/image-puzzle/image-puzzle.html', '_blank');
            }
          }
        }
      ];
      if (recommendations[index]) {
        recommendations[index]();
      }
    });
  });
}

// 主题切换功能
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle?.querySelector('.theme-icon');
  
  // 从localStorage读取主题设置
  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeIcon) themeIcon.textContent = '☀️';
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      const newTheme = isDark ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      
      if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
      }
    });
  }
}

function addInteractiveEffects() {
  // 为游戏卡片添加点击效果
  document.querySelectorAll('.game-card').forEach(card => {
    // 为游戏按钮添加悬停效果
    const playBtn = card.querySelector('.game-play-btn');
    
    if (playBtn) {
      playBtn.addEventListener('mouseenter', () => {
        playBtn.style.background = 'rgba(102,126,234,1)';
        playBtn.style.transform = 'scale(1.05)';
      });
      playBtn.addEventListener('mouseleave', () => {
        playBtn.style.background = 'rgba(102,126,234,0.8)';
        playBtn.style.transform = 'scale(1)';
      });
    }
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

// 初始化游戏历史管理器
function initGameHistory() {
  // 等待游戏历史管理器加载完成
  if (window.gameHistoryManager) {
    console.log('游戏历史管理器已加载');
    
    // 不再自动添加示例数据，让用户自己产生真实数据
    
    // 重新更新统计信息，显示从 gameHistoryManager 获取的成绩
    updateStats();
  } else {
    // 如果还没有加载，等待一下再试
    setTimeout(initGameHistory, 100);
  }
}

// 导出函数供其他模块使用
window.recordGamePlay = recordGamePlay;
window.updateStats = updateStats; 