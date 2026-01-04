# 房地产估价知识库 - Web前端

Vue3 + TypeScript + Element Plus

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 页面

1. **知识库管理** `/kb`
   - 查看统计信息
   - 上传报告
   - 删除报告
   - 重建向量索引

2. **案例搜索** `/search`
   - 混合搜索（向量+规则）
   - 语义搜索
   - 字段搜索
   - 查看案例详情

## 配置

### API代理

开发模式下，Vite会将 `/api` 请求代理到 `http://localhost:8000`。

修改 `vite.config.ts`：

```ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

### Token

在左侧边栏底部输入API Token进行认证。

## 技术栈

- Vue 3.4
- TypeScript 5
- Vue Router 4
- Element Plus 2.4
- Axios
- Vite 5
