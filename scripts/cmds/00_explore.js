const axios = require('axios');
const moment = require("moment-timezone");

const recyclableMaterials = [
  { name: 'Phoenix Feather', emoji: '🔥' },
  { name: 'Fairy Wings', emoji: '🍯' },
  { name: 'Ancient Relic', emoji: '🏺' },
  { name: 'Mystic Scroll', emoji: '📜' },
  { name: 'Enchanted Sword', emoji: '⚔️' },
  { name: 'Mermaid Pearl', emoji: '🧜‍♀️' },
  { name: 'Crystal Orb', emoji: '🔮' },
  { name: 'Emerald Idol', emoji: '🌿' },
  { name: 'Golden Crown', emoji: '👑' },
  { name: 'Jeweled', emoji: '💎' },
  { name: 'Compass', emoji: '🧭' },
  // Add more recyclable materials here
];

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCoinValue(material) {
  switch (material.name) {
    case 'Phoenix Feather':
      return getRandomValue(5000, 20000);
    case 'Fairy Wings':
      return getRandomValue(1000, 25000);
    case 'Ancient Relic':
      return getRandomValue(1500, 30000);
    default:
      return getRandomValue(3000, 15000);
  }
}

module.exports = {
  config: {
    name: "explore",
    version: "1.0.9",
    author: "Margaux",
    countDown: 15,
    role: 0,
    description: {
      en: "Explore a virtual world to find hidden treasures and earn rewards.!"
    },
    category: "game",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, args, usersData, event }) {
    const collect = (await axios.get("https://i.imgur.com/U8ICtpE.jpeg", {
      responseType: "stream"
    })).data;

    try {
      const targetID = event.senderID;
      const userData = await usersData.get(targetID);
      let totalAmount = 0;
      let collectedData = [];

      const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
      if (userData.data.exploreTime === dateTime)
        return message.reply("You've already explored today, Try to explore again tomorrow!");

      for (let i = 0; i < 3; i++) {
        const randomMaterial = recyclableMaterials[Math.floor(Math.random() * recyclableMaterials.length)];
        const coin = getCoinValue(randomMaterial);

        totalAmount += coin;

        collectedData.push({
          name: `𝗠𝗮𝘁𝗲𝗿𝗶𝗮𝗹𝘀: ${randomMaterial.emoji} ${randomMaterial.name}`,
          coin: ` ${coin.toLocaleString()} 𝗖𝗼𝗶𝗻𝘀`
        });
      }

      let replyMessage = `❛ ━❪ 𝗬𝗼𝘂 𝗳𝗼𝘂𝗻𝗱 𝘁𝗿𝗲𝗮𝘀𝘂𝗿𝗲𝘀! 🗺️ ❫━ ❜\n`;
      for (let i = 0; i < collectedData.length; i++) {
        replyMessage += `➡︎ ${collectedData[i].name}: ${collectedData[i].coin}\n\n`;
      }

      replyMessage += `💰Total coins earned: ${totalAmount.toLocaleString()} coins 💰`;

      message.reply({
        body: replyMessage,
        attachment: collect
      });

      userData.data.exploreTime = dateTime;
      await usersData.set(targetID, {
        money: userData.money + totalAmount,
        data: userData.data
      });

    } catch (error) {
      console.error(error);
      message.reply('An error occurred while collecting recyclable materials: ' + error.message);
    }
  }
};
