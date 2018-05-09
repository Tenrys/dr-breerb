
const Discord = require("discord.js")
global.client = new Discord.Client()
const http = require("http")
const fs = require("fs")
const parse = require("./parseargs.js")
const chalk = require("chalk")
Array.prototype.random = function() {
	return this[Math.floor((Math.random() * this.length))]
}
global.forin = function(obj, callback) { // I can't be fucked writing this over and over
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key]
			callback(key, value)
		}
	}
}

// Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically
// Also, future parity with DreamBot: need translate, Steam info and MyAnimeList support
client.ownerId = "138685670448168960"

// Load chatsound list from web
// TODO: Load last downloaded list on fail
// TODO: Avoid downloading new version if it's not very old?
client.soundListKeys = {}
let loadSoundlist = new Promise(function(resolve) {
	if (!fs.existsSync("soundlist.json")) {
		let request = http.get("http://cs.3kv.in/soundlist.json", function(response) {
			let stream = fs.createWriteStream("soundlist.json")
			stream.on("finish", resolve)

			response.pipe(stream)
		})
	} else { resolve() }
}).then(function() {
	client.soundList = JSON.parse(fs.readFileSync("soundlist.json"))

	for (let key in client.soundList) {
		if (client.soundList.hasOwnProperty(key)) {
			let cat = client.soundList[key]
			for (let name in cat) {
				if (cat.hasOwnProperty(name)) {
					if (!client.soundListKeys[name]) { client.soundListKeys[name] = [] }

					let sounds = cat[name]
					for (let i = 0; i < sounds.length; i++) {
						client.soundListKeys[name].push(sounds[i])
					}
					client.soundListKeys[name].sort()
				}
			}
		}
	}

	console.log("Soundlist loaded!")
})

// Command handler
client.ignoreList = {} // This isn't really well implemented.
client.ownerOnly = false

client.commands = require("./commands.js")
client.getCommands = function(category) {
	if (this.commands[category]) {
		let commands = {}
		forin(this.commands[category].commands, (name, data) => {
			data.category = category
			data.name = name
			commands[name] = data
			if (data.aliases) {
				data.aliases.forEach(name => {
					commands[name] = data
				})
			}
		})
		return commands
	} else {
		let commands = {}
		forin(this.commands, (category, data) => {
			forin(data.commands, (name, data) => {
				data.category = category
				data.name = name
				commands[name] = data
				if (data.aliases) {
					data.aliases.forEach(name => {
						commands[name] = data
					})
				}
			})
		})
		return commands
	}
}

// Ready up
// TODO: Per guild prefix
let prefix = "!"

client.on("ready", function() {
	console.log(`Logged in as ${client.user.tag}!`)

	client.user.setActivity(`${prefix}commands`, { type: "LISTENING" })
})

// TODO: Proper logging
client.on("message", function(msg) {
	if (client.ignoreList[msg.author.id]) { return }
	if (client.ownerOnly && msg.author.id !== client.ownerId) { return }

	let match = new RegExp(`^${prefix}([^\\s.]*)\\s?([\\s\\S]*)`, "gmi").exec(msg.content)
	if (match && match[1]) {
		let cmd = match[1].toLowerCase()
		let line = match[2]
		let args = []
		try {
			args = parse(line)
		} catch (e) {
			console.warn(chalk.bold.yellow(`[command: ${cmd}] `) + chalk.red('Argument parsing failed with line "' + line + '". Unexpected results may occur.'))
		}

		let action = client.getCommands()[cmd]
		if (action && action.callback) {
			if (action.guildOnly && !msg.guild) {
				msg.reply("this command can only be used while in a guild.")
				return
			}
			if (action.ownerOnly && msg.author.id !== client.ownerId) {
				msg.reply("this command can only be used by the bot's owner.")
				return
			}
			console.log(chalk.bold.yellow(`[command: ${cmd}] `) + 'From ' + msg.author.tag + (line ? ` ("${line}")` : ""))
			action.callback(msg, match[2], ...args)
		}
	}
})

// Let's begin
client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())

