// 鼠标轨迹测试主逻辑（基础结构）
function renderMouseView() {
  const el = document.getElementById('mouse-view');
  el.innerHTML = `
    <div style="text-align:center;margin:32px 0;">
      <h2 style="margin:16px 0 24px;">鼠标轨迹</h2>
      <div>（此处将显示鼠标轨迹玩法界面）</div>
    </div>
  `;
}
window.addEventListener('DOMContentLoaded', renderMouseView);
// TODO: 实现轨迹绘制、偏离评分等 