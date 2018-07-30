const Command = require("../Command.js")

const path = require("path")
const fs = require("fs")
const shell = require("shelljs")

const https = require("https")

const chatsndsRepositoryURL = "https://raw.githubusercontent.com/Metastruct/garrysmod-chatsounds/master/sound/"

module.exports = class SoundCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Plays a custom chatsound from the GitHub repository. Chatsounds from Valve games are coming soon."
        this.aliases = [ "play" ]
        this.guildOnly = true
    }

    async callback(msg, line) {
        if (!this.bot.soundListKeys) { msg.reply(this.error("Sound list hasn't loaded yet.")); return }

        line = line.toLowerCase()

        let vc = await this.bot.commands.get("join").callback(msg)

        if (vc && vc.connection) {
            let snd, sndInfo

            // Are we trying to get a random chatsound
            if (line === "random") {
                snd = this.bot.soundListKeys[Object.keys(this.bot.soundListKeys).random()]
                sndInfo = snd.random()
            } else { // If not
                // Check if we want a specific chatsound
                let num = /#(\d+)$/gi.exec(line)
                if (num) num = num[1]
                line = line.replace(/#\d+$/gi, "")

                // Get the chatsound and its variants
                snd = this.bot.soundListKeys[line]
                if (!snd) {
                    this.bot.commands.get("search").callback(msg, line, { content: `<@${msg.author.id}>, maybe you were looking for these chatsounds?`, displayCount: 5 })
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

            new Promise(resolve => {
                if (!fs.existsSync(filePath)) {
                    this.bot.logger.log("sound", sndPath + ": download")

                    let dir = /(.*)\/.*$/gi.exec(sndPath)
                    shell.mkdir("-p", path.join("cache", dir[1]))

                    let req = https.get(chatsndsRepositoryURL + encodeURI(sndPath), res => {
                        if (res.statusCode == 200) {
                            let writeFile = fs.createWriteStream(filePath)
                            writeFile.on("finish", resolve)

                            res.pipe(writeFile)
                        }
                    })
                } else {
                    resolve()
                }
            }).then(() => {
                let audio = vc.connection.play(fs.createReadStream(filePath), { volume: vc.guild.volume || 0.66 })
                audio.on("start", () => this.bot.logger.log("chatsound", sndPath + ": start"))
                audio.on("end", () => this.bot.logger.log("chatsound", sndPath + ": end"))
            })
        }
    }
}
