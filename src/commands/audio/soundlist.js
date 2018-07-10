const fs = require("fs")
const http = require("http")
const path = require("path")

module.exports = (category, bot) => {
    bot.soundListKeys = {}
    bot.loadSoundlist = err => {
        try {
            bot.soundList = JSON.parse(fs.readFileSync("soundlist.json"))

            forin(bot.soundList, (cat, snds) => {
                forin(snds, (name, _) => {
                    if (!bot.soundListKeys[name]) { bot.soundListKeys[name] = [] }

                    let variants = snds[name]
                    for (let i = 0; i < variants.length; i++) {
                        bot.soundListKeys[name].push(variants[i])
                    }
                    bot.soundListKeys[name].sort()
                })
            })

            bot.logger.success("soundlist", "Loaded.")
        } catch (err2) {
            bot.logger.error("soundlist", "Loading failed: " + ((err ? err.stack : err) || (err2 ? err2.stack : err2)))
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
    bot.downloadSoundlist().then(bot.loadSoundlist, bot.loadSoundlist)

    category.addCommand("reloadsnds", (msg, line) => {
        fs.unlink(path.join(__dirname, "..", "soundlist.json"), () => {
            bot.downloadSoundlist().then(() => {
                bot.loadSoundlist()
                msg.success("Chatsounds list refreshed.")
            })
        })
    }, {
        help: "Reloads the chatsound list.",
        ownerOnly: true
    })
}
