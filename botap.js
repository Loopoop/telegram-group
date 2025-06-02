const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual tokens
const token = '8110615479:AAG416BSa60D8thLFcQvwCwG-VNMQu2ktN4';
const weatherApiKey = 'YOUR_OPENWEATHERMAP_API_KEY';

const bot = new TelegramBot(token, { polling: true });

// Start command with buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Welcome! Choose an option:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📸 Send an Image', callback_data: 'image_info' },
          { text: '🌤 Get Weather', callback_data: 'get_weather' }
        ]
      ]
    }
  });
});

// Handle inline button actions
bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  if (data === 'image_info') {
    bot.sendMessage(chatId, '📷 Please send a photo and I will get its link.');
  } else if (data === 'get_weather') {
    bot.sendMessage(chatId, '🌍 Send your city name like this: /weather Nairobi');
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Handle images sent by the user
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    bot.sendMessage(chatId, `✅ Image received!\n🖼 Download URL:\n${fileUrl}`);
  } catch (err) {
    bot.sendMessage(chatId, '❌ Error retrieving image.');
  }
});

// Fetch weather for a city
bot.onText(/\/weather (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const city = match[1];

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    const weatherInfo = `
🌍 City: ${data.name}
🌡 Temp: ${data.main.temp}°C
🌤 Weather: ${data.weather[0].description}
💨 Wind: ${data.wind.speed} m/s
    `;

    bot.sendMessage(chatId, weatherInfo);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Could not get weather for "${city}"`);
  }
});
