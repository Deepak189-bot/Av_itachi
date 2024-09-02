const axios = require('axios');
const moment = require("moment-timezone");

const minerals = [
  { name: 'Coal', coinValue: getRandomValue(5000, 1000) },
  { name: 'Iron', coinValue: getRandomValue(1000, 5000) },
  { name: 'Bronze', coinValue: getRandomValue(5000, 10000) },
  { name: 'Silver', coinValue: getRandomValue(10000, 15000) },
  { name: 'Gold', coinValue: getRandomValue(1500, 20000) },
  { name: 'Diamond 💎', coinValue: getRandomValue(2000, 50000) },
  // Add more minerals here
];

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  config: {
    name: "mine",
    //aliases: ["f", ""], 
    version: "1.0.9",
    author: "Dymyrius",
    countDown: 15,
    role: 0,
    description: {
        en: "Dig for minerals and earn coins!"
    }, 
    category: "game", 
    guide: {
      en: "{pn}"
    } 
  },

  onStart: async function({ message, args, usersData, event }) {
    const mine = (await axios.get("https://i.imgur.com/w9ueJGi.gif", {
      responseType: "stream"
    })).data;
    try {
      const targetID = event.senderID;
      const userData = await usersData.get(targetID);
      let totalAmount = 0;
      let minedData = [];

      // Fix: dateTime is not defined, assuming you meant to use moment() to get the current date and time
      const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
      if (userData.data.mineTime === dateTime)
        return message.reply("You've Already done your mining today!");

      for (let i = 0; i < 3; i++) {
        const randomMineral = minerals[Math.floor(Math.random() * minerals.length)];

        const name = randomMineral.name;
        const coin = randomMineral.coinValue;

        totalAmount += coin;

        minedData.push({
          name: `Mineral: ${name}`,
          coin: ` ${coin.toLocaleString()} Coins`
        });
      }

      let replyMessage = `〔【 ⛏️ Mining Time ⛏️ 】〕\n`;
      for (let i = 0; i < minedData.length; i++) {
        replyMessage += `➡︎ ${minedData[i].name}: ${minedData[i].coin}\n\n`;
      }

      replyMessage += `💰 Total Coins earned: ${totalAmount.toLocaleString()} Coins 💰`;

      message.reply({
        body: replyMessage,
        attachment: mine
      });

      userData.data.mineTime = dateTime;
      await usersData.set(targetID, {
		    	money: userData.money + totalAmount, 
	    		data: userData.data
		   });

    } catch (error) {
      console.error(error);
      message.reply(error.message);
    }
  }
};
