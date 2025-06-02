let chatbot =  {
synonyms : {
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

topicExtract : [
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

};
