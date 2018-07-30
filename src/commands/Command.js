const InvalidArgumentException = require("@utils/classes/InvalidArgumentException.js")

const Discord = require("discord.js")

const { colors } = require("@utils")

const path = require("path")

/**
 * A chat command to be used by a Discord user.
 */
class Command {
    get categoryName() {
        return Command.categoryNames[this.category]
    }

    constructor(bot) {
        this.bot = bot

        this.description = "No information provided."
        this.guildOnly = false
        this.ownerOnly = false
        this.aliases = []
        this.postRun = () => {}
        this.permissions = {
            bot: [],
            user: []
        }
    }

    callback(msg, line, ...args) {}
}

Command.categoryNames = {
    bot: ":robot: Bot",
    chatsounds: ":speaker: Chatsounds",
    guild: ":two_men_holding_hands: Server",
    utility: ":gear: Utility",
    commands: ":star: All"
}

function resultMethod(name, emoji, defaultColor) {
    Command.prototype[name] = function(content, title, color) {
        if (title === undefined) title = this.categoryName

        if (emoji) {
            if (title) title = emoji + " " + title
            else content = emoji + " " + content
        }

        let embed = new Discord.MessageEmbed()
            .setColor(color || defaultColor)
            .setDescription(content)
        if (title) embed.setTitle(title)

        return embed
    }
}
resultMethod("result")
resultMethod("error", ":interrobang:", colors.red)
resultMethod("success", ":ballot_box_with_check:", colors.green)

module.exports = Command
