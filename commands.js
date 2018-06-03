
const Discord = require("discord.js")
const fs = require("fs")

const logger = require("./logging.js")
const parse = require("./parseargs.js")
const client = require("./index.js")

class InvalidArgumentException extends Error {
	constructor(name, type) {
		this.name = "InvalidArgumentException"
		this.message = `'${name}' needs to be of type '${type}'`
	}
}

class Command {
	constructor(name, callback, options) {
		if (typeof name !== "string") { throw new InvalidArgumentException("name", "string") }
		if (typeof callback !== "function") { throw new InvalidArgumentException("callback", "function") }
		if (options !== undefined && typeof options !== "object") { throw new InvalidArgumentException("options", "object") }

		this.name = name
		this.callback = callback
		this.help = options.help || "No information provided."
		this.guildOnly = options.guildOnly || false
		this.ownerOnly = options.ownerOnly || false
		this.aliases = options.aliases || []
		this.postRun = options.postRun
	}
}

class CommandCategory {
	constructor(name, printName = "Unnamed", desc = "No information provided.") {
		this._commands = []
		this.description = desc
		this.name = name
		this.printName = printName
	}

	addCommand(name, callback, options) {
		let command = new Command(name, callback, options)
		command.category = this
		this._commands.push(command)
		return command
	}

	get commands() {
		let commands = this._commands
		commands.__proto__.get = function(name) {
			if (name === undefined) {
				return commands
			}
			return commands.filter(x => {
				return x.name == name || x.aliases.includes(name)
			})[0]
		}
		return commands
	}
	set commands(a) {
		if (typeof a !== "object") { throw new InvalidArgumentException("aliases", "object") }

		this._commands = a
	}
}

let categories = {
	get: function(category) {
		if (this[category] && this[category] instanceof CommandCategory) {
			return this[category]
		} else {
			let cmd = this.all.commands.get(category)
			if (cmd && cmd instanceof Command) {
				return cmd
			} else {
				return this.all
			}
		}
	},
	all: new CommandCategory("all", ":star: All commands", "Every command available.")
}
Object.defineProperty(categories.all, "_commands", {
	get: function() {
		let commands = []

		forin(categories, (name, category) => {
			if (name !== "all" && category instanceof CommandCategory) {
				category._commands.forEach((command) => {
					commands.push(command)
				})
			}
		})

		return commands
	}
})

module.exports = {
	Command,
	CommandCategory
}
fs.readdirSync("./commands").forEach(function(file) {
	let category = require("./commands/" + file)
	categories[category.name] = category
})
module.exports.categories = categories

// TODO: Per guild prefix
client.commands = categories
let prefix = "!"
client.on("message", async function(msg) {
	if (this.ignoreList && this.ignoreList[msg.author.id]) { return }
	if (this.ownerOnly && msg.author.id !== this.ownerId) { return }

	let match = new RegExp(`^${prefix}([^\\s.]*)\\s?([\\s\\S]*)`, "gmi").exec(msg.content)
	if (match && match[1]) {
		let cmd = match[1].toLowerCase()
		let line = match[2].trim()
		let args = []
		try {
			args = parse(line)
		} catch (err) {
			// logger.error(`command-${cmd}`, 'Argument parsing failed with line "' + line + '". Unexpected results may occur: ' + err)
		}

		let action = this.commands.get().commands.get(cmd)
		if (action && action.callback) {
			if (action.guildOnly && !msg.guild) {
				msg.reply("this command can only be used while in a guild.")
				return
			}
			let logDetails = `(channel: ${msg.channel.id}, user: ${msg.author.id}` + (line ? `, line: '${line}'` : "") + ")"
			if (action.ownerOnly && msg.author.id !== this.ownerId) {
				msg.reply("this command can only be used by the bot's owner.")
				logger.error(`command-${cmd}`, "Invalid permissions from '" + msg.author.tag + "' " + logDetails)
				return
			}

			logger.log(`command-${cmd}`, "Ran by '" + msg.author.tag + "' " + logDetails)
			try {
				msg.printBuffer = ""
				msg.print = function(...args) {
					args.forEach((val) => {
						msg.printBuffer = msg.printBuffer + val.toString() + "\n"
					})
				}

				await action.callback(msg, match[2], ...args)

				if (msg.printBuffer) {
					await msg.channel.send(`\`\`\`\n${msg.printBuffer}\n\`\`\``)
				}
				if (action.postRun) {
					action.postRun(msg)
				}
			} catch (err) {
				let embed = new Discord.MessageEmbed()
					.setColor(0xE25555)
					.setTitle(`:interrobang: JavaScript error: from command '${cmd}'`)
					.setDescription(prettifyError(err))

				logger.error(`command-${cmd}`, `Error: ${err.stack || err}`)
				msg.channel.send(embed)
			}
		}
	}
})

client.on("ready", function() {
	this.user.setActivity(`${prefix}help`, { type: "LISTENING" })
})

