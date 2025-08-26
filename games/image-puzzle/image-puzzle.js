// 图片拼图游戏逻辑
class ImagePuzzle {
  constructor() {
    this.size = 4;
    this.board = [];
    this.empty = { x: 0, y: 0 };
    this.moves = 0;
    this.startTime = null;
    this.timer = null;
    this.gameStarted = false;
    this.solved = false;
    this.currentImage = '';
    this.customImage = null;
    this.preloadedImages = new Map(); // 缓存预加载的图片
    this.imageLibrary = null;
    this.imageLibraryLoaded = false;

    
    // 记录初始状态
    this.initialState = null;
    
    // 默认图库（备用）
    this.defaultImageLibrary = {
      '默认': [
        '../../assets/默认/1 (1).jpg',
        '../../assets/默认/1 (4).jpg',
        '../../assets/默认/1 (5).jpg',
        '../../assets/默认/1 (7).jpg',
        '../../assets/默认/1 (8).jpg',
        '../../assets/默认/1 (17).jpg',
        '../../assets/默认/1 (19).jpg'
      ],
      '柯南': [
        '../../assets/柯南/柯南-1.png',
        '../../assets/柯南/柯南-2.png',
        '../../assets/柯南/小兰-1.png',
        '../../assets/柯南/小兰-2.png',
        '../../assets/柯南/小哀-1.png',
        '../../assets/柯南/小哀-2.png',
        '../../assets/柯南/园子-1.png',
        '../../assets/柯南/园子-2.png',
        '../../assets/柯南/基德-1.png',
        '../../assets/柯南/基德-2.png',
        '../../assets/柯南/毛利-1.png',
        '../../assets/柯南/毛利-2.png'
      ]
    };
    
    // 异步初始化
    this.init().catch(error => {
      // 初始化失败时的处理
    });
  }

  // 动态加载图库索引
  async loadImageLibrary() {
    if (this.imageLibraryLoaded) return this.imageLibrary;
    
    try {
      // 自动扫描目录
      const autoScanned = await this.autoScanImageDirectories();
      if (autoScanned) {
        this.imageLibrary = autoScanned;
        this.imageLibraryLoaded = true;
        return this.imageLibrary;
      }
      
      // 如果自动扫描失败，尝试加载assets-index.json
      const response = await fetch('../../assets/assets-index.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 转换数据格式，保持与默认图库相同的结构
      this.imageLibrary = {};
      Object.entries(data).forEach(([dir, files]) => {
        const key = dir; // Use the actual directory name as key
        // 确保路径正确
        const basePath = `../../assets/${dir}`;
        this.imageLibrary[key] = files.map(f => `${basePath}/${f}`);
      });
      
      this.imageLibraryLoaded = true;
      return this.imageLibrary;
    } catch (error) {
      // 加载失败时使用默认图库
      this.imageLibrary = this.defaultImageLibrary;
      this.imageLibraryLoaded = true;
      return this.imageLibrary;
    }
  }

  // 自动扫描图片目录
  async autoScanImageDirectories() {
    try {
      // 定义要扫描的目录
      const directories = [
        { path: '../../assets/默认', name: '默认', label: '默认图库' }, // Default images are in 默认 directory
        { path: '../../assets/柯南', name: '柯南', label: '柯南系列' }
        // 可以继续添加更多目录
      ];
      
      const imageLibrary = {};
      
      for (const dir of directories) {
        try {
          const files = await this.scanDirectory(dir.path);
          if (files.length > 0) {
            imageLibrary[dir.name] = files.map(file => `${dir.path}/${file}`);
          }
        } catch (error) {
          // 忽略扫描失败的目录
        }
      }
      
      // 如果扫描到文件，返回结果
      const totalFiles = Object.values(imageLibrary).reduce((sum, files) => sum + files.length, 0);
      if (totalFiles > 0) {
        return imageLibrary;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // 扫描单个目录
  async scanDirectory(dirPath) {
    try {
      // 尝试获取目录列表
      const response = await fetch(`${dirPath}/index.json`);
      if (response.ok) {
        const data = await response.json();
        return data.files || [];
      }
      
      // 如果index.json不存在，尝试其他方法
      return await this.fallbackScanDirectory(dirPath);
    } catch (error) {
      return [];
    }
  }

  // 备用扫描方法
  async fallbackScanDirectory(dirPath) {
    // 这里可以实现其他扫描方法
    // 比如通过已知文件列表、API接口等
    return [];
  }

  async init() {
    this.bindEvents();

    this.loadBestScore();
    await this.updateImageSelect();
    this.updateDisplay();
    
    // 添加页面卸载时的清理
    window.addEventListener('beforeunload', () => this.cleanup());
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
      if (this.gameStarted) {
        // 游戏进行中切换难度，直接切换到新难度
        this.switchDifficulty();
      }
    });
    document.getElementById('image-library').addEventListener('change', async () => {
      await this.updateImageSelect();
    });
    document.getElementById('image-select').addEventListener('change', (e) => {
      this.currentImage = e.target.value;
      this.customImage = null;
      this.showImagePreview();
    });
    document.getElementById('image-upload').addEventListener('change', (e) => {
      this.handleImageUpload(e);
    });
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (this.gameStarted && !this.solved) {
        switch(e.key) {
          case 'ArrowUp':
            e.preventDefault();
            this.moveEmpty('down');
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.moveEmpty('up');
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.moveEmpty('right');
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.moveEmpty('left');
            break;
        }
      }
    });
  }

  moveEmpty(direction) {
    const { x, y } = this.empty;
    let newX = x, newY = y;
    
    switch(direction) {
      case 'up':
        if (y > 0) newY = y - 1;
        break;
      case 'down':
        if (y < this.size - 1) newY = y + 1;
        break;
      case 'left':
        if (x > 0) newX = x - 1;
        break;
      case 'right':
        if (x < this.size - 1) newX = x + 1;
        break;
    }
    
    if (newX !== x || newY !== y) {
      this.tryMove(newX, newY);
    }
  }

  async updateImageSelect() {
    const librarySelect = document.getElementById('image-library');
    const imageSelect = document.getElementById('image-select');
    
    // 确保图库已加载
    await this.loadImageLibrary();
    
    // 保存当前选中的图库
    const currentSelectedLibrary = librarySelect.value;
    
    // 动态更新图库选择器
    librarySelect.innerHTML = '';
    
    // 定义图库显示名称映射
    const libraryLabels = {
      '默认': '默认图库',
      '柯南': '柯南系列'
    };
    
    Object.keys(this.imageLibrary).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = libraryLabels[key] || key;
      librarySelect.appendChild(option);
    });
    
    // 恢复选中的图库，如果不存在则选择第一个
    if (currentSelectedLibrary && this.imageLibrary[currentSelectedLibrary]) {
      librarySelect.value = currentSelectedLibrary;
    } else if (Object.keys(this.imageLibrary).length > 0) {
      librarySelect.value = Object.keys(this.imageLibrary)[0];
    }
    
    // 清空图片选择器
    imageSelect.innerHTML = '<option value="">选择图片...</option>';
    
    // 获取当前选中的图库
    const selectedLibrary = librarySelect.value;
    
    if (this.imageLibrary && this.imageLibrary[selectedLibrary]) {
      this.imageLibrary[selectedLibrary].forEach((imagePath, index) => {
        const fileName = imagePath.split('/').pop();
        const option = document.createElement('option');
        option.value = imagePath;
        option.textContent = fileName;
        imageSelect.appendChild(option);
      });
    }
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.showError('仅支持JPG/PNG/WEBP格式的图片');
      return;
    }
    
    // 验证文件大小
    if (file.size > 1024 * 1024) {
      this.showError('图片不能超过1MB');
      return;
    }
    
    // 验证文件尺寸
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          this.showError('图片尺寸不能小于100×100像素');
          return;
        }
        if (img.width > 2000 || img.height > 2000) {
          this.showError('图片尺寸不能超过2000×2000像素');
          return;
        }
        
        this.customImage = e.target.result;
        this.currentImage = e.target.result;
        this.showImagePreview();
      };
      img.onerror = () => {
        this.showError('图片文件损坏，请重新选择');
      };
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      this.showError('文件读取失败，请重新选择');
    };
    
    reader.readAsDataURL(file);
  }

  showError(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4757;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  showImagePreview() {
    const previewContainer = document.getElementById('image-preview-container');
    const preview = document.getElementById('image-preview');
    
    if (this.currentImage) {
      preview.src = this.currentImage;
      previewContainer.style.display = 'block';
    } else {
      previewContainer.style.display = 'none';
    }
  }

  startGame() {
    if (!this.currentImage) {
      this.showError('请先选择一张图片！');
      return;
    }
    
    // 记录初始状态
    this.initialState = {
      size: this.size,
      currentImage: this.currentImage,
      customImage: this.customImage
    };
    
    // 显示加载状态
    const boardElement = document.getElementById('puzzle-board');
    boardElement.innerHTML = `
      <div style="text-align: center; color: white; opacity: 0.8;">
        <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
        <h3>正在加载图片...</h3>
        <p>请稍候</p>
      </div>
    `;
    
    // 预加载图片
    this.preloadImage(this.currentImage).then((img) => {
      this.gameStarted = true;
      this.solved = false;
      this.moves = 0;
      this.startTime = Date.now();
      this.board = this.createSolvableBoard();
      this.empty = this.findEmpty();
      this.renderBoard();
      this.startTimer();
      this.updateDisplay();
    }).catch(error => {
      this.showError('图片加载失败，请重新选择图片！');
      
      // 恢复初始状态
      boardElement.innerHTML = `
        <div style="text-align: center; color: white; opacity: 0.8;">
          <div style="font-size: 3em; margin-bottom: 20px;">🖼️</div>
          <h3>选择图片并点击"开始游戏"</h3>
          <p>将图片碎片拼回原图，空格在最后一格</p>
        </div>
      `;
    });
  }

  preloadImage(src) {
    // 检查缓存
    if (this.preloadedImages.has(src)) {
      return Promise.resolve(this.preloadedImages.get(src));
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        this.preloadedImages.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  resetGame() {
    if (this.gameStarted && this.initialState) {
      this.stopTimer();
      
      // 恢复到初始状态
      this.size = this.initialState.size;
      this.currentImage = this.initialState.currentImage;
      this.customImage = this.initialState.customImage;
      
      // 重新开始游戏
      this.gameStarted = true;
      this.solved = false;
      this.moves = 0;
      this.startTime = Date.now();
      this.board = this.createSolvableBoard();
      this.empty = this.findEmpty();
      this.renderBoard();
      this.startTimer();
      this.updateDisplay();
      
      // 更新难度选择器
      const sizeSelect = document.getElementById('puzzle-size');
      if (sizeSelect) {
        sizeSelect.value = this.size;
      }
    }
  }

  switchDifficulty() {
    if (this.gameStarted) {
      this.stopTimer();
      
      // 保持当前图片，只切换难度
      this.solved = false;
      this.moves = 0;
      this.startTime = Date.now();
      this.board = this.createSolvableBoard();
      this.empty = this.findEmpty();
      this.renderBoard();
      this.startTimer();
      this.updateDisplay();
    }
  }

  createSolvableBoard() {
    // 创建有序数组
    let arr = Array.from({ length: this.size * this.size }, (_, i) => i);
    let board;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环
    
    do {
      this.shuffle(arr);
      board = [];
      for (let y = 0; y < this.size; y++) {
        board.push(arr.slice(y * this.size, (y + 1) * this.size));
      }
      attempts++;
      
      // 如果尝试次数过多，使用更高效的生成方法
      if (attempts > maxAttempts) {
        return this.generateSolvableBoardEfficiently();
      }
    } while (!this.isSolvable(board));
    
    return board;
  }

  generateSolvableBoardEfficiently() {
    // 从有序状态开始，通过有效移动生成可解拼图
    let board = [];
    for (let y = 0; y < this.size; y++) {
      board[y] = [];
      for (let x = 0; x < this.size; x++) {
        board[y][x] = y * this.size + x;
      }
    }
    
    // 执行随机有效移动
    const moves = Math.floor(Math.random() * 50) + 20; // 20-70次随机移动
    for (let i = 0; i < moves; i++) {
      this.makeRandomValidMove(board);
    }
    
    return board;
  }

  makeRandomValidMove(board) {
    // 找到空格位置
    let emptyX, emptyY;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (board[y][x] === 0) {
          emptyX = x;
          emptyY = y;
          break;
        }
      }
    }
    
    // 生成可能的移动方向
    const directions = [];
    if (emptyX > 0) directions.push({ dx: -1, dy: 0 }); // 左
    if (emptyX < this.size - 1) directions.push({ dx: 1, dy: 0 }); // 右
    if (emptyY > 0) directions.push({ dx: 0, dy: -1 }); // 上
    if (emptyY < this.size - 1) directions.push({ dx: 0, dy: 1 }); // 下
    
    // 随机选择一个方向
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const newX = emptyX + direction.dx;
    const newY = emptyY + direction.dy;
    
    // 交换位置
    [board[emptyY][emptyX], board[newY][newX]] = [board[newY][newX], board[emptyY][emptyX]];
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
    
    // 计算gap和border的总空间
    const gapSize = 4;
    const borderSize = 2;
    const totalGapSpace = (this.size - 1) * gapSize;
    const totalBorderSpace = this.size * borderSize * 2;
    
    // 根据屏幕尺寸确定容器宽度
    let containerWidth, containerHeight;
    if (window.innerWidth <= 768) {
      // 移动端：使用100%宽度，保持与puzzle-controls和puzzle-info一致
      containerWidth = boardElement.parentElement.offsetWidth;
      // 根据16:9比例计算容器高度
      containerHeight = Math.round(containerWidth * 9 / 16);
    } else {
      // 桌面端：固定容器宽度为1400px（与puzzle-controls和puzzle-info保持一致）
      containerWidth = 1400;
      // 根据16:9比例计算容器高度
      containerHeight = Math.round(containerWidth * 9 / 16); // 1400 * 9/16 = 787.5 ≈ 788px
    }
    
    // 计算可用空间（减去padding）
    const paddingHorizontal = window.innerWidth <= 768 ? 30 : 40; // 移动端左右padding各15px，桌面端各20px
    const paddingVertical = window.innerWidth <= 768 ? 60 : 80;   // 移动端上下padding各30px，桌面端各40px
    const availableWidth = containerWidth - paddingHorizontal - totalGapSpace - totalBorderSpace;
    const availableHeight = containerHeight - paddingVertical - totalGapSpace - totalBorderSpace;
    
    // 计算拼图块尺寸
    const cellWidth = availableWidth / this.size;
    const cellHeight = availableHeight / this.size;
    
    // 计算所有拼图块的总尺寸（包含gap和border）
    const totalBoardWidth = this.size * cellWidth + totalGapSpace + totalBorderSpace;
    const totalBoardHeight = this.size * cellHeight + totalGapSpace + totalBorderSpace;
    
    // 设置puzzle-board的尺寸（保持与puzzle-controls和puzzle-info一致的宽度，高度根据16:9比例）
    boardElement.style.width = `${containerWidth}px`;
    boardElement.style.height = `${containerHeight}px`;
    
    boardElement.innerHTML = '';
    boardElement.style.display = 'grid';
    boardElement.style.gridTemplateColumns = `repeat(${this.size}, ${cellWidth}px)`;
    boardElement.style.gridTemplateRows = `repeat(${this.size}, ${cellHeight}px)`;
    boardElement.style.gap = `${gapSize}px`;
    boardElement.style.justifyContent = 'center';
    boardElement.style.alignItems = 'center';
    
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = document.createElement('div');
        const value = this.board[y][x];
        
        cell.className = 'image-cell';
        cell.style.width = `${cellWidth}px`;
        cell.style.height = `${cellHeight}px`;
        cell.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        cell.style.cursor = 'pointer';
        cell.style.transition = 'all 0.3s ease';
        cell.style.userSelect = 'none';
        cell.style.overflow = 'hidden';
        cell.style.position = 'relative';
        cell.style.borderRadius = '4px';
        
        if (value === 0) {
          cell.classList.add('empty');
          cell.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
          cell.style.background = 'transparent';
        } else {
          // 使用CSS background方式实现图片切片
          const idx = value - 1;
          const px = idx % this.size;
          const py = Math.floor(idx / this.size);
          
          // 使用CSS background方式实现图片切片
          const bgImg = this.customImage || this.currentImage;
          cell.style.background = `url('${bgImg}') no-repeat ${px / (this.size - 1) * 100}% ${py / (this.size - 1) * 100}% / ${this.size * 100}% ${this.size * 100}%`;
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
        'image_puzzle',
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
        <h2 style="margin-bottom: 20px; font-size: 1.8em;">拼图完成！</h2>
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
      this.resetGame();
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
      const bestScore = window.gameHistoryManager.getGameBestScoreCompatible('image_puzzle', this.getDifficultyString());
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
      const currentBest = window.gameHistoryManager.getGameBestScore('image_puzzle', this.getDifficultyString());
      if (currentBest === null || timeElapsed < currentBest) {
        isNewBest = true;
      }
    }
    
    if (isNewBest) {
      // 更新主站的统计（新格式）
      if (window.recordGamePlay) {
        window.recordGamePlay('image_puzzle', timeElapsed);
      }
      
      this.loadBestScore();
    }
  }

  showHistory() {
    if (window.historyModal) {
      window.historyModal.show('image_puzzle', this.getDifficultyString());
    } else {
      // 如果没有历史弹窗，显示简单的历史记录
      this.showSimpleHistory();
    }
  }

  showSimpleHistory() {
    if (!window.gameHistoryManager) return;
    
    const history = window.gameHistoryManager.getGameHistory('image_puzzle', this.getDifficultyString());
    const stats = window.gameHistoryManager.getGameStats('image_puzzle', this.getDifficultyString());
    
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

  // 资源清理方法
  cleanup() {
    this.stopTimer();
    this.preloadedImages.clear();
    this.customImage = null;
  }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  new ImagePuzzle();
}); 