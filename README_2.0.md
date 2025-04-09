
25.4.7新增修改：
前端：- 新增了侧边元素框可以上下滑动功能，确保元素都能完整看见
    -画布可无限拖拽拖动
    -新增添加了缩放按钮（放大和缩小），缩放范围限制在 0.5x 到 2x 之间
    -新增合成特朗普时的旋转动画特效

合成规则逻辑：<优先使用预定义规则————检查数据库里是否有存在的组合————没有再调用openai生成规则>


# 100步合成特朗普游戏 

玩家需要在100步内通过组合不同元素来合成特朗普。

## 项目结构

```
infinite-craft-nextjs/
├── public/
│   └── trump.png           # 特朗普头像图片（引用路径还没有更改，还是采用本地引用）
├── src/
│   ├── app/
│   │   ├── page.tsx        # 主游戏组件
│   │   ├── layout.tsx      # 根布局
│   │   ├── globals.css     # 全局样式
│   │   └── providers.tsx   # 主题提供者
│   ├── components/
│   │   ├── element-card.tsx    # 元素卡片组件
│   │   ├── playground-area.tsx # 游戏区域
│   │   ├── side-bar.tsx       # 侧边栏
│   │   └── sort-button.tsx    # 排序功能
│   ├── constants/
│   │   └── default-element.ts  # 默认元素和游戏规则
│   ├── interfaces/
│   │   └── element.ts         # TypeScript接口定义
│   ├── libs/
│   │   └── connect-db.ts      # 数据库连接
│   └── pages/
│       └── api/
│           └── combine.ts      # 元素合成API
```

## 配置要求

1. OpenAI接口配置，添加OpenAI API密钥（gpt-4o-mini）
```env
OPENAI_API_KEY=你的OpenAI_API密钥
```

2. 数据库配置
添加MongoDB连接字符串
```env
MONGODB_URI=你的MongoDB连接字符串
```

2. 数据库结构：
- 集合名：`elements`
- 字段说明：
  - `word1`: String (第一个元素文本)
  - `word2`: String (第二个元素文本)
  - `text`: String (结果元素文本)
  - `emoji`: String (结果表情)
  - `timestamps`: true (自动添加时间戳)


## 核心游戏逻辑

### 1. 元素合成规则
- 位置：`src/pages/api/combine.ts`
   - **预定义了一条28步的特朗普合成路线**
   - 玩家有100步的尝试机会
   - 鼓励探索不同的合成路径

### 2. 默认元素
- 位置：`src/constants/default-element.ts`
- 起始元素：
  - 草 (🌱)
  - 太阳 (☀️)

## API集成说明

### OpenAI集成
1. 当前使用模型：GPT-4o-mini
2. 接口端点：`/api/combine`
3. 响应格式：
```typescript
{
  message: string;
  element: {
    emoji: string;
    text: string;
    discovered: boolean;
  }
}
```

### 数据库集成
1. 连接配置：`src/libs/connect-db.ts`
2. 元素模型：`src/interfaces/element.ts`
3. 操作类型：
   - 读取：检查现有组合
   - 写入：保存新组合



