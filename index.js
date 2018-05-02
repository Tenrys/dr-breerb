
const Discord = require("discord.js")
global.client = new Discord.Client()
const http = require("http")
const fs = require("fs")
const parse = require("./parseargs.js")
Array.prototype.random = function() {
	return this[Math.floor((Math.random() * this.length))]
}

// Load chatsound list from web
// TODO: Load last downloaded list on fail
// TODO: Avoid downloading new version if it's not very old?
global.soundlist
global.soundlistKeys = {}
let loadSoundlist = new Promise(function(resolve) {
	if (!fs.existsSync("soundlist.json")) {
		let request = http.get("http://cs.3kv.in/soundlist.json", function(response) {
			let stream = fs.createWriteStream("soundlist.json")
			stream.on("finish", resolve)

			response.pipe(stream)
		})
	} else { resolve() }
}).then(function() {
	soundlist = JSON.parse(fs.readFileSync("soundlist.json"))

	for (let key in soundlist) {
		if (soundlist.hasOwnProperty(key)) {
			let cat = soundlist[key]
			for (let name in cat) {
				if (cat.hasOwnProperty(name)) {
					if (!soundlistKeys[name]) { soundlistKeys[name] = [] }

					let sounds = cat[name]
					for (let i = 0; i < sounds.length; i++) {
						soundlistKeys[name].push(sounds[i])
					}
				}
			}
		}
	}

	console.log("Soundlist loaded!")
})

client.on("ready", function() {
	console.log(`Logged in as ${client.user.tag}!`)

	client.user.setActivity("!commands", { type: "LISTENING" })
})

// Command handler
let commands = require("./commands.js")
client.on("message", function(msg) {
	let match = /^!([^\s.]*)\s?(.*)/gi.exec(msg.content)
	if (match && match[1]) {
		let cmd = match[1]
		let args = []
		try {
			args = parse(match[2])
		} catch (e) {
			console.warn(`Argument parsing for command '${cmd}' failed with line '${match[2]}'. Unexpected results may occur.`)
		}

		let action = commands[cmd]
		if (action && action.callback) {
			if (action.guildOnly && !msg.guild) {
				msg.reply("This command can only be used while in a guild.")
				return
			}
			action.callback(msg, match[2], ...args)
		}
	}
})

// Let's begin
client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())

