// 拼图游戏主逻辑（基础结构）
const puzzleConfig = {
  sizes: [3, 4, 5],
  defaultImages: [
    'assets/pic1.jpg', 'assets/pic2.jpg', 'assets/pic3.jpg',
    'assets/pic4.jpg', 'assets/pic5.jpg', 'assets/pic6.jpg',
    'assets/pic7.jpg', 'assets/pic8.jpg', 'assets/pic9.jpg',
    'assets/pic10.jpg'
  ]
};

window.renderPuzzleView = function() {
  const el = document.getElementById('puzzle-view');
  el.innerHTML = `
    <div style="text-align:center;margin:32px 0;">
      <button class="button" onclick="location.hash=''">返回大厅</button>
      <h2 style="margin:16px 0 24px;">拼图游戏</h2>
      <div>（此处将显示拼图玩法界面）</div>
    </div>
  `;
};
// TODO: 实现拼图核心逻辑、图片上传、难度切换等 