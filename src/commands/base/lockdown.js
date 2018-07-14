const Discord = require.main.require("./src/extensions/discord.js")

module.exports = (category, bot) => {
    bot.ignoreList = {}
    category.addCommand("ignore", (msg, line) => {
        line = line.toLowerCase()
        id = parseInt(line, 10)
        if (typeof id !== "number" || isNaN(id)) {
            msg.error("Invalid user ID.")
            return
        }

        bot.ignoreList[line] = true
        msg.success(`Added \`${line}\` to ignore list.`)
    }, {
        help: "Adds a Discord user to the list of people that the bot won't react to, using their user ID.",
        ownerOnly: true
    })
    category.addCommand("unignore", (msg, line) => {
        line = line.toLowerCase()
        if (!bot.ignoreList[line]) {
            msg.error(`\`${line}\` not in ignore list.`)
            return
        }

        bot.ignoreList[line] = undefined
        msg.success(`Removed \`${line}\` from ignore list.`)
    }, {
        help: "Removes a Discord user from the list of people that the bot won't react to, using their user ID.",
        ownerOnly: true
    })

    category.addCommand("lockdown", (msg, line) => {
        bot.ownerOnly = !bot.ownerOnly
        msg.success(`Toggled lockdown ${bot.ownerOnly ? 'on' : 'off'}.`)
    }, {
        help: "Makes the bot only react to its owner. This is a toggle command.",
        ownerOnly: true
    })

    bot.client.on("ready", () => {
        bot.ownerOnly = !bot.client.user.bot // Only allow owner to use the bot if the bot is a user, otherwise allow everyone
    })
}
