const logger = require("../../logging.js")

const fs = require("fs")
const http = require("http")
const path = require("path")

module.exports = (category, bot) => {
    bot.soundListKeys = {}
    bot.loadSoundlist = function(err) {
        try {
            this.soundList = JSON.parse(fs.readFileSync("soundlist.json"))

            forin(this.soundList, (cat, snds) => {
                forin(snds, (name, _) => {
                    if (!bot.soundListKeys[name]) { bot.soundListKeys[name] = [] }

                    let variants = snds[name]
                    for (let i = 0; i < variants.length; i++) {
                        bot.soundListKeys[name].push(variants[i])
                    }
                    bot.soundListKeys[name].sort()
                })
            })

            logger.success("soundlist", "Loaded.")
        } catch (err2) {
            logger.error("soundlist", "Loading failed: " + ((err ? err.stack : err) || (err2 ? err2.stack : err2)))
        }
    }
    bot.downloadSoundlist = function() {
        return new Promise(function(resolve, reject) {
            let stats, outdated
            try {
                stats = fs.statSync("soundlist.json")
                outdated = new Date().getTime() > stats.mtime.getTime() + (86400 * 7)
            } catch (err) {

            }

            if (!fs.existsSync("soundlist.json") || outdated) {
                let request = http.get("http://cs.3kv.in/soundlist.json", function(response) {
                    let stream = fs.createWriteStream("soundlist.json")
                    stream.on("finish", resolve)

                    response.pipe(stream)
                }).on("error", err => {
                    reject(err)
                })
            } else {
                resolve()
            }
        })
    }
    bot.downloadSoundlist().then(bot.loadSoundlist, bot.loadSoundlist)

    category.addCommand("reloadsnds", function(msg, line) {
        fs.unlink(path.join(__dirname, "..", "soundlist.json"), function() {
            bot.downloadSoundlist()
                .then(() => {
                    bot.loadSoundlist()
                    msg.reply("chatsounds list refreshed.")
                })
        })
    }, {
        help: "Reloads the chatsound list.",
        ownerOnly: true
    })
}
