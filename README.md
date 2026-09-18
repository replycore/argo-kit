# argo-kit

`sing-box`（vless-argo + 可选直连）+ `cloudflared` 隧道 + 可选探针的 Node.js 启动器。全配置走环境变量或文件顶部 `USER_CONFIG`，零 npm 依赖。

仓库实际文件（6 个）：`index.js` / `package.json` / `Dockerfile` / `README.md` / `.dockerignore` / `.github/workflows/docker.yml`。

## 功能（以 `index.js` 为准）

- **vless-argo**：vless+ws 经 Argo 暴露，sing-box 只听 `127.0.0.1`（`VLESS_PORT`，默认 18000）
- **代理地址优选**：`OPT_DOMAIN`（默认 `staticdelivery.nexusmods.com`）做链接 address
- **可选直连**（填端口即开，失败自动降级，不断线）：
  - hysteria2（UDP，`HY2_PORT`）：密码留空用 UUID 自动派生；可选 `HY2_OBFS`；HOST 留空自动获取公网 IPv4
  - vless-direct（TCP+TLS，`VLESS_DIRECT_PORT`）：`xtls-rprx-vision`，sni 默认 `www.nvidia.com`（`VLESS_DIRECT_SNI` 可改），自签证书客户端需跳过验证
  - anytls（TCP+TLS，`ANYTLS_PORT`）：密码留空用 UUID 自动派生（与 hy2 不同盐）
- Argo：`token`（固定域名）/ `temp`（临时域名自动解析）
- 探针：nezha / komari / CF 内置（配齐变量才启用，缺一半只警告禁用）
- CF 内置探针双模式：`auto`（默认）优先 WSS 实时上报（2s 节奏，服务端可调）+ POST 兜底；`http` 仅 POST
- 节点名自动加国家前缀（如 `#HK-vless-argo`，`NODE_PREFIX` 可覆盖）
- `/health` 状态，`/sub` / `/kit` 订阅；`KIT_FILE` 可落盘（如 `kit.txt`）
- 子进程退出自动重启（上限 30 次，指数退避 5s→60s）；`SIGTERM/SIGINT` 优雅退出
- `QUIET=1` 只显示 warn/error + `[OK]` 状态行；`SCRUB=1` 可选二进制 strings 脱敏
- **二进制 TTL**：`BIN_TTL_SEC`（默认 120）：启动 120s 后删除本次下载的二进制文件（进程已加载进内存，不受影响）；`0`=关闭

## 部署

### A. 上传文件（面板）

上传 `package.json` + `index.js`，执行 `npm start`。

配置二选一（环境变量优先）：

1. 面板环境变量
2. 直接改 `index.js` 顶部 `USER_CONFIG`

### B. Docker

```sh
docker build -t argo-kit .
docker run -d --name argo-kit -p 3000:3000 \
  -e UUID=11111111-2222-4333-8444-555555555555 \
  -e ARGO_MODE=temp \
  -e KIT_FILE=kit.txt \
  argo-kit
# curl http://IP:3000/kit
# curl http://IP:3000/health
```

镜像：`node:20-alpine`，非 root（`Dockerfile` 只装 `ca-certificates curl openssl tar unzip`）。
Actions（`.github/workflows/docker.yml`）：`index.js` 等变更 push `main` 自动构建 `amd64+arm64` 推 GHCR，也支持 Actions 页手动 Run。

## 环境变量（以 `index.js` 的 `USER_CONFIG` + `loadConfig` 为准）

**唯一必填：`UUID`**。

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | `3000` | HTTP（`/health` `/sub` `/kit`） |
| `UUID` | — | **必填**，探针 ID 默认复用 |
| `WS_PATH` | `/argo` | vless-ws 路径 |
| `VLESS_PORT` | `18000` | 内部转发端口（致命校验，越界直接退出） |
| `ARGO_MODE` | `temp` | `token` \| `temp` |
| `ARGO_TOKEN` / `ARGO_DOMAIN` | — | token 模式必填（缺件直接退出） |
| `OPT_DOMAIN` | `staticdelivery.nexusmods.com` | vless-argo 代理地址 |
| `HY2_PORT` | — | 填端口开 hy2；兼容旧 `HY2_ENABLED=1`（默认 4443） |
| `HY2_PASSWORD` / `HY2_OBFS` / `HY2_HOST` | 派生 / — / 自动 IPv4 | |
| `VLESS_DIRECT_PORT` / `VLESS_DIRECT_HOST` / `VLESS_DIRECT_SNI` | — / 自动 IPv4 / `www.nvidia.com` | |
| `ANYTLS_PORT` / `ANYTLS_PASSWORD` / `ANYTLS_HOST` | — / 派生 / 自动 IPv4 | |
| `NODE_PREFIX` | 国家码 | `custom`=IP 后缀；其它=字面量 |
| `KIT_FILE` | — | 节点落盘路径 |
| `BIN_TTL_SEC` | `120` | 二进制存活秒数；`0`=关闭；只删本次下载的 |
| `QUIET` / `SCRUB` | `0` | 安静日志 / strings 脱敏 |
| `NEZHA_SERVER` + `NEZHA_KEY` | — | 配齐启用；`NEZHA_UUID` 留空复用 UUID，`auto` 让 agent 自生成；`NEZHA_TLS` 默认 1；默认关远程命令 |
| `KOMARI_ENDPOINT` + `KOMARI_TOKEN` | — | 配齐启用；`KOMARI_INTERVAL` 默认 3；默认关 web ssh |
| `CF_WORKER_URL` + `CF_SECRET` | — | 配齐启用内置探针（`CF_NODE_ID` 留空复用 UUID；`CF_INTERVAL` 默认 60，最小 10；可选 `CF_PING_CT/CU/CM/BGP`、`CF_IFACE`） |
| `CF_CONNECTION_MODE` | `auto` | `auto`=WSS 实时+POST 兜底；`http`=仅 POST |
| `BIN_DIR` | `./.bin` | 只读环境改 `/tmp/.bin`；下载/解压临时走 `BIN_DIR/tmp` |
| `GH_PROXY` / `GH_TOKEN` | — | 代理前缀 / API token（提高限流） |
| `SINGBOX_VERSION` / `CLOUDFLARED_VERSION` / `NEZHA_VERSION` / `KOMARI_VERSION` | `latest` | 可 pin 版本 |
| `LOG_LEVEL` | `warn` | `debug` `info` `warn` `error` |

退出语义（`loadConfig` 实测）：致命（直接 `exit 1`）只有 UUID、ARGO token 件、PORT/VLESS_PORT 越界、komari/CF 的 URL 格式与 interval 下限；其余（探针配一半、直连端口非法/被占、无 openssl、无公网 IP）全部警告降级。

## 接口（以 `index.js` 的 `startServer` 为准）

- `GET /health`：uptime、域名、`node_prefix`、进程存活、直连 `*_active/*_reason/*_host`、探针状态（含 CF 的 `cf_mode/cf_wss_connected/cf_wss_reports/cf_post_reports`）
- `GET /sub` / `GET /kit`：订阅文本（vless-argo → vless-direct → anytls → hy2）
- `kit.txt`：`KIT_FILE` 非空时，argo 就绪后落盘（首 15s，之后每 60s）

## 原理简述（以 `index.js` 的 `main` 为准）

1. 按架构下载官方二进制到 `BIN_DIR`（改中性名 `sb-core/edge-tunnel/sys-monitor/node-monitor`，可选 strings 脱敏；下载带 ≥1MB 完整性校验）
2. 生成 `BIN_DIR/.run/sb.json`（`vless-argo` 常驻 + active 的直连协议），`sing-box check` 通过后启动；直连共享自签证书（`BIN_DIR/.run/cert.pem/key.pem`）
3. 启动 cloudflared（temp 模式从日志解析域名）
4. best-effort 启动探针；启动完成后按 `BIN_TTL_SEC` 删除本次下载的二进制（内存中进程不受影响）

## 依赖

- Node.js `>=18`，零 npm 依赖（`package.json` 无 dependencies）
- 需 `curl`/`wget`、`tar`；直连需 `openssl`；nezha 需 `unzip`（Dockerfile 已含）
