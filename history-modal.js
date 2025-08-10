// 成绩历史弹窗组件
class HistoryModal {
  constructor() {
    this.currentGameType = '';
    this.currentDifficulty = '';
    this.currentPage = 1;
    this.currentFilters = {};
    this.modal = null;
    
    this.init();
  }
  
  init() {
    this.createModal();
    this.bindEvents();
  }
  
  // 创建弹窗
  createModal() {
    const modalHTML = `
      <div id="history-modal" class="history-modal" style="display: none;">
        <div class="history-modal-overlay"></div>
        <div class="history-modal-content">
          <div class="history-modal-header">
            <h3 class="history-modal-title">成绩历史</h3>
            <button class="history-modal-close" id="history-modal-close">&times;</button>
          </div>
          
          <div class="history-modal-body">
            <!-- 筛选器 -->
            <div class="history-filters">
              <div class="filter-row">
                <div class="filter-group">
                  <label>完成状态：</label>
                  <select id="filter-completed">
                    <option value="">全部</option>
                    <option value="true">已完成</option>
                    <option value="false">未完成</option>
                  </select>
                </div>
                <div class="filter-group">
                  <label>排序方式：</label>
                  <select id="filter-sort">
                    <option value="date-desc">时间（最新）</option>
                    <option value="date-asc">时间（最早）</option>
                    <option value="score-asc">成绩（最好）</option>
                    <option value="score-desc">成绩（最差）</option>
                    <option value="moves-asc">步数（最少）</option>
                    <option value="moves-desc">步数（最多）</option>
                  </select>
                </div>
                <div class="filter-group">
                  <button id="filter-apply" class="filter-button">应用筛选</button>
                  <button id="filter-reset" class="filter-button">重置</button>
                </div>
              </div>
            </div>
            
            <!-- 统计概览 -->
            <div class="history-stats">
              <div class="stat-item">
                <div class="stat-number" id="stat-total">0</div>
                <div class="stat-label">总游戏次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" id="stat-completed">0</div>
                <div class="stat-label">完成次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" id="stat-best">--</div>
                <div class="stat-label">最佳成绩</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" id="stat-avg">--</div>
                <div class="stat-label">平均成绩</div>
              </div>
            </div>
            
            <!-- 图表区域 -->
            <div class="history-charts">
              <div class="chart-container">
                <h4>成绩趋势</h4>
                <canvas id="score-chart" width="400" height="200"></canvas>
              </div>
            </div>
            
            <!-- 历史记录表格 -->
            <div class="history-table-container">
              <div class="table-header">
                <h4>详细记录</h4>
                <div class="table-actions">
                  <button id="export-history" class="action-button">导出CSV</button>
                  <button id="clear-history" class="action-button danger">清空记录</button>
                </div>
              </div>
              <div class="history-table-wrapper">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>成绩</th>
                      <th>步数</th>
                      <th>用时</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody id="history-table-body">
                    <!-- 动态填充 -->
                  </tbody>
                </table>
              </div>
              
              <!-- 分页控件 -->
              <div class="history-pagination" id="history-pagination">
                <!-- 动态填充 -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('history-modal');
  }
  
  // 绑定事件
  bindEvents() {
    // 关闭弹窗
    document.getElementById('history-modal-close').addEventListener('click', () => {
      this.hide();
    });
    
    // 点击遮罩关闭
    this.modal.querySelector('.history-modal-overlay').addEventListener('click', () => {
      this.hide();
    });
    
    // 筛选应用
    document.getElementById('filter-apply').addEventListener('click', () => {
      this.applyFilters();
    });
    
    // 筛选重置
    document.getElementById('filter-reset').addEventListener('click', () => {
      this.resetFilters();
    });
    
    // 导出历史
    document.getElementById('export-history').addEventListener('click', () => {
      this.exportHistory();
    });
    
    // 清空历史
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });
  }
  
  // 显示弹窗
  show(gameType, difficulty) {
    this.currentGameType = gameType;
    this.currentDifficulty = difficulty;
    this.currentPage = 1;
    this.currentFilters = {};
    
    this.modal.style.display = 'block';
    this.loadHistory();
    this.updateStats();
    this.renderChart();
    
    // 添加显示动画
    setTimeout(() => {
      this.modal.classList.add('show');
    }, 10);
  }
  
  // 隐藏弹窗
  hide() {
    this.modal.classList.remove('show');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);
  }
  
  // 加载历史记录
  loadHistory() {
    const pageData = window.gameHistoryManager.getHistoryPage(
      this.currentGameType,
      this.currentDifficulty,
      this.currentPage,
      this.currentFilters
    );
    
    this.renderTable(pageData.records);
    this.renderPagination(pageData);
  }
  
  // 渲染表格
  renderTable(records) {
    const tbody = document.getElementById('history-table-body');
    
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">暂无记录</td></tr>';
      return;
    }
    
    tbody.innerHTML = records.map(record => `
      <tr class="${record.bestScore ? 'best-score' : ''}">
        <td>${this.formatDate(record.date)}</td>
        <td class="score-cell">
          ${record.score}
          ${record.bestScore ? '<span class="best-badge">🏆</span>' : ''}
        </td>
        <td>${record.moves || '-'}</td>
        <td>${this.formatTime(record.timeSpent)}</td>
        <td>
          <span class="status-badge ${record.completed ? 'completed' : 'incomplete'}">
            ${record.completed ? '完成' : '未完成'}
          </span>
        </td>
        <td>
          <button class="delete-record" data-id="${record.id}" title="删除记录">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
    
    // 绑定删除事件
    tbody.querySelectorAll('.delete-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recordId = e.target.dataset.id;
        this.deleteRecord(recordId);
      });
    });
  }
  
  // 渲染分页
  renderPagination(pageData) {
    const pagination = document.getElementById('history-pagination');
    
    if (pageData.totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    
    let paginationHTML = '';
    
    // 上一页
    if (pageData.hasPrev) {
      paginationHTML += `<button class="page-btn prev" data-page="${pageData.currentPage - 1}">上一页</button>`;
    }
    
    // 页码
    const startPage = Math.max(1, pageData.currentPage - 2);
    const endPage = Math.min(pageData.totalPages, pageData.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button class="page-btn ${i === pageData.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    // 下一页
    if (pageData.hasNext) {
      paginationHTML += `<button class="page-btn next" data-page="${pageData.currentPage + 1}">下一页</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
    
    // 绑定分页事件
    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      });
    });
  }
  
  // 跳转页面
  goToPage(page) {
    this.currentPage = page;
    this.loadHistory();
  }
  
  // 应用筛选
  applyFilters() {
    const completed = document.getElementById('filter-completed').value;
    const sort = document.getElementById('filter-sort').value;
    
    this.currentFilters = {};
    
    if (completed !== '') {
      this.currentFilters.completed = completed === 'true';
    }
    
    if (sort) {
      const [sortBy, sortOrder] = sort.split('-');
      this.currentFilters.sortBy = sortBy;
      this.currentFilters.sortOrder = sortOrder;
    }
    
    this.currentPage = 1;
    this.loadHistory();
  }
  
  // 重置筛选
  resetFilters() {
    document.getElementById('filter-completed').value = '';
    document.getElementById('filter-sort').value = 'date-desc';
    
    this.currentFilters = {};
    this.currentPage = 1;
    this.loadHistory();
  }
  
  // 更新统计信息
  updateStats() {
    const stats = window.gameHistoryManager.getGameStats(
      this.currentGameType,
      this.currentDifficulty
    );
    
    document.getElementById('stat-total').textContent = stats.totalGames;
    document.getElementById('stat-completed').textContent = stats.completedGames;
    document.getElementById('stat-best').textContent = stats.bestScore || '--';
    document.getElementById('stat-avg').textContent = stats.averageScore || '--';
  }
  
  // 渲染图表
  renderChart() {
    const canvas = document.getElementById('score-chart');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const history = window.gameHistoryManager.getGameHistory(
      this.currentGameType,
      this.currentDifficulty
    );
    
    if (history.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // 获取最近20条记录
    const recentRecords = history
      .filter(record => record.completed)
      .slice(0, 20)
      .reverse();
    
    if (recentRecords.length === 0) return;
    
    const scores = recentRecords.map(record => record.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // 绘制坐标轴
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // 绘制折线
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    recentRecords.forEach((record, index) => {
      const x = padding + (index / (recentRecords.length - 1)) * chartWidth;
      const y = canvas.height - padding - ((record.score - minScore) / scoreRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 绘制数据点
    ctx.fillStyle = '#667eea';
    recentRecords.forEach((record, index) => {
      const x = padding + (index / (recentRecords.length - 1)) * chartWidth;
      const y = canvas.height - padding - ((record.score - minScore) / scoreRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // 绘制标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X轴标签
    recentRecords.forEach((record, index) => {
      if (index % 5 === 0 || index === recentRecords.length - 1) {
        const x = padding + (index / (recentRecords.length - 1)) * chartWidth;
        const date = new Date(record.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, canvas.height - padding + 20);
      }
    });
  }
  
  // 导出历史
  exportHistory() {
    window.gameHistoryManager.exportHistory(this.currentGameType, this.currentDifficulty);
  }
  
  // 清空历史
  clearHistory() {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
      window.gameHistoryManager.clearAllHistory(this.currentGameType, this.currentDifficulty);
      this.loadHistory();
      this.updateStats();
      this.renderChart();
    }
  }
  
  // 删除记录
  deleteRecord(recordId) {
    if (confirm('确定要删除这条记录吗？')) {
      window.gameHistoryManager.deleteRecord(this.currentGameType, this.currentDifficulty, recordId);
      this.loadHistory();
      this.updateStats();
      this.renderChart();
    }
  }
  
  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  // 格式化时间
  formatTime(milliseconds) {
    if (!milliseconds) return '-';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}

// 创建全局实例
window.historyModal = new HistoryModal();
