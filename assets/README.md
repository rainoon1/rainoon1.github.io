# 经典语录语料库

这是一个包含经典语录和电影台词的语料库，用于在游戏完成弹窗中随机展示，为玩家提供激励和思考。

## 功能特性

- **多类别语录**：包含励志语录、电影台词、哲学思考、生活感悟和游戏感悟等5个类别
- **随机展示**：每次游戏完成后随机选择一条语录进行展示
- **中文显示**：所有语录都使用中文，并配有类别标识
- **易于扩展**：可以方便地添加新的语录和类别

## 语录类别

### 1. 励志语录 (motivational)
包含积极向上的励志语句，鼓励玩家继续努力。

### 2. 电影台词 (movieQuotes)
来自经典电影的经典台词，带有电影名称标识。

### 3. 哲学思考 (philosophical)
哲学家的经典名言，引发深度思考。

### 4. 生活感悟 (lifeWisdom)
关于生活的智慧感悟，贴近日常生活。

### 5. 游戏感悟 (gaming)
与游戏相关的感悟，增强游戏体验。

## 使用方法

### 基本用法

```javascript
// 获取随机语录
const randomQuote = window.getRandomQuote();
console.log(randomQuote.text);        // 语录内容
console.log(randomQuote.category);    // 语录类别
```

### 指定类别

```javascript
// 获取指定类别的随机语录
const motivationalQuote = window.getRandomQuoteByCategory('motivational');
```

### 在游戏弹窗中使用

```javascript
// 在游戏完成弹窗中展示随机语录
if (window.getRandomQuote) {
  const randomQuote = window.getRandomQuote();
  const quoteText = randomQuote.text;
  const quoteCategory = randomQuote.category;
  
  // 在弹窗HTML中添加语录展示
  const quoteHTML = `
    <div class="quote-container">
      <div class="quote-text">"${quoteText}"</div>
      <div class="quote-category">—— ${getCategoryDisplayName(quoteCategory)}</div>
    </div>
  `;
}
```

## 已集成的游戏

- ✅ 图片拼图游戏
- ✅ 数字拼图游戏  
- ✅ 反应速度测试
- ✅ 鼠标轨迹游戏
- ✅ 秒表挑战游戏

## 扩展语录

要添加新的语录，只需在 `quotes-library.js` 文件中相应类别下添加新的语录即可：

```javascript
// 在现有类别中添加新语录
motivational: [
  "成功不是偶然的，而是必然的。",
  "新的励志语录...",  // 添加新语录
  // ... 其他语录
],

// 添加新类别
newCategory: [
  "新类别的语录1",
  "新类别的语录2",
  // ... 更多语录
]
```

## 注意事项

1. 确保在游戏HTML文件中引入 `quotes-library.js`
2. 语录内容应保持积极正面，避免消极或不当内容
3. 电影台词应注明出处，尊重版权
4. 可以根据游戏主题调整语录的展示样式

## 更新日志

- **v1.0.0** - 初始版本，包含5个类别的经典语录
- 支持随机选择和指定类别选择
- 集成到所有现有游戏中
