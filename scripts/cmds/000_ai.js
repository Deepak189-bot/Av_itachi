const axios = require('axios');

const Prefixes = [
  'gpt',
  '/gpt',
  'ai',
  '/ai'
];

const apiEndpoints = [
  'https://celestial-dainsleif-v2.onrender.com/gpt?gpt=',
  'https://akhiroai.onrender.com/api?model=llama&q=',
  'https://akhiroai.onrender.com/api?model=hercai&q=',
  'https://akhiroai.onrender.com/api?model=gemini&q=',
  'https://akhiroai.onrender.com/api?model=chatgpt&q='
];

module.exports = {
  config: {
    name: 'ai',
    version: '2.5',
    author: 'JV Barcenas',
    role: 0,
    category: '𝗘𝗗𝗨𝗖𝗔𝗧𝗜𝗢𝗡',
    description: {
      en: 'Asks an AI for an answer based on the user prompt.',
    },
    guide: {
      en: '{pn} [prompt]',
    },
  },
  
  onStart: async function({}) {}, 
  onChat: async function ({ api, event, args, message }) {
    try {
      const prefix = Prefixes.find(p => event.body && event.body.toLowerCase().startsWith(p));
      if (!prefix) return;

      const prompt = event.body.substring(prefix.length).trim() || "Hello";

      if (prompt) {
        const sentMessage = await message.reply("Answering your question. Please wait a moment...");
        let respond = "Sorry, I couldn't generate an answer.";
        
        for (let i = 0; i < apiEndpoints.length; i++) {
          try {
            const response = await axios.get(`${apiEndpoints[i]}${prompt}`);
            respond = response.data.content?.trim() || response.data.message?.trim();
            if (respond) break;
          } catch (error) {
            console.error(`❌ | API ${i + 1} failed for answer generation`, error);
          }
        }

        if (!respond) {
          respond = "All AI services are currently unavailable. Please try again later.";
        }

        await api.editMessage(respond, sentMessage.messageID);
        console.log('Sent answer as a reply to user');
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      await api.sendMessage("An unexpected error occurred. Please try again later.", event.threadID, event.messageID);
    }
  }
};
