// 反应测试游戏 - 结构化重构
class ReactionGame {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.isMobile = window.innerWidth <= 700;
    this.modes = [1, 5, 10];
    this.mode = 1;
    this.lastMode = 1;
    this.waiting = false;
    this.started = false;
    this.timer = null;
    this.startTime = 0;
    this.round = 0;
    this.records = [];
    this.bests = this.loadBests();
    this.render();
  }

  // 加载最佳成绩
  loadBests() {
    try {
      return JSON.parse(localStorage.getItem('reaction_bests') || '{}');
    } catch {
      return {};
    }
  }
  // 保存最佳成绩
  saveBests() {
    try {
      localStorage.setItem('reaction_bests', JSON.stringify(this.bests));
    } catch {}
  }
  // 获取当前模式最佳
  getBest() {
    return this.bests[this.mode] || null;
  }
  // 更新最佳成绩
  updateBest(val) {
    if (!this.bests[this.mode] || val < this.bests[this.mode]) {
      this.bests[this.mode] = val;
      this.saveBests();
    }
  }

  // 渲染主界面
  render() {
    this.container.innerHTML = '';
    if (!this.isMobile) {
      // PC端：左侧说明+右侧主区域
      const mainFlex = document.createElement('div');
      mainFlex.className = 'reaction-main-flex';
      mainFlex.style.display = 'flex';
      mainFlex.style.justifyContent = 'center';
      mainFlex.style.alignItems = 'flex-start';
      mainFlex.style.gap = '32px';
      mainFlex.style.maxWidth = '900px';
      mainFlex.style.margin = '0 auto';
      // 说明区
      const descDiv = document.createElement('div');
      descDiv.className = 'reaction-desc-left';
      descDiv.style.flex = '0 0 220px';
      descDiv.style.minWidth = '120px';
      descDiv.style.maxWidth = '180px';
      descDiv.style.background = '#f8fff5';
      descDiv.style.borderRadius = '10px';
      descDiv.style.padding = '14px 18px 12px 18px';
      descDiv.style.boxShadow = '0 2px 8px rgba(76,175,80,0.08)';
      descDiv.style.fontSize = '1.05em';
      descDiv.style.color = '#388e3c';
      descDiv.style.marginBottom = '8px';
      descDiv.innerHTML = `
        <div style='font-weight:bold;font-size:1.18em;text-align:center;margin-bottom:8px;'>反应测试玩法说明</div>
        1. 点击“挑战1/5/10次”开始测试。<br>
        2. 进入等待区后，2-5秒后变红，看到红色后尽快点击。<br>
        3. 记录你的反应时间，挑战多次会显示所有成绩和平均值。<br>
        4. 若提前点击会自动重试本轮。<br>
      `;
      // 右侧主区域
      const rightDiv = document.createElement('div');
      rightDiv.style.flex = '1';
      rightDiv.style.minWidth = '0';
      rightDiv.appendChild(this.renderPanel());
      mainFlex.appendChild(descDiv);
      mainFlex.appendChild(rightDiv);
      this.container.appendChild(mainFlex);
    } else {
      // 移动端：说明为弹窗
      this.container.appendChild(this.renderPanel());
    }
  }

  // 渲染主功能区
  renderPanel() {
    const panel = document.createElement('div');
    // 挑战模式下拉框
    const modeRow = document.createElement('div');
    modeRow.style.display = 'flex';
    modeRow.style.justifyContent = 'center';
    modeRow.style.alignItems = 'center';
    modeRow.style.gap = '12px';
    modeRow.style.marginBottom = '8px';
    const modeLabel = document.createElement('label');
    modeLabel.textContent = '挑战模式：';
    modeLabel.style.fontWeight = 'bold';
    const modeSelect = document.createElement('select');
    modeSelect.id = 'reaction-mode-select';
    modeSelect.className = 'reaction-mode-select';
    this.modes.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `挑战${m}次`;
      if (this.mode === m) opt.selected = true;
      modeSelect.appendChild(opt);
    });
    modeSelect.onchange = (e) => {
      this.mode = parseInt(e.target.value);
      this.lastMode = this.mode;
      this.reset();
    };
    modeRow.appendChild(modeLabel);
    modeRow.appendChild(modeSelect);
    // 说明按钮（移动端）
    let descBtn = null;
    if (this.isMobile) {
      descBtn = document.createElement('button');
      descBtn.className = 'button';
      descBtn.textContent = '游戏说明';
      descBtn.style.marginLeft = '8px';
      descBtn.onclick = () => this.showDescDialog();
      modeRow.appendChild(descBtn);
    }
    // 重置按钮
    const resetBtn = document.createElement('button');
    resetBtn.className = 'button';
    resetBtn.textContent = '重置';
    resetBtn.style.width = '90%';
    resetBtn.style.maxWidth = '220px';
    resetBtn.style.display = 'block';
    resetBtn.style.margin = '0 auto 12px auto';
    resetBtn.onclick = () => this.reset();
    // 最佳成绩
    const bestDiv = document.createElement('div');
    bestDiv.className = 'reaction-best';
    bestDiv.style.maxWidth = '400px';
    bestDiv.style.margin = '0 auto 12px auto';
    bestDiv.style.textAlign = 'center';
    bestDiv.style.fontSize = '1.15em';
    bestDiv.style.color = '#1b5e20';
    bestDiv.style.fontWeight = 'bold';
    bestDiv.style.background = '#f5f5f5';
    bestDiv.style.border = '2.5px solid #4CAF50';
    bestDiv.style.borderRadius = '14px';
    bestDiv.style.boxShadow = '0 2px 8px rgba(76,175,80,0.10)';
    bestDiv.style.padding = '10px 0';
    // 游戏主区域
    const area = document.createElement('div');
    area.id = 'reaction-area';
    area.className = 'reaction-area';
    area.style.width = '90vw';
    area.style.maxWidth = '400px';
    area.style.height = '180px';
    area.style.margin = '0 auto 24px auto';
    area.style.borderRadius = '18px';
    area.style.background = '#43a047';
    area.style.display = 'flex';
    area.style.alignItems = 'center';
    area.style.justifyContent = 'center';
    area.style.cursor = 'pointer';
    area.style.transition = 'background 0.3s';
    area.style.fontSize = '1.5em';
    area.style.color = '#fff';
    area.style.userSelect = 'none';
    area.style.boxShadow = '0 2px 12px rgba(76,175,80,0.10)';
    area.textContent = '点击开始测试';
    // 结果区
    const resultDiv = document.createElement('div');
    resultDiv.id = 'reaction-result';
    resultDiv.style.textAlign = 'center';
    resultDiv.style.fontSize = '1.3em';
    resultDiv.style.color = '#388e3c';
    resultDiv.style.marginTop = '18px';
    // 成绩列表
    const listDiv = document.createElement('div');
    listDiv.id = 'reaction-list';
    listDiv.style.maxWidth = '400px';
    listDiv.style.margin = '0 auto';
    listDiv.style.textAlign = 'center';
    listDiv.style.fontSize = '1.1em';
    listDiv.style.color = '#333';
    // 进度条
    const progressDiv = document.createElement('div');
    progressDiv.id = 'reaction-progress';
    progressDiv.style.textAlign = 'center';
    progressDiv.style.fontSize = '1em';
    progressDiv.style.color = '#888';
    progressDiv.style.margin = '8px 0';
    // 组装
    panel.appendChild(modeRow);
    panel.appendChild(resetBtn);
    panel.appendChild(bestDiv);
    panel.appendChild(progressDiv);
    panel.appendChild(area);
    panel.appendChild(resultDiv);
    panel.appendChild(listDiv);
    // 事件绑定
    area.onclick = (e) => this.handleClick(area, resultDiv, listDiv, progressDiv, bestDiv);
    area.ontouchstart = (e) => { e.preventDefault(); this.handleClick(area, resultDiv, listDiv, progressDiv, bestDiv); };
    // 初始化
    this.area = area;
    this.resultDiv = resultDiv;
    this.listDiv = listDiv;
    this.progressDiv = progressDiv;
    this.bestDiv = bestDiv;
    this.renderBest();
    this.renderProgress();
    return panel;
  }

  // 说明弹窗（移动端）
  showDescDialog() {
    let dialog = document.getElementById('reaction-unified-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'reaction-unified-dialog';
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
        <div style='background:#fff;padding:18px 16px 14px 16px;border-radius:16px;max-width:96vw;max-height:90vh;box-shadow:0 4px 24px rgba(0,0,0,0.18);position:relative;display:flex;flex-direction:column;align-items:center;'>
          <div style='font-weight:bold;font-size:1.18em;text-align:center;margin-bottom:12px;color:#388e3c;'>反应测试玩法说明</div>
          <div style='margin-bottom:18px;width:100%;text-align:left;font-size:1.05em;'>
            1. 点击“挑战1/5/10次”开始测试。<br>
            2. 进入等待区后，2-5秒后变红，看到红色后尽快点击。<br>
            3. 记录你的反应时间，挑战多次会显示所有成绩和平均值。<br>
            4. 若提前点击会自动重试本轮。<br>
          </div>
          <button class='button' id='reaction-desc-close' style='margin:0 auto;font-size:1.08em;padding:8px 32px;border-radius:8px;'>关闭</button>
        </div>
      `;
      document.body.appendChild(dialog);
      document.getElementById('reaction-desc-close').onclick = () => dialog.remove();
      dialog.onclick = e => { if (e.target === dialog) dialog.remove(); };
    }
  }

  // 渲染最佳成绩
  renderBest() {
    const best = this.getBest();
    let label = '';
    if (this.mode === 1) label = '单次';
    else if (this.mode === 5) label = '5次';
    else if (this.mode === 10) label = '10次';
    else label = this.mode + '次';
    if (best !== null) {
      this.bestDiv.innerHTML = `最佳成绩（${label}）<br><span style='font-size:1.5em;color:#1b5e20;'>${best.toFixed(0)}</span> 毫秒`;
    } else {
      this.bestDiv.innerHTML = `最佳成绩（${label}）：--`;
    }
  }

  // 渲染进度
  renderProgress() {
    if (this.mode === 1) {
      this.progressDiv.textContent = '';
    } else if (this.round < this.mode) {
      this.progressDiv.textContent = `第${this.round+1} / ${this.mode}次`;
    } else {
      this.progressDiv.textContent = '';
    }
  }

  // 渲染成绩列表
  renderList() {
    if (!this.records.length) {
      this.listDiv.innerHTML = '';
      return;
    }
    let html = '<b>成绩列表：</b><br>';
    this.records.forEach((r, i) => {
      html += `第${i+1}次：${r.toFixed(0)} 毫秒<br>`;
    });
    if (this.records.length > 1) {
      html += `<b>当前平均：</b>${(this.records.reduce((a,b)=>a+b,0)/this.records.length).toFixed(0)} 毫秒`;
    }
    this.listDiv.innerHTML = html;
  }

  // 重置
  reset() {
    this.waiting = false;
    this.started = false;
    this.timer = null;
    this.startTime = 0;
    this.round = 0;
    this.records = [];
    if (this.area) {
      this.area.style.background = '#43a047';
      this.area.textContent = this.mode === 1 ? '点击开始测试' : '第1次：点击开始测试';
      this.area.style.pointerEvents = '';
    }
    if (this.resultDiv) this.resultDiv.textContent = '';
    if (this.listDiv) this.listDiv.innerHTML = '';
    this.renderBest();
    this.renderProgress();
  }

  // 根据成绩给出批语
  getComment(ms) {
    if (ms < 180) return '神反应！';
    if (ms < 250) return '非常优秀！';
    if (ms < 350) return '不错哦！';
    if (ms < 500) return '还可以，加油！';
    return '再练练吧~';
  }

  // 通用弹窗（参考拼图游戏）
  showResultDialog(title, html) {
    let dialog = document.getElementById('reaction-result-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'reaction-result-dialog';
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
        <div style='background:#fff;padding:18px 16px 14px 16px;border-radius:16px;max-width:96vw;max-height:90vh;box-shadow:0 4px 24px rgba(0,0,0,0.18);position:relative;display:flex;flex-direction:column;align-items:center;'>
          <div style='font-weight:bold;font-size:1.18em;text-align:center;margin-bottom:12px;color:#388e3c;'>${title}</div>
          <div style='margin-bottom:18px;width:100%;text-align:center;font-size:1.15em;'>${html}</div>
          <button class='button' id='reaction-result-close' style='margin:0 auto;font-size:1.08em;padding:8px 32px;border-radius:8px;'>关闭</button>
        </div>
      `;
      document.body.appendChild(dialog);
      document.getElementById('reaction-result-close').onclick = () => dialog.remove();
      dialog.onclick = e => { if (e.target === dialog) dialog.remove(); };
    }
  }

  // 主点击逻辑
  handleClick(area, resultDiv, listDiv, progressDiv, bestDiv) {
    if (!this.waiting && !this.started) {
      // 初始点击，进入等待
      if (this.mode > 1 && this.round === 0) {
        this.records = [];
        this.renderList();
      }
      this.startWait();
    } else if (this.waiting && !this.started) {
      // 等待区被误点，重置
      clearTimeout(this.timer);
      area.style.background = '#757575';
      area.textContent = '太心急了！再试一次';
      resultDiv.innerHTML = '';
      setTimeout(() => {
        if (this.mode > 1) {
          area.textContent = `第${this.round+1}次：请等待...`;
          area.style.background = '#43a047';
          this.waiting = true;
          this.started = false;
          resultDiv.innerHTML = '';
          // 重新开始等待
          const delay = 2000 + Math.random() * 3000;
          this.timer = setTimeout(() => {
            this.waiting = false;
            this.started = true;
            area.style.background = '#e53935';
            area.textContent = `第${this.round+1}次：快点我！`;
            this.startTime = performance.now();
          }, delay);
        } else {
          this.reset();
        }
      }, 1200);
      return;
    } else if (this.started) {
      // 计时中，点击结束
      const reaction = performance.now() - this.startTime;
      area.style.background = '#43a047';
      this.started = false;
      const comment = this.getComment(reaction);
      if (this.mode === 1) {
        area.textContent = '点击开始测试';
        // 弹窗输出
        this.showResultDialog('测试结果', `你的反应时间：<b>${reaction.toFixed(0)}</b> 毫秒<br><span style='color:#1b5e20;font-size:1.1em;'>${comment}</span>`);
        this.updateBest(reaction);
        this.renderBest();
      } else {
        this.records.push(reaction);
        this.round++;
        this.renderList();
        this.updateBest(reaction);
        this.renderBest();
        this.renderProgress();
        if (this.round < this.mode) {
          setTimeout(() => {
            this.startWait();
          }, 800);
        } else {
          // 挑战完成
          area.style.pointerEvents = 'none';
          area.style.background = '#388e3c';
          area.textContent = '测试完成';
          const avg = this.records.reduce((a,b)=>a+b,0)/this.records.length;
          const avgComment = this.getComment(avg);
          // 弹窗输出
          this.showResultDialog('挑战完成', `<b>平均反应时间：</b><span style='color:#388e3c;'>${avg.toFixed(0)}</span> 毫秒<br><span style='color:#1b5e20;font-size:1.1em;'>${avgComment}</span>`);
          this.renderProgress();
          // 再来一次按钮
          const againBtn = document.createElement('button');
          againBtn.className = 'button';
          againBtn.textContent = '再来一次';
          againBtn.style.margin = '18px auto 0 auto';
          againBtn.onclick = () => this.reset();
          // 追加到弹窗内容
          setTimeout(() => {
            const dialog = document.getElementById('reaction-result-dialog');
            if (dialog) {
              const inner = dialog.querySelector('div > div:nth-child(3)');
              if (inner) inner.appendChild(document.createElement('br'));
              if (inner) inner.appendChild(againBtn);
            }
          }, 0);
        }
      }
    }
  }

  // 等待区逻辑
  startWait() {
    this.waiting = true;
    this.started = false;
    if (this.area) {
      this.area.style.background = '#43a047';
      this.area.textContent = this.mode === 1 ? '请等待...' : `第${this.round+1}次：请等待...`;
    }
    if (this.resultDiv) this.resultDiv.textContent = '';
    // 2-5秒随机延迟
    const delay = 2000 + Math.random() * 3000;
    this.timer = setTimeout(() => {
      this.waiting = false;
      this.started = true;
      if (this.area) {
        this.area.style.background = '#e53935';
        this.area.textContent = this.mode === 1 ? '快点我！' : `第${this.round+1}次：快点我！`;
      }
      this.startTime = performance.now();
    }, delay);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.reactionGame = new ReactionGame('#reaction-view');
}); 