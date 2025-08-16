// 游戏成绩历史管理模块
class GameHistoryManager {
  constructor() {
    // 存储限制：每个游戏类型+难度组合最多保存200条记录
    this.STORAGE_LIMIT = 200;
    
    // 最佳成绩存储：每个游戏类型+难度组合单独存储最佳成绩
    this.BEST_SCORE_LIMIT = 10; // 保留前10个最佳成绩
    
    // 内存缓存
    this.historyCache = new Map();
    this.bestScoreCache = new Map();
    
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
      ...scoreData
    };
    
    // 保存记录
    this.saveGameRecord(gameType, difficulty, record);
    
    // 更新最佳成绩
    this.updateBestScores(gameType, difficulty, record);
    
    // 清理缓存
    this.clearCache(gameType, difficulty);
    
    return record;
  }
  
  // 保存游戏记录
  saveGameRecord(gameType, difficulty, record) {
    const key = `gameHistory_${gameType}_${difficulty}`;
    const history = this.getGameHistory(gameType, difficulty);
    
    // 添加新记录到开头
    history.unshift(record);
    
    // 清理超限数据，只保留最近200条
    if (history.length > this.STORAGE_LIMIT) {
      history.splice(this.STORAGE_LIMIT);
    }
    
    // 保存到localStorage
    localStorage.setItem(key, JSON.stringify(history));
  }
  
  // 更新最佳成绩
  updateBestScores(gameType, difficulty, record) {
    const bestKey = `bestScores_${gameType}_${difficulty}`;
    let bestScores = JSON.parse(localStorage.getItem(bestKey) || '[]');
    
    // 添加新记录到最佳成绩列表
    bestScores.push(record);
    
    // 按成绩排序（分数越低越好）
    bestScores.sort((a, b) => a.score - b.score);
    
    // 只保留前10个最佳成绩
    if (bestScores.length > this.BEST_SCORE_LIMIT) {
      bestScores = bestScores.slice(0, this.BEST_SCORE_LIMIT);
    }
    
    // 保存最佳成绩
    localStorage.setItem(bestKey, JSON.stringify(bestScores));
    
    // 清理缓存
    this.bestScoreCache.delete(`${gameType}_${difficulty}`);
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
      timestamp: Date.now()
    });
    
    return history;
  }
  
  // 获取最佳成绩（永远保留，不清缓存）
  getBestScore(gameType, difficulty) {
    const bestKey = `bestScores_${gameType}_${difficulty}`;
    const cached = this.bestScoreCache.get(`${gameType}_${difficulty}`);
    
    if (cached) {
      return cached;
    }
    
    const bestScores = JSON.parse(localStorage.getItem(bestKey) || '[]');
    const bestScore = bestScores.length > 0 ? bestScores[0].score : null;
    
    // 缓存最佳成绩（不设置过期时间，永远保留）
    this.bestScoreCache.set(`${gameType}_${difficulty}`, bestScore);
    
    return bestScore;
  }
  
  // 获取最佳成绩记录（包含详细信息）
  getBestScoreRecord(gameType, difficulty) {
    const bestKey = `bestScores_${gameType}_${difficulty}`;
    const bestScores = JSON.parse(localStorage.getItem(bestKey) || '[]');
    return bestScores.length > 0 ? bestScores[0] : null;
  }
  
  // 获取统计信息
  getGameStats(gameType, difficulty) {
    const history = this.getGameHistory(gameType, difficulty);
    
    if (history.length === 0) {
      return {
        bestScore: null,
        recent5Avg: null,
        recent10Avg: null,
        totalGames: 0
      };
    }
    
    const scores = history.map(record => record.score);
    
    // 计算近五次平均（如果记录少于5条，则用所有记录）
    const recent5Scores = scores.slice(0, Math.min(5, scores.length));
    const recent5Avg = Math.round(recent5Scores.reduce((a, b) => a + b, 0) / recent5Scores.length);
    
    // 计算近十次平均（如果记录少于10条，则用所有记录）
    const recent10Scores = scores.slice(0, Math.min(10, scores.length));
    const recent10Avg = Math.round(recent10Scores.reduce((a, b) => a + b, 0) / recent10Scores.length);
    
    return {
      bestScore: this.getBestScore(gameType, difficulty),
      recent5Avg: recent5Avg,
      recent10Avg: recent10Avg,
      totalGames: history.length
    };
  }
  
  // 获取分页历史记录
  getHistoryPage(gameType, difficulty, page = 1, pageSize = 20) {
    const history = this.getGameHistory(gameType, difficulty);
    const totalPages = Math.ceil(history.length / pageSize);
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      records: history.slice(startIndex, endIndex),
      total: history.length,
      currentPage: page,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize: pageSize
    };
  }
  
  // 获取所有难度的最佳成绩
  getAllDifficultiesBestScores(gameType) {
    const difficulties = this.getDifficultiesForGame(gameType);
    const result = {};
    
    difficulties.forEach(difficulty => {
      result[difficulty] = this.getBestScore(gameType, difficulty);
    });
    
    return result;
  }
  
  // 获取游戏支持的所有难度
  getDifficultiesForGame(gameType) {
    const difficulties = {
      'number_puzzle': ['3x3', '4x4', '5x5'],
      'image_puzzle': ['4x4', '6x6', '8x8'],
      'stopwatch': ['default'],
      'mouse': ['default'],
      'reaction': ['default']
    };
    
    return difficulties[gameType] || ['default'];
  }
  
  // 清理游戏历史
  cleanGameHistory(gameType, difficulty) {
    const key = `gameHistory_${gameType}_${difficulty}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (history.length <= this.STORAGE_LIMIT) return;
    
    // 只保留最近200条记录
    const recentHistory = history.slice(0, this.STORAGE_LIMIT);
    localStorage.setItem(key, JSON.stringify(recentHistory));
  }
  
  // 清理所有历史数据
  cleanAllHistories() {
    // 获取所有游戏历史相关的localStorage键
    const keys = Object.keys(localStorage).filter(key => key.startsWith('gameHistory_'));
    
    keys.forEach(key => {
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      if (history.length > this.STORAGE_LIMIT) {
        const recentHistory = history.slice(0, this.STORAGE_LIMIT);
        localStorage.setItem(key, JSON.stringify(recentHistory));
      }
    });
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
  
  // 清空最佳成绩（谨慎使用）
  clearBestScores(gameType, difficulty) {
    const bestKey = `bestScores_${gameType}_${difficulty}`;
    localStorage.removeItem(bestKey);
    this.bestScoreCache.delete(`${gameType}_${difficulty}`);
  }

  // 全局重置 - 清理所有游戏数据（谨慎使用）
  resetAllGames() {
    try {
      // 获取所有游戏类型
      const gameTypes = ['number_puzzle', 'image_puzzle', 'stopwatch', 'mouse', 'reaction'];
      
      // 清理每个游戏类型的所有数据
      gameTypes.forEach(gameType => {
        const difficulties = this.getDifficultiesForGame(gameType);
        difficulties.forEach(difficulty => {
          // 清理历史记录
          this.clearAllHistory(gameType, difficulty);
          // 清理最佳成绩
          this.clearBestScores(gameType, difficulty);
        });
      });

      // 清理所有缓存
      this.historyCache.clear();
      this.bestScoreCache.clear();

      // 彻底清理所有游戏相关的localStorage数据
      const allKeys = Object.keys(localStorage);
      const gameRelatedKeys = allKeys.filter(key => 
        key.startsWith('gameHistory_') || 
        key.startsWith('bestScores_') ||
        key.startsWith('record_') ||
        key === 'gameStats' ||
        key.includes('puzzle') ||
        key.includes('stopwatch') ||
        key.includes('mouse') ||
        key.includes('reaction')
      );
      
      gameRelatedKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // 强制清理可能遗漏的数据
      const remainingKeys = Object.keys(localStorage);
      const remainingGameKeys = remainingKeys.filter(key => 
        key.includes('game') || 
        key.includes('puzzle') || 
        key.includes('stopwatch') || 
        key.includes('mouse') || 
        key.includes('reaction') ||
        key.includes('best') ||
        key.includes('history')
      );
      
      if (remainingGameKeys.length > 0) {
        remainingGameKeys.forEach(key => {
          localStorage.removeItem(key);
        });
      }

      return true;
    } catch (error) {
      console.error('❌ 重置游戏数据失败:', error);
      return false;
    }
  }

  // 获取存储使用情况
  getStorageInfo() {
    try {
      const allKeys = Object.keys(localStorage);
      const gameHistoryKeys = allKeys.filter(key => key.startsWith('gameHistory_'));
      const bestScoreKeys = allKeys.filter(key => key.startsWith('bestScores_'));
      const recordKeys = allKeys.filter(key => key.startsWith('record_'));
      
      let totalSize = 0;
      let gameHistorySize = 0;
      let bestScoreSize = 0;
      let recordSize = 0;

      // 计算各种数据的大小
      gameHistoryKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const size = new Blob([data]).size;
          gameHistorySize += size;
          totalSize += size;
        }
      });

      bestScoreKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const size = new Blob([data]).size;
          bestScoreSize += size;
          totalSize += size;
        }
      });

      recordKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const size = new Blob([data]).size;
          recordSize += size;
          totalSize += size;
        }
      });

      return {
        totalSize: this.formatBytes(totalSize),
        gameHistorySize: this.formatBytes(gameHistorySize),
        bestScoreSize: this.formatBytes(bestScoreSize),
        recordSize: this.formatBytes(recordSize),
        gameHistoryCount: gameHistoryKeys.length,
        bestScoreCount: bestScoreKeys.length,
        recordCount: recordKeys.length,
        totalKeys: allKeys.length
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return null;
    }
  }

  // 格式化字节大小
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取游戏最佳成绩（替代旧格式的record_*）
  getGameBestScore(gameType, difficulty = 'default') {
    try {
      const bestKey = `bestScores_${gameType}_${difficulty}`;
      const bestScores = JSON.parse(localStorage.getItem(bestKey) || '[]');
      
      if (bestScores.length > 0) {
        // 返回最佳成绩（第一个，因为已经按成绩排序）
        return bestScores[0].score;
      }
      return null;
    } catch (error) {
      console.error(`获取${gameType}最佳成绩失败:`, error);
      return null;
    }
  }

  // 获取游戏最佳成绩（兼容旧格式，优先返回新格式数据）
  getGameBestScoreCompatible(gameType, difficulty = 'default') {
    // 优先从新格式获取
    const newBest = this.getGameBestScore(gameType, difficulty);
    if (newBest !== null) {
      return newBest;
    }
    
    // 如果新格式没有数据，尝试从旧格式获取（兼容性）
    try {
      const oldBest = localStorage.getItem(`record_${gameType}`);
      if (oldBest) {
        // 将旧格式数据迁移到新格式
        this.migrateOldRecord(gameType, difficulty, oldBest);
        return parseFloat(oldBest);
      }
    } catch (error) {
      console.error(`获取旧格式${gameType}最佳成绩失败:`, error);
    }
    
    return null;
  }

  // 迁移旧格式记录到新格式
  migrateOldRecord(gameType, difficulty, oldScore) {
    try {
      const record = {
        id: this.generateId(),
        gameType,
        difficulty,
        score: parseFloat(oldScore),
        date: new Date().toISOString(),
        timeSpent: 0,
        moves: 0
      };
      
      // 保存到新格式
      this.saveGameRecord(gameType, difficulty, record);
      this.updateBestScores(gameType, difficulty, record);
      
      // 删除旧格式数据
      localStorage.removeItem(`record_${gameType}`);
      
      console.log(`✅ 已迁移${gameType}的旧格式记录到新格式`);
    } catch (error) {
      console.error(`迁移${gameType}旧格式记录失败:`, error);
    }
  }
}

// 创建全局实例
window.gameHistoryManager = new GameHistoryManager();
