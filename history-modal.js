// 成绩历史弹窗组件
class HistoryModal {
  constructor() {
    this.currentGameType = '';
    this.currentDifficulty = '';
    this.currentPage = 1;
    this.pageSize = 20;
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
            <div class="header-actions">
              <button class="header-action-btn clear-history-btn" id="header-clear-history" title="清理所有游戏的历史记录">
                🗑️ 清理所有游戏
              </button>
              <button class="history-modal-close" id="history-modal-close" title="关闭">&times;</button>
            </div>
          </div>
          
          <div class="history-modal-body">
            <!-- 统计概览 -->
            <div class="history-stats">
              <div class="stat-item">
                <div class="stat-number" id="stat-best">--</div>
                <div class="stat-label">最佳成绩</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" id="stat-recent5">--</div>
                <div class="stat-label">近五次平均</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" id="stat-recent10">--</div>
                <div class="stat-label">近十次平均</div>
              </div>
            </div>
            
            <!-- 近期成绩表格 -->
            <div class="history-table-container">
              <div class="table-header">
                <h4>近期成绩（保留最近 200 次成绩）</h4>
                <div class="table-actions">
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
    
    // 清空所有游戏历史（头部按钮）
    document.getElementById('header-clear-history').addEventListener('click', () => {
      this.clearAllGamesHistory();
    });
    
    // 清空当前游戏历史（表格区域按钮）
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });
  }
  
  // 显示弹窗
  show(gameType, difficulty) {
    this.currentGameType = gameType;
    this.currentDifficulty = difficulty;
    this.currentPage = 1;
    
    this.modal.style.display = 'block';
    this.loadHistory();
    this.updateStats();
    
    // 添加显示动画
    setTimeout(() => {
      this.modal.classList.add('show');
      
      // 调试：检查清空记录按钮
      const clearBtn = document.getElementById('clear-history');
      if (clearBtn) {
        console.log('✅ 清空记录按钮已找到');
        console.log('按钮文本:', clearBtn.textContent);
        console.log('按钮样式:', clearBtn.className);
        console.log('按钮可见性:', clearBtn.style.display);
        console.log('按钮位置:', clearBtn.offsetTop, clearBtn.offsetLeft);
        
        // 确保按钮可见
        clearBtn.style.display = 'inline-block';
        clearBtn.style.visibility = 'visible';
        clearBtn.style.opacity = '1';
      } else {
        console.error('❌ 清空记录按钮未找到');
      }
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
      this.pageSize
    );
    
    // 添加调试信息
    console.log('分页数据:', pageData);
    console.log(`当前页: ${pageData.currentPage}, 总页数: ${pageData.totalPages}, 记录数: ${pageData.total}`);
    
    this.renderTable(pageData.records);
    this.renderPagination(pageData);
  }
  
  // 渲染表格
  renderTable(records) {
    const tbody = document.getElementById('history-table-body');
    
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">暂无记录</td></tr>';
      return;
    }
    
    tbody.innerHTML = records.map(record => `
      <tr>
        <td>${this.formatDate(record.date)}</td>
        <td class="score-cell">${this.formatScore(record.score)}</td>
        <td>${record.moves || '-'}</td>
        <td>${this.formatTime(record.timeSpent)}</td>
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
    
    // 跳转页面
    paginationHTML += `
      <div class="page-jump">
        <span>跳转到</span>
        <input type="number" id="jump-page" min="1" max="${pageData.totalPages}" value="${pageData.currentPage}">
        <span>页</span>
        <button id="jump-btn" class="jump-btn">跳转</button>
      </div>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // 绑定分页事件
    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      });
    });
    
    // 绑定跳转事件
    const jumpBtn = document.getElementById('jump-btn');
    const jumpInput = document.getElementById('jump-page');
    
    if (jumpBtn && jumpInput) {
      jumpBtn.addEventListener('click', () => {
        const page = parseInt(jumpInput.value);
        if (page >= 1 && page <= pageData.totalPages) {
          this.goToPage(page);
        } else {
          alert(`请输入1到${pageData.totalPages}之间的页码`);
        }
      });
      
      jumpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          jumpBtn.click();
        }
      });
    }
  }
  
  // 跳转页面
  goToPage(page) {
    this.currentPage = page;
    this.loadHistory();
  }
  
  // 更新统计信息
  updateStats() {
    const stats = window.gameHistoryManager.getGameStats(
      this.currentGameType,
      this.currentDifficulty
    );
    
    // 添加调试信息
    console.log('统计信息:', stats);
    
    document.getElementById('stat-best').textContent = this.formatScore(stats.bestScore) || '--';
    document.getElementById('stat-recent5').textContent = this.formatScore(stats.recent5Avg) || '--';
    document.getElementById('stat-recent10').textContent = this.formatScore(stats.recent10Avg) || '--';
  }
  
  // 清空所有游戏历史
  clearAllGamesHistory() {
    if (confirm('⚠️ 警告：这将删除所有游戏的历史记录！\n\n包括：数字拼图、图片拼图、秒表、鼠标轨迹、反应测试等所有游戏的历史记录！\n\n此操作不可恢复，确定要继续吗？')) {
      if (window.gameHistoryManager && window.gameHistoryManager.resetAllGames) {
        const success = window.gameHistoryManager.resetAllGames();
        if (success) {
          alert('✅ 所有游戏的历史记录已清理！');
          
          // 更新当前弹窗的统计
          this.loadHistory();
          this.updateStats();
          
          // 更新首页统计（如果主页面存在）
          if (window.updateStats) {
            window.updateStats();
          }
          if (window.updateDailyStats) {
            window.updateDailyStats();
          }
          if (window.updateStatProgress) {
            window.updateStatProgress();
          }
          if (window.loadBestScores) {
            window.loadBestScores();
          }
        } else {
          alert('❌ 清理失败，请重试');
        }
      } else {
        alert('❌ 历史管理器不可用，无法清理所有游戏数据');
      }
    }
  }

  // 清空当前游戏历史
  clearHistory() {
    if (confirm('确定要清空当前游戏的所有历史记录吗？此操作不可恢复！')) {
      window.gameHistoryManager.clearAllHistory(this.currentGameType, this.currentDifficulty);
      this.loadHistory();
      this.updateStats();
    }
  }
  
  // 删除记录
  deleteRecord(recordId) {
    if (confirm('确定要删除这条记录吗？')) {
      window.gameHistoryManager.deleteRecord(this.currentGameType, this.currentDifficulty, recordId);
      this.loadHistory();
      this.updateStats();
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

  // 格式化成绩
  formatScore(score) {
    if (score === null || score === undefined) return null;
    
    // 3秒挑战游戏：显示为毫秒
    if (this.currentGameType === 'stopwatch') {
      return Math.round(score) + 'ms';
    }
    
    // 反应测试游戏：显示为毫秒
    if (this.currentGameType === 'reaction') {
      return Math.round(score) + 'ms';
    }
    
    // 鼠标轨迹游戏：显示为整数分
    if (this.currentGameType === 'mouse') {
      return Math.round(score) + ' 分';
    }
    
    // 其他游戏：保持原有格式
    return score;
  }
}

// 创建全局实例
window.historyModal = new HistoryModal();
