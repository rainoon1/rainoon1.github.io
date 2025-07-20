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
  const target = getOffWorkTime();
  let diff = Math.max(0, target - now);
  let hours = Math.floor(diff / 3600000);
  let minutes = Math.floor((diff % 3600000) / 60000);
  let seconds = Math.floor((diff % 60000) / 1000);
  let text = '';
  if (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute)) {
    text = `距离下班还有: ${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  } else {
    text = `距离明天上班还有: ${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
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
      <input type="number" min="0" max="23" id="offwork-hour" value="${hour}" style="width:3em;font-size:1em;vertical-align:middle;"> :
      <input type="number" min="0" max="59" id="offwork-minute" value="${minute}" style="width:3em;font-size:1em;vertical-align:middle;">
    </label>
    <button class="button" id="save-offwork">保存</button>
  `;
  document.getElementById('save-offwork').onclick = () => {
    const h = parseInt(document.getElementById('offwork-hour').value, 10);
    const m = parseInt(document.getElementById('offwork-minute').value, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      alert('请输入有效的时间！');
      return;
    }
    setUserOffWorkTime(h, m);
    updateCountdown();
  };
}
setInterval(updateCountdown, 1000);
window.addEventListener('DOMContentLoaded', () => {
  updateCountdown();
  renderOffWorkTimeInput();
  renderGameHall();
  handleHashChange();
});

// 游戏大厅数据
const games = [
  { key: 'puzzle', name: '拼图游戏', icon: '🧩', best: null },
  { key: 'stopwatch', name: '掐秒表', icon: '⏱️', best: null },
  { key: 'mouse', name: '鼠标轨迹', icon: '🖱️', best: null },
  { key: 'reaction', name: '反应测试', icon: '⚡', best: null },
];

function loadBestScores() {
  games.forEach(g => {
    g.best = localStorage.getItem(`record_${g.key}`) || '--';
  });
}

function renderGameHall() {
  loadBestScores();
  const hall = document.querySelector('.game-hall');
  hall.innerHTML = games.map(g => {
    let href = '';
    if (g.key === 'puzzle') href = 'games/puzzle/puzzle.html';
    else if (g.key === 'stopwatch') href = 'games/stopwatch/stopwatch.html';
    else if (g.key === 'mouse') href = 'games/mouse/mouse.html';
    else if (g.key === 'reaction') href = 'games/reaction/reaction.html';
    return `
      <div class="game-card">
        <a href="${href}" style="text-decoration:none;color:inherit;display:block;">
          <div style="font-size:2.5em;">${g.icon}</div>
          <div style="margin:8px 0 4px;font-weight:bold;">${g.name}</div>
          <div style="font-size:0.9em;color:#888;">最佳成绩: ${g.best}</div>
        </a>
      </div>
    `;
  }).join('');
}
function showView(view) {
  document.querySelector('.game-hall').style.display = (view === 'hall') ? '' : 'none';
  document.getElementById('puzzle-view').style.display = (view === 'puzzle') ? '' : 'none';
}
function handleHashChange() {
  if (location.hash === '#puzzle') {
    showView('puzzle');
    if (window.renderPuzzleView) window.renderPuzzleView();
  } else {
    showView('hall');
  }
}
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange); 