# Piper TTS AppImage — 重建配方

> 产物：`dist/Piper TTS-1.0.0-linux-x86_64.AppImage`（约 750MB，引擎+运行时+音库全内置）
> 上游：github.com/davealaw/piper-electron（MIT，release 无产物，需自行构建）
> 本 tar 含全部源码与补丁；node_modules / dist / engine / voices 不在内，按下述步骤重建。

## 0. 取源码

本 tar 解压即工程目录（已含补丁）。或取上游后重新打补丁（改动见第 4 节）。

## 1. 装依赖（约 13 分钟，npmmirror）

```bash
cd piper-electron-main
env -u https_proxy -u http_proxy -u all_proxy -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY \
  ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
  npm_config_registry=https://registry.npmmirror.com/ npm ci --no-audit --no-fund
```

坑：继承会话代理会导致 npmmirror TLS 握手失败——**必须 env -u 四个代理变量**。

## 2. 组装 engine/（586MB，自包含 Python 引擎）

```bash
mkdir -p engine/python/bin engine/python/lib/python3.12

# 2.1 系统 Python 运行时（布局 = 标准 prefix，二进制可自定位）
cp -L /usr/bin/python3.12 engine/python/bin/
cp /usr/lib/x86_64-linux-gnu/libpython3.12.so.1.0 engine/python/lib/
(cd /usr/lib/python3.12 && tar cf - --exclude=test --exclude=idlelib --exclude=tkinter --exclude=__pycache__ .) \
  | (cd engine/python/lib/python3.12 && tar xf -)

# 2.2 piper 及依赖（新代 Python piper 1.8，带 g2pW 中文路径）
python3 -m venv /tmp/pv && /tmp/pv/bin/pip install -i https://mirrors.ustc.edu.cn/pypi/simple/ "piper-tts[zh]"
cp -r /tmp/pv/lib/python3.12/site-packages engine/python/lib/python3.12/dist-packages
rm -rf engine/python/lib/python3.12/dist-packages/pip
# ⚠️ 必须叫 dist-packages（Debian site.py 只认它），且不能嵌套在已有目录里

# 2.3 g2pW 多音字模型（153MB，官方 URL 写死 huggingface.co，国内手动灌）
mkdir -p engine/g2pW && curl -fsSL -o /tmp/g2pw.tar.gz \
  "https://hf-mirror.com/datasets/rhasspy/piper-checkpoints/resolve/main/zh/zh_CN/_resources/g2pw.tar.gz"
tar -xzf /tmp/g2pw.tar.gz -C engine/g2pW && rm /tmp/g2pw.tar.gz

# 2.4 BERT 分词器缓存（~436KB，g2pW 用；预置后可完全离线）
HF_HOME=$PWD/engine/hf-cache HF_ENDPOINT=https://hf-mirror.com \
  /tmp/pv/bin/python -c "from transformers import BertTokenizer; BertTokenizer.from_pretrained('bert-base-chinese')"

# 2.5 引擎包装脚本（已随 tar 提供，重建时重写）
cat > engine/piper <<'EOF'
#!/bin/bash
HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
export LD_LIBRARY_PATH="$HERE/python/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PYTHONNOUSERSITE=1
export HF_HOME="$HERE/hf-cache"
export HF_HUB_OFFLINE=1
export HF_ENDPOINT=https://hf-mirror.com
cd "$HERE"
exec "$HERE/python/bin/python3.12" -m piper "$@"
EOF
chmod +x engine/piper
```

自测：`echo 测试 | ./engine/piper --model voices/zh_CN-xiao_ya-medium.onnx --output_file /tmp/t.wav`

## 3. 音库 voices/（6 个，426MB）

经 Hugging Face 或其镜像（hf-mirror.com）下载：

```
https://huggingface.co/rhasspy/piper-voices/resolve/main/<path>
zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx(.json)      # 老 espeak 路径，断句一般
zh/zh_CN/chaowen/medium/zh_CN-chaowen-medium.onnx(.json)    # g2pW 新路径 ✅
zh/zh_CN/xiao_ya/medium/zh_CN-xiao_ya-medium.onnx(.json)    # g2pW 新路径 ✅
en/en_US/ryan/high/en_US-ryan-high.onnx(.json)
en/en_US/lessac/medium/en_US-lessac-medium.onnx(.json)
en/en_US/amy/medium/en_US-amy-medium.onnx(.json)
```

## 4. 相对上游的补丁（MIT，按需重打）

| 文件 | 改动 | 原因 |
|---|---|---|
| `main.js` 顶部 | 默认路径改 resBase（resources/engine、resources/voices）多级回退 | 上游 `__dirname/piper` 在 asar 内 + 自带的是 mac arm64 二进制，打包后必挂 |
| `main.js` run-piper | 空输出路径兜底到 `app.getPath('temp')`；`resolve(outFile)` 返回真实路径 | 上游把 JS null 字符串化成文件名 `'null'`，写进只读挂载报 Errno 30 |
| `main.js` speak-text-file | 同款路径兜底 | 同上 |
| `main.js` preview-voice | 试听改读用户输入前 80 字，无输入按音色语言给中/英默认句 | 上游写死英文测试句 |
| `preload.js` / `scripts/dom.js` | previewVoice 透传文本 | 配合上一条 |
| `scripts/tss.js` | 用主进程返回的真实路径回放 | 否则播放地址是 `null?t=...` |
| `package.json` | `files` 加 `!engine/**/*`；`extraResources` 加 engine | engine 走 resources 不进 asar |

## 5. 出包 + 运行

```bash
env -u https_proxy -u http_proxy -u all_proxy -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY \
  ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
  npx electron-builder --linux AppImage    # 跳过 npm prebuild 的 lint/test
```

- 运行需 FUSE（本机有 fusermount ✓）；无则 `--appimage-extract-and-run`
- 配置在 `~/.config/piper-electron/config.json`；piperPath 记录的是挂载点，每次启动会自动重解析，无需手改
- 端口无关（原生桌面应用）；内存常驻约 200MB
## 6. Edge TTS 云端音色（可选，2026-11-05 加）

```bash
# 灌进引擎运行时（USTC 若报 "versions: none" 是它同步抽风，换阿里源）
python3 -m venv /tmp/pv && /tmp/pv/bin/pip install -q \
  -i https://mirrors.aliyun.com/pypi/simple/ --upgrade \
  --target engine/python/lib/python3.12/dist-packages edge-tts
```

- 音色清单在 `main.js` 顶部 `EDGE_VOICES`（前缀 `edge:`），UI 下拉显示 ☁️
- 路由逻辑：`run-piper` / `preview-voice` / `speak-text-file` 见 `synthEdge()`——输出为 **mp3**（按用户路径自动换扩展名）
- 运行期需联网（speech.platform.bing.com，国内直连实测 ~4s/句）；无凭证、无本地模型
