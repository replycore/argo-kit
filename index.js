// ================= 配置区（环境变量优先，其次本区，最后代码默认值） =================
// 面板能设环境变量就用环境变量；否则直接改这里再上传。留空 "" = 默认/关闭。
const USER_CONFIG = {
  // ---- 基础 ----
  UUID: "",        // 必填：vless 的 UUID，例如 "11111111-2222-4333-8444-555555555555"
  PORT: "",        // HTTP 端口（/health /sub），默认 3000；PaaS 会自动注入 PORT 时不用填
  WS_PATH: "",     // vless-ws 路径，默认 /argo
  VLESS_PORT: "",  // 内部转发端口，sing-box听127.0.0.1、cloudflared转发到它；默认18000，被占用才改

  // ---- Argo 隧道 ----
  ARGO_MODE: "",    // token=固定域名 temp=临时域名，默认 temp
  ARGO_TOKEN: "",   // ARGO_MODE=token 时必填：隧道 Token
  ARGO_DOMAIN: "",  // ARGO_MODE=token 时必填：已绑定的域名
  OPT_DOMAIN: "",   // vless-argo 代理地址（直连CF优选IP）；默认 staticdelivery.nexusmods.com

  // ---- Hysteria2（直连 UDP，可选：只填端口即开启） ----
  HY2_PORT: "",     // 填了端口就启动 hy2（如 "4443"）；留空则关闭；其它参数自动生成
  HY2_PASSWORD: "", // 可选：留空则用 UUID 自动派生；如需固定密码再填
  HY2_OBFS: "",     // 可选：salamander 混淆密码，不用可留空
  HY2_HOST: "",     // 可选：留空则自动获取公网 IPv4；有固定域名/IP 再填

  // ---- VLESS 直连（TCP+TLS，可选：只填端口即开启，与 hy2 处理方式相同） ----
  VLESS_DIRECT_PORT: "",  // 填了端口就启动 vless 直连（如 "4433"）；留空则关闭
  VLESS_DIRECT_HOST: "",  // 可选：留空则自动获取公网 IPv4；有固定域名/IP 再填
  VLESS_DIRECT_SNI: "",   // 直连 sni，默认 www.nvidia.com；自签证书，客户端需跳过证书验证

  // ---- AnyTLS（TCP+TLS，可选：只填端口即开启，与 hy2 处理方式相同） ----
  ANYTLS_PORT: "",     // 填了端口就启动 anytls（如 "444"）；留空则关闭
  ANYTLS_PASSWORD: "", // 可选：留空则用 UUID 自动派生（与 hy2 不同的盐）；如需固定密码再填
  ANYTLS_HOST: "",     // 可选：留空则自动获取公网 IPv4；有固定域名/IP 再填

  // ---- Nezha 探针（SERVER + KEY 配齐才启用） ----
  NEZHA_SERVER: "",  // 面板地址带端口，例如 "dns.example.com:5555"
  NEZHA_KEY: "",     // 客户端密钥
  NEZHA_TLS: "",     // 是否 TLS，默认 1；填 0 关闭
  NEZHA_UUID: "",    // 留空则复用上面的 UUID；如需 agent 自动生成请填 auto
  NEZHA_ALLOW_COMMAND: "",  // 默认 0=禁用远程命令；填 1 才允许

  // ---- Komari 探针（ENDPOINT + TOKEN 配齐才启用） ----
  KOMARI_ENDPOINT: "",  // 面板地址，例如 "https://panel.example.com"
  KOMARI_TOKEN: "",     // agent token
  KOMARI_INTERVAL: "",  // 采集间隔秒，默认 3
  KOMARI_ALLOW_SSH: "", // 默认 0=禁用 web ssh；填 1 才允许

  // ---- CF 探针（URL + SECRET 配齐即启用，NODE_ID 留空则复用 UUID，Node 内置上报） ----
  CF_WORKER_URL: "",  // Worker 地址，例如 "https://probe.example.com"
  CF_SECRET: "",      // 上报密钥（= Worker 的 API_SECRET）
  CF_NODE_ID: "",     // 服务器 ID，留空则复用上面的 UUID
  CF_INTERVAL: "",    // 上报间隔秒，默认 60，最小 10
  CF_PING_CT: "",     // 可选测速节点，host 或 host:port
  CF_PING_CU: "",
  CF_PING_CM: "",
  CF_PING_BGP: "",
  CF_IFACE: "",       // 可选指定网卡，逗号分隔，例如 "eth0"
  CF_CONNECTION_MODE: "",  // auto=优先WSS实时上报+POST兜底 http=仅POST；默认 auto

  // ---- 隐身 ----
  SCRUB: "",  // 填 1 才做二进制 strings 脱敏；默认只改文件名，见下方说明
  QUIET: "",  // 填 1 只显示成功/失败结果日志（warn/error + 关键状态行），日常 info 全关

  // ---- 输出 ----
  KIT_FILE: "",  // 节点信息落盘，例如 "kit.txt"；留空则不写文件；支持绝对/相对路径
  BIN_TTL_SEC: "",  // 本地二进制存活秒数：启动 120s 后删除已加载进内存的二进制文件；0=关闭；默认 120
  NODE_PREFIX: "",  // 节点名称前缀，默认自动识别国家（如 JP）；填 custom 则用 IP 后缀；填其它值则直接用该值

  // ---- 运行期 ----
  BIN_DIR: "",              // 二进制目录，默认 ./.bin；只读环境改 "/tmp/.bin"
  GH_PROXY: "",             // GitHub 代理前缀（无尾斜杠）
  GH_TOKEN: "",             // 可选，提高 GitHub API 限流额度
  SINGBOX_VERSION: "",      // 默认 latest；可 pin 如 "v1.14.1"
  CLOUDFLARED_VERSION: "",  // 默认 latest；可 pin 如 "2026.9.1"
  NEZHA_VERSION: "",        // 默认 latest
  KOMARI_VERSION: "",       // 默认 latest
  LOG_LEVEL: "",            // debug/info/warn/error，默认 warn
};
// ================= 配置区结束，以下为程序代码 =================
import { execFile, spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { connect as tlsConnect } from "node:tls";
import { createSocket } from "node:dgram";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import { createConnection, createServer as createNetServer } from "node:net";
import { arch, cpus, freemem, hostname, platform, totalmem } from "node:os";
import { join } from "node:path";

// ---- src/logger.js ----
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

let level = "warn";
let quiet = false;

function setLogLevel(l) {
  if (LOG_LEVELS[l] !== undefined) level = l;
}

function setQuiet(q) {
  quiet = !!q;
}

function log(l, ...args) {
  if (LOG_LEVELS[l] >= LOG_LEVELS[level]) {
    // QUIET=1：info 全关，只留 warn/error
    if (quiet && l !== "warn" && l !== "error") return;
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${l.toUpperCase()}]`, ...args);
  }
}

const logger = {
  debug: (...a) => log("debug", ...a),
  info: (...a) => log("info", ...a),
  warn: (...a) => log("warn", ...a),
  error: (...a) => log("error", ...a),
};


// ---- src/config.js ----
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(name, def = "") {
  // 优先级：环境变量 > 文件内置 > 默认值
  const v = process.env[name];
  if (v !== undefined && v !== "") return String(v).trim();
  const fromUser = USER_CONFIG[name];
  if (fromUser !== undefined && String(fromUser).trim() !== "") return String(fromUser).trim();
  return def;
}

function int(name, def) {
  // 优先级：环境变量 > 文件内置 > 默认值
  const raw = process.env[name];
  const pick = (raw !== undefined && raw !== "")
    ? String(raw).trim()
    : ((USER_CONFIG[name] !== undefined && String(USER_CONFIG[name]).trim() !== "")
      ? String(USER_CONFIG[name]).trim()
      : undefined);
  if (pick === undefined || pick === "") return def;
  const n = parseInt(pick, 10);
  if (Number.isNaN(n)) throw new Error(`config ${name} must be an integer, got: ${pick}`);
  return n;
}

function bool01(name, def) {
  // 优先级：环境变量 > 文件内置 > 默认值
  const raw = process.env[name];
  const pick = (raw !== undefined && raw !== "")
    ? String(raw).trim()
    : ((USER_CONFIG[name] !== undefined && String(USER_CONFIG[name]).trim() !== "")
      ? String(USER_CONFIG[name]).trim()
      : undefined);
  if (pick === undefined || pick === "") return def;
  const v = String(pick).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  throw new Error(`config ${name} must be 0/1, got: ${pick}`);
}

function normalizeWsPath(p) {
  if (!p.startsWith("/")) p = "/" + p;
  return p.replace(/\/+$/, "") || "/";
}

function loadConfig() {
  const cfg = {
    port: int("PORT", 3000),
    uuid: str("UUID", ""),
    wsPath: normalizeWsPath(str("WS_PATH", "/argo")),
    vlessPort: int("VLESS_PORT", 18000),

    argoMode: str("ARGO_MODE", "temp").toLowerCase(),
    argoToken: str("ARGO_TOKEN", ""),
    argoDomain: str("ARGO_DOMAIN", ""),
    optDomain: str("OPT_DOMAIN", "staticdelivery.nexusmods.com"),

    hy2PortRaw: str("HY2_PORT", ""),
    hy2Password: str("HY2_PASSWORD", ""),
    hy2Obfs: str("HY2_OBFS", ""),
    hy2Host: str("HY2_HOST", ""),

    vlessDirectPortRaw: str("VLESS_DIRECT_PORT", ""),
    vlessDirectHost: str("VLESS_DIRECT_HOST", ""),
    vlessDirectSni: str("VLESS_DIRECT_SNI", "www.nvidia.com"),

    anytlsPortRaw: str("ANYTLS_PORT", ""),
    anytlsPassword: str("ANYTLS_PASSWORD", ""),
    anytlsHost: str("ANYTLS_HOST", ""),

    binDir: str("BIN_DIR", "./.bin"),
    ghProxy: str("GH_PROXY", "").replace(/\/+$/, ""),
    ghToken: str("GH_TOKEN", ""),
    singboxVersion: str("SINGBOX_VERSION", "latest"),
    cloudflaredVersion: str("CLOUDFLARED_VERSION", "latest"),
    nezhaVersion: str("NEZHA_VERSION", "latest"),
    komariVersion: str("KOMARI_VERSION", "latest"),
    logLevel: str("LOG_LEVEL", "warn").toLowerCase(),

    // --- nezha (enabled only when SERVER + KEY both present) ---
    nezhaServer: str("NEZHA_SERVER", ""),
    nezhaKey: str("NEZHA_KEY", ""),
    nezhaTls: bool01("NEZHA_TLS", true),
    nezhaUuid: str("NEZHA_UUID", ""),
    nezhaAllowCommand: bool01("NEZHA_ALLOW_COMMAND", false),

    // --- komari (enabled only when ENDPOINT + TOKEN both present) ---
    komariEndpoint: str("KOMARI_ENDPOINT", "").replace(/\/+$/, ""),
    komariToken: str("KOMARI_TOKEN", ""),
    komariInterval: int("KOMARI_INTERVAL", 3),
    komariAllowSsh: bool01("KOMARI_ALLOW_SSH", false),

    // --- cf probe, node built-in (URL + SECRET 配齐即启用，NODE_ID 留空复用 UUID) ---
    cfWorkerUrl: str("CF_WORKER_URL", "").replace(/\/+$/, ""),
    cfSecret: str("CF_SECRET", ""),
    cfNodeId: str("CF_NODE_ID", ""),
    cfInterval: int("CF_INTERVAL", 60),
    cfPingCt: str("CF_PING_CT", ""),
    cfPingCu: str("CF_PING_CU", ""),
    cfPingCm: str("CF_PING_CM", ""),
    cfPingBgp: str("CF_PING_BGP", ""),
    cfIface: str("CF_IFACE", ""),
    cfConnectionMode: str("CF_CONNECTION_MODE", "auto").toLowerCase(),

    // --- kit.txt 落盘 ---
    kitFile: str("KIT_FILE", ""),
    binTtlSec: int("BIN_TTL_SEC", 120),
    nodePrefix: str("NODE_PREFIX", ""),

    // --- strings 脱敏（默认关；文件名改名常开） ---
    scrub: bool01("SCRUB", false),

    // --- quiet：只显示成功/失败结果日志 ---
    quiet: bool01("QUIET", false),
  };

  cfg.nezhaEnabled = cfg.nezhaServer !== "" && cfg.nezhaKey !== "";
  cfg.komariEnabled = cfg.komariEndpoint !== "" && cfg.komariToken !== "";
  // UUID 复用：探针 ID 默认用主 UUID，省得填三遍。
  // NEZHA_UUID=auto 时显式留空，让 agent 自己生成；CF_NODE_ID 留空则用主 UUID。
  if (cfg.nezhaUuid === "" || cfg.nezhaUuid.toLowerCase() === "auto") {
    cfg.nezhaUuidAuto = cfg.nezhaUuid.toLowerCase() === "auto";
    cfg.nezhaUuid = cfg.nezhaUuidAuto ? "" : cfg.uuid;
  }
  if (cfg.cfNodeId === "") cfg.cfNodeId = cfg.uuid;
  cfg.cfEnabled =
    cfg.cfWorkerUrl !== "" && cfg.cfSecret !== "" && cfg.cfNodeId !== "";
  if (!["auto", "http"].includes(cfg.cfConnectionMode)) {
    warnings.push(`CF_CONNECTION_MODE unknown (${cfg.cfConnectionMode}), using auto`);
    cfg.cfConnectionMode = "auto";
  }

  const warnings = [];
  if (!cfg.nezhaEnabled && (cfg.nezhaServer || cfg.nezhaKey)) {
    warnings.push("NEZHA_SERVER/NEZHA_KEY incomplete, nezha disabled");
  }
  if (!cfg.komariEnabled && (cfg.komariEndpoint || cfg.komariToken)) {
    warnings.push("KOMARI_ENDPOINT/KOMARI_TOKEN incomplete, komari disabled");
  }
  if (!cfg.cfEnabled && (cfg.cfWorkerUrl || cfg.cfSecret || str("CF_NODE_ID", ""))) {
    warnings.push("CF_WORKER_URL/CF_SECRET incomplete, cf probe disabled");
  }
  cfg.warnings = warnings;

  setLogLevel(LOG_LEVEL_OK(cfg.logLevel) ? cfg.logLevel : "warn");

  const errors = [];

  if (!cfg.uuid) {
    errors.push("UUID is required");
  } else if (!UUID_RE.test(cfg.uuid)) {
    errors.push(`UUID format invalid: ${cfg.uuid}`);
  }

  if (!["token", "temp"].includes(cfg.argoMode)) {
    errors.push(`ARGO_MODE must be token|temp, got: ${cfg.argoMode}`);
  }
  if (cfg.argoMode === "token") {
    if (!cfg.argoToken) errors.push("ARGO_MODE=token requires ARGO_TOKEN");
    if (!cfg.argoDomain) errors.push("ARGO_MODE=token requires ARGO_DOMAIN");
  }

  if (!Number.isInteger(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    errors.push(`PORT must be 1-65535, got: ${cfg.port}`);
  }
  if (!Number.isInteger(cfg.vlessPort) || cfg.vlessPort < 1 || cfg.vlessPort > 65535) {
    errors.push(`VLESS_PORT must be 1-65535, got: ${cfg.vlessPort}`);
  }
  // HY2/VLESS直连/AnyTLS：只填 PORT 即开启；密码留空用 UUID 派生（各协议盐不同）；
  // HOST 留空启动后自动获取公网 IP。端口非法只警告降级，不断线。
  // 兼容旧变量：HY2_ENABLED=1 且 HY2_PORT 为空时视为开启（端口 4443）。
  function derivePw(salt) {
    // 纯 JS hash（无 crypto 依赖，config 段可独立求值）：cyrb53 取 16 hex。
    // 同一 UUID 重启后密码不变，kit.txt 链接长期有效。
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    const s = `${salt}:${cfg.uuid}`;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0")).slice(0, 16);
  }
  function portOn(raw, label) {
    const env = (raw || "").trim();
    if (env === "") return { on: false, port: 0 };
    const parsed = parseInt(env, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      warnings.push(`${label} invalid (${env}), disabled`);
      return { on: false, port: 0 };
    }
    return { on: true, port: parsed };
  }
  const hy2PortEnv = (cfg.hy2PortRaw || "").trim();
  const hy2LegacyOn = bool01("HY2_ENABLED", false);
  if (hy2PortEnv !== "" || hy2LegacyOn) {
    const r = portOn(hy2PortEnv || "4443", "HY2_PORT");
    cfg.hy2Enabled = r.on;
    cfg.hy2Port = r.on ? r.port : 4443;
  } else {
    cfg.hy2Enabled = false;
    cfg.hy2Port = 4443;
  }
  delete cfg.hy2PortRaw;
  if (!cfg.hy2Password) {
    cfg.hy2Password = derivePw("hy2");
    cfg.hy2PasswordAuto = true;
  }
  // VLESS 直连
  {
    const r = portOn((cfg.vlessDirectPortRaw || "").trim(), "VLESS_DIRECT_PORT");
    cfg.vlessDirectEnabled = r.on;
    cfg.vlessDirectPort = r.port;
  }
  delete cfg.vlessDirectPortRaw;
  // AnyTLS
  {
    const r = portOn((cfg.anytlsPortRaw || "").trim(), "ANYTLS_PORT");
    cfg.anytlsEnabled = r.on;
    cfg.anytlsPort = r.port;
  }
  delete cfg.anytlsPortRaw;
  if (!cfg.anytlsPassword) {
    cfg.anytlsPassword = derivePw("anytls");
    cfg.anytlsPasswordAuto = true;
  }
  if (cfg.komariEnabled) {
    if (!/^https?:\/\//.test(cfg.komariEndpoint)) {
      errors.push(`KOMARI_ENDPOINT must start with http(s)://, got: ${cfg.komariEndpoint}`);
    }
    if (!Number.isInteger(cfg.komariInterval) || cfg.komariInterval < 1) {
      errors.push(`KOMARI_INTERVAL must be >= 1, got: ${cfg.komariInterval}`);
    }
  }
  if (cfg.cfEnabled) {
    if (!/^https?:\/\//.test(cfg.cfWorkerUrl)) {
      errors.push(`CF_WORKER_URL must start with http(s)://, got: ${cfg.cfWorkerUrl}`);
    }
    if (!Number.isInteger(cfg.cfInterval) || cfg.cfInterval < 10) {
      errors.push(`CF_INTERVAL must be >= 10, got: ${cfg.cfInterval}`);
    }
  }

  if (errors.length > 0) {
    const err = new Error("Invalid config:\n- " + errors.join("\n- "));
    err.code = "ECONFIG";
    throw err;
  }

  logger.debug("config loaded", redact(cfg));
  for (const w of warnings) logger.warn(w);
  return cfg;
}

function LOG_LEVEL_OK(l) {
  return ["debug", "info", "warn", "error"].includes(l);
}

function redact(cfg) {
  const out = { ...cfg };
  if (out.argoToken) out.argoToken = "***";
  if (out.uuid) out.uuid = out.uuid.slice(0, 8) + "-****";
  if (out.hy2Password) out.hy2Password = "***";
  if (out.hy2Obfs) out.hy2Obfs = "***";
  if (out.anytlsPassword) out.anytlsPassword = "***";
  if (out.nezhaKey) out.nezhaKey = "***";
  if (out.komariToken) out.komariToken = "***";
  if (out.cfSecret) out.cfSecret = "***";
  if (out.ghToken) out.ghToken = "***";
  return out;
}


// ---- src/downloader.js ----
const FALLBACK = {
  singbox: "v1.14.1",
  cloudflared: "2026.9.1",
  nezha: "v2.3.5",
  komari: "1.5.11",
};

/** Map node arch to the naming used by nezha/komari assets. */
function goArch() {
  const a = detectArch(); // amd64 | arm64
  return a;
}

function detectArch() {
  const a = process.arch;
  if (a === "x64") return "amd64";
  if (a === "arm64") return "arm64";
  throw new Error(`unsupported arch: ${a} (only amd64/arm64)`);
}

function isAlpine() {
  return spawnSync("sh", ["-c", "test -f /etc/alpine-release"], { stdio: "ignore" }).status === 0;
}

function withProxy(url, ghProxy) {
  if (ghProxy) return `${ghProxy}/${url}`;
  return url;
}

async function resolveTag(repo, pinned, fallback, ghToken = "") {
  if (pinned && pinned !== "latest") return pinned;
  try {
    const headers = { "User-Agent": "argo-kit", Accept: "application/vnd.github+json" };
    if (ghToken) headers.Authorization = `Bearer ${ghToken}`;
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`github api ${res.status}`);
    const data = await res.json();
    if (!data.tag_name) throw new Error("no tag_name");
    logger.info(`resolved latest ${repo}: ${data.tag_name}`);
    return data.tag_name;
  } catch (e) {
    logger.warn(`resolve latest ${repo} failed (${e.message}), use fallback ${fallback}`);
    return fallback;
  }
}

function have(cmd) {
  return spawnSync("sh", ["-c", `command -v ${cmd} >/dev/null 2>&1`], { stdio: "ignore" }).status === 0;
}

/** 临时目录：TMPDIR > BIN_DIR/tmp（避开小 /tmp） */
async function workTmpDir(cfg) {
  const base = (process.env.TMPDIR && process.env.TMPDIR.trim())
    ? process.env.TMPDIR.trim()
    : join(cfg.binDir, "tmp");
  await fs.mkdir(base, { recursive: true });
  return base;
}

/** 二进制中性名：sing-box→sb-core, cloudflared→edge-tunnel, nezha→sys-monitor, komari→node-monitor */
const BIN_NAMES = {
  singbox: "sb-core",
  cloudflared: "edge-tunnel",
  nezha: "sys-monitor",
  komari: "node-monitor",
};
function binPath(cfg, key) {
  return join(cfg.binDir, BIN_NAMES[key]);
}

/** strings 脱敏（SCRUB=1）：等长替换短裸词，失败只告警。无法完整隐身。 */
const SCRUB_RULES = {
  singbox: [[Buffer.from("sing-box"), Buffer.from("sb-core_")]],
  cloudflared: [[Buffer.from("cloudflared"), Buffer.from("edge-tunnel")]],
  nezha: [[Buffer.from("nezha"), Buffer.from("watch")], [Buffer.from("Nezha"), Buffer.from("Watch")]],
  komari: [[Buffer.from("komari"), Buffer.from("nodexy")], [Buffer.from("Komari"), Buffer.from("Nodexy")]],
};

async function scrubBinaryStrings(cfg, file, key) {
  if (!cfg.scrub) return; // 默认只改文件名；SCRUB=1 才碰二进制内容
  const rules = SCRUB_RULES[key];
  if (!rules) return;
  try {
    const data = await fs.readFile(file);
    let total = 0;
    for (const [old, nw] of rules) {
      if (old.length !== nw.length) continue;
      let n = 0;
      let i = data.indexOf(old);
      while (i !== -1) { nw.copy(data, i); n++; i = data.indexOf(old, i + 1); }
      total += n;
    }
    if (total > 0) {
      await fs.writeFile(file, data);
      await fs.chmod(file, 0o755);
    }
    logger.info(`scrubbed ${total} strings: ${file}`);
  } catch (e) {
    logger.warn(`scrub skipped (${file}): ${e.message}`);
  }
}

// 本次启动新下载的二进制注册表（TTL 删除只删这些，不碰复用的旧文件）
const __freshBins = [];
function markFreshBinary(p) {
  if (p && !__freshBins.includes(p)) __freshBins.push(p);
}

/**
 * 本地二进制 TTL 清理：启动 binTtlSec 秒后，删除本次下载的二进制文件。
 * 原理：子进程已通过 spawn 加载进内存（Linux 执行中的 ETXTBSY 文件 unlink 后进程不受影响，
 * 新 spawn 会失败——所以只删"本次下载"的，复用旧文件的因为重启会重新下载而不删；
 * 且 Runner 30 次重启上限内进程早已常驻）。0=关闭。失败只告警。
 */
function scheduleBinaryTtl(cfg, runner) {
  const ttl = cfg.binTtlSec;
  if (!ttl || ttl <= 0) return;
  if (!__freshBins.length) {
    logger.debug("binary ttl: nothing freshly downloaded, skipping");
    return;
  }
  logger.info(`binary ttl: will remove ${__freshBins.length} fresh binaries in ${ttl}s`);
  const t = setTimeout(async () => {
    for (const f of [...__freshBins]) {
      try {
        await fs.rm(f, { force: true });
        logger.warn(`[OK] binary ttl removed: ${f}`);
      } catch (e) {
        logger.warn(`binary ttl remove failed (${f}): ${e.message}`);
      }
    }
    __freshBins.length = 0;
  }, ttl * 1000);
  if (t.unref) t.unref();
}

async function downloadFile(url, dest, opts = {}) {
  const minSize = opts.minSize || 0;
  await fs.mkdir(join(dest, "..").replace(/\/[^/]+$/, "") || ".", { recursive: true }).catch(() => {});
  // 清掉上次失败的残留，避免断点续传式的半截文件被当成完整包
  await fs.rm(dest, { force: true }).catch(() => {});
  if (have("curl")) {
    const r = spawnSync("curl", ["-fsSL", "--retry", "3", "--max-time", "300", "-o", dest, url], { stdio: "inherit" });
    if (r.status !== 0) throw new Error(`curl download failed: ${url}`);
  } else if (have("wget")) {
    const r = spawnSync("wget", ["-O", dest, url], { stdio: "inherit" });
    if (r.status !== 0) throw new Error(`wget download failed: ${url}`);
  } else {
    // pure-node fallback
    logger.warn("no curl/wget, using node fetch fallback");
    const res = await fetch(url, { headers: { "User-Agent": "argo-kit" } });
    if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
  }
  if (minSize > 0) {
    const st = await fs.stat(dest).catch(() => null);
    const size = st ? st.size : 0;
    if (size < minSize) {
      await fs.rm(dest, { force: true }).catch(() => {});
      throw new Error(`download incomplete: ${url} got ${size} bytes, expect >= ${minSize}`);
    }
  }
}

async function ensureSingBox(cfg) {
  const arch = detectArch();
  const dest = binPath(cfg, "singbox");
  if (await exists(dest)) {
    logger.info(`sb-core exists: ${dest}`);
    return dest;
  }
  const tag = await resolveTag("SagerNet/sing-box", cfg.singboxVersion, FALLBACK.singbox, cfg.ghToken);
  const ver = tag.replace(/^v/, "");
  const libc = isAlpine() ? "musl" : "";
  // asset layout: sing-box-{ver}-linux-{arch}[-musl].tar.gz
  const asset = libc
    ? `sing-box-${ver}-linux-${arch}-${libc}.tar.gz`
    : `sing-box-${ver}-linux-${arch}.tar.gz`;
  const url = withProxy(
    `https://github.com/SagerNet/sing-box/releases/download/v${ver}/${asset}`,
    cfg.ghProxy
  );
  logger.info(`downloading sing-box ${tag} (${arch}${libc ? "/" + libc : ""})`);
  const workDir = await workTmpDir(cfg);
  const tmp = join(workDir, asset);
  await downloadFile(url, tmp, { minSize: 1024 * 1024 });
  const outDir = join(workDir, `singbox-${ver}-${arch}`);
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const r = spawnSync("tar", ["-xzf", tmp, "-C", outDir], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("extract sing-box failed (tar required)");
  // find binary
  const found = await findFile(outDir, "sing-box");
  if (!found) throw new Error("sing-box binary not found in archive");
  await fs.mkdir(cfg.binDir, { recursive: true });
  await fs.copyFile(found, dest);
  await fs.chmod(dest, 0o755);
  await fs.rm(tmp, { force: true }).catch(() => {});
  await fs.rm(outDir, { recursive: true, force: true }).catch(() => {});
  await scrubBinaryStrings(cfg, dest, "singbox");
  markFreshBinary(dest);
  logger.info(`sb-core ready: ${dest}`);
  return dest;
}

async function ensureCloudflared(cfg) {
  const arch = detectArch();
  const dest = binPath(cfg, "cloudflared");
  if (await exists(dest)) {
    logger.info(`edge-tunnel exists: ${dest}`);
    return dest;
  }
  const tag = await resolveTag("cloudflare/cloudflared", cfg.cloudflaredVersion, FALLBACK.cloudflared, cfg.ghToken);
  // asset layout: cloudflared-linux-{amd64,arm64} (plain binary, no version in name)
  const asset = `cloudflared-linux-${arch}`;
  const url = withProxy(
    `https://github.com/cloudflare/cloudflared/releases/download/${tag}/${asset}`,
    cfg.ghProxy
  );
  logger.info(`downloading cloudflared ${tag} (${arch})`);
  const workDir = await workTmpDir(cfg);
  const tmp = join(workDir, `${asset}-${Date.now()}`);
  await downloadFile(url, tmp, { minSize: 1024 * 1024 });
  await fs.mkdir(cfg.binDir, { recursive: true });
  await fs.copyFile(tmp, dest);
  await fs.chmod(dest, 0o755);
  await fs.rm(tmp, { force: true }).catch(() => {});
  await scrubBinaryStrings(cfg, dest, "cloudflared");
  markFreshBinary(dest);
  logger.info(`edge-tunnel ready: ${dest}`);
  return dest;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findFile(dir, name) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isFile() && e.name === name) return p;
    if (e.isDirectory()) {
      const f = await findFile(p, name);
      if (f) return f;
    }
  }
  return null;
}

/** Exposed for tests: build asset URLs without network. */
function singBoxAssetUrl(ver, arch, libc, ghProxy) {
  const asset = libc ? `sing-box-${ver}-linux-${arch}-${libc}.tar.gz` : `sing-box-${ver}-linux-${arch}.tar.gz`;
  return withProxy(`https://github.com/SagerNet/sing-box/releases/download/v${ver}/${asset}`, ghProxy);
}

function cloudflaredAssetUrl(tag, arch, ghProxy) {
  return withProxy(`https://github.com/cloudflare/cloudflared/releases/download/${tag}/cloudflared-linux-${arch}`, ghProxy);
}

function nezhaAssetUrl(tag, arch, ghProxy) {
  return withProxy(`https://github.com/nezhahq/agent/releases/download/${tag}/nezha-agent_linux_${arch}.zip`, ghProxy);
}

function komariAssetUrl(tag, arch, ghProxy) {
  return withProxy(`https://github.com/komari-monitor/komari-agent/releases/download/${tag}/komari-agent-linux-${arch}`, ghProxy);
}

async function downloadBinary(cfg, url, dest) {
  const workDir = await workTmpDir(cfg);
  const tmp = join(workDir, `dl-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
  await downloadFile(url, tmp, { minSize: 1024 * 1024 });
  const dir = join(dest, "..");
  await fs.mkdir(dir, { recursive: true });
  await fs.copyFile(tmp, dest);
  await fs.chmod(dest, 0o755);
  await fs.rm(tmp, { force: true }).catch(() => {});
}

/** nezha-agent ships as a zip containing one `nezha-agent` binary. */
async function ensureNezha(cfg) {
  const arch = goArch();
  const dest = binPath(cfg, "nezha");
  if (await exists(dest)) {
    logger.info(`sys-monitor exists: ${dest}`);
    return dest;
  }
  const tag = await resolveTag("nezhahq/agent", cfg.nezhaVersion, FALLBACK.nezha, cfg.ghToken);
  const url = nezhaAssetUrl(tag, arch, cfg.ghProxy);
  logger.info(`downloading nezha-agent ${tag} (${arch})`);
  const zipTmp = join(await workTmpDir(cfg), `nezha-agent_linux_${arch}.zip`);
  await downloadFile(url, zipTmp, { minSize: 1024 * 1024 });
  const outDir = join(await workTmpDir(cfg), `nezha-${tag}-${arch}-${Date.now()}`);
  await fs.mkdir(outDir, { recursive: true });
  if (have("unzip")) {
    const r = spawnSync("unzip", ["-o", "-j", zipTmp, "-d", outDir], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("extract nezha-agent failed");
  } else {
    // node >= 20: no built-in unzip; busybox/alpine images may lack unzip
    throw new Error("unzip is required to extract nezha-agent (apk add unzip)");
  }
  const found = await findFile(outDir, "nezha-agent");
  if (!found) throw new Error("nezha-agent binary not found in archive");
  await fs.mkdir(cfg.binDir, { recursive: true });
  await fs.copyFile(found, dest);
  await fs.chmod(dest, 0o755);
  await fs.rm(zipTmp, { force: true }).catch(() => {});
  await fs.rm(outDir, { recursive: true, force: true }).catch(() => {});
  await scrubBinaryStrings(cfg, dest, "nezha");
  markFreshBinary(dest);
  logger.info(`sys-monitor ready: ${dest}`);
  return dest;
}

/** komari-agent ships as a plain binary (no archive). */
async function ensureKomari(cfg) {
  const arch = goArch();
  const dest = binPath(cfg, "komari");
  if (await exists(dest)) {
    logger.info(`node-monitor exists: ${dest}`);
    return dest;
  }
  const tag = await resolveTag("komari-monitor/komari-agent", cfg.komariVersion, FALLBACK.komari, cfg.ghToken);
  const url = komariAssetUrl(tag, arch, cfg.ghProxy);
  logger.info(`downloading komari-agent ${tag} (${arch})`);
  await downloadBinary(cfg, url, dest);
  await scrubBinaryStrings(cfg, dest, "komari");
  markFreshBinary(dest);
  logger.info(`node-monitor ready: ${dest}`);
  return dest;
}


// ---- src/cert.js ----
function haveOpenssl() {
  try {
    const r = spawnSync("openssl", ["version"], { stdio: "ignore" });
    return r.status === 0;
  } catch {
    return false;
  }
}

/**
 * Ensure a self-signed cert for hysteria2.
 * Returns { certPath, keyPath } or null when openssl is unavailable.
 * Cert is reused if both files already exist.
 */
async function ensureSelfSignedCert(cfg) {
  const certPath = join(cfg.binDir, ".run", "cert.pem");
  const keyPath = join(cfg.binDir, ".run", "key.pem");
  try {
    await fs.access(certPath);
    await fs.access(keyPath);
    logger.info(`hy2 cert reused: ${certPath}`);
    return { certPath, keyPath };
  } catch {
    // need to generate
  }
  if (!haveOpenssl()) {
    logger.warn("openssl not found, hysteria2 disabled (self-signed cert unavailable)");
    return null;
  }
  await fs.mkdir(join(cfg.binDir, ".run"), { recursive: true });
  const cn = cfg.hy2Host || "hy2";
  const r = spawnSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes",
      "-keyout", keyPath,
      "-out", certPath,
      "-days", "3650",
      "-subj", `/CN=${cn}`,
    ],
    { stdio: "inherit" }
  );
  if (r.status !== 0) {
    logger.warn("openssl cert generation failed, hysteria2 disabled");
    return null;
  }
  logger.info(`hy2 self-signed cert generated: ${certPath}`);
  return { certPath, keyPath };
}


// ---- src/netprobe.js ----
/**
 * Probe whether UDP bind on the hy2 port works.
 * PaaS without UDP support -> disable hy2 gracefully.
 */
function probeUdp(port) {
  return new Promise((resolve) => {
    let finished = false;
    const done = (ok, reason) => {
      if (finished) return;
      finished = true;
      try {
        sock.close();
      } catch {}
      resolve({ ok, reason });
    };
    const sock = createSocket("udp4");
    sock.on("error", (e) => {
      done(false, e.message);
    });
    try {
      sock.bind(port, "0.0.0.0", () => done(true, ""));
    } catch (e) {
      done(false, e.message);
    }
    setTimeout(() => done(false, "timeout"), 5000).unref();
  });
}

/** 探测 TCP 端口是否可 bind（直连协议降级用，失败只警告） */
function probeTcp(port) {
  return new Promise((resolve) => {
    let finished = false;
    const done = (ok, reason) => {
      if (finished) return;
      finished = true;
      try {
        server.close();
      } catch {}
      resolve({ ok, reason });
    };
    const server = createNetServer();
    server.on("error", (e) => done(false, e.message));
    try {
      server.listen(port, "0.0.0.0", () => done(true, ""));
    } catch (e) {
      done(false, e.message);
    }
    setTimeout(() => done(false, "timeout"), 5000).unref();
  });
}


// ---- src/singbox.js ----
/**
 * Minimal sing-box config: vless+ws always, hysteria2/vless-direct/anytls optional.
 * @param {object} cfg loaded config
 * @param {object|null} tls { certPath, keyPath } or null (shared by hy2/vless-direct/anytls)
 */
function buildSingBoxConfig(cfg, tls = null) {
  const inbounds = [
    {
      type: "vless",
      tag: "vless-argo",
      listen: "127.0.0.1",
      listen_port: cfg.vlessPort,
      users: [{ uuid: cfg.uuid, flow: "" }],
      transport: {
        type: "ws",
        path: cfg.wsPath,
        max_early_data: 0,
        early_data_header_name: "",
      },
    },
  ];

  if (cfg.hy2Enabled && tls) {
    const hy2Inbound = {
      type: "hysteria2",
      tag: "hy2",
      listen: "0.0.0.0",
      listen_port: cfg.hy2Port,
      users: [{ password: cfg.hy2Password }],
      tls: {
        enabled: true,
        certificate_path: tls.certPath,
        key_path: tls.keyPath,
      },
    };
    if (cfg.hy2Obfs) {
      hy2Inbound.obfs = { type: "salamander", password: cfg.hy2Obfs };
    }
    inbounds.push(hy2Inbound);
  }

  if (cfg.vlessDirectEnabled && tls) {
    inbounds.push({
      type: "vless",
      tag: "vless-direct",
      listen: "0.0.0.0",
      listen_port: cfg.vlessDirectPort,
      users: [{ uuid: cfg.uuid, flow: "xtls-rprx-vision" }],
      tls: {
        enabled: true,
        server_name: cfg.vlessDirectSni || "www.nvidia.com",
        certificate_path: tls.certPath,
        key_path: tls.keyPath,
      },
    });
  }

  if (cfg.anytlsEnabled && tls) {
    inbounds.push({
      type: "anytls",
      tag: "anytls",
      listen: "0.0.0.0",
      listen_port: cfg.anytlsPort,
      users: [{ password: cfg.anytlsPassword }],
      tls: {
        enabled: true,
        // 固定 SNI，与客户端链接一致；自签证书客户端需跳过验证
        server_name: "direct",
        certificate_path: tls.certPath,
        key_path: tls.keyPath,
      },
    });
  }

  return {
    log: { level: cfg.logLevel === "debug" ? "debug" : cfg.logLevel === "warn" ? "warn" : "info" },
    inbounds,
    outbounds: [{ type: "direct", tag: "direct" }],
  };
}

/**
 * @param {object} cfg loaded config
 * @param {string} dir output dir (legacy, ignored: always BIN_DIR/.run/sb.json)
 * @param {object|null} tls cert paths or null (shared by hy2/vless-direct/anytls)
 */
async function writeSingBoxConfig(cfg, dir = ".", tls = null) {
  const obj = buildSingBoxConfig(cfg, tls);
  await fs.mkdir(join(cfg.binDir, ".run"), { recursive: true });
  const path = join(cfg.binDir, ".run", "sb.json");
  await fs.writeFile(path, JSON.stringify(obj, null, 2));
  const tags = obj.inbounds.map((i) => i.tag).join(",");
  logger.info(`sing-box.json written: ${path} (inbounds: ${tags})`);
  return path;
}


// ---- src/tunnel.js ----
/** Build cloudflared tunnel args for token / temp mode. */
function buildTunnelArgs(cfg, binPath) {
  const target = `http://127.0.0.1:${cfg.vlessPort}`;
  if (cfg.argoMode === "token") {
    return {
      bin: binPath,
      args: ["tunnel", "--no-autoupdate", "run", "--token", cfg.argoToken],
      domain: cfg.argoDomain,
    };
  }
  return {
    bin: binPath,
    args: ["tunnel", "--no-autoupdate", "--url", target, "--no-tls-verify"],
    domain: null, // parsed from log: https://xxx.trycloudflare.com
  };
}

/** Extract https://xxx.trycloudflare.com from cloudflared log line. */
function parseTempDomain(line) {
  const m = String(line).match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  return m ? m[0] : null;
}

function watchTunnelOutput(child, onDomain) {
  let found = null;
  const scan = (data) => {
    const text = String(data);
    logger.debug(`[cloudflared] ${text.trim()}`);
    if (!found) {
      const d = parseTempDomain(text);
      if (d) {
        found = d;
        logger.info(`argo temp domain: ${d}`);
        onDomain && onDomain(d);
      }
    }
  };
  child.stdout && child.stdout.on("data", scan);
  child.stderr && child.stderr.on("data", scan);
  return () => found;
}


// ---- src/monitors.js ----
/**
 * Build nezha-agent config.yaml.
 * Schema per nezhahq/agent model/config.go AgentConfig.
 * Security defaults: disable_command_execute=true unless NEZHA_ALLOW_COMMAND=1.
 */
function buildNezhaYaml(cfg) {
  const lines = [
    `server: ${cfg.nezhaServer}`,
    `client_secret: ${cfg.nezhaKey}`,
    `tls: ${cfg.nezhaTls ? "true" : "false"}`,
    `disable_command_execute: ${cfg.nezhaAllowCommand ? "false" : "true"}`,
    `disable_auto_update: true`,
    `disable_force_update: true`,
    `report_delay: 3`,
  ];
  if (cfg.nezhaUuid) lines.push(`uuid: ${cfg.nezhaUuid}`);
  return lines.join("\n") + "\n";
}

async function writeNezhaYaml(cfg) {
  const path = join(cfg.binDir, ".run", "nz.yaml");
  await fs.mkdir(join(cfg.binDir, ".run"), { recursive: true });
  await fs.writeFile(path, buildNezhaYaml(cfg), { mode: 0o600 });
  await fs.chmod(path, 0o600);
  logger.info(`nezha config written: ${path}`);
  return path;
}

/** nezha-agent run args: binary -c config.yaml (foreground). */
function nezhaArgs(yamlPath) {
  return ["-c", yamlPath];
}

/**
 * Build komari-agent argv.
 * Security defaults: --disable-auto-update --disable-web-ssh unless KOMARI_ALLOW_SSH=1.
 */
function komariArgs(cfg) {
  const args = [
    "--endpoint", cfg.komariEndpoint,
    "--token", cfg.komariToken,
    "--interval", String(cfg.komariInterval),
    "--reconnect-interval", "5",
    "--disable-auto-update",
  ];
  if (!cfg.komariAllowSsh) args.push("--disable-web-ssh");
  return args;
}

/** 公网 IPv4（多源兜底，只取 v4） */
async function detectPublicIp() {
  const cands = [
    "https://www.cloudflare.com/cdn-cgi/trace",
    "https://api.ipify.org",
    "https://ifconfig.me/ip",
  ];
  for (const u of cands) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = (await res.text()).trim();
      if (u.includes("cdn-cgi")) {
        const m = text.match(/^ip=(.+)$/m);
        if (m && isIpv4(m[1].trim())) return m[1].trim();
      } else if (isIpv4(text.split(/\s+/)[0])) {
        return text.split(/\s+/)[0];
      }
    } catch {}
  }
  return "";
}

async function detectCountry() {
  // 首选 CF trace 的 loc=（无额外请求，main 流程里已顺手拿到则复用，这里独立再取一次也便宜）
  try {
    const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const m = (await res.text()).match(/^loc=([A-Z]{2})$/m);
      if (m) return m[1];
    }
  } catch {}
  // 兜底 ip-api（http 明文，45次/分钟限额，失败即放弃）
  try {
    const res = await fetch("http://ip-api.com/line/?fields=countryCode", { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const cc = (await res.text()).trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(cc)) return cc;
    }
  } catch {}
  return "";
}

/**
 * 节点名称前缀：默认国家码（JP/HK/US…），未知国家回退 IP 末段。
 * NODE_PREFIX=custom 强制用 IP 后缀；填其它非空值直接用该值。
 */
function nodePrefixFor(cfg, cc, ip) {
  const manual = (cfg.nodePrefix || "").trim();
  if (manual && manual.toLowerCase() !== "custom") return manual;
  if (manual.toLowerCase() === "custom") return ipTail(ip);
  if (cc) return cc;
  return ipTail(ip) || "NODE";
}

function ipTail(ip) {
  if (!ip) return "";
  if (ip.includes(".")) return ip.split(".").slice(-1)[0];
  return ip.replace(/:/g, "").slice(-4).toUpperCase() || "";
}

function isIpv4(s) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return false;
  return s.split(".").every((n) => Number(n) >= 0 && Number(n) <= 255);
}


// ---- src/collectors.js ----
/**
 * Lightweight collectors for the built-in CF probe.
 * Only stdlib, no native deps. Linux-first, degrades elsewhere.
 */

let lastCpu = null;

async function cpuPercent() {
  const list = cpus();
  let idle = 0;
  let total = 0;
  for (const c of list) {
    const t = c.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  const now = { idle, total };
  if (!lastCpu) {
    lastCpu = now;
    return 0;
  }
  const idleD = now.idle - lastCpu.idle;
  const totalD = now.total - lastCpu.total;
  lastCpu = now;
  if (totalD <= 0) return 0;
  return Math.max(0, Math.min(100, ((totalD - idleD) / totalD) * 100));
}

function memInfo() {
  const total = Math.floor(totalmem() / 1024 / 1024);
  const free = Math.floor(freemem() / 1024 / 1024);
  return { total, used: Math.max(0, total - free) };
}

async function readText(path) {
  try {
    return await fs.readFile(path, "utf8");
  } catch {
    return "";
  }
}

function pickIfaces(text, only) {
  // /proc/net/dev lines: "  eth0: rx ... tx ..."
  const rows = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([^:\s]+):\s*(.*)$/);
    if (!m) continue;
    const name = m[1];
    if (name === "lo") continue;
    if (only && only.length > 0 && !only.includes(name)) continue;
    const nums = m[2].trim().split(/\s+/).map(Number);
    if (nums.length < 16) continue;
    rows.push({ name, rx: nums[0], tx: nums[8] });
  }
  return rows;
}

async function netCounters(iface) {
  if (platform() !== "linux") return { rx: 0, tx: 0 };
  const text = await readText("/proc/net/dev");
  const only = iface ? iface.split(",").map((s) => s.trim()).filter(Boolean) : [];
  let rx = 0;
  let tx = 0;
  for (const r of pickIfaces(text, only)) {
    rx += r.rx;
    tx += r.tx;
  }
  return { rx, tx };
}

async function diskInfo() {
  if (platform() !== "linux") return { total: 0, used: 0 };
  const df = await runDf();
  if (df) return df;
  return { total: 0, used: 0 };
}

function runDf() {
  return new Promise((resolve) => {
    // busybox df (alpine) lacks -x/--total: use plain `df -BM` and filter.
    execFile("df", ["-BM"], (err, stdout) => {
      if (err) return resolve(null);
      try {
        const lines = stdout.trim().split("\n").slice(1);
        let total = 0;
        let used = 0;
        for (const line of lines) {
          const parts = line.split(/\s+/);
          // Filesystem 1M-blocks Used Available Use% Mounted-on
          if (parts.length < 6) continue;
          const fs = parts[0];
          if (/^(tmpfs|devtmpfs|shm|overlay|cgroup|none)$/.test(fs)) continue;
          if (fs.startsWith("/dev/") === false && !fs.includes("mapper") && !fs.startsWith("//") && fs !== "/") {
            // keep / (container root) but skip virtual mounts we can't classify;
            // busybox on docker: root fs shows as overlay -> skip, fall back below
            if (fs === "overlay") continue;
          }
          total += toMiB(parts[1]);
          used += toMiB(parts[2]);
        }
        // docker/alpine: everything is overlay -> fallback to root `/` row
        if (total === 0) {
          const root = lines.map((l) => l.split(/\s+/)).find((p) => p[p.length - 1] === "/");
          if (root && root.length >= 4) {
            total = toMiB(root[1]);
            used = toMiB(root[2]);
          }
        }
        resolve({ total, used });
      } catch {
        resolve(null);
      }
    });
  });
}

function toMiB(s) {
  return parseInt(String(s).replace(/M$/, ""), 10) || 0;
}

async function osRelease() {
  try {
    const text = await readText("/etc/os-release");
    const m = text.match(/^PRETTY_NAME[=](.+)$/m);
    if (m) return m[1].trim().replace(/^"|"$/g, "");
    const m2 = text.match(/^ID[=](.+)$/m);
    if (m2) return m2[1].trim().replace(/^"|"$/g, "");
    const m3 = text.match(/^ID_LIKE[=](.+)$/m);
    if (m3) return m3[1].trim().replace(/^"|"$/g, "").split(/\s+/)[0];
    return "Linux";
  } catch {
    return "Linux";
  }
}

async function hostMeta() {
  const osName = platform() === "linux" ? await osRelease() : platform();
  const a = arch() === "x64" ? "amd64" : arch() === "arm64" ? "arm64" : arch();
  let kernel = "";
  let cpuModel = "";
  let cores = String(cpus().length || 0);
  if (platform() === "linux") {
    const ver = await readText("/proc/version");
    kernel = ver.trim().slice(0, 128);
    const cpuinfo = await readText("/proc/cpuinfo");
    const m = cpuinfo.match(/model name\s*:\s*(.+)/);
    if (m) cpuModel = m[1].trim().slice(0, 128);
  }
  return { os: osName, arch: a, kernel, cpuModel, cores, hostname: hostname() };
}

async function loadAvg() {
  if (platform() !== "linux") return "0 0 0";
  const text = await readText("/proc/loadavg");
  const parts = text.trim().split(/\s+/);
  if (parts.length >= 3) return `${parts[0]} ${parts[1]} ${parts[2]}`;
  return "0 0 0";
}

async function bootTimeMs() {
  if (platform() === "linux") {
    const text = await readText("/proc/stat");
    const m = text.match(/^btime\s+(\d+)/m);
    if (m) return String(Number(m[1]) * 1000);
  }
  try {
    const { execFileSync } = await import("node:child_process");
    void execFileSync;
  } catch {}
  return "0";
}

async function procCount() {
  if (platform() !== "linux") return "0";
  try {
    const entries = await fs.readdir("/proc");
    let n = 0;
    for (const e of entries) if (/^\d+$/.test(e)) n++;
    return String(n);
  } catch {
    return "0";
  }
}

async function tcpUdpCount() {
  if (platform() !== "linux") return { tcp: "0", udp: "0" };
  const [tcpFull, udpText] = await Promise.all([
    readText("/proc/net/tcp"),
    readText("/proc/net/udp"),
  ]);
  let tcp = 0;
  for (const line of tcpFull.split("\n").slice(1)) {
    const cols = line.trim().split(/\s+/);
    if (cols.length > 3 && cols[3] === "01") tcp++; // ESTABLISHED
  }
  let udp = 0;
  for (const line of udpText.split("\n").slice(1)) {
    if (line.trim()) udp++;
  }
  return { tcp: String(tcp), udp: String(udp) };
}

async function swapInfo() {
  if (platform() !== "linux") return { total: "0", used: "0" };
  const text = await readText("/proc/meminfo");
  const get = (k) => {
    const m = text.match(new RegExp(`^${k}:\\s+(\\d+)`, "m"));
    return m ? Math.floor(Number(m[1]) / 1024) : 0;
  };
  const total = get("SwapTotal");
  const free = get("SwapFree");
  return { total: String(total), used: String(Math.max(0, total - free)) };
}

async function diskIo() {
  // /proc/diskstats 聚合：读扇区/写扇区(每扇区512B) + IO 时间；速率由 cfprobe 两次采样差分
  if (platform() !== "linux") return { readBytes: 0, writeBytes: 0 };
  const text = await readText("/proc/diskstats");
  let r = 0;
  let w = 0;
  for (const line of text.split("\n")) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 14) continue;
    const name = cols[2] || "";
    if (/^(loop|ram|dm-\d+|sr\d+)/.test(name)) continue;
    if (/[0-9]$/.test(name)) continue; // 只算整盘，跳过分区
    r += (Number(cols[5]) || 0) * 512;
    w += (Number(cols[9]) || 0) * 512;
  }
  return { readBytes: r, writeBytes: w };
}

function tcpPing(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const [h, p] = String(host).includes(":") && !String(host).startsWith("[")
      ? splitHostPort(host, port)
      : [host, port || 80];
    const start = Date.now();
    const sock = createConnection({ host: h, port: Number(p) || 80 });
    const timer = setTimeout(() => {
      sock.destroy();
      resolve(null);
    }, timeoutMs);
    sock.on("connect", () => {
      clearTimeout(timer);
      const ms = Date.now() - start;
      sock.destroy();
      resolve(ms);
    });
    sock.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

function splitHostPort(hostport, defPort) {
  const i = hostport.lastIndexOf(":");
  if (i === -1) return [hostport, defPort];
  return [hostport.slice(0, i), hostport.slice(i + 1)];
}

function resetCpuState() {
  lastCpu = null;
}



// ---- cfprobe ws client (zero-dep, mirrors cfsm-agent websocket_client.go) ----
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const WS_MAX_MSG = 1 << 20;
const WSS_HANDSHAKE_TIMEOUT = 10000;
const WSS_HELLO_TIMEOUT = 10000;
const WSS_WRITE_TIMEOUT = 8000;

function wsAccept(key) {
  return createHash("sha1").update(key + WS_GUID).digest("base64");
}

function wsNewKey() {
  return randomBytes(16).toString("base64");
}

function wsBuildHandshake(urlStr, extraHeaders) {
  const u = new URL(urlStr);
  const key = wsNewKey();
  const path = (u.pathname || "/") + (u.search || "");
  const lines = [
    `GET ${path} HTTP/1.1`,
    `Host: ${u.host}`,
    "Connection: Upgrade",
    "Upgrade: websocket",
    `Sec-WebSocket-Key: ${key}`,
    "Sec-WebSocket-Version: 13",
  ];
  for (const [k, v] of Object.entries(extraHeaders || {})) {
    lines.push(`${k}: ${v}`);
  }
  lines.push("", "");
  return { raw: lines.join("\r\n"), key };
}

function wsParseHandshakeResponse(buf) {
  // 返回 { ok, status, headers, rest }；数据不全返回 { ok:false, needMore:true }
  const idx = buf.indexOf("\r\n\r\n");
  if (idx === -1) return { ok: false, needMore: true };
  const head = buf.slice(0, idx).toString("latin1");
  const rest = buf.slice(idx + 4);
  const lines = head.split("\r\n");
  const statusLine = lines[0] || "";
  const m = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d+)/);
  const status = m ? parseInt(m[1], 10) : 0;
  const headers = {};
  for (const ln of lines.slice(1)) {
    const ci = ln.indexOf(":");
    if (ci === -1) continue;
    const k = ln.slice(0, ci).trim().toLowerCase();
    const v = ln.slice(ci + 1).trim();
    if (headers[k]) headers[k] = headers[k] + ", " + v;
    else headers[k] = v;
  }
  return { ok: true, status, headers, rest };
}

function wsHeaderHasToken(headers, name, want) {
  const v = (headers[name.toLowerCase()] || "").toLowerCase();
  return v.split(",").map((x) => x.trim()).includes(want.toLowerCase());
}

function wsFrameEncode(opcode, payload) {
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | len;
  } else if (len <= 0xffff) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  const mask = randomBytes(4);
  const out = Buffer.concat([header, mask]);
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([out, masked]);
}

function wsFrameDecodeOne(buf) {
  // 返回 { ok, needMore, fin, opcode, payload, rest }
  if (buf.length < 2) return { ok: false, needMore: true };
  const fin = (buf[0] & 0x80) !== 0;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let length = buf[1] & 0x7f;
  let off = 2;
  if (length === 126) {
    if (buf.length < 4) return { ok: false, needMore: true };
    length = buf.readUInt16BE(2);
    off = 4;
  } else if (length === 127) {
    if (buf.length < 10) return { ok: false, needMore: true };
    const big = buf.readBigUInt64BE(2);
    if (big > BigInt(WS_MAX_MSG)) throw new Error("WSS frame too large");
    length = Number(big);
    off = 10;
  }
  if (length > WS_MAX_MSG) throw new Error("WSS frame too large");
  let maskKey = null;
  if (masked) {
    if (buf.length < off + 4) return { ok: false, needMore: true };
    maskKey = buf.slice(off, off + 4);
    off += 4;
  }
  if (buf.length < off + length) return { ok: false, needMore: true };
  let payload = buf.slice(off, off + length);
  const rest = buf.slice(off + length);
  if (masked && maskKey) {
    const un = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) un[i] = payload[i] ^ maskKey[i % 4];
    payload = un;
  }
  return { ok: true, fin, opcode, payload, rest };
}

function wsCloseCode(payload) {
  if (!payload || payload.length < 2) return { code: 1005, reason: "" };
  return { code: payload.readUInt16BE(0), reason: payload.slice(2).toString("utf8") };
}

function cfWsUrl(rawUrl, schema, md5) {
  // https:// -> wss://，http:// -> ws://，路径 query 保留；再带 config_schema/config_md5（对齐官方）
  const u = new URL(rawUrl);
  if (u.protocol === "https:") u.protocol = "wss:";
  else if (u.protocol === "http:") u.protocol = "ws:";
  else if (u.protocol !== "wss:" && u.protocol !== "ws:") throw new Error(`unsupported scheme ${u.protocol}`);
  if (schema) u.searchParams.set("config_schema", schema);
  if (md5) u.searchParams.set("config_md5", md5);
  return u.toString();
}

function wsConnect(rawWsUrl, extraHeaders, timeoutMs) {
  // 返回 Promise<{ sock, headers, startedAt, receivedAt }>；握手失败 reject（带 status/headers/body）
  return new Promise((resolve, reject) => {
    const u = new URL(rawWsUrl);
    const secure = u.protocol === "wss:";
    const port = u.port ? parseInt(u.port, 10) : secure ? 443 : 80;
    const host = u.hostname;
    const startedAt = Date.now();
    let sock = null;
    let settled = false;
    const fail = (e) => {
      if (settled) return;
      settled = true;
      try { sock && sock.destroy(); } catch {}
      reject(e);
    };
    const timer = setTimeout(() => fail(new Error("WSS handshake timeout")), timeoutMs || WSS_HANDSHAKE_TIMEOUT);
    const onConnect = () => {
      const { raw, key } = wsBuildHandshake(rawWsUrl, extraHeaders);
      let acc = Buffer.alloc(0);
      const onData = (chunk) => {
        acc = Buffer.concat([acc, chunk]);
        let parsed;
        try {
          parsed = wsParseHandshakeResponse(acc);
        } catch (e) {
          cleanup();
          fail(e);
          return;
        }
        if (!parsed.ok) return; // needMore
        cleanup();
        const receivedAt = Date.now();
        if (parsed.status !== 101) {
          const body = parsed.rest.slice(0, 1024).toString("utf8");
          const err = new Error(`WSS handshake http=${parsed.status}${body ? " body=" + body.trim().slice(0, 200) : ""}`);
          err.status = parsed.status;
          err.headers = parsed.headers;
          err.body = body;
          fail(err);
          return;
        }
        if (!wsHeaderHasToken(parsed.headers, "upgrade", "websocket") || !wsHeaderHasToken(parsed.headers, "connection", "upgrade")) {
          fail(new Error("WSS handshake missing upgrade headers"));
          return;
        }
        const got = (parsed.headers["sec-websocket-accept"] || "").trim();
        if (got !== wsAccept(key)) {
          fail(new Error("WSS handshake invalid accept"));
          return;
        }
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        // 握手剩余字节是首帧数据（DO 行为：一般无；保留给调用方）
        resolve({ sock, headers: parsed.headers, startedAt, receivedAt, rest: parsed.rest });
      };
      const onError = (e) => { cleanup(); fail(e); };
      const cleanup = () => {
        if (sock) {
          sock.off("data", onData);
          sock.off("error", onError);
        }
      };
      sock.on("data", onData);
      sock.on("error", onError);
      sock.write(raw);
    };
    const opts = { host, port, servername: host, minVersion: "TLSv1.2" };
    try {
      sock = secure
        ? tlsConnect(port, host, opts, onConnect)
        : createConnection({ host, port }, onConnect);
      sock.on("error", (e) => fail(e));
    } catch (e) {
      fail(e);
    }
  });
}

// ---- src/cfprobe.js ----
const AGENT_VERSION = "argo-kit-cfprobe/0.2.0";
const CONFIG_SCHEMA = "7";

/**
 * Built-in CF probe (mirrors cfsm-agent report body + transport).
 * - CF_CONNECTION_MODE=auto: WSS 实时上报优先（默认 2s 间隔，服务端 ack 可调 1s-5min），POST 兜底
 * - CF_CONNECTION_MODE=http: 仅 POST（旧行为）
 * - WSS 握手带 X-Agent-* 头 + config_schema/config_md5 query；等 hello 后发首包（旧 POST body 不变）
 * - 服务端帧：ack（含 nextWssReportAfterMs/config 下发）/ error(401/403/404/1008 -> 停 120s) /
 *   409+wss_schedule_inactive -> 切 POST（X-Agent-Wss-Mode: active 时恢复）
 * - 网络错误指数退避 60s-5min；握手/读整体 10s deadline；读空闲 = 上报间隔+15s
 * - never throws out; reports status via getStatus()
 */
const WSS_REPORT_DEFAULT_MS = 2000;
const WSS_REPORT_MIN_MS = 1000;
const WSS_REPORT_MAX_MS = 5 * 60 * 1000;
const WSS_PAUSE_MS = 120 * 1000;
const WSS_NET_MIN_MS = 60 * 1000;
const WSS_NET_MAX_MS = 5 * 60 * 1000;
const WSS_IDLE_GRACE_MS = 15000;

function createCfProbe(cfg) {
  const useWss = (cfg.cfConnectionMode || "auto") !== "http";
  const state = {
    running: false,
    timer: null,
    lastOk: null,
    lastError: "",
    reportCount: 0,
    wssReports: 0,
    postReports: 0,
    configMd5: "none",
    offsetMs: null,
    serverCfg: {},
    lastNet: null,
    lastIo: null,
    lastAt: 0,
    // wss runtime
    ws: null,            // { sock, buf }
    wssConnected: false,
    wssPausedUntil: 0,
    wssPauseReason: "",
    wssBackoffMs: WSS_NET_MIN_MS,
    wssReportAfterMs: 0, // 服务端 ack 下发的下次上报间隔（0=用默认 2s）
    wssLoop: null,
    wssLastConfigAt: 0,
    wssWantStop: false,
  };

  async function collect() {
    const [cpu, mem, net, disk, meta, load, boot, procs, conns, swap, io] = await Promise.all([
      cpuPercent(),
      Promise.resolve(memInfo()),
      netCounters(cfg.cfIface),
      diskInfo(),
      hostMeta(),
      loadAvg(),
      bootTimeMs(),
      procCount(),
      tcpUdpCount(),
      swapInfo(),
      diskIo(),
    ]);
    const now = Date.now();
    let inSpeed = 0;
    let outSpeed = 0;
    let readBps = 0;
    let writeBps = 0;
    if (state.lastNet && state.lastAt) {
      const dt = Math.max(1, (now - state.lastAt) / 1000);
      inSpeed = Math.max(0, Math.floor((net.rx - state.lastNet.rx) / dt));
      outSpeed = Math.max(0, Math.floor((net.tx - state.lastNet.tx) / dt));
      if (state.lastIo) {
        readBps = Math.max(0, Math.floor((io.readBytes - state.lastIo.readBytes) / dt));
        writeBps = Math.max(0, Math.floor((io.writeBytes - state.lastIo.writeBytes) / dt));
      }
    }
    state.lastNet = net;
    state.lastIo = io;
    state.lastAt = now;

    const metrics = {
      cpu: Number(cpu).toFixed(2),
      ram_total: String(mem.total),
      ram_used: String(mem.used),
      swap_total: swap.total,
      swap_used: swap.used,
      disk_total: String(disk.total),
      disk_used: String(disk.used),
      disk: {
        read_bps: readBps,
        write_bps: writeBps,
        read_iops: 0,
        write_iops: 0,
        await_ms: 0,
        util: 0,
      },
      load_avg: load,
      boot_time: boot,
      net_rx: String(net.rx),
      net_tx: String(net.tx),
      net_rx_monthly: String(net.rx),
      net_tx_monthly: String(net.tx),
      net_in_speed: String(inSpeed),
      net_out_speed: String(outSpeed),
      os: meta.os,
      arch: meta.arch,
      kernel_version: meta.kernel,
      cpu_info: meta.cpuModel,
      cpu_cores: meta.cores,
      gpu_info: null,
      processes: procs,
      tcp_conn: conns.tcp,
      udp_conn: conns.udp,
      ip_v4: "0",
      ip_v6: "0",
      ping_ct: await pingField(cfg.cfPingCt),
      ping_cu: await pingField(cfg.cfPingCu),
      ping_cm: await pingField(cfg.cfPingCm),
      ping_bgp: await pingField(cfg.cfPingBgp),
      loss_ct: false,
      loss_cu: false,
      loss_cm: false,
      loss_bd: false,
    };

    const time = { local_ts: now };
    if (state.offsetMs !== null) {
      time.accurate_ts = now + state.offsetMs;
      time.offset_ms = state.offsetMs;
      time.source = "date";
    }

    return {
      id: cfg.cfNodeId,
      secret: cfg.cfSecret,
      time,
      metrics,
      collect_interval: 0,
      report_interval: cfg.cfInterval,
      config_schema: CONFIG_SCHEMA,
      config_md5: state.configMd5,
    };
  }

  async function pingField(node) {
    if (!node) return false;
    const ms = await tcpPing(node, 80, 3000);
    return ms === null ? "null" : String(ms);
  }

  function handleResponse(res, bodyText) {
    // POST 响应头 X-Agent-Wss-Mode: active -> 解除 409 时段关闭
    try { handleWssModeHeader(res.headers); } catch {}
    // time calibration from Date header
    const date = res.headers.get("date");
    if (date) {
      const t = Date.parse(date);
      if (!Number.isNaN(t)) state.offsetMs = t - Date.now();
    }
    if (!bodyText) return;
    // dynamic config is a query-string body
    if (/collect_interval|report_interval|schema_version/.test(bodyText)) {
      const md5 = createHash("md5").update(bodyText).digest("hex");
      if (md5 !== state.configMd5) {
        state.configMd5 = md5;
        state.serverCfg = Object.fromEntries(new URLSearchParams(bodyText).entries());
        logger.debug("cfprobe server config updated", state.serverCfg);
      }
    }
  }

  function postUrl() {
    return cfg.cfWorkerUrl.endsWith("/update") ? cfg.cfWorkerUrl : `${cfg.cfWorkerUrl}/update`;
  }

  function agentHeaders(extra) {
    return {
      "Content-Type": "application/json",
      Accept: "*/*",
      "User-Agent": "cfsm",
      "X-Agent-Config-Schema": CONFIG_SCHEMA,
      "X-Agent-Version": AGENT_VERSION,
      "X-Agent-Config-Md5": state.configMd5,
      ...(extra || {}),
    };
  }

  function wssPaused() {
    return Date.now() < state.wssPausedUntil;
  }

  function wssPause(reason) {
    // 认证/配置类错误：WSS + POST 同时停 120s（对齐官方 delayProtocol）
    state.wssPausedUntil = Date.now() + WSS_PAUSE_MS;
    state.wssPauseReason = reason || "protocol_error";
    closeWs();
    logger.warn(`WSS retry delayed reason=${state.wssPauseReason} delay=120s`);
    logger.warn(`POST fallback delayed reason=${state.wssPauseReason} delay=120s`);
  }

  function wssIntervalMs() {
    if (state.wssReportAfterMs > 0) {
      return Math.min(Math.max(state.wssReportAfterMs, WSS_REPORT_MIN_MS), WSS_REPORT_MAX_MS);
    }
    return WSS_REPORT_DEFAULT_MS;
  }

  function closeWs() {
    state.wssConnected = false;
    if (state.ws) {
      try { state.ws.sock.destroy(); } catch {}
      state.ws = null;
    }
  }

  function wsWriteText(text) {
    if (!state.ws) return false;
    try {
      state.ws.sock.write(wsFrameEncode(0x1, Buffer.from(text)));
      return true;
    } catch {
      closeWs();
      return false;
    }
  }

  function handleWssModeHeader(headers) {
    // POST 响应头 X-Agent-Wss-Mode: active -> 解除 409 时段关闭，恢复 WSS
    if (!headers || !headers.get) return;
    const mode = String(headers.get("x-agent-wss-mode") || "").toLowerCase();
    const reason = String(headers.get("x-agent-wss-reason") || "").toLowerCase();
    if (mode === "active") {
      if (state.wssPauseReason === "wss_schedule_inactive") {
        state.wssPausedUntil = 0;
        state.wssPauseReason = "";
        logger.warn(`WSS temporary disable cleared reason=${reason || "server_active"}`);
      }
    } else if (mode === "inactive" || mode === "disabled") {
      if (reason === "wss_schedule_inactive" || reason === "wss_schedule_empty" || reason === "wss_disabled") {
        state.wssPausedUntil = Date.now() + WSS_PAUSE_MS;
        state.wssPauseReason = reason;
        closeWs();
        logger.warn(`WSS temporarily disabled reason=${reason}; using POST report`);
      }
    }
  }

  function applyWssConfig(bodyText, md5) {
    // 最短 1 分钟处理一次 WSS 配置下发（对齐官方 wssConfigMinInterval）
    const now = Date.now();
    if (now - state.wssLastConfigAt < 60000) {
      logger.debug("WSS config delayed (min interval 60s)");
      return;
    }
    state.wssLastConfigAt = now;
    const hex = (md5 || "").toLowerCase();
    if (/^[0-9a-f]{32}$/.test(hex)) {
      if (hex !== state.configMd5) {
        state.configMd5 = hex;
        try {
          state.serverCfg = Object.fromEntries(new URLSearchParams(bodyText).entries());
        } catch {}
        logger.warn(`WSS config processed md5=${hex}`);
      }
      return;
    }
    // 无 md5：按原有 query-string 逻辑按字段变化更新
    handleResponse({ headers: { get: () => null } }, bodyText);
  }

  function handleServerFrame(raw) {
    let frame;
    try {
      frame = JSON.parse(raw);
    } catch {
      logger.debug("WSS message ignored invalid_json");
      return;
    }
    const type = frame.type;
    if (type === "ack") {
      if (frame.nextWssReportAfterMs != null) {
        const ms = Number(frame.nextWssReportAfterMs);
        if (ms > 0) {
          state.wssReportAfterMs = Math.min(Math.max(ms, WSS_REPORT_MIN_MS), WSS_REPORT_MAX_MS);
        }
      }
      logger.debug(`WSS ack ts=${frame.ts} persisted=${!!frame.persisted} nextWssReportAfterMs=${frame.nextWssReportAfterMs}`);
      // ack 内携带的 config 下发（body / config_body / config / payload 多形态）
      const body = frame.body || frame.config_body || (typeof frame.config === "string" ? frame.config : "") || "";
      const md5 = frame.config_md5 || frame.configMd5 || frame.md5 || "";
      const pl = frame.payload;
      let plBody = "", plMd5 = "";
      if (typeof pl === "string") plBody = pl;
      else if (pl && typeof pl === "object") {
        plBody = pl.body || pl.config || "";
        plMd5 = pl.config_md5 || pl.configMd5 || pl.md5 || "";
      }
      const cfgBody = body || plBody;
      if (cfgBody) applyWssConfig(String(cfgBody), md5 || plMd5);
    } else if (type === "error") {
      const code = Number(frame.code || 0);
      const reason = String(frame.error || frame.text || "server_error");
      if (code === 409 && /wss_schedule_inactive|wss_schedule_empty|wss_disabled/.test(reason)) {
        state.wssPausedUntil = Date.now() + WSS_PAUSE_MS;
        state.wssPauseReason = reason;
        closeWs();
        logger.warn(`WSS unavailable reason=${reason}`);
        return;
      }
      if (code === 401 || code === 403 || code === 404 || code === 1008) {
        logger.warn(`WSS error code=${code} error=${reason}`);
        wssPause(`server error code=${code} error=${reason}`);
        return;
      }
      logger.warn(`WSS error code=${code} error=${reason}`);
      wssPause(`server error code=${code}`);
    } else if (type === "config" || type === "remote_config") {
      const body = frame.body || frame.config_body || (typeof frame.config === "string" ? frame.config : "") || "";
      const md5 = frame.config_md5 || frame.configMd5 || frame.md5 || "";
      if (body) applyWssConfig(String(body), md5);
      else logger.debug("WSS config ignored: empty body");
    } else if (type === "hello") {
      logger.debug(`WSS hello repeated ts=${frame.ts}`);
    } else {
      logger.debug(`WSS message ignored type=${JSON.stringify(type)}`);
    }
  }

  async function wssEnsureLoop() {
    // 后台长连接循环：握手 -> 等 hello -> 标记 connected；读循环在 onData 里驱动
    if (state.wssLoop) return;
    state.wssLoop = (async () => {
      while (state.running && useWss && !state.wssWantStop) {
        if (wssPaused()) {
          const wait = state.wssPausedUntil - Date.now();
          logger.debug(`WSS paused reason=${state.wssPauseReason}, wait ${Math.ceil(wait / 1000)}s`);
          await new Promise((r) => setTimeout(r, Math.min(Math.max(wait, 1000), 30000)));
          continue;
        }
        try {
          await wssConnectOnce();
          state.wssBackoffMs = WSS_NET_MIN_MS;
        } catch (e) {
          if (!state.running || !useWss) break;
          const msg = String((e && e.message) || e);
          if (/http=401|http=403|http=404|close code=1008/i.test(msg)) {
            wssPause(msg.slice(0, 120));
            continue;
          }
          if (/http=409|wss_schedule_inactive/i.test(msg)) {
            state.wssPausedUntil = Date.now() + WSS_PAUSE_MS;
            state.wssPauseReason = "wss_schedule_inactive";
            closeWs();
            logger.warn("WSS temporarily disabled reason=wss_schedule_inactive; using POST report");
            continue;
          }
          logger.warn(`WSS retry delayed reason=${msg.slice(0, 120)} delay=${Math.ceil(state.wssBackoffMs / 1000)}s`);
          await new Promise((r) => setTimeout(r, state.wssBackoffMs));
          state.wssBackoffMs = Math.min(state.wssBackoffMs * 2, WSS_NET_MAX_MS);
        }
      }
      state.wssLoop = null;
    })();
  }

  async function wssConnectOnce() {
    const wsUrl = cfWsUrl(postUrl(), CONFIG_SCHEMA, state.configMd5);
    const headers = {
      Accept: "*/*",
      "User-Agent": "cfsm",
      "X-Agent-Config-Schema": CONFIG_SCHEMA,
      "X-Agent-Version": AGENT_VERSION,
      "X-Agent-Config-Md5": state.configMd5,
    };
    const startedAt = Date.now();
    const { sock, headers: respHeaders, receivedAt, rest } = await wsConnect(wsUrl, headers, WSS_HANDSHAKE_TIMEOUT);
    // Date 头校准（握手响应）
    try {
      const d = respHeaders["date"];
      if (d) {
        const t = Date.parse(d);
        if (!Number.isNaN(t)) state.offsetMs = t - Date.now();
      }
    } catch {}
    // 等 hello（10s）
    const helloRaw = await wssReadOne(sock, rest, WSS_HELLO_TIMEOUT);
    let hello;
    try {
      hello = JSON.parse(helloRaw);
    } catch {
      try { sock.destroy(); } catch {}
      throw new Error("WSS hello invalid json");
    }
    if (!hello || hello.type !== "hello" || hello.protocol !== "update") {
      try { sock.destroy(); } catch {}
      throw new Error(`WSS hello invalid type=${hello && hello.type} protocol=${hello && hello.protocol}`);
    }
    logger.warn(`WSS connected protocol=${hello.protocol} ts=${hello.ts}`);
    state.ws = { sock, buf: Buffer.alloc(0) };
    state.wssConnected = true;
    attachWsReader(sock);
    // 首包：旧 POST body 不变，立即发一次（对齐官方）
    await sendViaWss();
    // 读空闲超时 = 当前上报间隔 + 15s（对齐官方）；由 reader 看门狗执行
    return true;
  }

  function wssReadOne(sock, seed, timeoutMs) {
    return new Promise((resolve, reject) => {
      let acc = seed && seed.length ? seed : Buffer.alloc(0);
      let msgBuf = Buffer.alloc(0);
      let msgOpcode = 0;
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("WSS hello timeout"));
      }, timeoutMs);
      try { timer.unref && timer.unref(); } catch {}
      const cleanup = () => {
        clearTimeout(timer);
        sock.off("data", onData);
        sock.off("error", onError);
        sock.off("close", onClose);
      };
      const pump = () => {
        while (true) {
          let fr;
          try {
            fr = wsFrameDecodeOne(acc);
          } catch (e) {
            cleanup();
            reject(e);
            return false;
          }
          if (!fr.ok) return true; // needMore
          acc = fr.rest;
          if (fr.opcode === 0x9) {
            try { sock.write(wsFrameEncode(0xa, fr.payload)); } catch {}
            continue;
          }
          if (fr.opcode === 0xa) continue;
          if (fr.opcode === 0x8) {
            const { code, reason } = wsCloseCode(fr.payload);
            cleanup();
            const err = new Error(`WSS close code=${code} reason=${reason}`);
            err.closeCode = code;
            reject(err);
            return false;
          }
          if (fr.opcode === 0x1 || fr.opcode === 0x2) {
            msgOpcode = fr.opcode;
            msgBuf = Buffer.concat([msgBuf, fr.payload]);
          } else if (fr.opcode === 0x0) {
            msgBuf = Buffer.concat([msgBuf, fr.payload]);
          } else {
            cleanup();
            reject(new Error(`WSS unsupported opcode=${fr.opcode}`));
            return false;
          }
          if (fr.fin) {
            cleanup();
            resolve(msgBuf.toString("utf8"));
            return false;
          }
        }
      };
      const onData = (chunk) => {
        acc = Buffer.concat([acc, chunk]);
        pump();
      };
      const onError = (e) => { cleanup(); reject(e); };
      const onClose = () => { cleanup(); reject(new Error("WSS closed before hello")); };
      sock.on("data", onData);
      sock.on("error", onError);
      sock.on("close", onClose);
      if (acc.length) pump();
    });
  }

  function attachWsReader(sock) {
    let acc = Buffer.alloc(0);
    let msgBuf = Buffer.alloc(0);
    let idleTimer = null;
    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      const idle = wssIntervalMs() + WSS_IDLE_GRACE_MS;
      idleTimer = setTimeout(() => {
        logger.warn("WSS idle timeout, reconnecting");
        closeWs();
      }, idle);
      try { idleTimer.unref && idleTimer.unref(); } catch {}
    };
    armIdle();
    const pump = () => {
      while (true) {
        let fr;
        try {
          fr = wsFrameDecodeOne(acc);
        } catch (e) {
          logger.warn(`WSS frame error: ${e.message}`);
          closeWs();
          return;
        }
        if (!fr.ok) return;
        acc = fr.rest;
        armIdle();
        if (fr.opcode === 0x9) {
          try { sock.write(wsFrameEncode(0xa, fr.payload)); } catch {}
          continue;
        }
        if (fr.opcode === 0xa) continue;
        if (fr.opcode === 0x8) {
          const { code, reason } = wsCloseCode(fr.payload);
          try { sock.write(wsFrameEncode(0x8, fr.payload)); } catch {}
          closeWs();
          logger.warn(`WSS close code=${code} reason=${reason}`);
          if (code === 1008) wssPause(`WSS close code=1008 reason=${reason}`);
          else if (wssPaused()) { /* 409 时段关闭已在 handleServerFrame 处理 */ }
          return;
        }
        if (fr.opcode === 0x1 || fr.opcode === 0x2) {
          msgBuf = Buffer.alloc(0);
          msgBuf = Buffer.concat([msgBuf, fr.payload]);
        } else if (fr.opcode === 0x0) {
          msgBuf = Buffer.concat([msgBuf, fr.payload]);
        } else {
          logger.warn(`WSS unsupported opcode=${fr.opcode}`);
          closeWs();
          return;
        }
        if (fr.fin) {
          const text = msgBuf.toString("utf8");
          msgBuf = Buffer.alloc(0);
          try {
            handleServerFrame(text);
          } catch (e) {
            logger.debug(`WSS frame handle error: ${e.message}`);
          }
        }
      }
    };
    sock.on("data", (chunk) => {
      acc = Buffer.concat([acc, chunk]);
      if (acc.length > WS_MAX_MSG * 2) {
        logger.warn("WSS buffer overflow, reconnecting");
        closeWs();
        return;
      }
      pump();
    });
    sock.on("error", () => closeWs());
    sock.on("close", () => {
      if (idleTimer) clearTimeout(idleTimer);
      closeWs();
    });
  }

  async function sendViaWss() {
    if (!state.wssConnected || !state.ws) return false;
    try {
      const body = await collect();
      const text = JSON.stringify(body);
      if (!wsWriteText(text)) return false;
      state.lastOk = new Date().toISOString();
      state.lastError = "";
      state.reportCount += 1;
      state.wssReports += 1;
      logger.debug(`cfprobe WSS reported #${state.reportCount}`);
      return true;
    } catch (e) {
      closeWs();
      // 写失败立即尝试一次 POST fallback（对齐官方）
      logger.debug(`WSS write failed, POST fallback once: ${e.message}`);
      return await postOnce(true);
    }
  }

  async function postOnce(isFallback) {
    // POST 失败重试按 REPORT_INTERVAL 限流由调用方 tick 间隔保证
    try {
      const body = await collect();
      const res = await fetch(postUrl(), {
        method: "POST",
        headers: agentHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`worker ${res.status}: ${text.slice(0, 200)}`);
      handleWssModeHeader(res.headers);
      handleResponse(res, text);
      state.lastOk = new Date().toISOString();
      state.lastError = "";
      state.reportCount += 1;
      state.postReports += 1;
      logger.debug(`cfprobe ${isFallback ? "POST fallback" : "POST"} reported #${state.reportCount}`);
      return true;
    } catch (e) {
      state.lastError = String(e.message || e).slice(0, 300);
      logger.warn(`cfprobe report failed: ${state.lastError}`);
      return false;
    }
  }

  async function tick() {
    if (!useWss) {
      await postOnce(false);
      return;
    }
    // auto 模式：WSS 连着就走 WSS 节奏，否则 POST 兜底（暂停期跳过）
    if (state.wssConnected && state.ws) {
      return;
    }
    if (wssPaused()) {
      logger.debug(`POST fallback delayed reason=${state.wssPauseReason}`);
      return;
    }
    await postOnce(false);
  }

  async function wssTickLoop() {
    // WSS 节奏发送循环：按服务端下发的间隔（默认 2s）发送；断连则停等重连
    while (state.running && useWss && !state.wssWantStop) {
      if (!state.wssConnected || !state.ws) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      const ok = await sendViaWss();
      if (!ok) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      await new Promise((r) => setTimeout(r, wssIntervalMs()));
    }
  }

  return {
    start() {
      if (state.running) return;
      state.running = true;
      state.wssWantStop = false;
      logger.info(`cfprobe started: node=${cfg.cfNodeId} every ${cfg.cfInterval}s mode=${useWss ? "auto(wss+post)" : "http(post)"}`);
      if (useWss) {
        wssEnsureLoop();
        (async () => {
          // WSS 节奏发送与 POST 兜底 tick 并行
          wssTickLoop();
        })();
      }
      tick();
      state.timer = setInterval(tick, cfg.cfInterval * 1000);
      if (state.timer.unref) state.timer.unref();
    },
    stop() {
      state.running = false;
      state.wssWantStop = true;
      if (state.timer) clearInterval(state.timer);
      state.timer = null;
      state.wssLoop = null;
      closeWs();
    },
    getStatus() {
      return {
        cf_enabled: true,
        cf_running: state.running,
        cf_mode: useWss ? "auto" : "http",
        cf_wss_connected: state.wssConnected,
        cf_wss_paused: wssPaused() ? state.wssPauseReason : "",
        cf_wss_reports: state.wssReports,
        cf_post_reports: state.postReports,
        cf_last_ok: state.lastOk,
        cf_last_error: state.lastError,
        cf_reports: state.reportCount,
        cf_config_md5: state.configMd5,
      };
    },
    // exposed for tests
    _collect: collect,
    _handleResponse: handleResponse,
    _handleServerFrame: handleServerFrame,
    _wssIntervalMs: wssIntervalMs,
    _state: state,
  };
}


// ---- src/runner.js ----
const MAX_RESTARTS = 30; // 单进程最大自动重启次数，防止配置错误刷屏
const RESTART_BASE_MS = 5000;

class Runner {
  constructor() {
    this.children = new Map(); // name -> ChildProcess
    this.stopping = false;
    this.timers = new Map(); // name -> timeout
    this.restarts = new Map(); // name -> count
    this.refetchers = new Map(); // name -> async () => binPath | null（TTL 删二进制后重下用）
  }

  /** 注册缺二进制时的重下函数（ensure* 包装）。不注册则保持原行为。 */
  onMissingBinary(name, fn) {
    this.refetchers.set(name, fn);
  }

  start(name, bin, args, opts = {}) {
    this.stop(name, true);
    logger.info(`starting ${name}: ${bin} ${redactArgs(args).join(" ")}`);
    const child = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    child.stdout && child.stdout.on("data", (d) => logger.debug(`[${name}] ${String(d).trim().slice(0, 500)}`));
    child.stderr && child.stderr.on("data", (d) => logger.debug(`[${name}] ${String(d).trim().slice(0, 500)}`));
    this.children.set(name, child);
    child.on("exit", (code, signal) => {
      this.children.delete(name);
      if (this.stopping) return;
      this.scheduleRestart(name, bin, args, opts, `exited code=${code} signal=${signal}`);
    });
    child.on("error", (e) => {
      // ENOENT = 二进制被 TTL 删了（或从未下载成功）：先重下再重启，而不是空转 30 次
      if (e.code === "ENOENT" || /ENOENT/.test(e.message || "")) {
        logger.warn(`${name} binary missing (${bin}), refetching...`);
        this.refetch(name, args, opts);
        return;
      }
      logger.error(`${name} spawn error: ${e.message}`);
      this.scheduleRestart(name, bin, args, opts, `spawn error: ${e.message}`);
    });
    return child;
  }

  scheduleRestart(name, bin, args, opts, reason) {
    if (this.stopping) return;
    const n = (this.restarts.get(name) || 0) + 1;
    this.restarts.set(name, n);
    if (n > MAX_RESTARTS) {
      logger.error(`${name} ${reason}, max restarts (${MAX_RESTARTS}) reached, giving up`);
      return;
    }
    // 指数退避：5s, 10s, 20s ... 上限 60s
    const delay = Math.min(RESTART_BASE_MS * Math.pow(2, Math.min(n - 1, 4)), 60000);
    logger.warn(`${name} ${reason}, restart #${n} in ${delay / 1000}s`);
    const t = setTimeout(() => {
      if (!this.stopping) this.start(name, bin, args, opts);
    }, delay);
    this.timers.set(name, t);
  }

  /** 缺二进制重下：调用注册的 refetch，成功后重置该进程重启计数并拉起 */
  async refetch(name, args, opts) {
    if (this.stopping) return;
    const fn = this.refetchers.get(name);
    if (!fn) {
      // 没注册重下函数：退回普通重启（保持旧行为；bin 从重载参数里取不到就记 unknown）
      this.scheduleRestart(name, "<unknown-bin>", args, opts, "binary missing, no refetcher");
      return;
    }
    try {
      const freshBin = await fn();
      if (!freshBin) throw new Error("refetch returned empty");
      this.restarts.set(name, 0);
      logger.warn(`[OK] ${name} binary refetched: ${freshBin}`);
      if (!this.stopping) {
        const t = setTimeout(() => {
          if (!this.stopping) this.start(name, freshBin, args, opts);
        }, 3000);
        this.timers.set(name, t);
      }
    } catch (e) {
      logger.error(`${name} refetch failed: ${e.message}`);
      this.scheduleRestart(name, "", args, opts, `refetch failed: ${e.message}`);
    }
  }

  stop(name, silent = false) {
    const t = this.timers.get(name);
    if (t) {
      clearTimeout(t);
      this.timers.delete(name);
    }
    const child = this.children.get(name);
    if (child && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch {}
      if (!silent) logger.info(`stopped ${name}`);
    }
    this.children.delete(name);
  }

  stopAll() {
    this.stopping = true;
    for (const name of [...this.children.keys()]) this.stop(name);
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  check(bin, args = ["version"]) {
    const r = spawnSync(bin, args, { encoding: "utf8", timeout: 15000 });
    return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
  }

  isAlive(name) {
    const c = this.children.get(name);
    return !!c && c.exitCode === null && !c.killed;
  }
}

/** 启动日志脱敏：token/secret/password 不打明文。 */
function redactArgs(args) {
  const out = [];
  let maskNext = false;
  for (const a of args) {
    const s = String(a);
    if (maskNext) {
      out.push("***");
      maskNext = false;
      continue;
    }
    if (/^(--token|.*secret.*|.*password.*)$/i.test(s)) {
      out.push(s);
      maskNext = true;
      continue;
    }
    if (/^[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]+/.test(s) && s.includes(".")) {
      out.push("***"); // argo token 整坨
      continue;
    }
    out.push(s.length > 120 ? s.slice(0, 20) + "...***" : s);
  }
  return out;
}

/** 写 kit.txt（核心进程存活且 argo 就绪时；失败只告警） */
async function dumpKitFile(cfg, state) {
  if (!cfg.kitFile) return;
  try {
    const procsOk = state.runner.isAlive("sb-core") && state.runner.isAlive("edge-tunnel");
    if (!procsOk) {
      logger.debug("kit.txt skipped: core processes not alive yet");
      return;
    }
    const links = buildSubLinks(cfg, state);
    if (!links.length || links[0].startsWith("#")) {
      logger.debug("kit.txt skipped: argo domain not ready");
      return;
    }
    const body = [
      `# argo-kit nodes (${new Date().toISOString()})`,
      ...links,
      "",
    ].join("\n");
    await fs.writeFile(cfg.kitFile, body);
    logger.info(`kit nodes written: ${cfg.kitFile} (${links.length} links)`);
  } catch (e) {
    logger.warn(`kit.txt write failed: ${e.message}`);
  }
}


// ---- src/server.js ----
function startServer(cfg, state) {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost`);
    if (url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, ...state.status() }));
      return;
    }
    if (url.pathname === "/sub" || url.pathname === "/kit") {
      const links = buildSubLinks(cfg, state);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end(links.join("\n") + "\n");
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found\n");
  });

  server.listen(cfg.port, () => {
    logger.info(`http server listening on :${cfg.port} (/health /sub /kit)`);
  });
  return server;
}

function nodeTag(cfg, state, base) {
  const prefix = (state.getNodePrefix ? state.getNodePrefix() : "") || "NODE";
  return `${prefix}-${base}`;
}

function buildVlessLink(cfg, state) {
  const domain = state.getDomain();
  if (!domain) return null;
  const host = domain.replace(/^https?:\/\//, "");
  // 代理地址用 OPT_DOMAIN（默认 staticdelivery.nexusmods.com）
  const addr = (cfg.optDomain || "").trim() || host;
  const path = encodeURIComponent(cfg.wsPath);
  return (
    `vless://${cfg.uuid}@${addr}:443` +
    `?encryption=none&security=tls&sni=${host}&fp=chrome&type=ws&host=${host}&path=${path}#${nodeTag(cfg, state, "vless-argo")}`
  );
}

function buildDirectHost(manual, getter) {
  return ((manual || "").trim() || (getter ? getter() : "") || "").trim();
}

function buildHy2Link(cfg, state) {
  if (!state.isHy2Active || !state.isHy2Active()) return null;
  const host = buildDirectHost(cfg.hy2Host, state.getHy2Host);
  if (!host) return null;
  const params = new URLSearchParams();
  params.set("insecure", "1");
  params.set("sni", host);
  if (cfg.hy2Obfs) {
    params.set("obfs", "salamander");
    params.set("obfs-password", cfg.hy2Obfs);
  }
  return `hysteria2://${encodeURIComponent(cfg.hy2Password)}@${host}:${cfg.hy2Port}?${params.toString()}#${nodeTag(cfg, state, "hy2")}`;
}

function buildVlessDirectLink(cfg, state) {
  if (!state.isVlessDirectActive || !state.isVlessDirectActive()) return null;
  const host = buildDirectHost(cfg.vlessDirectHost, state.getVlessDirectHost);
  if (!host) return null;
  // sni 用配置的 VLESS_DIRECT_SNI（默认 www.nvidia.com），与 sing-box server_name 一致；自签证书需客户端跳过验证
  const sni = (cfg.vlessDirectSni || "www.nvidia.com").trim();
  const params = new URLSearchParams();
  params.set("encryption", "none");
  params.set("security", "tls");
  params.set("sni", sni);
  params.set("fp", "chrome");
  params.set("flow", "xtls-rprx-vision");
  params.set("allowInsecure", "1");
  return `vless://${cfg.uuid}@${host}:${cfg.vlessDirectPort}?${params.toString()}#${nodeTag(cfg, state, "vless-direct")}`;
}

function buildAnytlsLink(cfg, state) {
  if (!state.isAnytlsActive || !state.isAnytlsActive()) return null;
  const host = buildDirectHost(cfg.anytlsHost, state.getAnytlsHost);
  if (!host) return null;
  // 自签证书，sni 与服务端 server_name 对齐（固定 "direct"），客户端需 insecure
  const params = new URLSearchParams();
  params.set("security", "tls");
  params.set("sni", "direct");
  params.set("fp", "chrome");
  params.set("insecure", "1");
  return `anytls://${encodeURIComponent(cfg.anytlsPassword)}@${host}:${cfg.anytlsPort}?${params.toString()}#${nodeTag(cfg, state, "anytls")}`;
}

function buildSubLinks(cfg, state) {
  const links = [];
  const vless = buildVlessLink(cfg, state);
  if (vless) {
    links.push(vless);
  } else {
    links.push("# argo domain not ready yet");
  }
  const vd = buildVlessDirectLink(cfg, state);
  if (vd) links.push(vd);
  const at = buildAnytlsLink(cfg, state);
  if (at) links.push(at);
  const hy2 = buildHy2Link(cfg, state);
  if (hy2) links.push(hy2);
  return links;
}


// ---- index.js (main) ----
async function main() {
  // 防检测：ps 显示为 node 而不是带参长的 index.js 路径
  try {
    process.title = "node";
  } catch {}
  let cfg;
  try {
    cfg = loadConfig();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  setLogLevel(cfg.logLevel);
  setQuiet(cfg.quiet);

  const runner = new Runner();
  const startedAt = Date.now();
  let domain = cfg.argoMode === "token" ? `https://${cfg.argoDomain}` : null;
  let cfProbe = null;
  const monitorState = {
    nezha: cfg.nezhaEnabled ? "pending" : "disabled",
    komari: cfg.komariEnabled ? "pending" : "disabled",
  };
  const getDomain = () => domain;
  // 直连协议状态在下面第 2 步才确定；server 先挂占位闭包，启动后通过 rebind 更新
  const live = {
    hy2Active: false, vlessDirectActive: false, anytlsActive: false,
    directAutoHost: "", nodePrefix: "NODE",
  };

  const server = startServer(cfg, {
    getDomain,
    isHy2Active: () => live.hy2Active,
    isVlessDirectActive: () => live.vlessDirectActive,
    isAnytlsActive: () => live.anytlsActive,
    getHy2Host: () => ((cfg.hy2Host || "").trim() || live.directAutoHost),
    getVlessDirectHost: () => ((cfg.vlessDirectHost || "").trim() || live.directAutoHost),
    getAnytlsHost: () => ((cfg.anytlsHost || "").trim() || live.directAutoHost),
    getNodePrefix: () => live.nodePrefix,
    status: () => ({
      uptime_s: Math.floor((Date.now() - startedAt) / 1000),
      argo_mode: cfg.argoMode,
      domain,
      node_prefix: live.nodePrefix,
      singbox: runner.children.has("sb-core"),
      cloudflared: runner.children.has("edge-tunnel"),
      hy2_enabled: cfg.hy2Enabled,
      hy2_active: live.hy2Active,
      hy2_reason: hy2Reason,
      hy2_host: (cfg.hy2Host || "").trim() || live.directAutoHost || "",
      hy2_password_auto: !!cfg.hy2PasswordAuto,
      vless_direct_enabled: cfg.vlessDirectEnabled,
      vless_direct_active: live.vlessDirectActive,
      vless_direct_reason: vlessDirectReason,
      vless_direct_host: (cfg.vlessDirectHost || "").trim() || live.directAutoHost || "",
      anytls_enabled: cfg.anytlsEnabled,
      anytls_active: live.anytlsActive,
      anytls_reason: anytlsReason,
      anytls_host: (cfg.anytlsHost || "").trim() || live.directAutoHost || "",
      anytls_password_auto: !!cfg.anytlsPasswordAuto,
      nezha_enabled: cfg.nezhaEnabled,
      nezha_state: monitorState.nezha,
      nezha_running: runner.children.has("sys-monitor"),
      komari_enabled: cfg.komariEnabled,
      komari_state: monitorState.komari,
      komari_running: runner.children.has("node-monitor"),
      ...(cfProbe ? cfProbe.getStatus() : { cf_enabled: cfg.cfEnabled, cf_running: false }),
    }),
  });

  const shutdown = () => {
    logger.info("shutting down...");
    if (cfProbe) cfProbe.stop();
    runner.stopAll();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // 1. core binaries
  const singboxBin = await ensureSingBox(cfg);
  const cloudflaredBin = await ensureCloudflared(cfg);

  // 2. 直连协议：hy2(UDP)/vless-direct(TCP)/anytls(TCP) —— 与 hy2 相同处理：
  //    填端口即开，密码自动派生，HOST 自动获取公网 IP，失败只警告降级，不断线。
  //    三协议共享同一份自签 cert（tlsCert），任一开启都触发 cert 生成。
  let tlsCert = null;
  let hy2Reason = cfg.hy2Enabled ? "pending" : "disabled";
  let vlessDirectReason = cfg.vlessDirectEnabled ? "pending" : "disabled";
  let anytlsReason = cfg.anytlsEnabled ? "pending" : "disabled";
  const needTls = cfg.hy2Enabled || cfg.vlessDirectEnabled || cfg.anytlsEnabled;
  if (needTls) {
    tlsCert = await ensureSelfSignedCert(cfg);
    if (!tlsCert) {
      const msg = "cert unavailable (no openssl)";
      if (cfg.hy2Enabled) { hy2Reason = msg; logger.warn(`hysteria2 disabled: ${msg}`); }
      if (cfg.vlessDirectEnabled) { vlessDirectReason = msg; logger.warn(`vless-direct disabled: ${msg}`); }
      if (cfg.anytlsEnabled) { anytlsReason = msg; logger.warn(`anytls disabled: ${msg}`); }
    }
  }
  if (tlsCert && cfg.hy2Enabled) {
    const probe = await probeUdp(cfg.hy2Port);
    if (!probe.ok) {
      hy2Reason = `udp-unavailable: ${probe.reason}`;
      logger.warn(`hysteria2 disabled: UDP :${cfg.hy2Port} unavailable`);
    } else {
      live.hy2Active = true;
      hy2Reason = "active";
      logger.info(`hysteria2 enabled on :${cfg.hy2Port}`);
    }
  }
  if (tlsCert && cfg.vlessDirectEnabled) {
    const probe = await probeTcp(cfg.vlessDirectPort);
    if (!probe.ok) {
      vlessDirectReason = `tcp-unavailable: ${probe.reason}`;
      logger.warn(`vless-direct disabled: TCP :${cfg.vlessDirectPort} unavailable`);
    } else {
      live.vlessDirectActive = true;
      vlessDirectReason = "active";
      logger.info(`vless-direct enabled on :${cfg.vlessDirectPort}`);
    }
  }
  if (tlsCert && cfg.anytlsEnabled) {
    const probe = await probeTcp(cfg.anytlsPort);
    if (!probe.ok) {
      anytlsReason = `tcp-unavailable: ${probe.reason}`;
      logger.warn(`anytls disabled: TCP :${cfg.anytlsPort} unavailable`);
    } else {
      live.anytlsActive = true;
      anytlsReason = "active";
      logger.info(`anytls enabled on :${cfg.anytlsPort}`);
    }
  }
  // 公网 IPv4 只获取一次，三直连协议共用；手动 HOST 优先，见 buildDirectHost()
  // 国家码顺手取一次，给节点名称前缀用（默认国家码，如 JP；失败回退 IP 末段）
  let nodeCc = "";
  if ((live.hy2Active && !cfg.hy2Host) || (live.vlessDirectActive && !cfg.vlessDirectHost) || (live.anytlsActive && !cfg.anytlsHost)) {
    live.directAutoHost = await detectPublicIp();
    if (live.directAutoHost) logger.info(`direct public host: ${live.directAutoHost}`);
    else logger.warn("public IP detect failed, direct links skipped (fill *_HOST manually)");
  }
  if (!cfg.nodePrefix || cfg.nodePrefix.trim() === "" || cfg.nodePrefix.trim().toLowerCase() === "custom") {
    nodeCc = await detectCountry();
    if (nodeCc) logger.info(`node country: ${nodeCc}`);
  }
  // 手动前缀非空（且非 custom）则跳过国家码请求，直接用手动值
  live.nodePrefix = nodePrefixFor(cfg, nodeCc, live.directAutoHost || cfg.hy2Host || cfg.vlessDirectHost || cfg.anytlsHost || "");
  logger.info(`node prefix: ${live.nodePrefix}`);
  // sing-box 只装配真正 active 的协议：cert 有但端口被占的，不进 config
  const sbTls = (live.hy2Active || live.vlessDirectActive || live.anytlsActive) ? tlsCert : null;
  if (cfg.hy2Enabled && !live.hy2Active) cfg.hy2Enabled = false;
  if (cfg.vlessDirectEnabled && !live.vlessDirectActive) cfg.vlessDirectEnabled = false;
  if (cfg.anytlsEnabled && !live.anytlsActive) cfg.anytlsEnabled = false;

  // 3. sing-box config + check
  const sbPath = await writeSingBoxConfig(cfg, ".", sbTls);
  const chk = runner.check(singboxBin, ["check", "-c", sbPath]);
  if (!chk.ok) {
    logger.error(`sing-box check failed:\n${chk.out}`);
    process.exit(1);
  }

  // 4. start sing-box（注册 TTL 缺二进制重下）
  runner.onMissingBinary("sb-core", async () => {
    const fresh = await ensureSingBox(cfg);
    markFreshBinary(fresh);
    return fresh;
  });
  runner.start("sb-core", singboxBin, ["run", "-c", sbPath]);

  // 5. start cloudflared（注册 TTL 缺二进制重下）
  runner.onMissingBinary("edge-tunnel", async () => {
    const fresh = await ensureCloudflared(cfg);
    markFreshBinary(fresh);
    return fresh;
  });
  const t = buildTunnelArgs(cfg, cloudflaredBin);
  const child = runner.start("edge-tunnel", t.bin, t.args);
  if (cfg.argoMode === "temp") {
    watchTunnelOutput(child, (d) => {
      domain = d;
    });
  } else {
    logger.info(`argo fixed domain: https://${cfg.argoDomain}`);
  }

  // 6. monitors (best-effort, never fatal)
  if (cfg.nezhaEnabled) {
    try {
      const bin = await ensureNezha(cfg);
      const yaml = await writeNezhaYaml(cfg);
      runner.onMissingBinary("sys-monitor", async () => {
        const fresh = await ensureNezha(cfg);
        markFreshBinary(fresh);
        return fresh;
      });
      runner.start("sys-monitor", bin, nezhaArgs(yaml));
      monitorState.nezha = "started";
    } catch (e) {
      monitorState.nezha = `failed: ${String(e.message).slice(0, 200)}`;
      logger.warn(`nezha-agent disabled: ${e.message}`);
    }
  }
  if (cfg.komariEnabled) {
    try {
      const bin = await ensureKomari(cfg);
      runner.onMissingBinary("node-monitor", async () => {
        const fresh = await ensureKomari(cfg);
        markFreshBinary(fresh);
        return fresh;
      });
      runner.start("node-monitor", bin, komariArgs(cfg));
      monitorState.komari = "started";
    } catch (e) {
      monitorState.komari = `failed: ${String(e.message).slice(0, 200)}`;
      logger.warn(`komari-agent disabled: ${e.message}`);
    }
  }
  if (cfg.cfEnabled) {
    cfProbe = createCfProbe(cfg);
    cfProbe.start();
  }

  // 7. kit.txt：argo 就绪后（域名分配到）且核心进程存活时落盘；此后每 60s 刷新一次
  const kitState = {
    getDomain: () => domain,
    isHy2Active: () => live.hy2Active,
    isVlessDirectActive: () => live.vlessDirectActive,
    isAnytlsActive: () => live.anytlsActive,
    getHy2Host: () => ((cfg.hy2Host || "").trim() || live.directAutoHost),
    getVlessDirectHost: () => ((cfg.vlessDirectHost || "").trim() || live.directAutoHost),
    getAnytlsHost: () => ((cfg.anytlsHost || "").trim() || live.directAutoHost),
    getNodePrefix: () => live.nodePrefix,
    runner,
  };
  const kitTick = () => dumpKitFile(cfg, kitState);
  if (cfg.kitFile) {
    const kitTimer = setInterval(kitTick, 60000);
    if (kitTimer.unref) kitTimer.unref();
    // 首次延迟 15s，等 cloudflared 注册域名
    const once = setTimeout(kitTick, 15000);
    if (once.unref) once.unref();
  }

  // 关键状态行：QUIET=1 也显示（进程级成功/失败结果）
  const ok = (m) => logger.warn(`[OK] ${m}`);
  ok(`all started (argo:${cfg.argoMode} hy2:${live.hy2Active ? "on" : "off"} vless-direct:${live.vlessDirectActive ? "on" : "off"} anytls:${live.anytlsActive ? "on" : "off"} cf:${cfg.cfEnabled ? "on" : "off"} nezha:${monitorState.nezha} komari:${monitorState.komari})`);

  // 8. 本地二进制 TTL：全部子进程已 spawn（文件已加载进内存）后开始计时，到期删除本次下载的二进制
  scheduleBinaryTtl(cfg, runner);
}

main().catch((e) => {
  logger.error(e.stack || e.message);
  process.exit(1);
});
