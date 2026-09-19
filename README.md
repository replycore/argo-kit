# argo-kit

Node.js 启动器：sing-box（vless-argo + 可选直连）+ cloudflared 隧道 + 可选探针。零 npm 依赖，全配置走环境变量或 `USER_CONFIG`。

## 功能

- **vless-argo**：vless+ws 经 Argo 暴露，sing-box 监听 `127.0.0.1:VLESS_PORT`
- **代理地址优选**：`OPT_DOMAIN`（默认 `staticdelivery.nexusmods.com`）
- **可选直连**（填端口即开，失败自动降级）：
  - hysteria2（`HY2_PORT`）：密码留空用 UUID 派生；支持 `HY2_OBFS`；HOST 留空自动公网 IPv4
  - vless-direct（`VLESS_DIRECT_PORT`）：xtls-rprx-vision，sni 默认 `www.nvidia.com`
  - anytls（`ANYTLS_PORT`）：密码留空用 UUID 派生
- **Argo**：`token`（固定域名） / `temp`（临时域名自动解析）
- **探针**：nezha / komari / 内置 CF 探针（变量配齐全启用，缺一半仅警告）
- **CF 内置探针**：`auto`（默认，优先 WSS 实时上报 + POST 兜底） / `http`（仅 POST）
- **节点名**：自动国家前缀（`NODE_PREFIX` 可覆盖；`custom`=IP 后缀）
- **接口**：`GET /health`（状态 JSON） / `/sub` `/kit`（订阅）；`KIT_FILE` 落盘
- **进程管理**：子进程退出自动重启（上限 30 次，指数退避 5s→60s）
- **二进制 TTL**：`BIN_TTL_SEC`（默认 120s）后删除本次下载的二进制（进程已在内存，不影响运行）；`0`=不删
- **QUIET**：仅输出 warn/error；**SCRUB**：二进制文件名+内容脱敏（`sb-core`、`edge-tunnel`、`sys-monitor`、`node-monitor`）

## 环境变量

**唯一必填：`UUID`**。其余有默认值或可选。

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | `3000` | HTTP 端口 |
| `WS_PATH` | `/argo` | vless-ws 路径 |
| `VLESS_PORT` | `18000` | sing-box 内部端口 |
| `ARGO_MODE` / `ARGO_TOKEN` / `ARGO_DOMAIN` | `temp` | token 模式需配齐 ARGO_TOKEN+ARGO_DOMAIN |
| `OPT_DOMAIN` | `staticdelivery.nexusmods.com` | vless-argo 代理地址 |
| `HY2_PORT` / `VLESS_DIRECT_PORT` / `ANYTLS_PORT` | — | 直连端口，空=不启用 |
| `NEZHA_SERVER` + `NEZHA_KEY` | — | 配齐启用 nezha 探针 |
| `KOMARI_ENDPOINT` + `KOMARI_TOKEN` | — | 配齐启用 komari 探针 |
| `CF_WORKER_URL` + `CF_SECRET` + `CF_NODE_ID` | — | 配齐启用内置 CF 探针（`CF_NODE_ID` 留空复用 UUID） |
| `CF_CONNECTION_MODE` | `auto` | `auto`=WSS+POST；`http`=仅 POST |
| `CF_INTERVAL` | `60` | 上报间隔（最小 10） |
| `CF_PING_CT` / `CF_PING_CU` / `CF_PING_CM` / `CF_PING_BGP` | — | 探测节点 |
| `CF_IFACE` | — | 指定网卡统计 |
| `BIN_DIR` | `./.bin` | 二进制存放目录 |
| `BIN_TTL_SEC` | `120` | 启动后删除二进制的等待秒数；`0`=不删 |
| `KIT_FILE` | — | 节点订阅落盘路径 |
| `NODE_PREFIX` | 国家码 | `custom`=IP 后缀；其它=字面量 |
| `QUIET` / `SCRUB` | `0` | 安静日志 / 二进制脱敏 |
| `GH_PROXY` / `GH_TOKEN` | — | GitHub 代理 / API token |
| `SINGBOX_VERSION` / `CLOUDFLARED_VERSION` / `NEZHA_VERSION` / `KOMARI_VERSION` | `latest` | 可 pin 版本 |

## 部署

### 面板部署

上传 `package.json` + `index.js`，配环境变量或改 `USER_CONFIG`，执行 `npm start`。

### Docker

```sh
docker build -t argo-kit .
docker run -d --name argo-kit -p 3000:3000 \
  -e UUID=11111111-2222-4333-8444-555555555555 \
  -e ARGO_MODE=temp \
  -e KIT_FILE=kit.txt \
  argo-kit
```

镜像 `node:20-alpine`，非 root，只装 `ca-certificates curl openssl tar unzip`。push `main` 自动构建 `amd64+arm64` 推 GHCR。

## 依赖

Node.js `>=18`，零 npm 依赖。需 `curl`/`wget`、`tar`；直连需 `openssl`；nezha 需 `unzip`（Dockerfile 已含）。