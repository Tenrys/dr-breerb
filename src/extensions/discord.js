const Discord = require("discord.js")
const colors = require("../colors.js")

function resultMethod(name, emoji, defaultColor) {
    Discord.Message.prototype[name] = function(content, title, color) {
        if (emoji) {
            if (title) title = emoji + " " + title
            else content = emoji + " " + content
        }

        let embed = new Discord.MessageEmbed()
            // .setAuthor(this.author.tag, this.author.avatarURL()) // Apparently the mention actually shows up if using proper bot
            .setColor(color || defaultColor)
            .setDescription(content)
        if (title) embed.setTitle(title)

        return this.reply(embed)
    }

    Discord.Channel.prototype[name] = function(content, title, color) {
        if (emoji) {
            if (title) title = emoji + " " + title
            else content = emoji + " " + content
        }

        let embed = new Discord.MessageEmbed()
            // .setAuthor(this.author.tag, this.author.avatarURL())
            .setColor(color || defaultColor)
            .setDescription(content)
        if (title) embed.setTitle(title)

        return this.send(embed)
    }
}
resultMethod("result", null, null)
resultMethod("error", ":interrobang:", colors.red)
resultMethod("success", ":ballot_box_with_check:", colors.green)
