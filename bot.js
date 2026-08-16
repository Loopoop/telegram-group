const TelegramBot = require("node-telegram-bot-api").default;
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();
// Replace with your real bot token from BotFather
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  throw new Error("Missing TELEGRAM_TOKEN in .env");
}

// Create a bot that uses polling to fetch new messages.
// autoStart lets us patch a deprecated library alias before polling begins.
const bot = new TelegramBot(token, { polling: { autoStart: false } });
bot.deleteWebHook = bot.deleteWebhook.bind(bot);

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Hello! I am your Telegram bot!");
});

bot.onText(/\/rules/, (msg) => {
  bot.sendMessage(msg.chat.id, formatGroupRules());
});

bot.on("callback_query", async (query) => {
  await handleAnswerChoice(query);
});

// Respond to any text message
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (await moderateGroupMessage(msg)) return;

  if (typeof text === "string" && !text.startsWith("/")) {
    const handle = await handleUserInput(chatId, text);
    if (handle) {
      bot.sendMessage(chatId, handle);
    }
  }
});

let knowledge = require("./Aidata");
const memoryFile = path.join(__dirname, "learned-memory.json");

function loadLearnedMemory() {
  try {
    if (!fs.existsSync(memoryFile)) return {};
    const data = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.error("Could not load learned memory:", error.message);
    return {};
  }
}

function saveLearnedMemory() {
  fs.writeFileSync(memoryFile, `${JSON.stringify(memory, null, 2)}\n`);
}

let memory = loadLearnedMemory();
const chatStates = new Map();
const moderationStates = new Map();

const groupRules = [
  "No spam, repeated messages, or flooding.",
  "No suspicious links, invite links, or unsolicited promotion.",
  "No insults, hate speech, threats, or harassment.",
  "No excessive caps or disruptive messages.",
];

const moderationConfig = {
  maxWarnings: 2,
  floodWindowMs: 10 * 1000,
  maxMessagesInWindow: 5,
  repeatWindowMs: 60 * 1000,
  muteMinutes: 10,
  bannedWords: [
    "scam",
    "free money",
    "click here",
    "join my channel",
    "crypto pump",
  ],
};

const onlineSearchConfig = {
  timeoutMs: 6000,
  localConfidenceThreshold: 0.45,
};

function formatGroupRules() {
  return `Group rules:\n${groupRules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}`;
}

function isGroupChat(chat) {
  return chat && (chat.type === "group" || chat.type === "supergroup");
}

function getModerationKey(chatId, userId) {
  return `${chatId}:${userId}`;
}

function getModerationState(chatId, userId) {
  const key = getModerationKey(chatId, userId);
  if (!moderationStates.has(key)) {
    moderationStates.set(key, {
      warnings: 0,
      messages: [],
      lastTexts: [],
      mutedUntil: 0,
    });
  }
  return moderationStates.get(key);
}

function getDisplayName(user) {
  if (!user) return "Member";
  return user.username ? `@${user.username}` : user.first_name || "Member";
}

async function isChatAdmin(chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ["creator", "administrator"].includes(member.status);
  } catch (error) {
    console.error("Could not check admin status:", error.message);
    return false;
  }
}

function detectRuleViolations(text, state) {
  const now = Date.now();
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const reasons = [];

  state.messages = state.messages.filter(
    (item) => now - item.timestamp <= moderationConfig.floodWindowMs,
  );
  state.lastTexts = state.lastTexts.filter(
    (item) => now - item.timestamp <= moderationConfig.repeatWindowMs,
  );

  state.messages.push({ timestamp: now });
  state.lastTexts.push({ text: normalized, timestamp: now });

  const repeatCount = state.lastTexts.filter(
    (item) => item.text === normalized,
  ).length;
  const hasSuspiciousLink =
    /(https?:\/\/|www\.|t\.me\/|telegram\.me\/|bit\.ly|tinyurl|discord\.gg)/i.test(
      text,
    );
  const upperLetters = text.replace(/[^A-Z]/g, "").length;
  const letters = text.replace(/[^a-zA-Z]/g, "").length;
  const capsRatio = letters > 0 ? upperLetters / letters : 0;
  const hasBannedPhrase = moderationConfig.bannedWords.some((word) =>
    normalized.includes(word),
  );

  if (state.messages.length > moderationConfig.maxMessagesInWindow) {
    reasons.push("flooding the chat");
  }
  if (normalized.length > 5 && repeatCount >= 3) {
    reasons.push("sending the same message repeatedly");
  }
  if (hasSuspiciousLink) {
    reasons.push("posting suspicious links or invites");
  }
  if (letters >= 18 && capsRatio > 0.7) {
    reasons.push("using excessive capital letters");
  }
  if (hasBannedPhrase) {
    reasons.push("breaking the group rules");
  }

  return [...new Set(reasons)];
}

async function warnOrRestrictUser(msg, state, reasons) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const name = getDisplayName(msg.from);
  state.warnings += 1;

  try {
    await bot.deleteMessage(chatId, msg.message_id);
  } catch (error) {
    console.error("Could not delete violating message:", error.message);
  }

  if (state.warnings <= moderationConfig.maxWarnings) {
    const remaining = moderationConfig.maxWarnings - state.warnings;
    const nextAction =
      remaining > 0
        ? `${remaining} more warning${remaining === 1 ? "" : "s"} before a mute.`
        : "The next violation will mute you.";
    await bot.sendMessage(
      chatId,
      `${name}, warning ${state.warnings}/${moderationConfig.maxWarnings}: ${reasons.join(", ")}. ${nextAction}`,
    );
    return;
  }

  const until =
    Math.floor(Date.now() / 1000) + moderationConfig.muteMinutes * 60;
  state.mutedUntil = until * 1000;

  try {
    await bot.restrictChatMember(
      chatId,
      userId,
      {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
      { until_date: until },
    );
    await bot.sendMessage(
      chatId,
      `${name} has been muted for ${moderationConfig.muteMinutes} minutes after repeated rule violations.`,
    );
  } catch (error) {
    console.error("Could not restrict member:", error.message);
    await bot.sendMessage(
      chatId,
      `${name} has passed the warning limit, but I need admin permission to mute members.`,
    );
  }
}

async function moderateGroupMessage(msg) {
  if (!isGroupChat(msg.chat) || !msg.from || msg.from.is_bot) return false;
  if (typeof msg.text !== "string" || msg.text.startsWith("/")) return false;
  if (await isChatAdmin(msg.chat.id, msg.from.id)) return false;

  const state = getModerationState(msg.chat.id, msg.from.id);
  const reasons = detectRuleViolations(msg.text, state);

  if (reasons.length === 0) return false;

  await warnOrRestrictUser(msg, state, reasons);
  return true;
}

const synonyms = {
  engine: ["power", "powerplant"],
  sensor: ["detector", "transducer"],
  injector: ["fuel nozzle"],
  ecu: ["computer", "engine control unit", "module"],
  maf: ["mass airflow", "mass air flow"],
  map: ["manifold,pressure"],
  car: ["vehicle", "auto", "automobile"],
  obd: ["diagnostics", "code reader"],
  battery: ["cell", "power source"],
  overheating: ["hot", "heat up", "overheat"],
  shaking: ["vibrating", "trembling", "wobbling"],
  knocking: ["pinging", "detonation", "rattling", "knock"],
  motor: ["electric motor", "motors"],
  crankshaft: ["crank", "shaft"],
  thank: ["thanks", "thank's"],
  hi: ["hii"],
  creator: ["creat", "maker", "made", "joe", "created"],
  ev: ["electric car", "electric vehicle"],
  fact: ["facts"],
  supercharger: ["super charger"],
  turbocharger: ["turbo charger"],
  agi: ["artifitial general inteligence"],
  llm: ["large language model"],
  nlp: ["natural language processing"],
  iot: ["internet of things"],
  code: ["codding", "coding"],
  hybrid: ["hybrid car"],
};

let topicExtract = [
  "engine",
  "piston",
  "crankshaft",
  "camshaft",
  "rotary engine",
  "boxer engine",
  "motor",
  "battery",
  "ai",
  "programing",
  "artifitial inteligence",
];

const stopWords = [
  "what",
  "the",
  "is",
  "at",
  "does",
  "a",
  "an",
  "in",
  "on",
  "and",
];

function removeStopWords(text) {
  return text
    .split(" ")
    .filter((word) => !stopWords.includes(word))
    .join(" ");
}

const embeddings = {
  car: [0.8, 0.5, 0.7],
  fact: [0.5, 0.7, 0.8],
  turbocharger: [0.8, 0.7, 0.5],
  supercharger: [0.85, 0.75, 0.6],
  "vtt system": [0.7, 0.65, 0.55],
  dct: [0.72, 0.68, 0.6],
  cvt: [0.78, 0.74, 0.65],
  fuel: [0.8, 0.75, 0.72],
  throttle: [0.75, 0.7, 0.6],
  phev: [0.7, 0.65, 0.55],
  bms: [0.76, 0.68, 0.61],
  "electric vehicle": [0.85, 0.78, 0.7],
  "mass air flow sensor": [0.77, 0.71, 0.6],
  "oxygen sensor": [0.82, 0.7, 0.65],
  inverter: [0.75, 0.65, 0.6],
  battery: [0.6, 0.7, 0.8],
  engine: [0.9, 0.8, 0.7],
  motor: [0.7, 0.8, 0.6],
  brake: [0.4, 0.6, 0.5],
  accelerate: [0.2, 0.8, 0.6],
  wheel: [0.5, 0.4, 0.7],
  gearbox: [0.6, 0.5, 0.3],
  transmission: [0.7, 0.6, 0.4],
  hybrid: [0.75, 0.6, 0.5],
  electric: [0.85, 0.75, 0.7],
  speed: [0.5, 0.3, 0.8],
  crankshaft: [0.6, 0.7, 0.8],
  creator: [0.4, 0.7, 0.6],
  clutch: [0.65, 0.75, 0.5],
  piston: [0.9, 0.7, 0.8],
  how: [0.8, 0.7, 0.2],
  work: [0.5, 0.6, 0.4],
  camshaft: [0.8, 0.6, 0.7],
  belt: [0.75, 0.65, 0.6],
  plug: [0.85, 0.7, 0.75],
  coolant: [0.8, 0.65, 0.6],
  differential: [0.7, 0.8, 0.6],
  filter: [0.6, 0.5, 0.7],
  abs: [0.75, 0.85, 0.65],
  ecu: [0.9, 0.8, 0.7],
  converter: [0.8, 0.7, 0.65],
  suspension: [0.7, 0.6, 0.8],
  absorber: [0.75, 0.6, 0.7],
  pump: [0.65, 0.7, 0.6],
  system: [0.6, 0.5, 0.7],
  radiator: [0.7, 0.6, 0.8],
  airbag: [0.9, 0.7, 0.6],
  "traction control": [0.75, 0.6, 0.7],
  "cruise control": [0.8, 0.7, 0.6],
  "traction control system": [0.75, 0.65, 0.7],
  "brake fluid": [0.65, 0.6, 0.7],
  "tire pressure": [0.6, 0.5, 0.8],
  "regenerative braking": [0.8, 0.75, 0.6],
  torque: [0.8, 0.7, 0.9],
  horsepower: [0.85, 0.75, 0.65],
  aerodynamics: [0.75, 0.8, 0.7],
  manual: [0.6, 0.7, 0.5],
  automatic: [0.7, 0.6, 0.5],
  gear: [0.7, 0.6, 0.4],
  powertrain: [0.8, 0.7, 0.6],
  pneumatic: [0.65, 0.75, 0.8],
  pulley: [0.7, 0.6, 0.5],
  chain: [0.75, 0.65, 0.7],
  alternator: [0.8, 0.6, 0.7],
  "fuel tank": [0.65, 0.6, 0.7],
  dynamo: [0.6, 0.7, 0.8],
  rotary: [0.85, 0.75, 0.6],
  boxer: [0.8, 0.7, 0.65],
  Wankel: [0.9, 0.8, 0.7],
  diesel: [0.7, 0.6, 0.75],
  petrol: [0.75, 0.7, 0.6],
  position: [0.7, 0.6, 0.5],
  block: [0.75, 0.65, 0.7],
  wiper: [0.6, 0.5, 0.7],
  reservoir: [0.7, 0.6, 0.7],
  air: [0.75, 0.6, 0.65],
  filter: [0.6, 0.5, 0.7],
  headlights: [0.8, 0.7, 0.6],
  taillights: [0.7, 0.6, 0.5],
  signal: [0.65, 0.5, 0.6],
  drivetrain: [0.75, 0.8, 0.7],
  "all-wheel": [0.8, 0.7, 0.9],
  "four-wheel": [0.85, 0.75, 0.8],
  "front-wheel": [0.7, 0.6, 0.75],
  "rear-wheel": [0.75, 0.7, 0.65],
  "plug-in": [0.65, 0.55, 0.5],
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(input) {
  input = input.toLowerCase();
  // Replace multi-word synonyms first
  for (let key in synonyms) {
    for (let synonym of synonyms[key]) {
      const pattern = new RegExp(`\\b${escapeRegex(synonym)}\\b`, "gi");
      input = input.replace(pattern, key);
    }
  }
  // Then split into words and stem
  let arr2 = input.split(/\s+/).map((word) => stem(word));
  return arr2.filter((word) => {
    if (word != "") {
      return word;
    }
  });
}

function stem(word) {
  word = removeStopWords(word);
  if (word == "") return;
  return word.replace(/(ing|ed|s|ly|es)$/, "");
}

/*function tokenize(text) {
  let wor = normalizeInput(text)
  console.log("w=> "+wor)
  let words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .map(stem);
  
  //alert("w=>"+words)
  return words.flatMap(word => {
    for (let key in synonyms) {
      if (synonyms[key].includes(word)) return [stem(key)];
    }
    return [word];
  });
}*/

function similarityScore(a, b) {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  const common = [...tokensA].filter((word) => tokensB.has(word));
  return common.length / Math.max(tokensA.size, 1);
}

function getAttentionScore(context, input) {
  const keywords = tokenize(input);
  let entries = Object.entries(context);

  return entries
    .map((item) => {
      let score = -1;
      const key = Object.keys(item);
      keywords.forEach((word, index) => {
        if (item[0].toLowerCase().includes(word)) {
          score++;
        }
      });
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);
}

function checkWordFlow(input, joe) {
  let keyword = tokenize(input);
  let indexes = [];
  keyword.forEach((key) => {
    if (joe.includes(key)) {
      let inde = joe.indexOf(key);
      indexes.push(inde);
    }
  });
  return indexes;
}

function checkScore(jim) {
  let score = 0;
  jim.forEach((num, index) => {
    if (num == jim[index + 1] - 1) {
      score++;
    }
  });
  return score;
}

function checkFlowOfAll(context, input) {
  const keywords = tokenize(input);
  let entries = Object.entries(context);
  return entries
    .map((item) => {
      let joe = item[0].toLowerCase().split(/\W+/);
      let jim = checkWordFlow(input, joe);
      let checkscore = checkScore(jim);
      return { item, checkscore };
    })
    .sort((a, b) => b.checkscore - a.checkscore);
}

let contextWindow = [];
function addTopic(input) {
  contextWindow = [];
  let keywords = input;
  topicExtract.forEach((topic) => {
    if (keywords.includes(topic)) {
      contextWindow.push(topic);
    }
  });
}

function getTopic(input) {
  let match = null;
  let output = input;
  topicExtract.forEach((topic) => {
    if (contextWindow.length > 0) {
      const last = contextWindow.length > 0 ? contextWindow.length - 1 : "";
      if (contextWindow[last].includes(topic)) {
        output = input.replace("it", topic);
      }
    }
  });
  return output;
}

function cosineSim(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB || 1);
}

function smartEmbeddingAttention(input, question) {
  const inputTokens = tokenize(input).filter((w) => embeddings[w]);

  const questionTokens = tokenize(question).filter((w) => embeddings[w]);

  if (inputTokens.length === 0 || questionTokens.length === 0) return 0;

  let totalSim = 0;

  inputTokens.forEach((inputWord) => {
    let maxSim = 0;
    questionTokens.forEach((qWord) => {
      const sim = cosineSim(embeddings[inputWord], embeddings[qWord]);
      if (sim > maxSim) maxSim = sim;
    });
    totalSim += maxSim;
  });

  // Normalize by number of input tokens
  return totalSim / inputTokens.length;
}

function keywordMatchScore(input, question) {
  const inputWords = new Set(tokenize(input));
  const questionWords = new Set(tokenize(question));
  let matchCount = 0;

  if (questionWords.size === 0) return 0;

  questionWords.forEach((word) => {
    if (inputWords.has(word)) matchCount++;
  });

  return matchCount / questionWords.size;
}

const contextMem = []; // store recent { input, question, timestamp }

function contextMemoryScore(input, question) {
  for (let i = contextMem.length - 1; i >= 0; i--) {
    if (contextMem[i].input === input && contextMem[i].question === question) {
      // Recently seen exact match = high score
      return 1;
    } else if (contextMem[i].question === question) {
      // Previously seen = medium score
      return 0.5;
    }
  }
  return 0;
}

function getContextRanking(input, knowledgeBase) {
  return Object.keys(knowledgeBase)
    .map((key) => {
      const embScore = smartEmbeddingAttention(input, key);
      const keywordScore = keywordMatchScore(input, key);
      const contextScore = contextMemoryScore(input, key);

      const totalScore =
        embScore * 0.6 + keywordScore * 0.3 + contextScore * 0.1;

      return {
        question: key,
        answer: knowledgeBase[key],
        score: totalScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function updateContextMemory(input, matchedQuestion) {
  contextMem.push({ input, question: matchedQuestion, timestamp: Date.now() });
  if (contextMem.length > 20) contextMem.shift();
}

function findNewWords(input, knowledgeBase, response) {
  let words = tokenize(input); // should return array of words
  let unknownWords = [];

  words.forEach((word) => {
    let found = false;
    for (let key in knowledgeBase) {
      key = tokenize(key);
      if (key.includes(word)) {
        found = true;
        break;
      }
    }
    if (!found) {
      unknownWords.push(word);
    }
  });

  if (unknownWords.length > 0) {
    if (response && response.all === 1 && response.ans) {
      const userConfirmed = getUserFeedback(response.ans);
      if (userConfirmed === "yes") {
        knowledgeBase[input.toLowerCase()] = response.ans;
        console.log(Object.entries(knowledge));
      }
    }
  }
}

let speech = null;

function getChatState(chatId) {
  if (!chatStates.has(chatId)) {
    chatStates.set(chatId, {
      history: [],
      pendingLearning: null,
      pendingChoice: null,
      topics: [],
      lastQuestion: null,
      lastAnswerKey: null,
    });
  }
  return chatStates.get(chatId);
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rememberTurn(state, role, text) {
  state.history.push({ role, text, timestamp: Date.now() });
  if (state.history.length > 12) state.history.shift();
}

function learnAnswer(question, answer) {
  const cleanQuestion = normalizeText(question);
  const cleanAnswer = answer.trim();
  if (!cleanQuestion || !cleanAnswer) return false;

  memory[cleanQuestion] = cleanAnswer;
  saveLearnedMemory();
  return true;
}

function parseTeachCommand(text) {
  const match = text.match(/^teach\s*:\s*(.+?)\s*(?:=>|=|-{2,}|:)\s*(.+)$/i);
  if (!match) return null;
  return { question: match[1].trim(), answer: match[2].trim() };
}

function extractTopics(input) {
  const normalized = normalizeText(input);
  const tokens = new Set(tokenize(normalized));
  const topics = [];

  topicExtract.forEach((topic) => {
    const topicTokens = tokenize(topic);
    if (
      normalized.includes(topic) ||
      topicTokens.some((token) => tokens.has(token))
    ) {
      topics.push(topic);
    }
  });

  Object.keys(embeddings).forEach((topic) => {
    if (tokens.has(topic) && !topics.includes(topic)) topics.push(topic);
  });

  return topics.slice(0, 5);
}

function updateChatTopics(state, input) {
  const topics = extractTopics(input);
  if (topics.length === 0) return;

  state.topics = [
    ...topics,
    ...state.topics.filter((topic) => !topics.includes(topic)),
  ].slice(0, 8);
}

function resolveContextReferences(input, state) {
  if (state.topics.length === 0) return input;
  const topic = state.topics[0];
  return input.replace(/\b(it|that|this|they|them)\b/gi, topic);
}

function detectEmotion(text) {
  const positive = ["great", "awesome", "thank", "perfect", "good", "nice"];
  const negative = [
    "bad",
    "sad",
    "frustrated",
    "angry",
    "problem",
    "broken",
    "fail",
  ];
  const tokens = tokenize(text);

  if (tokens.some((token) => negative.includes(token))) {
    return "Sorry about that. ";
  }
  if (tokens.some((token) => positive.includes(token))) {
    return "Glad to help. ";
  }
  return "";
}

function topicAttentionScore(question, state) {
  if (!state || state.topics.length === 0) return 0;
  const questionTokens = new Set(tokenize(question));

  return state.topics.reduce((score, topic, index) => {
    const weight = Math.max(0.1, 1 - index * 0.15);
    const topicTokens = tokenize(topic);
    return topicTokens.some((token) => questionTokens.has(token))
      ? score + weight
      : score;
  }, 0);
}

function answerCandidateScore(input, question, state) {
  const inputTokens = tokenize(input);
  const questionTokens = tokenize(question);
  const flowScore =
    checkScore(checkWordFlow(input, questionTokens)) /
    Math.max(inputTokens.length - 1, 1);
  const exactBoost = normalizeText(input) === normalizeText(question) ? 1 : 0;
  const memoryBoost = state.lastAnswerKey === question ? 0.25 : 0;

  return (
    exactBoost * 0.35 +
    similarityScore(input, question) * 0.25 +
    keywordMatchScore(input, question) * 0.2 +
    smartEmbeddingAttention(input, question) * 0.25 +
    flowScore * 0.15 +
    topicAttentionScore(question, state) * 0.1 +
    memoryBoost
  );
}

function cleanSearchQuery(input) {
  return input
    .replace(/\b(who|what|when|where|why|how)\b/gi, " ")
    .replace(
      /\b(is|are|was|were|does|do|did|can|could|please|tell me about)\b/gi,
      " ",
    )
    .replace(/[?!.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSummary(text, maxLength = 650) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;

  const clipped = clean.slice(0, maxLength);
  const sentenceEnd = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("!"),
    clipped.lastIndexOf("?"),
  );

  return `${clipped.slice(0, sentenceEnd > 160 ? sentenceEnd + 1 : maxLength).trim()}...`;
}

async function searchWikipedia(input) {
  const query = cleanSearchQuery(input) || input;
  const searchUrl = "https://en.wikipedia.org/w/api.php";

  const searchResponse = await axios.get(searchUrl, {
    timeout: onlineSearchConfig.timeoutMs,
    params: {
      action: "query",
      list: "search",
      srsearch: query,
      format: "json",
      origin: "*",
      srlimit: 1,
    },
  });

  const first = searchResponse.data?.query?.search?.[0];
  if (!first?.title) return null;

  const summaryResponse = await axios.get(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.title)}`,
    { timeout: onlineSearchConfig.timeoutMs },
  );

  const summary = summaryResponse.data;
  if (!summary?.extract) return null;

  return {
    source: "Wikipedia",
    title: summary.title || first.title,
    answer: compactSummary(summary.extract),
    url:
      summary.content_urls?.desktop?.page ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(first.title)}`,
  };
}

async function searchWebInstantAnswer(input) {
  const response = await axios.get("https://api.duckduckgo.com/", {
    timeout: onlineSearchConfig.timeoutMs,
    params: {
      q: input,
      format: "json",
      no_html: 1,
      skip_disambig: 1,
    },
  });

  const data = response.data;
  const answer = data.AbstractText || data.Answer;
  if (!answer) return null;

  return {
    source: data.AbstractSource || "DuckDuckGo",
    title: data.Heading || "Web result",
    answer: compactSummary(answer),
    url: data.AbstractURL || data.AnswerURL || "https://duckduckgo.com/",
  };
}

async function searchOnline(input) {
  try {
    const wikipedia = await searchWikipedia(input);
    if (wikipedia) return wikipedia;
  } catch (error) {
    console.log("Wikipedia search failed:", error.message);
    console.error("Wikipedia search failed:", error.message);
  }

  try {
    const web = await searchWebInstantAnswer(input);
    if (web) return web;
  } catch (error) {
    console.log("DuckDuckGo search failed:", error.message);
    console.error("Web search failed:", error.message);
  }

  return null;
}

function formatOnlineAnswer(result) {
  return `I found this online from ${result.source}:\n${result.answer}\nSource: ${result.url}`;
}

async function sendAnswerChoice(chatId, state, input, localAnswer) {
  state.pendingChoice = {
    input,
    localAnswer,
    createdAt: Date.now(),
  };

  await bot.sendMessage(
    chatId,
    "I am not fully sure about this. What should I do?",
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Search online", callback_data: "answer:search" },
            { text: "Teach it", callback_data: "answer:teach" },
          ],
        ],
      },
    },
  );
}

async function clearChoiceButtons(query) {
  const message = query.message;
  if (!message) return;

  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      {
        chat_id: message.chat.id,
        message_id: message.message_id,
      },
    );
  } catch (error) {
    console.error("Could not clear choice buttons:", error.message);
  }
}

async function handleAnswerChoice(query) {
  const chatId = query.message?.chat?.id;
  const action = query.data;

  if (!chatId || !action?.startsWith("answer:")) return;

  const state = getChatState(chatId);
  const choice = state.pendingChoice;

  try {
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Could not answer callback:", error.message);
  }

  if (!choice) {
    await bot.sendMessage(
      chatId,
      "That question is no longer active. Please ask it again.",
    );
    return;
  }

  await clearChoiceButtons(query);

  if (action === "answer:teach") {
    state.pendingLearning = choice.input;
    state.pendingChoice = null;
    await bot.sendMessage(
      chatId,
      "Okay. Reply with the answer and I will learn it.",
    );
    return;
  }

  if (action === "answer:search") {
    await bot.sendMessage(chatId, "Searching online...");
    const onlineAnswer = await searchOnline(choice.input);
    state.pendingChoice = null;

    if (onlineAnswer) {
      const reply = formatOnlineAnswer(onlineAnswer);
      rememberTurn(state, "bot", reply);
      await bot.sendMessage(chatId, reply);
      return;
    }

    if (choice.localAnswer?.ans) {
      const fallback = `I could not find a strong online result. My best local answer is: ${choice.localAnswer.ans}`;
      rememberTurn(state, "bot", fallback);
      await bot.sendMessage(chatId, fallback);
      return;
    }

    state.pendingLearning = choice.input;
    await bot.sendMessage(
      chatId,
      "I could not find a good online result. Reply with the answer and I will learn it.",
    );
  }
}

function findAnswer(input, state) {
  const knowledgeBase = { ...knowledge, ...memory };
  const candidates = Object.entries(knowledgeBase)
    .map(([question, answer]) => ({
      question,
      answer,
      score: answerCandidateScore(input, question, state),
    }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (best && best.score >= 0.32) {
    return {
      ans: best.answer,
      key: best.question,
      confidence: best.score,
      all: 1,
      res: best.score >= 0.55 ? "good" : "fair",
    };
  }

  const reasoning = reason(input, memory);
  if (reasoning) {
    return {
      ans: reasoning,
      key: input,
      confidence: 0.4,
      all: 1,
      res: "reasoned",
    };
  }

  return {
    ans: null,
    key: null,
    confidence: best ? best.score : 0,
    all: 0,
    res: "unknown",
  };
}

async function handleUserInput(chatId, text) {
  const state = getChatState(chatId);
  const rawInput = text.trim();
  if (!rawInput) return "";

  rememberTurn(state, "user", rawInput);

  const taught = parseTeachCommand(rawInput);
  if (taught) {
    learnAnswer(taught.question, taught.answer);
    state.pendingLearning = null;
    state.pendingChoice = null;
    updateChatTopics(state, taught.question);
    return "Got it. I learned that and will use it next time.";
  }

  if (state.pendingLearning) {
    const learned = learnAnswer(state.pendingLearning, rawInput);
    const reply = learned
      ? "Thanks. I learned that answer and saved it."
      : "I could not save that yet. Try: teach: question = answer";
    state.pendingLearning = null;
    state.pendingChoice = null;
    return reply;
  }

  state.pendingChoice = null;

  const input = resolveContextReferences(rawInput, state);
  updateChatTopics(state, input);

  const answer = findAnswer(input, state);
  if (
    answer.all === 1 &&
    answer.ans &&
    answer.confidence >= onlineSearchConfig.localConfidenceThreshold
  ) {
    updateContextMemory(input, answer.key);
    state.lastQuestion = input;
    state.lastAnswerKey = answer.key;
    rememberTurn(state, "bot", answer.ans);
    return `${detectEmotion(rawInput)}${answer.ans}`;
  }

  await sendAnswerChoice(chatId, state, input, answer);
  return "";
}

function reason(question, memory) {
  const tokens = tokenize(question);
  if (tokens.includes("why") && tokens.includes("engine")) {
    return "Engines are used to convert fuel into mechanical motion.";
  }

  if (
    tokens.includes("difference") &&
    tokens.includes("turbocharger") &&
    tokens.includes("supercharger")
  ) {
    return "A turbocharger uses exhaust gases; a supercharger is driven mechanically by the engine.";
  }

  // Try to combine parts of memory
  for (let key in memory) {
    if (similarityScore(question, key) > 0.5) {
      return memory[key];
    }
  }

  return null;
}

function analyzeSentiment(text) {
  // Simple sentiment analysis based on keywords
  const negativeWords = ["problem", "fail", "broken", "issue"];
  const positiveWords = ["fixed", "work", "good", "repair"];

  let sentiment = "neutral";
  if (negativeWords.some((word) => text.includes(word))) {
    sentiment = "negative";
  } else if (positiveWords.some((word) => text.includes(word))) {
    sentiment = "positive";
  }

  return sentiment;
}

function ethicalReasoning(query) {
  const unsafePractices = [
    "disabling airbags",
    "ignoring engine warning signs",
  ]; // Example unsafe practices

  for (let practice of unsafePractices) {
    if (query.includes(practice)) {
      return "It's important to never engage in unsafe practices. Please consult a professional mechanic.";
    }
  }
  return "The suggested action is safe.";
}

function addPositionEncoding(tokens) {
  const posEncodings = tokens.map((_, index) => Math.sin(index / 10000)); // Example sine encoding
  return tokens.map((token, idx) => [token, posEncodings[idx]]);
}

function layerNormalization(input) {
  // Normalize the input to make training stable
  const mean = input.reduce((sum, x) => sum + x, 0) / input.length;
  return input.map((x) => x - mean); // Simple normalization
}

function dropout(input, rate = 0.1) {
  return input.map((x) => (Math.random() > rate ? x : 0)); // Drop some values with probability
}

let userFeedback = [];

function getUserFeedback(response) {
  // Telegram learning is handled in handleUserInput; Node has no prompt().
  console.log("Feedback requested for:", response);
  return null;
}

function adjustModelBasedOnFeedback(feedback) {
  if (feedback === "yes") {
    // Reward the model for correct behavior
    userFeedback.push({ feedback: "positive", timestamp: Date.now() });
  } else if (feedback === "no") {
    // Penalize the model for incorrect behavior
    userFeedback.push({ feedback: "negative", timestamp: Date.now() });
  }

  // Example: Recalculate response strategies based on feedback
  // (In practice, this would involve retraining the model with new feedback)
}

function getResponse(input) {
  // Get initial response (as before)
  let response = generateResponse(input);

  // Get user feedback
  const feedback = getUserFeedback(response);

  // Adjust model based on feedback
  adjustModelBasedOnFeedback(feedback);

  return response;
}

let automotiveData = {};
function fetchRealTimeData() {
  const newData = {
    carModel: "Toyota Camry",
    issues: ["oil change required", "engine coolant low"],
    parts: ["brake pads", "engine sensor"],
    diagnosticCodes: ["P0300", "P0420"],
  };

  automotiveData = { ...automotiveData, ...newData };
}

// Fetch real-time data every 10 seconds
setInterval(fetchRealTimeData, 10000);

bot.startPolling().catch((error) => {
  console.error("Failed to start Telegram polling:", error.message);
});
