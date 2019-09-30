const functions = require("firebase-functions")
const express = require("express")

const axios = require('axios');
const cheerio = require('cheerio')
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const app = express()
const base_url = "https://www.ouedkniss.com"
app.get("/", (req, res) => {
    let u = new URLSearchParams(req.query).toString();
    console.log("query", u)
    let url = `${base_url}/annonces/?c=immobilier${u ? '&' + u : ''}`

    console.log("url", url)
    axios.get(url).then((response) => {
        let result = parseHtml(response.data)
        res.send({result})
    }).catch(error => {
        console.log("error:", error)
        res.send({error})
    })
})

app.get("/pes/*", (req, res) => {

    console.log("path", req.path)
    const url = "https://www.pesmaster.com" + req.path.replace("/pes", "")
    console.dir("https://www.pesmaster.com" + req.path.replace("/pes", "")) // '/new'
    const arr = req.path.split("/")
    const isVersionPage = (/(pes-[0-9]*)/).test(arr[arr.length - 2])
    const isRoot = req.path === "/pes/"
    const isPlayer = req.path.includes("player")
    const isTeam = req.path.includes("team")
    const isLeag = req.path.includes("league")


    axios.get(url).then((response) => {
        const $ = cheerio.load(response.data)

        // The pre.highlight.shell CSS selector matches all `pre` elements
        // that have both the `highlight` and `shell` class
        let result = []
        if (isVersionPage) {
            const urlElems = $(req.path === "/pes/pes-2020/" ? '.team-block' : '.leagues-list a')
            console.log("isVersionPage", isVersionPage)
            // We now loop through all the elements found
            for (let i = 0; i < urlElems.length; i++) {
                result.push({
                    url: req.path === "/pes/pes-2020/" ? $(urlElems[i]).find('a').attr('href') : $(urlElems[i]).attr('href'),
                    image: $(urlElems[i]).find(req.path === "/pes/pes-2020/" ? ".team-block-logo" : '.leagues-list-logo').attr("src"),
                    name: $(urlElems[i]).find(req.path === "/pes/pes-2020/" ? ".team-block-name" : '.leagues-list-text').text()
                })
            }
        } else if (isRoot) {
            console.log("isRoot", isRoot)
        } else if (isPlayer) {
            result = {}
            let playerCard = $(".top-container")
            result.overview = $(playerCard).find('.player-card-ovr').text().match(/.{1,2}/g)[0]
            result.name = $(playerCard).find('.player-card-name').text()
            result.position = $(playerCard).find('.player-card-position').text()
            result.teamlogo = $(playerCard).find('.player-card-teamlogo').attr("src")
            result.image = $(playerCard).find('.player-card-image').attr("src")
            let topInfo = $(".top-info")
            result.description = $(topInfo).find('.description').text()
            let teams = $(topInfo).find("div > a")
            result.actualTeam = {
                name: $(teams[0]).text(),
                url: $(teams[0]).attr("href")
            }
            if (teams[1]) {
                result.nationalTeam = {
                    name: $(teams[1]).text(),
                    url: $(teams[1]).attr("href")
                }
            }

           let statsBlock = $('.stats-block')

            let stats = []
           for (let i = 0; i < statsBlock.length; i++) {
                let statBlock = $(statsBlock[i])
                let mainStateArray = statBlock.find('h4').text().split(/([0-9]+)/)
                //console.log("main", mainStateArray)
                let currentState= {}
                currentState.main = {
                    label: mainStateArray[2],
                    value: mainStateArray[1]
                }
               currentState.details = []

               const uu = statBlock.find('tbody').children()
               for (let i = 0; i < uu.length; i++) {
                   let detailsStateArray = $(uu[i]).find('td').text().split(/([0-9]+)/)
                   currentState.details.push({
                       label: detailsStateArray[2],
                       value: detailsStateArray[1]
                   })
               }
                stats.push(currentState)
            }
            result.state=stats


            let playerInfo = []
            let playerInfoBlock = $('.player-info').find('tbody').children()
            for (let i = 0; i < playerInfoBlock.length; i++) {
                const infoRow = $(playerInfoBlock[i]).children()
                playerInfo.push({
                    label: $(infoRow[0]).text(),
                    value: $(infoRow[1]).text()
                })
            }
            result.playerInfo = playerInfo

            let playerPosition = []
            let playerPositionBlock = $('.player-positions-item')
            for (let i = 0; i < playerPositionBlock.length; i++) {
                const positionRow = $(playerPositionBlock[i]).children()
                console.log("player position", $(positionRow[0]).text())
                playerPosition.push({
                    label: $(positionRow[0]).text(),
                    value: $(positionRow[1]).text()
                })
            }
            result.positions = playerPosition


        } else if (isLeag) {
            const urlElems = $(".team-table")
            const uu = $(urlElems).find('tbody').children()
            for (let i = 0; i < uu.length; i++) {
                result.push({
                    image: $(uu[i]).find('img').attr('src'),
                    url: $(uu[i]).find('a').attr('href'),
                    name: $(uu[i]).find('a').text(),
                    note: $(uu[i]).find('span').text().match(/.{1,2}/g)[0]
                })
            }

        } else if (isTeam) {
            result = {}
            console.log("isTeam", isTeam)
            const urlElems = $(".squad-table")
            const uu = $(urlElems).find('tbody').children()
            let players = []
            for (let i = 0; i < uu.length; i++) {
                players.push({
                    image: $(uu[i]).find('img').attr('src'),
                    url: $(uu[i]).find('a').attr('href'),
                    name: $(uu[i]).find('a').text(),
                    countryFlag: $(uu[i]).find('.country-flag').attr('src'),
                    num: $(uu[i]).find('.squad-table-num').text(),
                    age: $(uu[i]).find('.squad-table-age').text(),
                    height: $(uu[i]).find('.squad-table-height').text(),
                    pos: $(uu[i]).find('.squad-table-pos').text(),
                    stat: $(uu[i]).find('.squad-table-stat-col').text().match(/.{1,2}/g)[0],
                })
            }
            let lignUp = []
            const lignUpContainer = $(".game-plan-container")
            const lignupItems = $(lignUpContainer).find('.gp-player')
            for (let i = 0; i < lignupItems.length; i++) {
                const str = $(lignupItems[i]).attr('style')
                let position = {}
                if (str) {
                    const temp = str.split(" ")
                    position = {
                        top: temp[1],
                        left: temp[3]
                    }
                } else {
                    position = {
                        bottom: "1%",
                        left: "40%"
                    }
                }
                lignUp.push({
                    position: position,
                    image: $(lignupItems[i]).find('img').attr('src'),
                    url: $(lignupItems[i]).find('a').attr('href'),
                    name: $(lignupItems[i]).find('.gp-playername > div').text(),
                })
            }

            result.players = players
            result.lignUp = lignUp
        }
        res.send({result})
    }).catch(error => {

        res.send({error})
    })
})
app.get("/annonces/:uid", (req, res) => {
    console.log("params: ", JSON.stringify(req.params))
    let url = base_url + req.params.uid
    axios.get(url).then((response) => {
        let result = parseHtml(response.data)
        res.send({result})
    }).catch(error => {
        console.log("error:", error)
        res.send({error})
    })
})

function parseHtml(data) {
    // Load the web page source code into a cheerio instance
    const $ = cheerio.load(data)

    // The pre.highlight.shell CSS selector matches all `pre` elements
    // that have both the `highlight` and `shell` class
    const urlElems = $('.annonce_store')

    let result = []
    // We now loop through all the elements found
    for (let i = 0; i < urlElems.length; i++) {
        // Since the URL is within the span element, we can use the find method
        // To get all span elements with the `s1` class that are contained inside the
        // pre element. We select the first such element we find (since we have seen that the first span
        // element contains the URL)
        let item = {
            title: $(urlElems[i]).find('h2').text(),
            description: $(urlElems[i]).find('.annonce_description_preview').text(),
            item_url: $(urlElems[i]).find('a').attr('href'),
            image_url: "https:" + $(urlElems[i]).find('.annonce_image_img').attr('style').match(/\(([^)]+)\)/)[1],

        }
        $(urlElems[i]).find('.annonce_get_description').html().split("<br>").forEach(element => {
            let e = entities.decode(element)

            if (!!e) {
                if (e.includes("Superficie : ")) {
                    if (e.match(/\d+/)) item.area = e.match(/\d+/)[0]
                } else if (e.includes("pièce")) {
                    if (e.match(/\d+/)) item.rooms = e.match(/\d+/)[0]
                } else if (e.includes("Quatier :")) {
                    if (e.split(" : ")) item.district = e.split(" : ")[1]
                } else if (e.includes("étage")) {
                    if (e.match(/\d+/)) item.floor = e.match(/\d+/)[0]
                } else if (e.includes("Promesse de vente")) {
                    item.agreementToSell = e.includes("Promesse de vente")
                } else if (e.includes("Act notarié")) {
                    item.notarialAct = e.includes("Act notarié")
                } else if (e.includes("Jardin")) {
                    item.garden = e.includes("Jardin")
                } else if (e.includes("Garage")) {
                    item.garage = e.includes("Garage")
                } else if (e.includes("Livret foncier")) {
                    item.landBooklet = e.includes("Livret foncier")
                } else if (e.includes("Promotion immobilière")) {
                    item.realEstateDevelopment = e.includes("Promotion immobilière")
                } else if (e.includes("Meublé")) {
                    item.furnished = true
                }
            }

        })
        result.push(item)

    }
    return result
}

const api = functions.https.onRequest(app)

module.exports = {
    api
}