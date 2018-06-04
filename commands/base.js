const logger = require("../logging.js")

const bot = require("../index.js")
const { Command, CommandCategory } = require("../commands.js")

const Discord = require("discord.js")
const fs = require("fs")
const util = require("util")
const child_process = require("child_process")

let base = new CommandCategory("base", ":gear: Base", "Basic commands related to the bot and other stuff.")
base.addCommand("ping", function(msg, line, ...args) {
	msg.reply("pong!")
}, { help: "Pings the bot" })

/*
 * TODO: Add "Usage" and/or "Example" fields to help (low priority)
 * TODO: Add paging if I go over the number of possible fields (25), though unlikely
 */
base.addCommand("help", function(msg, line) {
	line = line.toLowerCase()
	let res = bot.commands.get(line)

	let embed = new Discord.MessageEmbed()
		.setColor(0x5ABEBC)
		.setAuthor(msg.author.tag, msg.author.avatarURL())

	if (res instanceof Command) {
		embed.setTitle(`:information_source: Command help: \`${res.name}\``)
			.setDescription(res.help)
	} else if (res instanceof CommandCategory) {
		let showAll = line === "all"
		embed.setTitle(":tools: Command list")
		if (!showAll) {
			embed.setDescription("If you want to see all commands at once, run the same command again with the `all` argument.")
		}

		forin(bot.commands, (_, cat) => {
			if (cat instanceof CommandCategory) {
				if ((showAll && cat.name === "all") || (!showAll && cat.name !== "all")) {
					embed.addField(cat.printName, cat.description + "\n" + "```" + cat.commands.map(cmd => cmd.name).join(", ") + "```")
				}
			}
		})
	}

	msg.channel.send(embed)
}, { help: "Displays information about commands and their categories." })

base.addCommand("eval", function(msg, line) {
	let code = /^```\w*\n([\s\S]*)```$/gim.exec(line) // Test if we put a language after the code blocks first
	if (code && code[1]) {
		line = code[1]
	} else {
		code = /^```([\s\S]*)```$/gim.exec(line) // If not then treat everything inside as code
		if (code && code[1])
			line = code[1]
	}

	let embed = new Discord.MessageEmbed()
		.setAuthor(msg.author.tag, msg.author.avatarURL())

	let res
	try {
		let print = msg.print
		res = eval(line)

		if (typeof res !== "string")
			res = util.inspect(res)

		embed.setColor(0xE2D655)
			.setTitle(":ballot_box_with_check: JavaScript result")
	} catch (err) {
		res = bot.formatErrorToDiscord(err)

		embed.setColor(0xE25555)
			.setTitle(":interrobang: JavaScript error")
	}

	embed.setDescription(`\`\`\`js\n${bot.truncate(res)}\n\`\`\``)

	msg.channel.send(embed)
}, {
	help: "Executes JavaScript code and displays its result.",
	ownerOnly: true
})

/**
 * Runs a command in the running operating system's shell, and prints its results to the requesting channel.
 * @param {Discord.Message} msg The message that requested the command to be run.
 * @param {string} cmd The entire command line to be run.
 */
function runCommand(msg, cmd) {
	return new Promise((resolve, reject) => {
		let proc = child_process.spawn(cmd, [], { shell: true })

		proc.stdout.on("data", msg.print)
		proc.stderr.on("data", msg.print)
		proc.on("close", () => {
			resolve()
		})
		proc.on("error", err => {
			reject(err)
		})
	})
}

base.addCommand("exec", async function(msg, line) {
	await runCommand(msg, line)
}, {
	help: "Executes a command from the shell.",
	ownerOnly: true
})
base.addCommand("update", async function(msg, line) {
	msg.reply("updating...\n")
	await runCommand(msg, "git pull origin master")
}, {
	help: "Updates the bot to the latest revision from its GitHub repository and quits it.",
	ownerOnly: true,
	postRun() {
		process.exit() // Restarting is handled by start.sh
	}
})

bot.ignoreList = {}
base.addCommand("ignore", function(msg, line) {
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
base.addCommand("unignore", function(msg, line) {
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

base.addCommand("lockdown", function(msg, line) {
	bot.ownerOnly = !bot.ownerOnly
	msg.reply("toggled lockdown " + (bot.ownerOnly ? "on" : "off") + ".")
}, {
	help: "Makes the bot only react to its owner. This is a toggle command.",
	ownerOnly: true
})

base.addCommand("pick", function(msg, line, ...str) { // This is stupidly easy but Kabus wanted it
	if (!str) { return }
	if (str.length < 1) { return }

	msg.reply(str.random())
}, { help: "Picks a random argument from the ones you provide." })

bot.client.on("ready", function() {
	bot.ownerOnly = !this.user.bot // Only allow owner to use the bot if the bot is a user, otherwise allow everyone
})

module.exports = base
