const Discord = require("discord.js")
const colors = require.main.require("./src/colors.js")

function resultMethod(name, emoji, defaultColor) {
    function makeEmbed(content, title, color) {
        if (emoji) {
            if (title) title = emoji + " " + title
            else content = emoji + " " + content
        }

        let embed = new Discord.MessageEmbed()
            // .setAuthor(this.author.tag, this.author.avatarURL()) // Apparently the mention actually shows up if using proper bot
            .setColor(color || defaultColor)
            .setDescription(content)
        if (title) embed.setTitle(title)

        return embed
    }

    Discord.Message.prototype[name] = async function(content, title, color) {
        return await this.reply(makeEmbed(content, title, color))
    }

    Discord.Channel.prototype[name] = async function(content, title, color) {
        return await this.send(makeEmbed(content, title, color))
    }

    Discord.MessageEmbed.prototype[name] = async function(content, title, color) {
        return makeEmbed(content, title, color)
    }
}
resultMethod("result", null, null)
resultMethod("error", ":interrobang:", colors.red)
resultMethod("success", ":ballot_box_with_check:", colors.green)

module.exports = Discord
