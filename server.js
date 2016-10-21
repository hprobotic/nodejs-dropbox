let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

let app = express()

if(NODE_ENV == 'development') {
    app.use(morgan('dev'))
}

app.listen(PORT, ()=> console.log(`LSNING @ http://127.0.0.1:${PORT}`))

// GET
app.get('*', setResponseHeaders, setResponseMetaData, (req, res, next) => {
    if(res.body) {
        res.json(res.body)
        return
    } try {
        fs.createReadStream(req.filePath).pipe(res)
    } catch(e) {
        console.log(`${e.stack} : ${e.message}`)
    }
})

app.head('*', (req, res, next) => {
    res.end()
})

app.put('*', (req, res, next) => {
    res.end()
})

app.post('*', (req, res, next) => {
    res.end()
})

app.delete('*', (req, res, next) => {

})


// Extend request and response data

function setResponseMetaData(req, res, next) {
    req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
    let filePath = req.filePath
    fs.promise.stat(filePath)
        .then(
        stat => req.stat = stat, () => req.stat = null
        ).nodeify(next)

}

function setResponseHeaders(req, res, next) {
    nodeify(async ()=> {
        let filePath = req.filePath
        console.log(`File path: ${filePath}`)

        let stat = req.stat
        if (stat.isDirectory()) {
            let files = await fs.promise.readdir(filePath)
            res.body = JSON.stringify(files)
            res.setHeader('Content-Length', res.body.length)
            res.setHeader('Content-Type', 'application/json')
            return
        } else {
            res.setHeader('Content-Length', stat.size)
            res.setHeader('Content-Type', mime.contentType(path.extname(path)))
        }

    }, next)

}






























