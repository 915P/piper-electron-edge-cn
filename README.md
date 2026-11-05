# Piper Electron Edge CN 🎙️

> 中文增强版桌面语音合成工具，基于 [davealaw/piper-electron](https://github.com/davealaw/piper-electron)（MIT）。
> **本地 Piper 神经语音** + **微软 Edge 云端音色** 二合一，打包为单文件 AppImage。

一个界面管两种引擎：离线时用本地 Piper 音库（轻快、零依赖），要音质时切 ☁️ Edge 云端音色（微软神经 TTS，300+ 声线，约 4 秒出句）。

## 特性

- 🈶 **全中文界面**：按钮、状态、系统对话框、报错全部汉化
- 🌗 **三档主题**：暗色（默认）/ 亮色 / 跟随系统，选择记忆、首帧即生效不闪白
- 🏠 **本地引擎自包含**：自带 Python 运行时与依赖，中文走 g2pW 多音字路径，完全离线
- ☁️ **Edge 云端音色**：晓晓、云希、云扬、Jenny…（生成时需联网，输出 mp3）
- 📦 **单文件 AppImage**：引擎、音库、分词资源全内置，双击即用
- 🎛 音色下拉带**中文名与性别标注**，试听按钮可直接朗读你输入的前 80 字

## 与上游的差异

| # | 改动 |
|---|---|
| 1 | AppImage 打包适配：默认路径改走 `resources/engine`、engine 不进 asar |
| 2 | 修复输出路径为 `null` 时写只读挂载崩溃（`Errno 30`），主进程返回真实播放路径 |
| 3 | `validate-model-path` 放行 `edge:` 云端音色（原先选中即锁死按钮） |
| 4 | 新增 Edge TTS 合成路由（朗读/试读/拖文件三条路径） |
| 5 | 试听改为朗读当前输入前 80 字，中英文默认句按音色语言区分 |
| 6 | 暗色/亮色/跟随系统三档主题（CSS 变量架构） |
| 7 | 全界面汉化 + 去掉 Electron 默认菜单栏 |

## 构建

完整步骤（含国内镜像、engine 运行时组装、全部踩坑记录）见 **[BUILD-RECIPE.md](BUILD-RECIPE.md)**。

```bash
npm ci --registry=https://registry.npmmirror.com/
# 按配方第 2、3 节准备 engine/ 与 voices/
npx electron-builder --linux AppImage
```

## 音库与权重（重要）

本仓库**只含代码，不含任何模型权重**：

- Piper 音库从 [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) 自行下载，命令见配方第 3 节；部分音库（如 `zh_CN-xiao_ya`）所用语料标注 **Non-commercial**，请仅限个人使用
- g2pW 多音字模型与 BERT 分词器的获取方式见配方第 2 节
- **Edge 云端**音色通过 `pip install edge-tts` 接入（配方第 6 节），受微软服务条款约束，请勿商用

## 依赖的上游项目

- [davealaw/piper-electron](https://github.com/davealaw/piper-electron) — GUI 框架（MIT）
- [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) — Piper TTS 引擎（MIT）
- [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) — 官方音库
- [GitYCC/g2pW](https://github.com/GitYCC/g2pW) — 中文多音字注音
- [rany2/edge-tts](https://github.com/rany2/edge-tts) — 微软 Edge 云端 TTS 客户端（MIT）

## 许可

[MIT](LICENSE)。版权同上游：`Copyright (c) 2025 piper-electron contributors`，本 fork 的修改同样以 MIT 发布。音库与云端服务的许可独立于本代码，见上一节。