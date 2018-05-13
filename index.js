
// TODO: Make forin a reusable module instead of polluting global scope..maybe

// Load libraries
const Discord = require("discord.js")
const client = new Discord.Client()
module.exports = client

const http = require("http")
const fs = require("fs")

// Custom fancy stuff
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

// Load our own stuff
const commands = require("./commands.js")

// Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically
// TODO: Proper logging
// Also, future parity with DreamBot: need translate, Steam info and MyAnimeList support
client.ownerId = "138685670448168960"

// Load chatsound list from web
// TODO: Load last downloaded list on fail
// TODO: Avoid downloading new version if it's not very old?
client.soundListKeys = {}
new Promise(function(resolve) {
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

client.on("ready", function() {
	console.log(`Logged in as ${client.user.tag}!`)
})

// Begin
client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())

