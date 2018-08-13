const child_process = require("child_process")

let utils = {
    runCommand(cmd, onData) {
        return new Promise((resolve, reject) => {
            let proc = child_process.spawn(cmd, [], { shell: true })

            let buf = ""
            function _onData(data) {
                buf += data
                if (onData) onData(data, buf)
            }
            proc.stdout.on("data", _onData)
            proc.stderr.on("data", _onData)
            proc.on("close", () => {
                resolve(buf)
            })
            proc.on("error", err => {
                reject(buf, err)
            })
        })
    },
    colors: {
        green: 0x73D437,
        red: 0xE25555,
        yellow: 0xE2D655,
        blue: 0x5ABEBC,
    }
}
utils.runCommandInChannel = function(cmd, progressMsg, msg, onData) {
    let nextEdit = 0
    return utils.runCommand(cmd, (data, buf) => {
        if (nextEdit < Date.now()) {
            progressMsg.edit("<@" + msg.author.id + ">, " + progressMsg.client.bot.inspectCodeBlock(buf))
            nextEdit = Date.now() + 2000 // Update every 2 seconds
        }
        if (onData) onData(data, buf)
    })
}
module.exports = utils
