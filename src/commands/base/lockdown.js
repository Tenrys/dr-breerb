const Discord = require("discord.js")

module.exports = (category, bot) => {
    bot.ignoreList = {}
    category.addCommand("ignore", function(msg, line) {
        line = line.toLowerCase()
        id = parseInt(line, 10)
        if (typeof id !== "number" || isNaN(id)) {
            msg.reply("invalid userid.")
            return
        }

        bot.ignoreList[line] = true
        msg.reply(`added \`${line}\` to ignore list.`)
    }, {
        help: "Adds a Discord user to the list of people that the bot won't react to, using their user ID.",
        ownerOnly: true
    })
    category.addCommand("unignore", function(msg, line) {
        line = line.toLowerCase()
        if (!bot.ignoreList[line]) {
            msg.reply(`\`${line}\` not in ignore list.`)
            return
        }

        bot.ignoreList[line] = undefined
        msg.reply(`removed \`${line}\` from ignore list.`)
    }, {
        help: "Removes a Discord user from the list of people that the bot won't react to, using their user ID.",
        ownerOnly: true
    })

    category.addCommand("lockdown", function(msg, line) {
        bot.ownerOnly = !bot.ownerOnly
        msg.reply(`toggled lockdown ${bot.ownerOnly ? 'on' : 'off'}.`)
    }, {
        help: "Makes the bot only react to its owner. This is a toggle command.",
        ownerOnly: true
    })

    bot.client.on("ready", function() {
        bot.ownerOnly = !this.user.bot // Only allow owner to use the bot if the bot is a user, otherwise allow everyone
    })
}
