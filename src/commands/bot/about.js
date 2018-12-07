const Command = require("@commands/Command.js")
const Discord = require("@extensions/discord.js")

const prettyBytes = require("pretty-bytes")
const humanizeDuration = require("humanize-duration")

module.exports = class AboutCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Displays information about me."
        this.ownerOnly = false
    }

    callback(msg) { // Hurray for one-liners
        let owners = this.bot.ownerId.map(id => this.bot.client.users.resolve(id))

        let embed = this.result("Here's everything you need to know about me.")
            .addField(":star: Owner" + (owners.length == 1 ? "" : "s"), owners.join("\n"), true)
            .addField(":tools: Using", `Discord.js \`${Discord.version}\`\nNode.js \`${process.version}\`` , true)
            .addField(":link: Links", `[GitHub repository](${this.bot.repositoryURL})`, true)

            .addField(":desktop: RAM usage", prettyBytes(process.memoryUsage().rss), true)
            .addField(":arrow_up: Uptime", humanizeDuration(process.uptime() * 1000, { round: true }), true)

        msg.reply(embed)
    }
}
