const logger = require("@utils/classes/Logger.js")

module.exports = bot => {
    process.on("uncaughtException", err => {
        logger.error("critical", `JavaScript unhandled exception: ${err.stack || err}`)

        /* This does not work, save err stack in a file and send when bot has restarted..?
        try {
            let embed = new Discord.MessageEmbed()
                .setColor(bot.colors.red)
                .setTitle(`:interrobang: JavaScript unhandled exception`)
                .setDescription(bot.errorToMarkdown(err))

            bot.client.users.get(bot.client.ownerId).send(embed)
        } catch (err) {
            // logger.error("critical", `Couldn't send message to bot owner: ${err.stack || err}`)
            bot.logger.error("critical", `Couldn't send message to bot owner, probably couldn't connect yet.`)
        }
        */

        logger.error("critical", "Quitting to avoid unforeseen consequences.")
        process.exit()
    })
}
