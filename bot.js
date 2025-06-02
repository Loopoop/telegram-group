const TelegramBot = require('node-telegram-bot-api');

// Replace with your real bot token from BotFather
const token = '8110615479:AAG416BSa60D8thLFcQvwCwG-VNMQu2ktN4';

// Create a bot that uses polling to fetch new messages
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Hello! I am your Node.js Telegram bot!');
});

// Respond to any text message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text.startsWith('/')) {
    let handle = handleUserInput(text);
    console.log(handle)
    bot.sendMessage(chatId, handle);
  }
});

let knowledge = require("./Aidata");

const synonyms = {
  "engine": ["power", "powerplant"],
  "sensor": ["detector", "transducer"],
  "injector": ["fuel nozzle"],
  "ecu": ["computer", "engine control unit", "module"],
  "maf": ["mass airflow", "mass air flow"],
  "map": ["manifold,pressure"],
  "car": ["vehicle", "auto", "automobile"],
  "obd": ["diagnostics", "code reader"],
  "battery": ["cell", "power source"],
  "overheating": ["hot", "heat up", "overheat"],
  "shaking": ["vibrating", "trembling", "wobbling"],
  "knocking": ["pinging", "detonation", "rattling", "knock"],
  "motor": ["electric motor","motors"],
  "crankshaft": ["crank","shaft"],
  "thank": ["thanks","thank's"],
  "hi":["hii"],
  "creator":["creat","maker","made","joe","created"],
  "ev":["electric car","electric vehicle"],
  "fact":["facts"],
  "supercharger":["super charger"],
  "turbocharger":["turbo charger"],
  "agi":["artifitial general inteligence"],
  "llm":["large language model"],
  "nlp":["natural language processing"],
  "iot":["internet of things"],
  "code":["codding","coding"],
  "hybrid":["hybrid car"]
}

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
  "artifitial inteligence"
  ]

const stopWords = ["what","the", "is", "at","does", "a", "an", "in", "on", "and"];

function removeStopWords(text) {
  return text.split(" ").filter(word => !stopWords.includes(word)).join(" ");
}

const embeddings = {
  "car":[0.8,0.5,0.7],
  "fact":[0.5,0.7,0.8],
  "turbocharger": [0.8, 0.7, 0.5],
  "supercharger": [0.85, 0.75, 0.6],
  "vtt system": [0.7, 0.65, 0.55],
  "dct": [0.72, 0.68, 0.6],
  "cvt": [0.78, 0.74, 0.65],
  "fuel": [0.8, 0.75, 0.72],
  "throttle": [0.75, 0.7, 0.6],
  "phev": [0.7, 0.65, 0.55],
  "bms": [0.76, 0.68, 0.61],
  "electric vehicle": [0.85, 0.78, 0.7],
  "mass air flow sensor": [0.77, 0.71, 0.6],
  "oxygen sensor": [0.82, 0.7, 0.65],
  "inverter": [0.75, 0.65, 0.6],
  "battery": [0.6, 0.7, 0.8],
  "engine": [0.9, 0.8, 0.7],
  "motor": [0.7, 0.8, 0.6],
  "brake": [0.4, 0.6, 0.5],
  "accelerate": [0.2, 0.8, 0.6],
  "wheel": [0.5, 0.4, 0.7],
  "gearbox": [0.6, 0.5, 0.3],
  "transmission": [0.7, 0.6, 0.4],
  "hybrid": [0.75, 0.6, 0.5],
  "electric": [0.85, 0.75, 0.7],
  "speed": [0.5, 0.3, 0.8],
  "crankshaft": [0.6, 0.7, 0.8],
  "creator": [0.4, 0.7, 0.6],
  "clutch": [0.65, 0.75, 0.5],
  "piston": [0.9, 0.7, 0.8],
  "how": [0.8,0.7,0.2],
  "work":[0.5,0.6,0.4],
  "camshaft": [0.8, 0.6, 0.7],
  "belt": [0.75, 0.65, 0.6],
  "plug": [0.85, 0.7, 0.75],
  "coolant": [0.8, 0.65, 0.6],
  "differential": [0.7, 0.8, 0.6],
  "filter": [0.6, 0.5, 0.7],
  "abs": [0.75, 0.85, 0.65],
  "ecu": [0.9, 0.8, 0.7],
  "converter": [0.8, 0.7, 0.65],
  "suspension": [0.7, 0.6, 0.8],
  "absorber": [0.75, 0.6, 0.7],
  "pump": [0.65, 0.7, 0.6],
  "system": [0.6, 0.5, 0.7],
  "radiator": [0.7, 0.6, 0.8],
  "airbag": [0.9, 0.7, 0.6],
  "traction control": [0.75, 0.6, 0.7],
  "cruise control": [0.8, 0.7, 0.6],
  "traction control system": [0.75, 0.65, 0.7],
  "brake fluid": [0.65, 0.6, 0.7],
  "tire pressure": [0.6, 0.5, 0.8],
  "regenerative braking": [0.8, 0.75, 0.6],
  "torque": [0.8, 0.7, 0.9],
  "horsepower": [0.85, 0.75, 0.65],
  "aerodynamics": [0.75, 0.8, 0.7],
  "manual": [0.6, 0.7, 0.5],
  "automatic": [0.7, 0.6, 0.5],
  "gear": [0.7, 0.6, 0.4],
  "powertrain": [0.8, 0.7, 0.6],
  "pneumatic": [0.65, 0.75, 0.8],
  "pulley": [0.7, 0.6, 0.5],
  "chain": [0.75, 0.65, 0.7],
  "alternator": [0.8, 0.6, 0.7],
  "fuel tank": [0.65, 0.6, 0.7],
  "dynamo": [0.6, 0.7, 0.8],
  "rotary": [0.85, 0.75, 0.6],
  "boxer": [0.8, 0.7, 0.65],
  "Wankel": [0.9, 0.8, 0.7],
  "diesel": [0.7, 0.6, 0.75],
  "petrol": [0.75, 0.7, 0.6],
  "position": [0.7, 0.6, 0.5],
  "block": [0.75, 0.65, 0.7],
  "wiper": [0.6, 0.5, 0.7],
  "reservoir": [0.7, 0.6, 0.7],
  "air": [0.75, 0.6, 0.65],
  "filter": [0.6, 0.5, 0.7],
  "headlights": [0.8, 0.7, 0.6],
  "taillights": [0.7, 0.6, 0.5],
  "signal": [0.65, 0.5, 0.6],
  "drivetrain": [0.75, 0.8, 0.7],
  "all-wheel": [0.8, 0.7, 0.9],
  "four-wheel": [0.85, 0.75, 0.8],
  "front-wheel": [0.7, 0.6, 0.75],
  "rear-wheel": [0.75, 0.7, 0.65],
  "plug-in": [0.65,0.55,0.5]
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenize(input) {
  input = input.toLowerCase();
  // Replace multi-word synonyms first
  for (let key in synonyms) {
    for (let synonym of synonyms[key]) {
      const pattern = new RegExp(`\\b${escapeRegex(synonym)}\\b`, 'gi');
      input = input.replace(pattern, key);
    }
  }
  // Then split into words and stem
  let arr2 = input.split(/\s+/).map(word => stem(word));
  return arr2.filter(word =>{ if(word != "") {
    return word
  }
  });
}

function stem(word) {
  word = removeStopWords(word);
  if(word == "")return
  return word.replace(/(ing|ed|s|ly|es)$/, '');
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
  const common = [...tokensA].filter(word => tokensB.has(word));
  return common.length / Math.max(tokensA.size, 1);
}

function getAttentionScore(context, input) {
      const keywords = tokenize(input)
      let entries = Object.entries(context)
    
      return entries.map(item => {
        let score = -1;
        const key = Object.keys(item)
          keywords.forEach((word, index)=> {
            if (item[0].toLowerCase().includes(word)) {
              score++;
            }
        });
        return {item, score };
      }).sort((a, b) => b.score - a.score);
    
}

function checkWordFlow(input,joe){
  let keyword = tokenize(input);
  let indexes = [];
  keyword.forEach(key=>{
    if(joe.includes(key)){
      let inde = joe.indexOf(key)
      indexes.push(inde)
    }
  })
  return indexes
}

function checkScore(jim){
  let score = 0;
  jim.forEach((num,index)=>{
    if(num == jim[index + 1] - 1){
        score++
      }
  })
  return score
}

function checkFlowOfAll(context, input) {
      const keywords = tokenize(input);
      let entries = Object.entries(context)
      return entries.map(item => {
            let joe = item[0].toLowerCase().split(/\W+/);
            let jim = checkWordFlow(input,joe)
            let checkscore = checkScore(jim);
        return {item, checkscore };
      }).sort((a, b) => b.checkscore - a.checkscore);
    
}

let contextWindow = []
function addTopic(input){
  contextWindow = [];
  let keywords = input;
    topicExtract.forEach(topic=>{
      if(keywords.includes(topic)){
        contextWindow.push(topic)
      }
  })
}

function getTopic(input){
  let match = null;
  let output = input;
  topicExtract.forEach(topic=>{
    if(contextWindow.length > 0){
      const last = contextWindow.length > 0 ? contextWindow.length - 1 : '';
      if(contextWindow[last].includes(topic)){
         output = input.replace("it",topic);
      }
    }
  })
  return output
}

function cosineSim(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB || 1);
}

function smartEmbeddingAttention(input, question) {
  const inputTokens = tokenize(input).filter(w => embeddings[w]);
  
  const questionTokens = tokenize(question).filter(w => embeddings[w]);
  
  if (inputTokens.length === 0 || questionTokens.length === 0) return 0;

  let totalSim = 0;

  inputTokens.forEach(inputWord => {
    let maxSim = 0;
    questionTokens.forEach(qWord => {
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

  questionWords.forEach(word => {
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
    .map(key => {
      const embScore = smartEmbeddingAttention(input, key);
      const keywordScore = keywordMatchScore(input, key);
      const contextScore = contextMemoryScore(input, key);

      const totalScore = (embScore * 0.6) + (keywordScore * 0.3) + (contextScore * 0.1);

      return {
        question: key,
        answer: knowledgeBase[key],
        score: totalScore
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

  words.forEach(word => {
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
      if (userConfirmed === 'yes') {
        knowledgeBase[input.toLowerCase()] = response.ans;
        console.log(Object.entries(knowledge))
      }
    }
  }
}



let memory = {};
let speech = null;

function handleUserInput(text) {
  let input = text;
  console.log(input)
  if(input == "")return;
  let out = tokenize(input);
  let botout = null;
  if(contextWindow[0] != "" && out.includes("it") || out.includes("that") || out.includes("this")){
    input = getTopic(input);
  }else{
    console.log("joe")
  }

  let answer = findAnswer(input);
  console.log(answer)
  
  if (answer.all == 1 && answer.res == "fair" || answer.res == "draw" || answer.res == "good") {
    console.log(answer.all)
    updateContextMemory(input,answer.ans)
    botout = answer.ans;
  } else {
    botout = "I don't know that yet. Can you teach me?";
  }
  findNewWords(input,knowledge,answer);
  console.log(botout)
  return botout;
}

function detectEmotion(text) {
    const positive = ["great", "awesome", "thank", "perfect"];
    const negative = ["bad", "sad", "frustrated", "angry", "problem"];
    const tokens = this.tokenize(text);
    console.log(tokens)
    if (tokens.some(t => negative.includes(t))) return "Sorry to here that.";
    if (tokens.some(t => positive.includes(t))) return "Im glad to help.";
    return "";
  }

function findAnswer(input) {
  let bestMatch = null;
  let bestScore = 0;
  let matchKey = null;
  let matchscore = 0;

  // Match from memory
  for (let q in memory) {
    const score = similarityScore(input, q);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = memory[q];
    }
  }
 
  const context = getAttentionScore(knowledge, input);
let me = null;
  // Match from knowledge
  for (let q in knowledge) {
    const score = similarityScore(input, q);
    if (score > bestScore) {
      bestScore = score;
      me = q
      bestMatch = knowledge[q];
      matchKey = q;
    }
  }
  
  let flow = checkFlowOfAll(knowledge, input);
  
  let embading = getContextRanking(input,knowledge);

  if(matchKey){
    let joe = matchKey.split(/\W+/)
    let flowscore = checkWordFlow(input,joe)
    flowscore.forEach((num, index)=>{
      if(num == flowscore[index + 1] - 1){
        matchscore++
      }
    })
  }
  
  // Use reasoning if no good match
  if (bestScore < 0.4 && context[0].score < 1 && matchscore < 2) {
    const reasoning = reason(input, memory);
    if (reasoning) return reasoning;
  }
  let overral = null;
  let probable = null;
  
  if(bestMatch == context[0].item[1] && bestMatch == flow[0].item[1] && embading[0].answer == bestMatch){
    overral = "draw";
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = bestMatch;
  }else if(bestMatch == context[0].item[1] && bestMatch != flow[0].item[1] && bestMatch == embading[0].answer){
    overral = "good"
    probable = bestMatch;
  }else if(bestMatch == context[0].item[1] && bestMatch == flow[0].item[1] && bestMatch != embading[0].answer){
    overral = "good"
    probable = bestMatch;
  }else if(bestMatch == flow[0].item[1] && bestMatch != context[0].item[0] && bestMatch == embading[0].answer){
    overral = "fair"
    probable = bestMatch;
  }else if(flow[0].item[1] == context[0].item[1] && flow[0].item[1] != bestMatch && bestMatch != embading[0].answer){
    overral = "fair";
    probable = context[0].item[1];
  }else if(bestMatch != flow[0].item[1] && context[0].item[1] != flow[0].item[1] && context[0].item[1] != bestMatch && bestMatch != embading[0].answer){
    overral = "fair";
    probable = embading[0].answer;
  }else if(bestMatch != context[0].item[1] && bestMatch != embading[0].answer && flow[0].item[1] != bestMatch){
    overral = "fair";
    probable = embading[0].answer;
  }else if(bestMatch == context[0].item[1] && bestMatch != embading[0].answer && flow[0].item[1] != bestMatch){
    overral = "fair";
    alert("fair4");
    probable = embading[0].answer;
  }else if(bestMatch != context[0].item[1] && bestMatch == embading[0].answer && flow[0].item[1] != bestMatch){
    overral = "fair";
    probable = embading[0].answer;
  }else{
    overral = "fair";
    alert("add")
    console.log(bestMatch)
    console.log(context[0])
    probable = embading[0].answer;
  }

  let overralScore = 1;
  if(bestScore < 0.4 && flow[0].checkscore < 1 && context[0].score < 1 && embading[0].score < 0.2){
    overralScore = 0;
  }

  return {ans:probable,res:overral,all:overralScore}
}



function reason(question, memory) {
  const tokens = tokenize(question);
  if (tokens.includes("why") && tokens.includes("engine")) {
    return "Engines are used to convert fuel into mechanical motion.";
  }

  if (tokens.includes("difference") && tokens.includes("turbocharger") && tokens.includes("supercharger")) {
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
  const negativeWords = ['problem', 'fail', 'broken', 'issue'];
  const positiveWords = ['fixed', 'work', 'good', 'repair'];
  
  let sentiment = 'neutral';
  if (negativeWords.some(word => text.includes(word))) {
    sentiment = 'negative';
  } else if (positiveWords.some(word => text.includes(word))) {
    sentiment = 'positive';
  }
  
  return sentiment;
}

function ethicalReasoning(query) {
  const unsafePractices = ['disabling airbags', 'ignoring engine warning signs'];  // Example unsafe practices
  
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
  return input.map(x => x - mean); // Simple normalization
}

function dropout(input, rate = 0.1) {
  return input.map(x => Math.random() > rate ? x : 0); // Drop some values with probability
}

let userFeedback = [];

function getUserFeedback(response) {
  // Get feedback from the user: Positive or Negative
  return prompt(`Is this response helpful? (yes/no): ${response}`);
}

function adjustModelBasedOnFeedback(feedback) {
  if (feedback === 'yes') {
    // Reward the model for correct behavior
    userFeedback.push({ feedback: 'positive', timestamp: Date.now() });
  } else if (feedback === 'no') {
    // Penalize the model for incorrect behavior
    userFeedback.push({ feedback: 'negative', timestamp: Date.now() });
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
    carModel: 'Toyota Camry',
    issues: ['oil change required', 'engine coolant low'],
    parts: ['brake pads', 'engine sensor'],
    diagnosticCodes: ['P0300', 'P0420'],
  };

  automotiveData = { ...automotiveData, ...newData };
}

// Fetch real-time data every 10 seconds
setInterval(fetchRealTimeData, 10000);  

