const TelegramBot = require('node-telegram-bot-api');

// Replace this with your BotFather token
const token = '8110615479:AAG416BSa60D8thLFcQvwCwG-VNMQu2ktN4';

const bot = new TelegramBot(token, { polling: true });

// /start command shows inline buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Say Hello 👋', callback_data: 'hello' },
          { text: 'Get Time 🕒', callback_data: 'time' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, 'Choose an action:', options);
});

// Handle button clicks
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;

  if (data === 'hello') {
    bot.sendMessage(msg.chat.id, 'Hello there! 👋');
  } else if (data === 'time') {
    const now = new Date().toLocaleTimeString();
    bot.sendMessage(msg.chat.id, `Current time is: ${now}`);
  }

  // Acknowledge the button press (important!)
  bot.answerCallbackQuery(callbackQuery.id);
});
