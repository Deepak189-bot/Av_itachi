const axios = require('axios');

const Prefixes = [
  'gemini',
  '/gemini'
];

module.exports = {
  config: {
    name: 'gemini',
    version: '2.5',
    author: 'JV Barcenas', // do not change
    role: 0,
    category: '𝗘𝗗𝗨𝗖𝗔𝗧𝗜𝗢𝗡',
    description: {
      en: 'Asks GEMINI for an answer based on the user prompt.',
    },
    guide: {
      en: '{pn} [prompt]',
    },
  },
  onStart: async function () {},
  onChat: async function ({ api, event, args, message, usersData }) {
    const senderID = event.senderID;
    const { name } = await usersData.get(senderID);
    try {
      const prefix = Prefixes.find((p) => event.body && event.body.toLowerCase().startsWith(p));

      if (!prefix) {
        return; 
      }

      const prompt = event.body.substring(prefix.length).trim();

      if (prompt === '') {
        await message.reply(
          "This is gemini, your personal AI assistant. Please provide the question you would like me to answer. \n\nName: " + name + "\nSenderID: " + senderID 
        );
        return;
      }


      const sentMessage = await message.reply("Answering your question. Please wait a moment...");

      const response = await axios.get(`https://celestial-dainsleif.onrender.com/gem?chat=${encodeURIComponent(prompt)}&id=${senderID}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      const messageText = response.data.content.trim();
      const formatText = `${messageText}\n\nName: ${name}\nSenderID: ${senderID}`

      await api.editMessage(formatText, sentMessage.messageID);

      console.log('Sent answer as a reply to user');
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(
        `${error.message}.\n\nYou can try typing your question again or resending it, as there might be a bug from the server that's causing the problem. It might resolve the issue.`,
        event.threadID
      );
    }
  },
};
