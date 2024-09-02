const axios = require("axios");
const moment = require("moment-timezone");

const vegetables = [
  { name: 'Carrot', coinValue: getRandomValue(5000, 10000), emoji: '🥕' },
  { name: 'Tomato', coinValue: getRandomValue(7000, 12000), emoji: '🍅' },
  { name: 'Broccoli', coinValue: getRandomValue(8000, 15000), emoji: '🥦' },
  { name: 'Spinach', coinValue: getRandomValue(6000, 11000), emoji: '🍃' },
  { name: 'Pepper', coinValue: getRandomValue(9000, 16000), emoji: '🌶️' },
  { name: 'Cucumber', coinValue: getRandomValue(4000, 90000), emoji: '🥒' },
  { name: 'Zucchini', coinValue: getRandomValue(6000, 11000), emoji: '🥒' },
  { name: 'Lettuce', coinValue: getRandomValue(5000, 10000), emoji: '🥬' },
  { name: 'Onion', coinValue: getRandomValue(3000, 70000), emoji: '🧅' },
  { name: 'Potato', coinValue: getRandomValue(6000, 12000), emoji: '🥔' },
  { name: 'Eggplant', coinValue: getRandomValue(7000, 13000), emoji: '🍆' },
  { name: 'Corn', coinValue: getRandomValue(4000, 90000), emoji: '🌽' },
  { name: 'Radish', coinValue: getRandomValue(4000, 80000), emoji: '🌶️' }, 
  { name: 'Cabbage', coinValue: getRandomValue(7000, 13000), emoji: '🥬' },
  { name: 'Artichoke', coinValue: getRandomValue(8000, 15000), emoji: '🌿' },
  { name: 'Mushroom', coinValue: getRandomValue(5000, 10000), emoji: '🍄' },
  { name: 'Beetroot', coinValue: getRandomValue(6000, 11000), emoji: '🍠' },
];

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  config: {
    name: "harvest",
    //aliases: ["gather"], 
    version: "1.0.9",
    author: "Rue",
    countDown: 10,
    role: 0,
    description: {
      en: "Harvest vegetables and earn coins!"
    },
    category: "game",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function({ message, args, usersData, event }) {
    try {
      const harvest = (await axios.get("https://i.imgur.com/Kio12vS.gif", {
        responseType: "stream"
      })).data;

      const targetID = event.senderID;
      const userData = await usersData.get(targetID);
      let totalAmount = 0;
      let harvestedData = [];

      const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
      if (userData.data.harvestTime === dateTime) {
        return message.reply("You've already harvested today, Try harvest again tomorrow!");
      }

      for (let i = 0; i < 3; i++) {
        const randomVegetable = vegetables[Math.floor(Math.random() * vegetables.length)];

        const name = randomVegetable.name;
        const coin = randomVegetable.coinValue;
        const emoji = randomVegetable.emoji;

        totalAmount += coin;

        harvestedData.push({
          name: `Vegetable: ${name} ${emoji}`,
          coin: ` ${coin.toLocaleString()} coins`
        });
      }

      let replyMessage = `〔 🌾 【  Harvest Time 】🌾〕\n`;
      for (let i = 0; i < harvestedData.length; i++) {
        replyMessage += `${harvestedData[i].name}: ${harvestedData[i].coin}\n\n`;
      }

      replyMessage += `💰 Total coins earned: ${totalAmount.toLocaleString()} coins 💰`;

      message.reply({
        body: replyMessage,
        attachment: harvest
      });

      userData.data.harvestTime = dateTime;
      await usersData.set(targetID, {
        money: userData.money + totalAmount,
        data: userData.data
      });
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while harvesting: ' + error.message);
    }
  }
};
