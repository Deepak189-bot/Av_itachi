const axios = require('axios');
const moment = require("moment-timezone");

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const recyclableMaterials = [
  { name: 'Plastic Bottle', emoji: '🥤', coinValue: getRandomValue(5000, 20000) },
  { name: 'Glass Jar', emoji: '🍯', coinValue: getRandomValue(1000, 25000) },
  { name: 'Aluminum Can', emoji: '🥫', coinValue: getRandomValue(1500, 30000) },
  { name: 'Paper', emoji: '📄', coinValue: getRandomValue(3000, 15000) },
  { name: 'Glass Bottle', emoji: '🍾', coinValue: getRandomValue(3000, 15000) },
  { name: 'Newspapers', emoji: '🗞️', coinValue: getRandomValue(3000, 15000) },
  { name: 'Magazines', emoji: '📰', coinValue: getRandomValue(3000, 15000) },
  { name: 'Cardstock', emoji: '📄', coinValue: getRandomValue(3000, 15000) },
  { name: 'Office Paper', emoji: '📑', coinValue: getRandomValue(3000, 15000) },
  { name: 'Takeout Containers', emoji: '🥡', coinValue: getRandomValue(3000, 15000) },
  { name: 'Cardboard', emoji: '📦', coinValue: getRandomValue(8000, 18000) },
  { name: 'Plastic Bags', emoji: '🛍️', coinValue: getRandomValue(2000, 10000) },
  { name: 'Cans', emoji: '🥫', coinValue: getRandomValue(1500, 12000) }
];

module.exports = {
  config: {
    name: "recycle",
    version: "1.0.9",
    author: "Rue",
    countDown: 10,
    role: 0,
    description: {
        en: "Collect recyclable materials and earn coins!"
    }, 
    category: "game", 
    guide: {
      en: "{pn}"
    } 
  },

  onStart: async function({ message, args, usersData, event }) {
    const collect = (await axios.get("https://i.imgur.com/pLkwIyn.gif", {
      responseType: "stream"
    })).data;
    try {
      const targetID = event.senderID;
      const userData = await usersData.get(targetID);
      let totalAmount = 0;
      let collectedData = [];

      const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
      if (userData.data.recycleTime === dateTime) {
        return message.reply("You've already recycled today!");
      }
      
      for (let i = 0; i < 3; i++) {
        const randomMaterial = recyclableMaterials[Math.floor(Math.random() * recyclableMaterials.length)];

        const name = randomMaterial.name;
        const emoji = randomMaterial.emoji;
        const coin = randomMaterial.coinValue;

        totalAmount += coin;

        collectedData.push({
          name: `Material: ${emoji} ${name}`,
          coin: ` ${coin.toLocaleString()} coins`
        });
      }

      let replyMessage = `『 ♻️ ❰ 𝗥𝗘𝗖𝗬𝗖𝗟𝗜𝗡𝗚 𝗧𝗜𝗠𝗘 ❱ ♻️ 』\n`;
      for (let i = 0; i < collectedData.length; i++) {
        replyMessage += `➡︎ ${collectedData[i].name}: ${collectedData[i].coin}\n\n`;
      }

      replyMessage += `💰 Total coins earned: ${totalAmount.toLocaleString()} coins 💰`;

      message.reply({
        body: replyMessage,
        attachment: collect
      });

      userData.data.recycleTime = dateTime;
      await usersData.set(targetID, {
        money: userData.money + totalAmount,
        data: userData.data
      });

    } catch (error) {
      console.error(error);
      message.reply(error.message + '\n\nAn error occurred while collecting recyclable materials!');
    }
  }
};
