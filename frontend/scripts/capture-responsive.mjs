import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import "../../backend/dist/config/env.js";

const [{ issueAuthToken }, { prisma }, { env }] = await Promise.all([
  import("../../backend/dist/auth/auth-token.js"),
  import("../../backend/dist/database/prisma.js"),
  import("../../backend/dist/config/env.js"),
]);
const manager = await prisma.user.findUniqueOrThrow({ where: { email: "manager@stocksense.local" }, select: { id: true } });
const token = await issueAuthToken(manager.id);
await prisma.$disconnect();

const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
if (!edge) throw new Error("Microsoft Edge is not installed in a standard location.");
const profile = mkdtempSync(join(tmpdir(), "stocksense-phase10-"));
const port = 9300 + (process.pid % 500);
const browser = spawn(edge, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--disable-gpu", "--no-first-run", "--window-size=360,800"], { stdio: "ignore", windowsHide: true });
const pause = (ms) => new Promise((resolvePause) => setTimeout(resolvePause, ms));
async function retry(url, options) { for (let attempt = 0; attempt < 60; attempt += 1) { try { const response = await fetch(url, options); if (response.ok) return response; } catch {} await pause(500); } throw new Error(`Edge debugging endpoint did not become ready: ${url}`); }

const page = await (await retry(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5173/`, { method: "PUT" })).json();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => { socket.onopen = resolveOpen; socket.onerror = rejectOpen; });
let sequence = 0;
const pending = new Map();
socket.onmessage = (event) => { const message = JSON.parse(event.data); if (!message.id) return; const callback = pending.get(message.id); pending.delete(message.id); if (message.error) callback?.reject(new Error(message.error.message)); else callback?.resolve(message.result); };
function send(method, params = {}) { const id = ++sequence; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolveSend, rejectSend) => pending.set(id, { resolve: resolveSend, reject: rejectSend })); }

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const output = join(projectRoot, "docs", "evidence", "phase10");
mkdirSync(output, { recursive: true });
await send("Network.enable");
await send("Network.setCookie", { name: env.AUTH_COOKIE_NAME, value: token, url: "http://127.0.0.1:5173", httpOnly: true, sameSite: "Lax" });
await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
await send("Page.enable");
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await pause(2500);
const routes = [{ name: "dashboard", path: "/" }, { name: "products", path: "/products" }, { name: "record-stock", path: "/inventory/new" }, { name: "history", path: "/history" }, { name: "reports", path: "/reports" }, { name: "assistant", path: "/assistant" }];
const audit = [];
for (const route of routes) {
  await send("Page.navigate", { url: `http://127.0.0.1:5173${route.path}` });
  await pause(route.name === "dashboard" || route.name === "products" ? 2800 : 1600);
  const evaluation = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => { const controls=[...document.querySelectorAll('button,a,input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}); const unnamed=controls.filter(e=>!((e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').trim())&&!(e.labels&&e.labels.length)); const small=controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<40||r.height<40}); return { path:location.pathname, viewport:{width:innerWidth,height:innerHeight}, documentWidth:document.documentElement.scrollWidth, horizontalOverflow:document.documentElement.scrollWidth>innerWidth, unnamedControls:unnamed.map(e=>e.outerHTML.slice(0,180)), smallControls:small.map(e=>({tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim(),width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)})) }; })()` });
  audit.push({ name: route.name, ...evaluation.result.value });
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(output, `${route.name}-360.png`), Buffer.from(screenshot.data, "base64"));
}
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await pause(1600);
await send("Runtime.evaluate", { expression: "document.querySelector('.mobile-menu')?.click()" });
await pause(250);
const navigation = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
writeFileSync(join(output, "navigation-open-360.png"), Buffer.from(navigation.data, "base64"));
writeFileSync(join(output, "responsive-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), width: 360, height: 800, routes: audit }, null, 2));
console.log(JSON.stringify(audit, null, 2));
socket.close();
browser.kill();
await Promise.race([new Promise((resolveExit) => browser.once("exit", resolveExit)), pause(1500)]);
const resolvedProfile = resolve(profile);
if (resolvedProfile.startsWith(resolve(tmpdir()))) { try { rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { console.warn("Temporary Edge profile will be cleaned by the operating system."); } }
