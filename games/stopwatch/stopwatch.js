// 3秒挑战主逻辑
function renderStopwatchView() {
  const el = document.getElementById('stopwatch-view');
  const desc = document.getElementById('stopwatch-desc');
  if (desc) {
    desc.innerHTML = `游戏玩法：选择目标时间（3秒/5秒/10秒）和模式，点击“开始”后计时，再次点击“结束”停止计时。<br>动态秒表可见计时，默念模式计时不可见。结算时显示你的成绩与目标时间的误差。`;
  }
  el.innerHTML = `
    <div style="max-width:420px;margin:0 auto;display:flex;align-items:flex-start;justify-content:center;gap:18px;">
      <div style="flex:1;min-width:0;text-align:center;">
        <div style="margin-bottom:16px;">
          <div style="margin-bottom:8px;">
            <label>目标时间：</label>
            <select id="target-time">
              <option value="3">3秒</option>
              <option value="5">5秒</option>
              <option value="10">10秒</option>
            </select>
          </div>
          <div>
            <label>模式：</label>
            <select id="mode-select">
              <option value="normal">动态秒表</option>
              <option value="silent">默念模式</option>
            </select>
          </div>
        </div>
        <div id="stopwatch-timer" style="font-size:2.5em;font-weight:bold;margin:24px 0;letter-spacing:2px;display:inline-block;padding:18px 36px;border:3px solid #4CAF50;border-radius:18px;box-shadow:0 2px 12px rgba(76,175,80,0.10);background:#fff;">0.000</div>
        <button class="button" id="stopwatch-btn" style="font-size:1.2em;padding:10px 36px;">开始</button>
        <div id="stopwatch-result" style="margin-top:24px;font-size:1.6em;color:#388e3c;font-weight:bold;"></div>
      </div>
      <div id="stopwatch-best" style="min-width:110px;max-width:150px;padding:16px 10px 12px 10px;background:#f5f5f5;border:2.5px solid #4CAF50;border-radius:14px;box-shadow:0 2px 8px rgba(76,175,80,0.10);font-size:1.18em;color:#1b5e20;font-weight:bold;text-align:center;line-height:1.5;">最佳成绩：--</div>
    </div>
  `;

  let timer = 0;
  let startTime = 0;
  let running = false;
  let rafId = null;
  let mode = 'normal';
  let target = 3;

  const timerEl = document.getElementById('stopwatch-timer');
  const btn = document.getElementById('stopwatch-btn');
  const resultEl = document.getElementById('stopwatch-result');
  const targetSel = document.getElementById('target-time');
  const modeSel = document.getElementById('mode-select');
  const bestEl = document.getElementById('stopwatch-best');

  function format(t) {
    return t.toFixed(3);
  }

  function updateTimer() {
    if (!running) return;
    timer = (performance.now() - startTime) / 1000;
    if (mode === 'normal') {
      timerEl.textContent = format(timer);
    }
    rafId = requestAnimationFrame(updateTimer);
  }

  function getBestKey() {
    return `stopwatch_best_${target}_${mode}`;
  }
  function getBest() {
    const v = localStorage.getItem(getBestKey());
    return v ? parseFloat(v) : null;
  }
  function setBest(val) {
    localStorage.setItem(getBestKey(), val);
  }
  function renderBest() {
    const best = getBest();
    if (best !== null) {
      bestEl.innerHTML = `最佳成绩<br><span style='font-size:1.5em;color:#1b5e20;'>${best.toFixed(3)}</span> 秒`;
    } else {
      bestEl.innerHTML = '最佳成绩：--';
    }
  }

  function reset() {
    running = false;
    timer = 0;
    startTime = 0;
    if (modeSel.value === 'silent') {
      timerEl.innerHTML = '<span style="color:#fff;">0.000</span>';
    } else {
      timerEl.textContent = '0.000';
    }
    btn.textContent = '开始';
    btn.disabled = false;
    resultEl.textContent = '';
    timerEl.style.visibility = 'visible';
    renderBest();
  }

  btn.onclick = function() {
    if (!running) {
      // 开始
      running = true;
      btn.textContent = '结束';
      resultEl.textContent = '';
      mode = modeSel.value;
      target = Number(targetSel.value);
      if (mode === 'silent') {
        timerEl.innerHTML = '<span style="color:#fff;">0.000</span>';
      } else {
        timerEl.style.visibility = 'visible';
        timerEl.textContent = '0.000';
      }
      startTime = performance.now();
      rafId = requestAnimationFrame(updateTimer);
    } else {
      // 结束
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      timer = (performance.now() - startTime) / 1000;
      timerEl.textContent = format(timer);
      timerEl.style.visibility = 'visible';
      btn.textContent = '重新挑战';
      btn.disabled = true;
      const diff = Math.abs(timer - target);
      let msg = `目标：${target}秒<br>你的成绩：${format(timer)} 秒<br>误差：<b>${format(diff)}</b> 秒`;
      if (Math.abs(diff) < 0.0005) msg += '<br>🌟 宇宙无敌超级强！你是时间的主宰者！';
      else if (diff < 0.05) msg += '<br>🎉 超神！';
      else if (diff < 0.15) msg += '<br>👍 很棒！';
      else if (diff < 0.3) msg += '<br>还不错！';
      else msg += '<br>再试试吧！';
      resultEl.innerHTML = msg;
      // 最佳成绩
      const prevBest = getBest();
      if (prevBest === null || diff < prevBest) {
        setBest(diff);
      }
      renderBest();
      setTimeout(() => { btn.disabled = false; }, 800);
    }
  };

  targetSel.onchange = reset;
  modeSel.onchange = reset;
}
window.addEventListener('DOMContentLoaded', renderStopwatchView); 