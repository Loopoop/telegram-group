let memory = {};
let speech = null;

function handleUserInput() {
  let input = document.getElementById("user-input").value;
  if(input == "")return;
  let out = tokenize(input);
  if(contextWindow[0] != "" && out.includes("it") || out.includes("that") || out.includes("this")){
    input = getTopic(input);
  }else{
    addTopic(input);
  }
  document.getElementById("user-input").value = '';
  addToChat("You: " + input);

  let answer = findAnswer(input);
  let emotion = detectEmotion(input);
  //let inp = startVoiceInput()
  //let anser2 = Chatbot.handleMessage(input)
  //alert(answer.all)
  if (answer.all == 1 && answer.res == "fair" || answer.res == "draw" || answer.res == "good") {
    //let selfGenerated = selfGenerateText(answer.ans)
    updateContextMemory(input,answer.ans)
    if(speech){
      speakText(emotion + " "+answer.ans)
    }
    addToChat("AutoBot: " + emotion + " " + answer.ans);
  } else {
    addToChat("AutoBot: I don't know that yet. Can you teach me?");
    setTimeout(() => {
      const newAnswer = prompt("Please teach me: " + input);
      if (newAnswer) {
        memory[input.toLowerCase()] = newAnswer;
        knowledge[input.toLowerCase()] = newAnswer;
        console.log(JSON.stringify(knowledge))
        addToChat("AutoBot: Got it! I've learned that.");
      }
    }, 300);
  }
  findNewWords(input,knowledge,answer);
}

function detectEmotion(text) {
    const positive = ["great", "awesome", "thank", "perfect"];
    const negative = ["bad", "sad", "frustrated", "angry", "problem"];
    const tokens = this.tokenize(text);
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
    alert("draw")
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = bestMatch;
  }else if(bestMatch == context[0].item[1] && bestMatch != flow[0].item[1] && bestMatch == embading[0].answer){
    overral = "good"
    alert("good1");
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = bestMatch;
  }else if(bestMatch == context[0].item[1] && bestMatch == flow[0].item[1] && bestMatch != embading[0].answer){
    overral = "good"
    alert("good2");
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = bestMatch;
  }else if(bestMatch == flow[0].item[1] && bestMatch != context[0].item[0] && bestMatch == embading[0].answer){
    overral = "fair"
    alert("fair1");
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = bestMatch;
  }else if(flow[0].item[1] == context[0].item[1] && flow[0].item[1] != bestMatch && bestMatch != embading[0].answer){
    overral = "fair";
    alert("fair2")
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = context[0].item[1];
  }else if(bestMatch != flow[0].item[1] && context[0].item[1] != flow[0].item[1] && context[0].item[1] != bestMatch && bestMatch != embading[0].answer){
    overral = "fair";
    alert("fair3");
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = embading[0].answer;
  }else if(bestMatch != context[0].item[1] && bestMatch != embading[0].answer && flow[0].item[1] != bestMatch){
    overral = "fair";
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = embading[0].answer;
  }else if(bestMatch == context[0].item[1] && bestMatch != embading[0].answer && flow[0].item[1] != bestMatch){
    overral = "fair";
    alert("fair4");
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
    probable = embading[0].answer;
  }else if(bestMatch != context[0].item[1] && bestMatch == embading[0].answer && flow[0].item[1] != bestMatch){
    overral = "fair";
    alert("fair5");
    console.log(bestScore + "\n" + context[0].score + "\n "+ flow[0].checkscore +"\n "+ embading[0].score)
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

function addToChat(message) {
  const chatLog = document.getElementById('chat-log');
  const messageElem = document.createElement('div');
  chatLog.appendChild(messageElem);

  let index = 0;
  let charIndex = 0;
  let currentText = '';
  
  // Function to handle the typing effect
  function type() {
    // Check if we haven't finished typing the message
    if (charIndex < message.length) {
      const char = message.charAt(charIndex);

      // If we encounter an HTML tag, we need to skip it correctly
      if (char === '<') {
        let tag = '';
        // Collect the entire HTML tag
        while (message.charAt(charIndex) !== '>' && charIndex < message.length) {
          tag += message.charAt(charIndex);
          charIndex++;
        }
        tag += '>';
        currentText += tag; // Add tag to the text buffer
      } else {
        currentText += char; // Otherwise, just add the character
      }

      messageElem.innerHTML = currentText; // Update the message content
      charIndex++;
      chatLog.scrollTop = chatLog.scrollHeight;

      setTimeout(type, 10); // Keep typing
    } else {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }

  type(); // Start the typing effect
}

function speakText(output) {
      const text = output;
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      } else {
        alert("Sorry, your browser doesn't support Text-to-Speech.");
      }
    }

function startVoiceInput() {
  const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.onresult = event => {
    document.getElementById("user-input").value = event.results[0][0].transcript;
    handleUserInput();
  };
  recognition.start();
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

function startspeech(){
  let sp = document.getElementById("sp");
  speech = speech == null ? speech = "joe" : speech = null;
  speech == null ? sp.innerText = "🔊" : sp.innerText = "🔈";
  startVoiceInput()
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


/*class MultiHeadAttention {
  constructor(numHeads, inputDim, headDim) {
    this.numHeads = numHeads;
    this.inputDim = inputDim;
    this.headDim = headDim;
    this.totalHeadDim = numHeads * headDim;

    // Random weight matrices for each head
    this.Wq = this.initWeights(numHeads, inputDim, headDim);
    this.Wk = this.initWeights(numHeads, inputDim, headDim);
    this.Wv = this.initWeights(numHeads, inputDim, headDim);
  }

  initWeights(heads, inDim, outDim) {
    // Initialize random weights for each head
    return Array.from({ length: heads }, () =>
      Array.from({ length: inDim }, () =>
        Array.from({ length: outDim }, () => Math.random() * 0.1)
      )
    );
  }

  matMul(a, b) {
    return a.map(row =>
      b[0].map((_, j) =>
        row.reduce((sum, val, i) => sum + val * b[i][j], 0)
      )
    );
  }

  softmax(vec) {
    const max = Math.max(...vec);
    const exp = vec.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b);
    return exp.map(v => v / sum);
  }

  transpose(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }

  scaledDotProductAttention(Q, K, V) {
    const KT = this.transpose(K);
    const scores = this.matMul(Q, KT);
    const scale = Math.sqrt(K[0].length);
    const scaled = scores.map(row => row.map(v => v / scale));
    const weights = scaled.map(this.softmax);
    return weights.map((row, i) =>
      this.matMul([row], V)[0]
    );
  }

  applyLinear(input, weight) {
    return this.matMul(input, weight);
  }

  attention(input) {
    const outputs = [];

    for (let h = 0; h < this.numHeads; h++) {
      const Q = this.applyLinear(input, this.Wq[h]);
      const K = this.applyLinear(input, this.Wk[h]);
      const V = this.applyLinear(input, this.Wv[h]);

      const headOutput = this.scaledDotProductAttention(Q, K, V);
      outputs.push(headOutput);
    }

    // Concatenate heads
    return input.map((_, i) =>
      outputs.flatMap(head => head[i])
    );
  }
}

// Example input: 2 tokens with 4-dimensional embeddings
const input = [
  [0.1, 0.2, 0.3, 0.4],
];

const mha = new MultiHeadAttention(2, 4, 2); // 2 heads, input dim 4, each head dim 2
const output = mha.attention(input);

console.log("Multi-head output:", output);*/

// === Utility Functions ===
/*function zeros(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function randomMatrix(rows, cols, scale = 0.1) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() - 0.5) * scale));
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

function crossEntropy(predicted, trueIdx) {
  const epsilon = 1e-12;
  return -Math.log(predicted[trueIdx] + epsilon);
}

function decoderGradient(predicted, trueIdx) {
  return predicted.map((p, i) => (i === trueIdx ? p - 1 : p));
}

function matVecMul(vec, mat) {
  return mat[0].map((_, col) => vec.reduce((sum, v, row) => sum + v * mat[row][col], 0));
}

function addVectors(a, b) {
  return a.map((v, i) => v + b[i]);
}

function outerProduct(a, b) {
  return a.map(ai => b.map(bj => ai * bj));
}

function meanVector(vecs) {
  const len = vecs.length;
  return vecs[0].map((_, i) => vecs.reduce((sum, v) => sum + v[i], 0) / len);
}

function subtractVectors(a, b) {
  return a.map((v, i) => v - b[i]);
}

// === Adam Optimizer ===
class AdamOptimizer {
  constructor(beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
    this.m = new Map();
    this.v = new Map();
    this.t = 0;
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.epsilon = epsilon;
  }

  update(weights, grad, name, lr) {
    if (!this.m.has(name)) {
      this.m.set(name, zeros(weights.length, weights[0].length));
      this.v.set(name, zeros(weights.length, weights[0].length));
    }

    const m = this.m.get(name);
    const v = this.v.get(name);
    this.t += 1;

    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        m[i][j] = this.beta1 * m[i][j] + (1 - this.beta1) * grad[i][j];
        v[i][j] = this.beta2 * v[i][j] + (1 - this.beta2) * grad[i][j] ** 2;

        const mHat = m[i][j] / (1 - this.beta1 ** this.t);
        const vHat = v[i][j] / (1 - this.beta2 ** this.t);

        weights[i][j] -= lr * mHat / (Math.sqrt(vHat) + this.epsilon);
      }
    }
  }
}

// === Transformer Core Components ===
class MultiHeadAttention {
  constructor(inputDim, numHeads) {
    this.numHeads = numHeads;
    this.inputDim = inputDim;
    this.queryWeights = randomMatrix(inputDim, inputDim);
    this.keyWeights = randomMatrix(inputDim, inputDim);
    this.valueWeights = randomMatrix(inputDim, inputDim);
    this.outputWeights = randomMatrix(inputDim, inputDim);
  }

  forward(x) {
    this.lastInput = x;
    return x.map(vec => matVecMul(vec, this.outputWeights));
  }

  backward(lr, optimizer) {
    const grad = zeros(this.outputWeights.length, this.outputWeights[0].length);
    optimizer.update(this.outputWeights, grad, 'mha_output_weights', lr);
  }
}

class FeedForward {
  constructor(inputDim, hiddenDim) {
    this.w1 = randomMatrix(inputDim, hiddenDim);
    this.w2 = randomMatrix(hiddenDim, inputDim);
  }

  forward(x) {
    this.lastInput = x;
    this.hidden = x.map(vec => matVecMul(vec, this.w1));
    return this.hidden.map(vec => matVecMul(vec, this.w2));
  }

  backward(lr, optimizer) {
    const gradW1 = zeros(this.w1.length, this.w1[0].length);
    const gradW2 = zeros(this.w2.length, this.w2[0].length);
    optimizer.update(this.w1, gradW1, 'ffn_w1', lr);
    optimizer.update(this.w2, gradW2, 'ffn_w2', lr);
  }
}

class TransformerBlock {
  constructor(inputDim, numHeads, hiddenDim) {
    this.attn = new MultiHeadAttention(inputDim, numHeads);
    this.ffn = new FeedForward(inputDim, hiddenDim);
  }

  forward(x) {
    const attnOut = this.attn.forward(x);
    const added = attnOut.map((vec, i) => addVectors(vec, x[i]));
    const norm = this.layerNorm(added);
    const ffnOut = this.ffn.forward(norm);
    return ffnOut.map((vec, i) => addVectors(vec, norm[i]));
  }

  layerNorm(x) {
    const mean = meanVector(x);
    return x.map(vec => subtractVectors(vec, mean));
  }

  backward(lr, optimizer) {
    this.ffn.backward(lr, optimizer);
    this.attn.backward(lr, optimizer);
  }
}

class DecoderHead {
  constructor(inputDim, vocabSize) {
    this.weights = randomMatrix(inputDim, vocabSize);
  }

  project(vec) {
    return softmax(matVecMul(vec, this.weights));
  }

  backward(inputVec, grad, lr, optimizer) {
    const outer = outerProduct(inputVec, grad);
    optimizer.update(this.weights, outer, 'decoder_weights', lr);
  }
}

class SimpleTokenizer {
  constructor() {
    this.vocab = {};
    this.revVocab = [];
  }

  encode(text) {
    return text.toLowerCase().split(/\s+/).map(w => {
      if (!(w in this.vocab)) {
        this.vocab[w] = this.revVocab.length;
        this.revVocab.push(w);
      }
      return this.vocab[w];
    });
  }

  decode(indices) {
    return indices.map(i => this.revVocab[i] || '?').join(' ');
  }
}

// === Transformer Model ===
class Transformer {
  constructor(inputDim, numHeads, hiddenDim) {
    this.inputDim = inputDim;
    this.block = new TransformerBlock(inputDim, numHeads, hiddenDim);
  }

  forward(x) {
    return this.block.forward(x);
  }

  backward(lr, optimizer) {
    this.block.backward(lr, optimizer);
  }
}

// === Training Function ===
function trainBatch(batch, transformer, decoder, tokenizer, learningRate, optimizer) {
  let totalLoss = 0;

  for (let { input, target } of batch) {
    const inputVecs = input.map(id => Array(transformer.inputDim).fill(id * 0.01));
    const encoded = transformer.forward(inputVecs);

    const targetIds = tokenizer.encode(target);
    let loss = 0;

    for (let i = 0; i < targetIds.length; i++) {
      const logits = decoder.project(encoded[i % encoded.length]);
      loss += crossEntropy(logits, targetIds[i]);

      const grad = decoderGradient(logits, targetIds[i]);
      decoder.backward(encoded[i % encoded.length], grad, learningRate, optimizer);
    }

    transformer.backward(learningRate, optimizer);
    totalLoss += loss;
  }

  return totalLoss / batch.length;
}*/
