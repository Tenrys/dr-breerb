const bot = require("./index.js")
const Discord = require("discord.js")

process.on("uncaughtException", err => {
	bot.logger.error("critical", `JavaScript unhandled exception: ${err.stack || err}`)

	/* This does not work, save err stack in a file and send when bot has restarted..?
	try {
		let embed = new Discord.MessageEmbed()
			.setColor(bot.colors.red)
			.setTitle(`:interrobang: JavaScript unhandled exception`)
			.setDescription(bot.formatErrorToDiscord(err))

		bot.client.users.get(bot.client.ownerId).send(embed)
	} catch (err) {
		// logger.error("critical", `Couldn't send message to bot owner: ${err.stack || err}`)
		bot.logger.error("critical", `Couldn't send message to bot owner, probably couldn't connect yet.`)
	}
	*/

	bot.logger.error("critical", "Quitting to avoid unforeseen consequences.")
	process.exit()
})
