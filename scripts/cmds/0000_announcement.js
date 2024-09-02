const fs = require('fs');
const path = require('path');

const botAdmins = global.GoatBot.config.adminBot;

module.exports = {
  config: {
    name: 'announcement',
    aliases: ["announce", "news"],
    version: 1.2,
    author: 'JV Barcenas',
    countDown: 5,
    role: 0,
    description: {
      en: 'Create or display server announcements'
    },
    category: 'admin',
    guide: {
      en: '{pn} [post|create] [text]: Create a new announcement\n{pn}: Display the current announcement'
    },
  },

  langs: {
    en: {
      announcementSet: 'Your announcement has been set.',
      noAnnouncement: 'There is no current announcement.',
      currentAnnouncement: '▽ Current Announcement ▽\n───────────────────\n%1\n───────────────────\n',
      fetchError: 'An error occurred while fetching the announcement.',
      noPermission: 'You do not have permission to use this command.',
      provideText: 'Please provide the announcement text. Usage: /announcement create [text]',
      unknownCommand: 'Unknown command. Usage: /announcement [post|create] [text]'
    }
  },

  onStart: async function ({ args, message, event }) {
    const { senderID } = event;
    const announcementFilePath = path.join(__dirname, 'announcement.txt');

    if (['post', 'create'].includes(args[0])) {
      const announcementText = args.slice(1).join(' ');

      if (!announcementText) {
        return message.reply(this.langs.en.provideText);
      }

      if (!botAdmins.includes(senderID)) {
        return message.reply(this.langs.en.noPermission);
      }

      try {
        fs.writeFileSync(announcementFilePath, announcementText);
        message.reply(this.langs.en.announcementSet);
      } catch (err) {
        console.error('Error writing to announcement file:', err);
        message.reply(this.langs.en.fetchError);
      }

      return;
    }

    if (!args.length) {
      try {
        const currentAnnouncement = fs.readFileSync(announcementFilePath, 'utf8').trim();
        if (currentAnnouncement) {
          message.reply(this.langs.en.currentAnnouncement.replace('%1', currentAnnouncement));
        } else {
          message.reply(this.langs.en.noAnnouncement);
        }
      } catch (err) {
        console.error('Error reading announcement file:', err);
        message.reply(this.langs.en.fetchError);
      }

      return;
    }

    message.reply(this.langs.en.unknownCommand);
  }
};
