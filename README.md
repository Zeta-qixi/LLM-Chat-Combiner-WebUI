# 🚀 NexusLLM Manager - Unified Orchestration Studio

NexusLLM 是一款专为提示词工程（Prompt Engineering）设计的模块化管理平台。它通过“积木式”的拖拽组合，帮助用户快速构建、测试并持久化复杂的 LLM 请求流。

---

## 🌟 核心理念 (Core Concepts)

### 1. 模块化提示词 (Modular Prompts)
提示词不再是单一的长文本，而是由多个功能模块组成的“管道”：
- **人设 (Role)**: 定义 AI 的身份（如：资深架构师）。
- **任务 (Task)**: 明确要完成的具体动作（如：总结报告）。
- **场景 (Scene)**: 设定上下文环境。
- **动态槽位 (Slots)**: 使用 `{{变量名}}` 语法，可以在构建时动态填入内容，甚至**链接到另一个模块**。

### 2. 引擎部件化 (Engine Parts)
将请求参数与提示词分离，实现快速切换：
- **密钥 (Token)**: 集中管理 API Keys。
- **引擎 (Model)**: 预设不同的模型名称（如 `gemini-3-flash-preview`）。
- **参数 (Config)**: 以 JSON 形式保存常用的 Temperature、TopP 等配置。

---

## 🛠 使用指南 (Usage Guide)

### 第一步：构建你的库
在左侧边栏的 **提示词库** 和 **模型部件** 选项卡中，点击 `+` 号添加你的常用组件。
> **技巧**: 在提示词内容中使用 `{{topic}}` 即可创建一个输入槽位。

### 第二步：拖拽编排 (The Pipeline)
1. **配置引擎**: 从“模型部件”库中将对应的 `Token`、`Model`、`Config` 拖入顶部的 **Engine Config** 区域。
2. **构建提示词**: 将“提示词库”中的模块拖入中间的 **Prompt Pipeline**。
3. **填充变量**: 在已添加的模块卡片中，直接输入文本，或者点击 `M` 按钮将该变量链接到库中的另一个完整模块。

### 第三步：即时调试
右侧的 **测试终端** 会实时检测配置状态：
- 当顶部的 Engine 配置完整时，状态将变为 `READY`。
- 点击发送消息，系统会自动解析所有模块间的引用关系，合成最终的 `System Instruction` 并发送请求。

### 第四步：保存工作空间
在顶部的 **Config Identity** 处为当前组合命名，点击 **保存配置**。你可以通过 **配置库** 随时找回你的编排方案。

---

## 💎 技术特性
- **递归解析**: 支持模块间的无限级嵌套引用。
- **本地持久化**: 所有数据自动存储在浏览器 IndexedDB/LocalStorage 中，无需后端即可使用。
- **可视化 JSON**: 在工作台底部可实时预览最终发送给 API 的完整请求结构。
- **响应式交互**: 采用 TailwindCSS 打造的深色系极客界面，适配高效办公。

---

## ⌨️ 开发者提示
本项目基于 **Gemini API SDK** 构建。
- **模型支持**: 推荐使用 `gemini-3-flash-preview` 或 `gemini-3-pro-preview` 以获得最佳推理效果。
- **环境变量**: 运行环境需正确配置 `process.env.API_KEY`。

---

*Powered by Google Gemini 3.0 Series Models.*