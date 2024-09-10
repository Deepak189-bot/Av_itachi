const axios = require('axios');

module.exports = {
  config: {
    name: 'itachi',
    version: '1.0.0',
    author: 'Itachi',
    countDown: 5,
    role: 0,
    description: {
      en: 'Talk with Itachi-AI',
    },
    category: '𝗘𝗗𝗨𝗖𝗔𝗧𝗜𝗢𝗡',
    guide: {
      en: '{pn} [ask]',
    },
  },

  onStart: async function ({ api, event, args }) {
    const getUserInfo = async (api, userID) => {
      try {
        const userInfo = await api.getUserInfo(userID);
        return userInfo[userID].firstName;
      } catch (error) {
        console.error(`Error fetching user info: ${error}`);
        return '';
      }
    };

    let { messageID, threadID, senderID } = event;

    const name = await getUserInfo(api, senderID);
    let ranGreetVar = [
      `Konichiwa ${name}`,
      'Konichiwa senpai',
      'Hora',
      `Yoroshiku onegaishimasu? ${name}`,
      `Ogenki desu ka? ${name}`,
    ];
    const ranGreet = ranGreetVar[Math.floor(Math.random() * ranGreetVar.length)];

    const chat = args.join(' ');

    try {
      const prompt = `Act%20as%20a%20human.%20You%20are%20an%20AI%20known%20as%20Akira-AI.%20Your%20name%20is%20Akira.%20You%20are%20created%20by%20AceGerome.%20Your%20responses%20must%20always%20contain%20emoji%20`
      const resApi = `https://api.kenliejugarap.com/blackbox?text=${prompt}${encodeURIComponent(chat)}`;
      const res = await axios.get(resApi);
      const simRes = res.data.response;
      const respond = simRes.replace("\n\nIs this answer helpful to you? Kindly click the link below\nhttps:\/\/click2donate.kenliejugarap.com\n(Clicking the link and clicking any ads or button and wait for 30 seconds (3 times) everyday is a big donation and help to us to maintain the servers, last longer, and upgrade servers in the future)", "")
      
      const text = await translate(respond);

      return api.sendMessage({
        body: text,
      }, threadID);
    } catch (error) {
      console.error(error);
      api.sendMessage(error, threadID, messageID);
    }
    if (!args[0]) return api.sendMessage(`${ranGreet}`, threadID, messageID);
  },
};

async function translate(respond) {
  try {
    const array = ["tl", "en"];
    const random = Math.floor(Math.random() * array.length);
    const tl = array[random];
    const response = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(respond)}`
    );
    const translations = response.data[0];
    const translated = translations.reduce((accumulator, translation) => {
      if (translation[0]) {
        accumulator += translation[0];
      }
      return accumulator;
    }, '');
    return translated;
  } catch (error) {
    console.error(error);
    return 'Error getting an response.';
  }
}
