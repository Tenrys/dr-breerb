// const puppeteer = require("puppeteer")
const axios = require("axios")

const url = "https://sandbox.facepunch.com/beta"

module.exports = async bot => {
    /*
    let check = async () => {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        page.on("domcontentloaded", async () => {
            let html = await page.evaluate(() => {
                return document.body.innerHTML
            })

            if (!html.match("Sorry, there's no beta available right now.")) {
                for (const i of [1, 2, 3]) setTimeout(() => bot.dmOwners("**SANDBOX BETA IS OUT**"), 1000 * i)
            }

            setTimeout(async () => await browser.close(), 1000)
        })
        await page.goto("https://sandbox.facepunch.com/beta")
    }
    */

    let contentLength = 0

    let check = async () => {
        let res = await axios.head(url)

	bot.logger.log("s&box", "Checking beta page content length...")
        if (contentLength != res.headers["content-length"]) {
	    bot.logger.working("s&box", "Beta page content length is different!")
            if (contentLength != null) {
                bot.logger.log("s&box", "Checking for beta form.")

                let res = await axios.get(url)

                if (!res.data.match('"EnableBetaSignup":false')) {
                    bot.logger.success("s&box", "BETA IS OUT!")
                    for (const i of [1, 2, 3]) setTimeout(() => bot.dmOwners("<a:partytime:514568482264842250> **SANDBOX BETA IS OUT** <a:partytime:514568482264842250>"), 1000 * i)
                } else {
                    bot.logger.error("s&box", "No beta.")
                }
            }

            contentLength = res.headers["content-length"]
        } else {
		bot.logger.error("s&box", "Same as ever.")
	}
    }

    await check()
    setInterval(check, 60 * 60 * 2 * 1000);
}
