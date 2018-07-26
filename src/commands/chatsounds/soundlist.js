const fs = require("fs")
const path = require("path")

const http = require("http")

module.exports = (category, bot) => {
    bot.soundListKeys = {}
    bot.loadSoundlist = () => {
        try {
            bot.soundList = JSON.parse(fs.readFileSync("soundlist.json"))

            for (const category in bot.soundList) {
                if (bot.soundList.hasOwnProperty(category)) {
                    const sounds = bot.soundList[category]

                    for (const name in sounds) {
                        if (sounds.hasOwnProperty(name)) {
                            if (!bot.soundListKeys[name]) { bot.soundListKeys[name] = [] }

                            let variants = sounds[name]
                            for (let i = 0; i < variants.length; i++) {
                                bot.soundListKeys[name].push(variants[i])
                            }
                            bot.soundListKeys[name].sort()
                        }
                    }

                }
            }

            bot.logger.success("soundlist", "Loaded.")
        } catch (err) {
            bot.logger.error("soundlist", "Loading failed: " + (err ? err.stack : err))
            if (err.message.match("Unexpected end of JSON input")) {
                bot.logger.warn("soundlist", "Error is related to JSON input, maybe it was badly downloaded? Redownloading.")
                fs.unlinkSync("soundlist.json")
                bot.downloadSoundlist().then(bot.loadSoundlist)
            }
        }
    }
    bot.downloadSoundlist = () => {
        return new Promise((resolve, reject) => {
            let stats, outdated
            try {
                stats = fs.statSync("soundlist.json")
                outdated = new Date().getTime() > stats.mtime.getTime() + (86400 * 7)
            } catch (err) {}

            if (!fs.existsSync("soundlist.json") || outdated) {
                let request = http.get("http://cs.3kv.in/soundlist.json", res => {
                    let stream = fs.createWriteStream("soundlist.json")
                    stream.on("finish", resolve)

                    res.pipe(stream)
                }).on("error", err => {
                    reject(err)
                })
            } else {
                resolve()
            }
        })
    }
    bot.downloadSoundlist().then(bot.loadSoundlist)

    category.addCommand("reloadsnds", (msg, line) => {
        fs.unlink(path.join(__dirname, "..", "soundlist.json"), () => {
            bot.downloadSoundlist().then(() => {
                bot.loadSoundlist()
                msg.success("Chatsounds list refreshed.", category.printName)
            })
        })
    }, {
        help: "Reloads the chatsound list.",
        ownerOnly: true
    })
}
