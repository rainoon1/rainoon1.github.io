// 游戏成绩历史管理模块
class GameHistoryManager {
  constructor() {
    // 存储限制配置
    this.STORAGE_LIMITS = {
      'number_puzzle': {
        '3x3': 80,
        '4x4': 100,
        '5x5': 60
      },
      'image_puzzle': {
        '4x4': 80
      },
      'stopwatch': 150,
      'mouse': 100,
      'reaction': 120
    };
    
    // 分页配置
    this.PAGINATION_CONFIG = {
      pageSize: 20,
      maxVisiblePages: 5,
      preloadPages: 2
    };
    
    // 内存缓存
    this.historyCache = new Map();
    
    this.init();
  }
  
  init() {
    // 初始化时清理过期数据
    this.cleanAllHistories();
  }
  
  // 记录游戏成绩
  recordGameScore(gameType, difficulty, scoreData) {
    const record = {
      id: this.generateId(),
      gameType,
      difficulty,
      score: scoreData.score || 0,
      moves: scoreData.moves || 0,
      timeSpent: scoreData.timeSpent || 0,
      date: new Date().toISOString(),
      completed: scoreData.completed !== false,
      bestScore: false,
      ...scoreData
    };
    
    // 检查是否破纪录
    const bestScore = this.getBestScore(gameType, difficulty);
    if (bestScore === null || record.score < bestScore) {
      record.bestScore = true;
    }
    
    // 保存记录
    this.saveGameRecord(gameType, difficulty, record);
    
    // 清理缓存
    this.clearCache(gameType, difficulty);
    
    return record;
  }
  
  // 保存游戏记录
  saveGameRecord(gameType, difficulty, record) {
    const key = `gameHistory_${gameType}_${difficulty}`;
    const history = this.getGameHistory(gameType, difficulty);
    
    // 添加新记录
    history.unshift(record);
    
    // 清理超限数据
    this.cleanGameHistory(gameType, difficulty);
    
    // 保存到localStorage
    localStorage.setItem(key, JSON.stringify(history));
  }
  
  // 获取游戏历史记录
  getGameHistory(gameType, difficulty) {
    const key = `gameHistory_${gameType}_${difficulty}`;
    const cached = this.historyCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 30000) { // 30秒缓存
      return cached.data;
    }
    
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    
    // 更新缓存
    this.historyCache.set(key, {
      data: history,
      timestamp: Date.now(),
      filtered: null
    });
    
    return history;
  }
  
  // 获取分页历史记录
  getHistoryPage(gameType, difficulty, page = 1, filters = {}) {
    let history = this.getGameHistory(gameType, difficulty);
    
    // 应用筛选
    if (filters.completed !== undefined) {
      history = history.filter(record => record.completed === filters.completed);
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      history = history.filter(record => {
        const recordDate = new Date(record.date);
        return (!start || recordDate >= start) && (!end || recordDate <= end);
      });
    }
    
    if (filters.scoreRange) {
      const { min, max } = filters.scoreRange;
      history = history.filter(record => {
        return (!min || record.score >= min) && (!max || record.score <= max);
      });
    }
    
    // 排序
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    
    history.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'moves':
          aVal = a.moves;
          bVal = b.moves;
          break;
        case 'timeSpent':
          aVal = a.timeSpent;
          bVal = b.timeSpent;
          break;
        case 'date':
        default:
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // 分页
    const startIndex = (page - 1) * this.PAGINATION_CONFIG.pageSize;
    const endIndex = startIndex + this.PAGINATION_CONFIG.pageSize;
    
    return {
      records: history.slice(startIndex, endIndex),
      total: history.length,
      currentPage: page,
      totalPages: Math.ceil(history.length / this.PAGINATION_CONFIG.pageSize),
      hasNext: page < Math.ceil(history.length / this.PAGINATION_CONFIG.pageSize),
      hasPrev: page > 1
    };
  }
  
  // 获取最佳成绩
  getBestScore(gameType, difficulty) {
    const history = this.getGameHistory(gameType, difficulty);
    const completedRecords = history.filter(record => record.completed);
    
    if (completedRecords.length === 0) return null;
    
    return Math.min(...completedRecords.map(record => record.score));
  }
  
  // 获取统计信息
  getGameStats(gameType, difficulty) {
    const history = this.getGameHistory(gameType, difficulty);
    const completedRecords = history.filter(record => record.completed);
    
    if (completedRecords.length === 0) {
      return {
        totalGames: 0,
        completedGames: 0,
        bestScore: null,
        averageScore: null,
        worstScore: null,
        totalTime: 0,
        averageTime: null,
        totalMoves: 0,
        averageMoves: null
      };
    }
    
    const scores = completedRecords.map(record => record.score);
    const times = completedRecords.map(record => record.timeSpent);
    const moves = completedRecords.map(record => record.moves);
    
    return {
      totalGames: history.length,
      completedGames: completedRecords.length,
      bestScore: Math.min(...scores),
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      worstScore: Math.max(...scores),
      totalTime: times.reduce((a, b) => a + b, 0),
      averageTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      totalMoves: moves.reduce((a, b) => a + b, 0),
      averageMoves: Math.round(moves.reduce((a, b) => a + b, 0) / moves.length)
    };
  }
  
  // 清理游戏历史
  cleanGameHistory(gameType, difficulty) {
    const limit = this.getStorageLimit(gameType, difficulty);
    const key = `gameHistory_${gameType}_${difficulty}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (history.length <= limit) return;
    
    // 保留最佳成绩和最近成绩
    const bestScores = history
      .filter(record => record.completed)
      .sort((a, b) => a.score - b.score)
      .slice(0, Math.floor(limit * 0.3)); // 保留30%的最佳成绩
    
    const recentScores = history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Math.floor(limit * 0.7)); // 保留70%的最近成绩
    
    // 合并并去重
    const merged = [...bestScores, ...recentScores];
    const unique = merged.filter((record, index, self) => 
      index === self.findIndex(r => r.id === record.id)
    );
    
    // 如果还是超限，按时间删除最旧的
    if (unique.length > limit) {
      unique.sort((a, b) => new Date(b.date) - new Date(a.date));
      unique.splice(limit);
    }
    
    localStorage.setItem(key, JSON.stringify(unique));
  }
  
  // 清理所有历史数据
  cleanAllHistories() {
    Object.keys(this.STORAGE_LIMITS).forEach(gameType => {
      if (typeof this.STORAGE_LIMITS[gameType] === 'object') {
        Object.keys(this.STORAGE_LIMITS[gameType]).forEach(difficulty => {
          this.cleanGameHistory(gameType, difficulty);
        });
      } else {
        this.cleanGameHistory(gameType, 'default');
      }
    });
  }
  
  // 获取存储限制
  getStorageLimit(gameType, difficulty) {
    const limits = this.STORAGE_LIMITS[gameType];
    if (typeof limits === 'object') {
      return limits[difficulty] || limits[Object.keys(limits)[0]];
    }
    return limits;
  }
  
  // 清除缓存
  clearCache(gameType, difficulty) {
    const key = `${gameType}_${difficulty}`;
    this.historyCache.delete(key);
  }
  
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // 导出数据
  exportHistory(gameType, difficulty) {
    const history = this.getGameHistory(gameType, difficulty);
    const csv = this.convertToCSV(history);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${gameType}_${difficulty}_history.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 转换为CSV格式
  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }
  
  // 删除记录
  deleteRecord(gameType, difficulty, recordId) {
    const history = this.getGameHistory(gameType, difficulty);
    const filtered = history.filter(record => record.id !== recordId);
    
    const key = `gameHistory_${gameType}_${difficulty}`;
    localStorage.setItem(key, JSON.stringify(filtered));
    
    this.clearCache(gameType, difficulty);
  }
  
  // 清空所有记录
  clearAllHistory(gameType, difficulty) {
    const key = `gameHistory_${gameType}_${difficulty}`;
    localStorage.removeItem(key);
    this.clearCache(gameType, difficulty);
  }
}

// 创建全局实例
window.gameHistoryManager = new GameHistoryManager();
