// 拼图游戏主逻辑
const puzzleConfig = {
  sizes: [3, 4, 5],
  defaultImages: Array.from({length: 20}, (_, i) => `../../assets/1%20(${i+1}).jpg`),
  maxUploadSize: 1024 * 1024, // 1MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

let state = {
  size: 3,
  type: 'number', // 'number' or 'image'
  image: puzzleConfig.defaultImages[0],
  customImage: null,
  board: [],
  empty: {x: 0, y: 0},
  moves: 0,
  best: null,
  solved: false
};

function renderTips() {
  const tips = document.getElementById('puzzle-tips');
  if (!tips) return;
  let desc = '';
  if (state.type === 'number') {
    desc = `<b>数字拼图玩法：</b><br><br>
      将打乱的数字方块通过点击相邻空格移动，按顺序排列为 1~N，空格在最后一格即为完成。<br><br>
      支持 3x3、4x4、5x5 难度。步数越少越好！`;
  } else {
    desc = `<b>图片拼图玩法：</b><br><br>
      将打乱的图片碎片通过点击相邻空格移动，拼回原图。<br><br>
      可选择内置图片或上传自定义图片。支持多种难度。步数越少越好！`;
  }
  tips.innerHTML = desc + `<div style='margin-top:18px;text-align:right;'><button id='puzzle-help-btn' class='button' style='font-size:0.95em;padding:6px 16px;'>帮助</button></div>`;
  const helpBtn = document.getElementById('puzzle-help-btn');
  if (helpBtn) {
    helpBtn.onclick = function() {
      showPuzzleHelp();
    };
  }
}

function showPuzzleHelp() {
  // 自定义弹窗
  let dialog = document.getElementById('puzzle-help-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'puzzle-help-dialog';
    dialog.style.position = 'fixed';
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.background = 'rgba(255,255,255,0.98)';
    dialog.style.boxShadow = '0 8px 32px rgba(76,175,80,0.18)';
    dialog.style.borderRadius = '18px';
    dialog.style.padding = '32px 18px 22px 18px';
    dialog.style.zIndex = '2000';
    dialog.style.textAlign = 'center';
    dialog.style.fontSize = '1.15em';
    dialog.style.color = '#388e3c';
    dialog.style.width = '90vw';
    dialog.style.maxWidth = '360px';
    dialog.innerHTML = `
      <div style='font-size:1.25em;font-weight:bold;margin-bottom:12px;'>拼图类游戏终极技巧</div>
      <div style='margin-bottom:18px;line-height:1.7;'>按顺序移动图片时，<br>临边的数字需要和前一个数字一起移进去。<br>例如 3*3 中的 23、47；<br>4*4 中的 34、78、9 和 13 等。</div>
      <button class='button' id='puzzle-help-close'>关闭</button>
    `;
    document.body.appendChild(dialog);
    document.getElementById('puzzle-help-close').onclick = () => dialog.remove();
  }
}

function renderCtrl() {
  const ctrl = document.getElementById('puzzle-ctrl');
  ctrl.innerHTML = `
    <label>难度：
      <select id="puzzle-size">${puzzleConfig.sizes.map(s => `<option value="${s}"${s===state.size?' selected':''}>${s}×${s}</option>`).join('')}</select>
    </label>
    <label>类型：
      <select id="puzzle-type">
        <option value="number"${state.type==='number'?' selected':''}>数字拼图</option>
        <option value="image"${state.type==='image'?' selected':''}>图片拼图</option>
      </select>
    </label>
    <span id="puzzle-img-ctrl" style="display:${state.type==='image'?'inline-block':'none'};">
      <label>图库：
        <select id="puzzle-img-select">
          ${puzzleConfig.defaultImages.map((img,i) => `<option value="${img}"${img===state.image?' selected':''}>图片${i+1}</option>`).join('')}
        </select>
      </label>
      <label>或上传：
        <input type="file" id="puzzle-img-upload" accept="image/jpeg,image/png,image/webp">
      </label>
    </span>
    <button class="button" id="puzzle-reset">重置</button>
  `;
  document.getElementById('puzzle-size').onchange = e => { state.size = +e.target.value; startGame(); };
  document.getElementById('puzzle-type').onchange = e => { state.type = e.target.value; renderTips(); renderCtrl(); startGame(); };
  if (state.type === 'image') {
    document.getElementById('puzzle-img-select').onchange = e => { state.image = e.target.value; state.customImage = null; startGame(); };
    document.getElementById('puzzle-img-upload').onchange = e => handleUpload(e);
  }
  document.getElementById('puzzle-reset').onclick = startGame;
}

function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!puzzleConfig.allowedTypes.includes(file.type)) {
    alert('仅支持JPG/PNG/WEBP格式');
    return;
  }
  if (file.size > puzzleConfig.maxUploadSize) {
    alert('图片不能超过1MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(evt) {
    state.customImage = evt.target.result;
    state.image = evt.target.result;
    startGame();
  };
  reader.readAsDataURL(file);
}

function startGame() {
  state.board = createSolvableBoard(state.size);
  state.empty = findEmpty(state.board);
  state.moves = 0;
  state.solved = false;
  // 记录每个块的原始索引（图片切片用）
  state.blockMap = [];
  let n = 1;
  for (let y = 0; y < state.size; y++) {
    for (let x = 0; x < state.size; x++) {
      state.blockMap.push({x, y, idx: (y * state.size + x)});
    }
  }
  renderTips();
  renderCtrl();
  renderBoard();
  renderInfo();
}

function createSolvableBoard(size) {
  let arr = Array.from({length: size*size}, (_, i) => i);
  let board;
  do {
    shuffle(arr);
    board = [];
    for (let y = 0; y < size; y++) board.push(arr.slice(y*size, (y+1)*size));
  } while (!isSolvable(board));
  return board;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function isSolvable(board) {
  // 参考15-puzzle有解性判定
  const size = board.length;
  const flat = board.flat();
  let inv = 0;
  for (let i = 0; i < flat.length; i++) {
    for (let j = i+1; j < flat.length; j++) {
      if (flat[i] && flat[j] && flat[i] > flat[j]) inv++;
    }
  }
  if (size % 2 === 1) {
    return inv % 2 === 0;
  } else {
    const emptyRow = board.findIndex(row => row.includes(0));
    return (inv + emptyRow) % 2 === 1;
  }
}

function findEmpty(board) {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      if (board[y][x] === 0) return {x, y};
    }
  }
}

function renderBoard() {
  const main = document.getElementById('puzzle-main');
  const size = state.size;
  // 16:9 容器
  main.innerHTML = `<div class="puzzle-grid" style="display:grid;grid-template-columns:repeat(${size},1fr);gap:4px;user-select:none;width:100%;max-width:640px;aspect-ratio:16/9;margin:0 auto;"></div>`;
  const grid = main.querySelector('.puzzle-grid');
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = state.board[y][x];
      const cell = document.createElement('div');
      cell.className = 'puzzle-cell';
      cell.style.background = v === 0 ? 'transparent' : '#fff';
      cell.style.borderRadius = '6px';
      cell.style.aspectRatio = '16/9';
      cell.style.width = '100%';
      cell.style.display = 'flex';
      cell.style.alignItems = 'center';
      cell.style.justifyContent = 'center';
      cell.style.fontSize = '1.5em';
      cell.style.cursor = v === 0 ? 'default' : 'pointer';
      cell.style.boxShadow = v === 0 ? 'none' : '0 1px 4px rgba(0,0,0,0.08)';
      cell.style.position = 'relative';
      if (state.type === 'number') {
        cell.textContent = v === 0 ? '' : v;
      } else if (state.type === 'image') {
        if (v !== 0) {
          // v: 1~N*N-1，表示原始块索引
          const idx = v - 1;
          const px = idx % size, py = Math.floor(idx / size);
          const bgImg = state.customImage || state.image;
          cell.style.backgroundImage = `url('${bgImg}')`;
          cell.style.backgroundSize = `${size*100}% ${size*100}%`;
          cell.style.backgroundPosition = `${px/(size-1)*100}% ${py/(size-1)*100}%`;
          cell.style.backgroundRepeat = 'no-repeat';
        }
      }
      cell.onclick = () => tryMove(x, y);
      grid.appendChild(cell);
    }
  }
}

function showWinDialog() {
  let dialog = document.getElementById('puzzle-win-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'puzzle-win-dialog';
    dialog.style.position = 'fixed';
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.background = 'rgba(255,255,255,0.98)';
    dialog.style.boxShadow = '0 8px 32px rgba(76,175,80,0.18)';
    dialog.style.borderRadius = '18px';
    dialog.style.padding = '48px 32px 32px 32px';
    dialog.style.zIndex = '1000';
    dialog.style.textAlign = 'center';
    dialog.style.fontSize = '2em';
    dialog.style.color = '#388e3c';
    dialog.innerHTML = `🎉 恭喜完成拼图！<br><br><button class="button" id="puzzle-win-close">关闭</button>`;
    document.body.appendChild(dialog);
    document.getElementById('puzzle-win-close').onclick = () => dialog.remove();
  }
}

function tryMove(x, y) {
  if (state.solved) return;
  const {empty, board, size} = state;
  const dx = Math.abs(x - empty.x), dy = Math.abs(y - empty.y);
  if (dx + dy !== 1) return;
  // 交换
  [board[empty.y][empty.x], board[y][x]] = [board[y][x], board[empty.y][empty.x]];
  state.empty = {x, y};
  state.moves++;
  renderBoard();
  renderInfo();
  if (checkSolved()) {
    state.solved = true;
    saveBest();
    setTimeout(() => showWinDialog(), 100);
  }
}

function checkSolved() {
  const {board, size} = state;
  let n = 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (y === size-1 && x === size-1) return board[y][x] === 0;
      if (board[y][x] !== n++) return false;
    }
  }
  return true;
}

function renderInfo() {
  const info = document.getElementById('puzzle-info');
  const best = getBest();
  info.innerHTML = `步数：${state.moves} ${state.solved ? '✅' : ''} <span style="margin-left:2em;">最佳：${best ?? '--'}</span>`;
}

function getBest() {
  const key = `puzzle_best_${state.size}_${state.type}_${state.type==='image'?state.image:''}`;
  return localStorage.getItem(key);
}
function saveBest() {
  const key = `puzzle_best_${state.size}_${state.type}_${state.type==='image'?state.image:''}`;
  const prev = getBest();
  if (!prev || state.moves < +prev) {
    localStorage.setItem(key, state.moves);
  }
}

window.addEventListener('DOMContentLoaded', startGame); 