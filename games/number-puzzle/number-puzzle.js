// 数字拼图游戏逻辑
class NumberPuzzle {
  constructor() {
    this.size = 4;
    this.board = [];
    this.empty = { x: 0, y: 0 };
    this.moves = 0;
    this.startTime = null;
    this.timer = null;
    this.gameStarted = false;
    this.solved = false;

    
    this.init();
  }

  init() {
    this.bindEvents();

    this.loadBestScore();
    this.updateDisplay();
  }



  getDifficultyString() {
    switch (this.size) {
      case 3: return '3x3';
      case 4: return '4x4';
      case 5: return '5x5';
      default: return '4x4';
    }
  }

  bindEvents() {
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
    document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
    document.getElementById('puzzle-size').addEventListener('change', (e) => {
      this.size = parseInt(e.target.value);
      this.resetGame();
    });
  }



  startGame() {
    this.gameStarted = true;
    this.solved = false;
    this.moves = 0;
    this.startTime = Date.now();
    this.board = this.createSolvableBoard();
    this.empty = this.findEmpty();
    this.renderBoard();
    this.startTimer();
    this.updateDisplay();
  }

  resetGame() {
    if (this.gameStarted) {
      this.startGame();
    }
  }

  createSolvableBoard() {
    let arr = Array.from({ length: this.size * this.size }, (_, i) => i);
    let board;
    do {
      this.shuffle(arr);
      board = [];
      for (let y = 0; y < this.size; y++) {
        board.push(arr.slice(y * this.size, (y + 1) * this.size));
      }
    } while (!this.isSolvable(board));
    return board;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  isSolvable(board) {
    const size = board.length;
    let inversions = 0;
    const flatBoard = board.flat();
    
    // 计算逆序数
    for (let i = 0; i < flatBoard.length - 1; i++) {
      for (let j = i + 1; j < flatBoard.length; j++) {
        if (flatBoard[i] !== 0 && flatBoard[j] !== 0 && flatBoard[i] > flatBoard[j]) {
          inversions++;
        }
      }
    }
    
    // 找到空格位置
    const emptyRow = board.findIndex(row => row.includes(0));
    
    if (size % 2 === 1) {
      // 奇数阶：逆序数必须为偶数
      return inversions % 2 === 0;
    } else {
      // 偶数阶：逆序数 + 空格行数必须为奇数
      return (inversions + emptyRow) % 2 === 1;
    }
  }

  findEmpty() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.board[y][x] === 0) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  renderBoard() {
    const boardElement = document.getElementById('puzzle-board');
    const boardSize = Math.min(400, window.innerWidth - 100);
    const cellSize = boardSize / this.size;
    
    boardElement.innerHTML = '';
    boardElement.style.display = 'grid';
    boardElement.style.gridTemplateColumns = `repeat(${this.size}, ${cellSize}px)`;
    boardElement.style.gridTemplateRows = `repeat(${this.size}, ${cellSize}px)`;
    boardElement.style.gap = '4px';
    boardElement.style.justifyContent = 'center';
    boardElement.style.alignItems = 'center';
    
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = document.createElement('div');
        const value = this.board[y][x];
        
        cell.className = 'number-cell';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        // 修复字体大小计算，确保数字可见
        const fontSize = Math.max(16, Math.min(cellSize * 0.4, cellSize * 0.6));
        cell.style.fontSize = `${fontSize}px`;
        cell.style.lineHeight = `${cellSize}px`;
        
        if (value === 0) {
          cell.classList.add('empty');
          cell.textContent = '';
        } else {
          cell.textContent = value;
        }
        
        cell.addEventListener('click', () => this.tryMove(x, y));
        boardElement.appendChild(cell);
      }
    }
  }

  tryMove(x, y) {
    if (!this.gameStarted || this.solved) return;
    
    // 检查是否与空格相邻
    const dx = Math.abs(x - this.empty.x);
    const dy = Math.abs(y - this.empty.y);
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      // 交换位置
      [this.board[this.empty.y][this.empty.x], this.board[y][x]] = 
      [this.board[y][x], this.board[this.empty.y][this.empty.x]];
      
      this.empty = { x, y };
      this.moves++;
      
      this.renderBoard();
      this.updateDisplay();
      
      if (this.checkSolved()) {
        this.gameWon();
      }
    }
  }

  checkSolved() {
    let expected = 1;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (y === this.size - 1 && x === this.size - 1) {
          if (this.board[y][x] !== 0) return false;
        } else {
          if (this.board[y][x] !== expected) return false;
          expected++;
        }
      }
    }
    return true;
  }

  gameWon() {
    this.solved = true;
    this.stopTimer();
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    
    // 保存最佳记录
    this.saveBestScore(timeElapsed);
    
    // 记录到历史系统
    this.recordGameScore(timeElapsed);
    
    
    
    // 显示胜利对话框
    this.showWinDialog(timeElapsed);
  }

  recordGameScore(timeElapsed) {
    if (window.gameHistoryManager) {
      const scoreData = {
        score: timeElapsed, // 用时作为成绩（越短越好）
        moves: this.moves,
        timeSpent: timeElapsed * 1000 // 转换为毫秒
      };
      
      window.gameHistoryManager.recordGameScore(
        'number_puzzle',
        this.getDifficultyString(),
        scoreData
      );
    }
  }

  showWinDialog(timeElapsed) {
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    dialog.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        color: white;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 4em; margin-bottom: 20px;">🎉</div>
        <h2 style="margin-bottom: 20px; font-size: 1.8em;">恭喜完成！</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>用时：</strong>${timeString}</p>
          <p><strong>步数：</strong>${this.moves}</p>
          <p><strong>难度：</strong>${this.size}×${this.size}</p>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="play-again" style="
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
          ">再玩一次</button>
          <button id="close-dialog" style="
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
          ">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('play-again').addEventListener('click', () => {
      document.body.removeChild(dialog);
      this.startGame();
    });
    
    document.getElementById('close-dialog').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (this.gameStarted && !this.solved) {
        this.updateTimer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateTimer() {
    if (!this.startTime) return;
    
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timer').textContent = timeString;
  }

  updateDisplay() {
    document.getElementById('moves-count').textContent = this.moves;
    this.updateTimer();
  }

  loadBestScore() {
    // 从新格式获取最佳成绩
    if (window.gameHistoryManager) {
      const bestScore = window.gameHistoryManager.getGameBestScoreCompatible('number_puzzle', this.getDifficultyString());
      if (bestScore !== null) {
        const minutes = Math.floor(bestScore / 60);
        const seconds = bestScore % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('best-score').textContent = timeString;
        return;
      }
    }
  }

  saveBestScore(timeElapsed) {
    // 检查是否是最佳成绩
    let isNewBest = false;
    
    if (window.gameHistoryManager) {
      const currentBest = window.gameHistoryManager.getGameBestScore('number_puzzle', this.getDifficultyString());
      if (currentBest === null || timeElapsed < currentBest) {
        isNewBest = true;
      }
    }
    
    if (isNewBest) {
      // 更新主站的统计（新格式）
      if (window.recordGamePlay) {
        window.recordGamePlay('number_puzzle', timeElapsed);
      }
      
      this.loadBestScore();
    }
  }

  showHistory() {
    if (window.historyModal) {
      window.historyModal.show('number_puzzle', this.getDifficultyString());
    } else {
      // 如果没有历史弹窗，显示简单的历史记录
      this.showSimpleHistory();
    }
  }

  showSimpleHistory() {
    if (!window.gameHistoryManager) return;
    
    const history = window.gameHistoryManager.getGameHistory('number_puzzle', this.getDifficultyString());
    const stats = window.gameHistoryManager.getGameStats('number_puzzle', this.getDifficultyString());
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const historyList = history.slice(0, 10).map(record => {
      const minutes = Math.floor(record.timeSpent / 60000);
      const seconds = Math.floor((record.timeSpent % 60000) / 1000);
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      return `<tr><td>${timeString}</td><td>${record.moves}</td><td>${new Date(record.date).toLocaleDateString()}</td></tr>`;
    }).join('');
    
    dialog.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        color: white;
        max-width: 600px;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-height: 80vh;
        overflow-y: auto;
      ">
        <h2 style="margin-bottom: 20px;">${this.size}×${this.size} 历史记录</h2>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
            <div style="font-size: 1.5em; font-weight: bold;">${stats.bestScore ? Math.floor(stats.bestScore / 60) + ':' + (stats.bestScore % 60).toString().padStart(2, '0') : '--'}</div>
            <div style="font-size: 0.9em; opacity: 0.8;">最佳成绩</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
            <div style="font-size: 1.5em; font-weight: bold;">${stats.recent5Avg ? Math.floor(stats.recent5Avg / 60) + ':' + (stats.recent5Avg % 60).toString().padStart(2, '0') : '--'}</div>
            <div style="font-size: 0.9em; opacity: 0.8;">近五次平均</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
            <div style="font-size: 1.5em; font-weight: bold;">${stats.recent10Avg ? Math.floor(stats.recent10Avg / 60) + ':' + (stats.recent10Avg % 60).toString().padStart(2, '0') : '--'}</div>
            <div style="font-size: 0.9em; opacity: 0.8;">近十次平均</div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.3);">
              <th style="padding: 10px; text-align: left;">用时</th>
              <th style="padding: 10px; text-align: left;">步数</th>
              <th style="padding: 10px; text-align: left;">日期</th>
            </tr>
          </thead>
          <tbody>
            ${historyList}
          </tbody>
        </table>
        
        <button id="close-history" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 1em;
        ">关闭</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('close-history').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  new NumberPuzzle();
}); 