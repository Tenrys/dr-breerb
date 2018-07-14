const fs = require("fs")
const path = require("path")
const shell = require("shelljs")

const https = require("https")

module.exports = (category, bot) => {
    const chatsndsRepositoryURL = "https://raw.githubusercontent.com/Metastruct/garrysmod-chatsounds/master/sound/"

    category.addCommand("play", async (msg, line) => {
        if (!bot.soundListKeys) { msg.error("Sound list hasn't loaded yet.", category.printName); return }

        line = line.toLowerCase()

        let vc = await bot.commands.get("join").callback(msg)

        if (vc && vc.connection) {
            let snd, sndInfo

            // Are we trying to get a random chatsound
            if (line == "random") {
                snd = bot.soundListKeys[Object.keys(bot.soundListKeys).random()]
                sndInfo = snd.random()
            } else { // If not
                // Check if we want a specific chatsound
                let num = /#(\d+)$/gi.exec(line)
                if (num) { num = num[1] }
                line = line.replace(/#\d+$/gi, "")

                // Get the chatsound and its variants
                snd = bot.soundListKeys[line]
                if (!snd) {
                    bot.commands.get("search").callback(msg, line, { content: `<@${msg.author.id}>, maybe you were looking for these chatsounds?`, displayCount: 5 })
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

            let playFile = new Promise(resolve => {
                if (!fs.existsSync(filePath)) {
                    bot.logger.log("sound", sndPath + ": download")

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
                audio.on("start", () => bot.logger.log("chatsound", sndPath + ": start"))
                audio.on("end", () => bot.logger.log("chatsound", sndPath + ": end"))
            })
        }
    }, {
        guildOnly: true,
        help: "Plays a custom chatsound from the GitHub repository. Does not support chatsounds from games like Half-Life 2, and such."
    })

    category.addCommand("stop", (msg, line) => {
        let vc = msg.guild.me.voiceChannel
        if (vc && vc.connection && vc.connection.dispatcher) {
            vc.connection.dispatcher.end()
        }
    }, {
        aliases: [ "sh" ],
        guildOnly: true,
        help: "Stops playing a chatsound."
    })
}
