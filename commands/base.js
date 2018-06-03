
const Discord = require("discord.js")
const fs = require("fs")
const util = require("util")
const child_process = require("child_process")

const client = require("../index.js")
const { CommandCategory } = require("../commands.js")
const logger = require("../logging.js")

function truncate(res) {
	if (res.length > 1970) {
		return res.substr(0, 1970) + "\n[...] (output truncated)"
	} else {
		return res
	}
}

let category = new CommandCategory("base", ":gear: Base", "Basic commands related to the bot and other stuff.")
category.addCommand("ping", function(msg, line, ...args) {
	msg.reply("pong!")
}, { help: "Pings the bot" })

/*
 * TODO: Add "Usage" and/or "Example" fields to help
 * TODO: Add paging if I go over the number of possible fields (25)
 */
category.addCommand("help", function(msg, line) { // Okay this is messy
	let embed = new Discord.MessageEmbed()
		.setColor(0x5ABEBC)
		.setAuthor(msg.author.tag, msg.author.avatarURL())

	line = line.toLowerCase()

	let category = client.commands.get(line) // Try to get a category
	let command = category.commands.get(line) // Assuming we didn't find a category, and we fell back to the "all" category

	if (command) { // Looking up a specific command
		embed.setTitle(`:information_source: Command help: \`${command.name}\``)
			.setDescription(command.help)
	} else { // Looking up all categories OR all commands
		let showAll = line === "all"
		embed.setTitle(":tools: Command list")
		if (!showAll) {
			embed.setDescription("If you want to see all commands at once, run the same command again with the `all` argument.")
		}

		forin(client.commands, (_, category) => {
			if (category instanceof CommandCategory) {
				if ((showAll && category.name === "all") || (!showAll && category.name !== "all")) {
					embed.addField(category.printName, category.description + "\n" + "```" + category.commands.map(command => command.name).join(", ") + "```")
				}
			}
		})
	}

	msg.channel.send(embed)
}, { help: "Displays information about commands and their categories." })

category.addCommand("eval", function(msg, line) {
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
		res = prettifyError(err)

		embed.setColor(0xE25555)
			.setTitle(":interrobang: JavaScript error")
	}

	embed.setDescription(`\`\`\`js\n${truncate(res)}\n\`\`\``)

	msg.channel.send(embed)
}, {
	help: "Executes JavaScript code and displays its result.",
	ownerOnly: true
})

let runCommand = function(msg, cmd) {
	return new Promise((resolve, reject) => {
		let proc = child_process.spawn(cmd, [], { shell: true })

		proc.stdout.on("data", msg.print)
		proc.stderr.on("data", msg.print)
		proc.on("close", () => {
			resolve()
		})
		proc.on("error", (err) => {
			reject(err)
		})
	})
}
category.addCommand("exec", async function(msg, line) {
	await runCommand(msg, line)
}, {
	help: "Executes a command from the shell.",
	ownerOnly: true
})
category.addCommand("update", async function(msg, line) {
	msg.reply("updating...\n")
	await runCommand(msg, "git pull origin master")
}, {
	help: "Updates the bot to the latest revision from its GitHub repository and quits it.",
	ownerOnly: true,
	postRun: function() {
		process.exit() // Restarting is handled by start.sh
	}
})

client.ignoreList = {}
category.addCommand("ignore", function(msg, line) {
	line = line.toLowerCase()
	id = parseInt(line, 10)
	if (typeof id !== "number" || isNaN(id)) {
		msg.reply("invalid userid.")
		return
	}

	client.ignoreList[line] = true
	msg.reply(`added \`${line}\` to ignore list.`)
}, {
	help: "Adds a Discord user to the list of people that the bot won't react to, using their user ID.",
	ownerOnly: true
})
category.addCommand("unignore", function(msg, line) {
	line = line.toLowerCase()
	if (!client.ignoreList[line]) {
		msg.reply(`\`${line}\` not in ignore list.`)
		return
	}

	client.ignoreList[line] = undefined
	msg.reply(`removed \`${line}\` from ignore list.`)
}, {
	help: "Removes a Discord user from the list of people that the bot won't react to, using their user ID.",
	ownerOnly: true
})

client.ownerOnly = false
category.addCommand("lockdown", function(msg, line) {
	client.ownerOnly = !client.ownerOnly
	msg.reply("toggled lockdown " + (client.ownerOnly ? "on" : "off") + ".")
}, {
	help: "Makes the bot only react to its owner. This is a toggle command.",
	ownerOnly: true
})

category.addCommand("pick", function(msg, line, ...str) { // This is stupidly easy but Kabus wanted it
	if (!str) { return }
	if (str.length < 1) { return }

	msg.reply(str.random())
}, { help: "Picks a random argument from the ones you provide." })

module.exports = category
