
const Discord = require("discord.js")
const fs = require("fs")
const https = require("https")
const http = require("http")
const path = require("path")
const shell = require("shelljs")
const util = require("util")

const logger = require("../logging.js")
const page = require("../page.js")
const client = require("../index.js")
const { CommandCategory } = require("../commands.js")

let category = new CommandCategory("audio", ":speaker: Audio", "Voice channel stuff.")

/*
 * TODO: Add support for Valve game sounds (https://github.com/PAC3-Server/chatsounds-valve-games, msgpack lib)
 * TODO: Allow overlapping chatsounds on top of another (https://www.npmjs.com/package/audio-mixer)
 * TODO: Play chatsounds one after another, try using the same folder for them (prioritize long chatsounds over short ones) (queueing)
 * TODO: Allow assigning channel to play anything said as a chatsound if it exists (#chatsounds)
 * TODO: Add modifiers somehow (manually use ffmpeg for this shite?)
 * TODO: Make volume command persist through voice channel connection
 * TODO: Allow to search chatsounds by their residing folder / category
 */

// Load chatsound list from web
client.soundListKeys = {}
client.loadSoundlist = function(err) {
	try {
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

		logger.success("soundlist", "Loaded")
	} catch (err2) {
		logger.error("soundlist", "Loading failed: " + (err || err2))
	}
}
client.downloadSoundlist = function() {
	return new Promise(function(resolve, reject) {
		let stats, outdated
		try {
			stats = fs.statSync("soundlist.json")
			outdated = new Date().getTime() > stats.mtime.getTime() + (86400 * 7)
		} catch {

		}

		if (!fs.existsSync("soundlist.json") || outdated) {
			let request = http.get("http://cs.3kv.in/soundlist.json", function(response) {
				let stream = fs.createWriteStream("soundlist.json")
				stream.on("finish", resolve)

				response.pipe(stream)
			}).on("error", (err) => {
				reject(err)
			})
		} else {
			resolve()
		}
	})
}
client.downloadSoundlist().then(client.loadSoundlist, client.loadSoundlist)

category.addCommand("join", async function(msg, line, ...args) {
	if (!msg.member) { msg.reply("webhooks unsupported."); return }

	let vc = msg.guild.me.voiceChannel

	if (!vc) {
		vc = msg.member.voiceChannel

		if (vc) {
			await vc.join()
		} else {
			msg.reply("you aren't in any channel.")
		}
	} else {
		if (!vc.connection) {
			logger.warn("discord-voice", "No connection? What.")
			await vc.leave()
			await vc.join()
		}
	}

	return vc
}, {
	guildOnly: true,
	help: "Makes the bot join the voice channel you are currently in."
})
category.addCommand("leave", function(msg, line) {
	let vc = msg.guild.me.voiceChannel

	if (vc) {
		vc.leave()
	} else {
		msg.reply("I am not in any channel.")
	}
}, {
	guildOnly: true,
	help: "Makes the bot leave the voice channel it's in."
})

let repoPath = "https://raw.githubusercontent.com/Metastruct/garrysmod-chatsounds/master/sound/"
category.addCommand("play", async function(msg, line) {
	if (!client.soundListKeys) { msg.reply("sound list hasn't loaded yet."); return }

	let vc = await client.commands.get("join").callback(msg)

	line = line.toLowerCase()

	if (vc && vc.connection) {
		let snd, sndInfo

		// Are we trying to get a random chatsound
		if (line == "random") {
			snd = client.soundListKeys[Object.keys(client.soundListKeys).random()]
			sndInfo = snd.random()
		} else { // If not
			// Check if we want a specific chatsound
			let num = /#(\d+)$/gi.exec(line)
			if (num) { num = num[1] }
			line = line.replace(/#\d+$/gi, "")

			// Get the chatsound and its variants
			snd = client.soundListKeys[line]
			if (!snd) {
				client.commands.get("search").callback(msg, line, { content: `<@${msg.author.id}>, maybe you were looking for these chatsounds?`, displayCount: 5 })
				return
			}

			// Determine which variant to play
			if (num !== undefined && num !== null) {
				num = Math.floor(Math.max(0, Math.min(parseInt(num, 10) - 1, snd.length - 1)))
				sndInfo = snd[num]
			} else {
				sndInfo = snd.random()
			}
		}

		let sndPath = sndInfo.path
		let filePath = path.join("cache", sndPath)

		let playFile = new Promise((resolve) => {
			if (!fs.existsSync(filePath)) {
				logger.log("sound", sndPath + ": download")

				let dir = /(.*)\/.*$/gi.exec(sndPath)
				shell.mkdir("-p", path.join("cache", dir[1]))

				let request = https.get(repoPath + encodeURI(sndPath), function(response) {
					if (response.statusCode == 200) {
						let writeFile = fs.createWriteStream(filePath)
						writeFile.on("finish", resolve)

						response.pipe(writeFile)
					}
				})
			} else {
				resolve()
			}
		}).then(function() {
			let audio = vc.connection.play(fs.createReadStream(filePath), { volume: 0.66 })
			audio.on("start", () => console.log(sndPath, ": start"))
			audio.on("end", () => console.log(sndPath, ": end"))
		})
	}
}, {
	guildOnly: true,
	help: "Plays a custom chatsound from the GitHub repository. Does not support chatsounds from games like Half-Life 2, and such."
})
category.addCommand("stop", function(msg, line) {
	let vc = msg.guild.me.voiceChannel
	if (vc && vc.connection && vc.connection.dispatcher) {
		vc.connection.dispatcher.end()
	}
}, {
	aliases: ["sh"],
	guildOnly: true,
	help: "Stops playing a chatsound."
})

category.addCommand("volume", function(msg, line, vol) {
	let vc = msg.guild.me.voiceChannel

	if (vc && vc.connection && vc.connection.dispatcher) {
		let volume = Math.min(1, Math.max(0, vol))
		let playing = vc.connection.dispatcher

		if (!vol) {
			msg.reply("volume: " + playing.volume * 100 + "%.")
		} else {
			playing.setVolume(volume)
			msg.reply("changed playing chatsound's volume to " + playing.volume * 100 + "%.")
		}
	} else {
		msg.reply("I am not in any channel.")
	}
}, {
	aliases: ["vol"],
	guildOnly: true,
	help: "Changes the volume of the chatsound that's currently playing.\n\nVolume can be between 0 and 1."
})

category.addCommand("search", function(msg, line, ...options) {
	if (options && typeof options[0] == "object") {
		options = options[0]
	} else {
		options = undefined
	}

	if (!client.soundListKeys) { msg.reply("sound list hasn't loaded yet."); return }

	line = line.toLowerCase()

	let results = []
	forin(client.soundListKeys, (name) => {
		if (name.toLowerCase().trim().includes(line)) {
			results.push(name)
		}
	})
	if (results.length <= 0) {
		msg.reply("couldn't find any chatsound.")
		return null
	}
	results.sort(function(a, b) {
		return 	a.length - b.length || // sort by length, if equal then
				a.localeCompare(b)     // sort by dictionary order
	})

	let handler = async function(to) {
		let displayCount = this.displayCount || page.displayCount
		let buf = ""
		for (let i = displayCount * (this.page - 1); i < displayCount * this.page; i++) {
			if (!this.data[i]) { break }
			buf = buf + (i + 1) + `. \`${this.data[i]}\`\n`
		}

		let embed = new Discord.MessageEmbed()
			.setAuthor(msg.author.tag, msg.author.avatarURL())
			.setTitle("Chatsound search results")
			.setDescription(buf)
			.setFooter(`Page ${this.page}/${this.lastPage} (${this.data.length} entries)`)

		let result = this.message
		if (!result) {
			result = await msg.channel.send(options ? options.content : "", embed)
		} else {
			await this.message.edit(embed)
		}

		return result
	}
	return page.init(null, msg, results, handler, options ? options.displayCount : null)
}, {
	aliases: ["find"],
	help: "Searches chatsounds by name."
})

category.addCommand("reloadsnds", function(msg, line) {
	fs.unlink(path.join(__dirname, "..", "soundlist.json"), function() {
		client.downloadSoundlist().then(function() {
			client.loadSoundlist()
			msg.reply("chatsounds list refreshed.")
		})
	})
}, {
	help: "Reloads the chatsound list.",
	ownerOnly: true
})

module.exports = category