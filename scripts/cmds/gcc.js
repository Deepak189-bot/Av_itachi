module.exports = {
 config: {
 name: "gcc",
 aliases: ["gcc"],
 version: "1.0",
 author: "MILAN",
 countDown: 5,
 role: 0,
 shortDescription: "",
 longDescription: "",
 category: "code",
 guide: {
 en: "{pn} code"
 }
 },
 onStart: async function ({ message, args, api, event }) {
 const axios = require('axios');
 try {
 const cLangCode = args.join(' ');
 if (!cLangCode) {
 return api.sendMessage(`Enter C Language code baka!!`, event.threadID, event.messageID);
 }
 const encodedCode = encodeURIComponent(cLangCode);
 const apiUrl = `https://milanbhandari.onrender.com/executec?code=${encodedCode}`;
 
 const response = await axios.get(apiUrl);
 const data = response.data;

 if (data.stderr) {
 return api.sendMessage('Error:\n' + data.stderr, event.threadID, event.messageID);
 } else if (data.stdout) {
 return api.sendMessage('Success:\n' + data.stdout, event.threadID, event.messageID);
 } else {
 return api.sendMessage('Unexpected response format:\n' + JSON.stringify(data), event.threadID, event.messageID);
 }
 } catch (error) {
 console.error('Error:', error);
 return api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
 }
 }
};