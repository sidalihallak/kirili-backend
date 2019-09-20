const functions = require("firebase-functions")
const express = require("express")

const axios = require('axios');
const cheerio = require('cheerio')
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const app = express()
const base_url = "https://www.ouedkniss.com"
const url = base_url+"/immobilier"
app.get("/", (req, res) => {
    axios.get(url).then((response) => {
        // Load the web page source code into a cheerio instance
        const $ = cheerio.load(response.data)

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
            let item ={
                title: $(urlElems[i]).find('h2').text(),
                description: $(urlElems[i]).find('annonce_description_preview').text(),
                item_url: $(urlElems[i]).find('a').attr('href'),
                image_url: "https:"+ $(urlElems[i]).find('.annonce_image_img').attr('style').match(/\(([^)]+)\)/)[1],

            }
            console.log("desc",$(urlElems[i]).find('.annonce_get_description').html())

           /* $(urlElems[i]).find('.annonce_get_description').innerHTML.split("<br>").forEach(e=> {
                console.log("e", e)
                if(!!e) {
                    if(e.includes("Superficie : ")) {
                        item.push({
                            area: e.match(/\d+/)[0]
                        })
                    } else if(e.includes("pièce")) {
                        item.push({
                            rooms: e.match(/\d+/)[0]
                        })
                    } else if(e.includes("Quatier :")) {
                        item.push({
                            district: e.split(" : ")[1]
                        })
                    } else if(e.includes("étage")){
                        item.push({
                            floor: e.match(/\d+/)[0]
                        })
                    }
                }

            })*/
            // We proceed, only if the element exists

            result.push(item)

        }
        res.send({result})
    }).catch(error => {
        console.log("error:", error)
        res.send({error})
    })


})

const api = functions.https.onRequest(app)

module.exports = {
    api
}