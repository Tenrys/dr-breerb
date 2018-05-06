
const Discord = require("discord.js")
const fs = require("fs")
const util = require("util")

function truncate(res) {
	if (res.length > 1970) {
		return res.substr(0, 1970) + "\n[...] (output truncated)"
	} else {
		return res
	}
}

let category = {
	commands: {},
	description: "Bot-related commands.",
	name: "base",
	printName: ":gear: Base"
}

category.commands.ping = {
	callback: function(msg, line, ...args) {
		msg.reply("pong!")
	},
	help: "Pings the bot.",
}

/*
 * TODO: Add "Usage" and/or "Example" fields to help
 * TODO: Maybe add "all commands" listing, not sure
 */

category.commands.help = {
	callback: function(msg, line) {
		let embed = new Discord.MessageEmbed()
			.setColor(0x5ABEBC)
			.setAuthor(msg.author.tag, msg.author.avatarURL())

		if (line) {
			let query = line.toLowerCase().trim()

			let category = client.commands[query]
			let allCommands = client.getCommands()
			let command = allCommands[query]

			if (category) { // Looking up a category and it's commands
				let commands = client.getCommands(category.name) // Show aliases!
				embed.setTitle(`Category help: ${category.printName}`)
					.addField(":tools: Command list", "`" + Object.keys(commands).join(", ") + "`")
				if (category.description) {
					embed.setDescription(category.description)
				}
			} else if (command) { // Looking up a specific command
				embed.setTitle(`:information_source: Command help: \`${command.name}\``)
					.setDescription(command.help || "No information provided.")
			}
		} else {
			embed.setTitle(`:tools: Command list`)
				.setDescription("Call this command with a category name or command name to get information relevant for them.")
			forin(client.commands, (_, category) => {
				let commands = client.getCommands(category.name) // Show aliases!
				embed.addField(category.printName, "`" + Object.keys(commands).join(", ") + "`")
			})
		}
		msg.channel.send(embed)
	},
	help: "Displays information about commands."
}
category.commands.eval = {
	callback: function(msg, line) {
		let embed = new Discord.MessageEmbed()
			.setAuthor(msg.author.tag, msg.author.avatarURL())

		let res

		try {
			res = eval(line)

			if (typeof res !== "string")
				res = util.inspect(res)

			embed.setColor(0xE2D655)
				.setTitle("JavaScript result")
		} catch (err) {
			res = err

			embed.setColor(0xE25555)
				.setTitle("JavaScript error")
		}

		embed.setDescription(`\`\`\`js\n${truncate(res)}\n\`\`\``)

		msg.channel.send(embed)
	},
	ownerOnly: true,
	help: "Executes JavaScript code and displays its result."
}
category.commands.ignore = {
	callback: function(msg, line) {
		line = line.toLowerCase().trim()
		id = parseInt(line, 10)
		if (typeof id !== "number" || isNaN(id)) {
			msg.reply("invalid userid.")
			return
		}

		client.ignoreList[line] = true
		msg.reply(`added \`${line}\` to ignore list.`)
	},
	ownerOnly: true
}
category.commands.unignore = {
	callback: function(msg, line) {
		line = line.toLowerCase().trim()
		if (!client.ignoreList[line]) {
			msg.reply(`\`${line}\` not in ignore list.`)
			return
		}

		client.ignoreList[line] = undefined
		msg.reply(`removed \`${line}\` from ignore list.`)
	},
	ownerOnly: true
}
category.commands.lockdown = {
	callback: function(msg, line) {
		client.ownerOnly = !client.ownerOnly
		msg.reply("toggled lockdown " + (client.ownerOnly ? "on" : "off") + ".")
	},
	ownerOnly: true
}

module.exports = category
