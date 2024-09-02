const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'element',
    aliases: ['periodic'],
    version: '1.0',
    author: 'Samir x Void',
    countDown: 5,
    role: 0,
    description: {
      en: 'Get info of an element',
    },
    category: 'Education',
    guide: {
      en: '{pn} <element>',
    },
  },

  onStart: async function ({ message, args }) {
    const element = args.join(' ');

    if (!element) {
      return message.reply('Please provide an element name.');
    }

    try {
      const response = await axios.get(`https://api.popcat.xyz/periodic-table?element=${element}`);
      const data = response.data;

      const messageBody = `🧪 Element: ${data.name}\n✳️ Symbol: ${data.symbol}\n🧮 Atomic Number: ${data.atomic_number}\n⚛️ Atomic Mass: ${data.atomic_mass}\n🧊 Phase: ${data.phase}\n🔍 Discovered By: ${data.discovered_by}\n\n📜 Summary: ${data.summary}`;

      const imagePath = `${__dirname}/tmp/${data.name}.png`;
      const writer = fs.createWriteStream(imagePath);

      const imageResponse = await axios({
        url: data.image,
        method: 'GET',
        responseType: 'stream',
      });

      imageResponse.data.pipe(writer);

      writer.on('finish', () => {
        message.reply(
          {
            body: messageBody,
            attachment: fs.createReadStream(imagePath),
          },
          () => fs.unlinkSync(imagePath),
        );
      });

      writer.on('error', (err) => {
        console.error('Error writing image to file:', err);
        message.reply(messageBody);
      });
    } catch (err) {
      console.error('Error fetching element data:', err);
      message.reply('An error occurred while fetching the element data. Please try again later.');
    }
  },
};
