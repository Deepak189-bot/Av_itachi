const axios = require('axios');

module.exports = {
  config: {
    name: 'bible',
    aliases: ['tellverse', 'verse'],
    version: '1.0',
    author: 'JV',
    role: 0,
    category: '𝗘𝗗𝗨𝗖𝗔𝗧𝗜𝗢𝗡',
    description: {
      en: 'Shares a random Bible verse.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ message }) {
    try {
      const date = new Date();
      const day = date.getDate();
      const response = await axios.get(`https://beta.ourmanna.com/api/v1/get/?format=text&order=random&order_by=verse&day=${day}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from OurManna API');
      }

      const msg = `Here's a Bible verse for you: \n\n${response.data}`;

      const messageID = await message.reply(msg);

      if (!messageID) {
        throw new Error('Failed to send message with Bible verse');
      }

      console.log(`Sent Bible verse with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send Bible verse: ${error.message}`);
      message.reply('Sorry, something went wrong while trying to share a Bible passage. Please try again later.');
    }
  }
};