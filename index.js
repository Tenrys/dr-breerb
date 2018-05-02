const Discord = require("discord.js")
const client = new Discord.Client()
const http = require("http")
const fs = require("fs")
const parse = require("./parseargs.js")
Array.prototype.random = function() {
	return this[Math.floor((Math.random() * this.length))]
}

global.soundlist
global.soundlistKeys = {}
let loadSoundlist = new Promise(function(resolve) {
	let request = http.get("http://cs.3kv.in/soundlist.json", function(response) {
		let stream = fs.createWriteStream("soundlist.json")
		stream.on("finish", resolve)

		response.pipe(stream)
	})
}).then(function() {
	soundlist = JSON.parse(fs.readFileSync("soundlist.json"))

	for (key in soundlist) {
		if (soundlist.hasOwnProperty(key)) {
			let cat = soundlist[key]
			for (name in cat) {
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

let commands = require("./commands.js")

client.on("message", function(msg) {
	let match = /^!([^\s.]*)\s?(.*)/gi.exec(msg.content)
	if (match && match[1]) {
		let cmd = match[1]
		let args = parse(match[2])

		let action = commands[cmd]
		if (action && action.callback) {
			action.callback(msg, match[2], ...args)
		}
	}
})

client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())

