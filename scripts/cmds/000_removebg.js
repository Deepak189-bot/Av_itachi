const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const { image } = require('image-downloader');

module.exports = {
  config: {
    name: 'removebg',
    version: '1.1.1',
    role: 0,
    author: 'AceGerome',
    description: 'Edit photo',
    category: '𝗘𝗗𝗨𝗖𝗔𝗧𝗜𝗢𝗡',
    guide: '{pn} - Reply images or url images',
    countDown: 120,
  },

  onStart: async function({ api, event, args }) {
    try {
      // Ensure it's a reply to a message
      if (event.type !== "message_reply") {
        return api.sendMessage("🖼️ | You must reply to the photo you want to remove the background from", event.threadID, event.messageID);
      }

      // Inform user that background removal is in progress
      api.sendMessage("🖼 | Removing background from the provided picture. Please wait...", event.threadID, event.messageID);

      // Check if the replied message contains an image
      if (!event.messageReply.attachments || event.messageReply.attachments.length == 0) {
        return api.sendMessage("❌ | No image found in the replied message.", event.threadID, event.messageID);
      }

      // Ensure the attachment is a photo
      if (event.messageReply.attachments[0].type != "photo") {
        return api.sendMessage("❌ | The attached media is not a photo.", event.threadID, event.messageID);
      }

      // Get the image URL
      const content = event.messageReply.attachments[0].url;

      // API key (in a real application, you should securely store this)
      const removebgApi = ["W3rDUn4sL7Pjp9rycewA6yCi", "K2mEzPfotSS9wa5HdqadHhr6"];

      // Define the input and output paths
      const inputPath = path.resolve(__dirname, 'tmp', `photo.png`);

      // Download the image to the local file system
      await image({
        url: content,
        dest: inputPath
      });

      // Prepare the form data for the API request
      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', fs.createReadStream(inputPath), path.basename(inputPath));

      // Make the request to remove the background
      const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: formData,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': removebgApi[Math.floor(Math.random() * removebgApi.length)],
        },
        encoding: null
      });

      // Check for errors in the response
      if (response.status !== 200) {
        console.error('Error:', response.status, response.statusText);
        return api.sendMessage("❌ | Failed to remove the background.", event.threadID, event.messageID);
      }

      // Save the edited image and send it as a reply
      fs.writeFileSync(inputPath, response.data);
      api.sendMessage({ attachment: fs.createReadStream(inputPath) }, event.threadID, () => fs.unlinkSync(inputPath));

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ | An error occurred while processing your request.", event.threadID, event.messageID);
    }
  }
};
