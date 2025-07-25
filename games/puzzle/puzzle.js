// 拼图游戏主逻辑
const puzzleConfig = {
  sizes: [3, 4, 5],
  defaultImages: Array.from({length: 20}, (_, i) => `../../assets/1%20(${i+1}).jpg`),
  maxUploadSize: 1024 * 1024, // 1MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

// 动态图库索引
let imageLibrary = null;
let imageLibraryLoaded = false;

async function loadImageLibrary() {
  if (imageLibraryLoaded) return imageLibrary;
  try {
    const res = await fetch('../../assets/assets-index.json');
    const data = await res.json();
    imageLibrary = Object.entries(data).map(([dir, files]) => ({
      label: dir ? dir : '默认图库',
      dir,
      images: files.map(f => dir ? `../../assets/${dir}/${f}` : `../../assets/${f}`)
    }));
    imageLibraryLoaded = true;
    return imageLibrary;
  } catch (e) {
    // 加载失败时返回空图库
    imageLibrary = [];
    imageLibraryLoaded = true;
    return imageLibrary;
  }
}

let state = {
  size: 3,
  type: 'number', // 'number' or 'image'
  image: '',
  imgDirIdx: 0,
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
  const isMobile = window.innerWidth <= 700;
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
  if (isMobile) {
    tips.innerHTML = `
      <div style='display:flex;justify-content:center;align-items:center;min-height:48px;width:100%;'>
        <button id='puzzle-tips-expand' class='button' style='font-size:1em;padding:8px 24px;margin:0 auto;'>玩法说明</button>
        <button id='puzzle-help-btn' class='button' style='font-size:1em;padding:8px 24px;margin-left:10px;'>帮助</button>
      </div>
    `;
    tips.style.display = 'flex';
    tips.style.justifyContent = 'center';
    tips.style.alignItems = 'center';
    tips.style.minHeight = '48px';
    tips.style.height = 'auto';
    tips.style.padding = '0';
    tips.style.margin = '0 0 10px 0';
    const btnExpand = document.getElementById('puzzle-tips-expand');
    if (btnExpand) btnExpand.onclick = function() { showTipsDialog(desc); };
    const helpBtn = document.getElementById('puzzle-help-btn');
    if (helpBtn) helpBtn.onclick = function() { showPuzzleHelp(); };
  } else {
    tips.innerHTML = desc + `<div style='margin-top:18px;text-align:right;'><button id='puzzle-help-btn' class='button' style='font-size:0.95em;padding:6px 16px;'>帮助</button></div>`;
    const helpBtn = document.getElementById('puzzle-help-btn');
    if (helpBtn) {
      helpBtn.onclick = function() {
        showPuzzleHelp();
      };
    }
  }
}

function showDialog(title, contentHtml) {
  let dialog = document.getElementById('puzzle-unified-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'puzzle-unified-dialog';
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
      <div style='background:#fff;padding:16px 14px 12px 14px;border-radius:16px;max-width:96vw;max-height:90vh;box-shadow:0 4px 24px rgba(0,0,0,0.18);position:relative;display:flex;flex-direction:column;align-items:center;'>
        <div style='font-weight:bold;font-size:1.18em;text-align:center;margin-bottom:12px;color:#388e3c;'>${title}</div>
        <div style='margin-bottom:18px;width:100%;text-align:center;'>${contentHtml}</div>
        <button id='puzzle-unified-close' class='button' style='margin:0 auto;font-size:1.08em;padding:8px 32px;border-radius:8px;'>关闭</button>
      </div>
    `;
    document.body.appendChild(dialog);
    document.getElementById('puzzle-unified-close').onclick = () => dialog.remove();
    dialog.onclick = e => { if (e.target === dialog) dialog.remove(); };
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

let puzzleAspectRatio = 16 / 9; // 默认比例

// 获取图片原始比例
function updatePuzzleAspectRatio() {
  // 优化：移动端下始终保持 16:9，不随图片比例变化
  const isMobile = window.innerWidth <= 700;
  if (isMobile) {
    puzzleAspectRatio = 16 / 9;
    renderBoard();
    return;
  }
  if (state.type === 'image' && state.image) {
    const img = new window.Image();
    img.onload = function() {
      puzzleAspectRatio = img.naturalWidth / img.naturalHeight;
      renderBoard();
    };
    img.onerror = function() {
      puzzleAspectRatio = 16 / 9;
      renderBoard();
    };
    img.src = state.image;
  } else {
    puzzleAspectRatio = 16 / 9;
    renderBoard();
  }
}

// 修改 renderCtrl 里图片选择、上传、目录切换后都调用 updatePuzzleAspectRatio
async function renderCtrl() {
  const ctrl = document.getElementById('puzzle-ctrl');
  let imgDirSel = '', imgSel = '', imgUploadSel = '';
  if (state.type === 'image') {
    const libs = await loadImageLibrary();
    imgDirSel = `<label style="margin-right:0.8em;">图库：<select id="puzzle-img-dir">${libs.map((lib, i) => `<option value="${i}"${state.imgDirIdx===i?' selected':''}>${lib.label}</option>`).join('')}</select></label>`;
    const dirIdx = state.imgDirIdx ?? 0;
    const imgs = libs[dirIdx].images;
    if (!imgs.includes(state.image)) state.image = imgs[0] || '';
    imgSel = `<label>图片：<select id="puzzle-img-select">${imgs.map((img, i) => `<option value="${img}"${img===state.image?' selected':''}>${img.split('/').pop()}</option>`).join('')}</select></label>`;
    imgUploadSel = `<label>或上传：<input type="file" id="puzzle-img-upload" accept="image/jpeg,image/png,image/webp"></label>`;
  }
  ctrl.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:center;">
      <div style="display:flex;align-items:center;gap:0.8em;"> 
        <label>难度：
          <select id="puzzle-size">${puzzleConfig.sizes.map(s => `<option value="${s}"${s===state.size?' selected':''}>${s}×${s}</option>`).join('')}</select>
        </label>
        <label>类型：
          <select id="puzzle-type">
            <option value="number"${state.type==='number'?' selected':''}>数字拼图</option>
            <option value="image"${state.type==='image'?' selected':''}>图片拼图</option>
          </select>
        </label>
      </div>
      <div style="display:flex;align-items:center;gap:0.8em;${state.type!=='image'?'display:none;':''}">
        ${imgDirSel}
        ${imgSel}
      </div>
      <div style="${state.type!=='image'?'display:none;':''}">${imgUploadSel}</div>
    </div>
  `;
  document.getElementById('puzzle-size').onchange = e => { state.size = +e.target.value; startGame(); };
  document.getElementById('puzzle-type').onchange = e => { state.type = e.target.value; startGame(); };
  if (state.type === 'image') {
    document.getElementById('puzzle-img-dir').onchange = e => {
      state.imgDirIdx = +e.target.value;
      loadImageLibrary().then(libs => {
        state.image = libs[state.imgDirIdx].images[0] || '';
        state.customImage = null;
        startGame();
      });
    };
    document.getElementById('puzzle-img-select').onchange = e => { state.image = e.target.value; state.customImage = null; updatePuzzleAspectRatio(); };
    document.getElementById('puzzle-img-upload').onchange = e => handleUpload(e);
  }
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
    updatePuzzleAspectRatio();
  };
  reader.readAsDataURL(file);
}

async function startGame() {
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
  await renderCtrl();
  if (state.type === 'image') {
    updatePuzzleAspectRatio();
  } else {
    puzzleAspectRatio = 16 / 9;
    renderBoard();
  }
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

let isPuzzleFullscreen = false;

function getMax16by9Rect() {
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  // 移动端下最大高度为 60vh，预留顶部和按钮空间
  const maxH = ww < 700 ? Math.floor(wh * 0.6) : wh;
  let w = ww, h = Math.round(ww * 9 / 16);
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * 16 / 9);
  }
  return { width: w, height: h };
}

function renderBoard() {
  const main = document.getElementById('puzzle-main');
  const size = state.size;
  // 全屏按钮
  let fullscreenBtn = '';
  if (!isPuzzleFullscreen) {
    fullscreenBtn = `<button id="puzzle-fullscreen-btn" class="button" style="position:absolute;right:8px;top:8px;z-index:10;font-size:0.95em;padding:6px 16px;">全屏</button>`;
  } else {
    fullscreenBtn = `<button id="puzzle-exit-fullscreen-btn" class="button" style="position:absolute;right:8px;top:8px;z-index:10001;font-size:0.95em;padding:6px 16px;">退出全屏</button>`;
  }
  // 16:9 容器
  let gridGap = isPuzzleFullscreen ? 0 : 4;
  let gridStyle = `display:grid;grid-template-columns:repeat(${size},1fr);grid-template-rows:repeat(${size},1fr);gap:${gridGap}px;user-select:none;position:relative;`;
  let fullscreenWrapperStart = '', fullscreenWrapperEnd = '';
  let showPreviewBtn = '';
  if (isPuzzleFullscreen) {
    const rect = getMax16by9Rect();
    gridStyle += `width:${rect.width}px;height:${rect.height}px;max-width:100vw;max-height:100vh;aspect-ratio:16/9;`;
    fullscreenWrapperStart = `<div class='puzzle-fullscreen-bg' style='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999;background:#e8f5e9;display:flex;align-items:center;justify-content:center;flex-direction:column;'>`;
    fullscreenWrapperEnd = '</div>';
  } else {
    gridStyle += 'width:100%;max-width:640px;aspect-ratio:16/9;margin:0 auto;';
    fullscreenWrapperStart = '';
    fullscreenWrapperEnd = '';
  }
  // 按钮区
  const isMobile = window.innerWidth <= 700;
  let btnGroup = `<div style='display:flex;gap:14px;justify-content:center;align-items:center;margin:18px 0 0 0;'>
    <button class='button' id='puzzle-reset' style='font-size:1.08em;padding:8px 28px;${isMobile ? 'min-width:40vw;' : ''}'>重置</button>
    ${state.type === 'image' ? `<button id='puzzle-preview-btn' class='button' style='font-size:1.08em;padding:8px 28px;${isMobile ? 'min-width:40vw;' : ''}'>查看原图</button>` : ''}
    ${!isPuzzleFullscreen ? `<button id='puzzle-fullscreen-btn' class='button' style='font-size:1.08em;padding:8px 28px;${isMobile ? 'min-width:40vw;' : ''}'>全屏</button>` : `<button id='puzzle-exit-fullscreen-btn' class='button' style='font-size:1.08em;padding:8px 28px;${isMobile ? 'min-width:40vw;' : ''}'>退出全屏</button>`}
  </div>`;
  main.innerHTML = `${fullscreenWrapperStart}<div class=\"puzzle-grid\" style=\"${gridStyle}\"></div>${btnGroup}${fullscreenWrapperEnd}`;
  const grid = main.querySelector('.puzzle-grid');
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = state.board[y][x];
      const cell = document.createElement('div');
      cell.className = 'puzzle-cell';
      cell.style.background = v === 0 ? 'transparent' : '#fff';
      cell.style.borderRadius = '6px';
      cell.style.width = '100%';
      cell.style.height = '100%';
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
  // 绑定全屏按钮事件
  const btnFullscreen = document.getElementById('puzzle-fullscreen-btn');
  if (btnFullscreen) btnFullscreen.onclick = enterPuzzleFullscreen;
  const btnExitFullscreen = document.getElementById('puzzle-exit-fullscreen-btn');
  if (btnExitFullscreen) btnExitFullscreen.onclick = exitPuzzleFullscreen;
  const btnReset = document.getElementById('puzzle-reset');
  if (btnReset) btnReset.onclick = startGame;
  // 绑定原图预览按钮
  const previewBtn = document.getElementById('puzzle-preview-btn');
  if (previewBtn) previewBtn.onclick = showPuzzlePreview;
  // 设置全屏样式
  const puzzleContent = document.getElementById('puzzle-content');
  if (isPuzzleFullscreen) {
    puzzleContent.classList.add('puzzle-fullscreen');
    document.body.style.overflow = 'hidden';
  } else {
    puzzleContent.classList.remove('puzzle-fullscreen');
    document.body.style.overflow = '';
  }
}

function enterPuzzleFullscreen() {
  isPuzzleFullscreen = true;
  renderBoard();
  // 隐藏 tips、ctrl、info 区域
  document.getElementById('puzzle-tips').style.display = 'none';
  document.getElementById('puzzle-ctrl').style.display = 'none';
  document.getElementById('puzzle-info').style.display = 'none';
}
function exitPuzzleFullscreen() {
  isPuzzleFullscreen = false;
  renderBoard();
  document.getElementById('puzzle-tips').style.display = '';
  document.getElementById('puzzle-ctrl').style.display = '';
  document.getElementById('puzzle-info').style.display = '';
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
    dialog.style.zIndex = '40000';
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

function showPuzzlePreview() {
  // 统一弹窗UI
  const imgUrl = state.customImage || state.image;
  showDialog('原图预览', `<img src='${imgUrl}' style='max-width:90vw;max-height:60vh;display:block;border-radius:10px;'>`);
}

window.addEventListener('DOMContentLoaded', () => { startGame(); }); 