const child_process = require("child_process")

module.exports = {
    runCommand(cmd, onData) {
        return new Promise((resolve, reject) => {
            let proc = child_process.spawn(cmd, [], { shell: true })

            let buf = ""
            function _onData(data) {
                if (onData) onData(data)
                buf += data
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
