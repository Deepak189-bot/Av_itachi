const axios = require('axios');

module.exports = {
  config: {
    name: "ngl",
    //aliases: [""], 
    version: "1.0.0",
    author: "?/zed",
    countDown: 20,
    role: 0,
    description: {
        en: "Spam The NGL.link!!"
    }, 
    category: "Owner", 
    guide: {
      en: "To use this command, type {pn} [username] [message] [amount] - To spam the UserNGL ."
    }
  }, 

onStart: async function ({ message, event, args }) {
  try {
    if (args.length < 3) {
      message.reply('[ NGL ] Insufficient arguments. Usage: /ngl [username] [message] [amount]');
      return;
    }

    const username = args.shift();
    const msg = args.slice(0, -1).join(" "); 
    const spamCount = parseInt(args[args.length - 1]); 

    if (isNaN(spamCount) || spamCount <= 0) {
      message.reply('[ NGL ] Invalid amount. Please provide a valid positive number.');
      return;
    }

    console.log(`[ NGL ] Spamming To : ${username}`);
    for (let i = 0; i < spamCount; i++) {
      const response = await axios.post('https://ngl.link/api/submit', {
        username: username,
        question: msg,
        deviceId: '23d7346e-7d22-4256-80f3-dd4ce3fd8878',
        gameSlug: '',
        referrer: '',
      });

      console.log(`[ NGL ] Message ${i + 1}: Status - ${response.status}`);
    }

    message.reply(`[ NGL ] Successfully spammed ${spamCount} times to ${username}`);
  } catch (error) {
    console.error('[ NGL ] Error:', error);
    message.reply('[ NGL ] Error: ' + error.message);
  }
},
};
