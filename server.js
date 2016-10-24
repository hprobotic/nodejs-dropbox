#!/usr/bin/env babel-node


let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let chokidar = require('chokidar')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let bluebird = require('bluebird')
let argv = require('yargs').argv
let net = require('net')
let jsonSocket = require('json-socket')

// App config
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = argv.dir ? path.resolve(argv.dir) : path.resolve(process.cwd())
const SOCKET_PORT = 4000

let app = express()

if(NODE_ENV == 'development') {
    app.use(morgan('dev'))
}

app.listen(PORT, ()=> console.log(`LSNING @ http://127.0.0.1:${PORT}`))
console.log(`Root Directory is: ${ROOT_DIR}`)
// GET
app.get('*', setResponseMetaData, setResponseHeaders, (req, res) => {
    if(res.body) {
        res.json(res.body)
        return
    } try {
        fs.createReadStream(req.filePath).pipe(res)
    } catch(e) {
        console.log(`${e.stack} : ${e.message}`)
    }
})

// HEAD
app.head('*', setResponseMetaData, setResponseHeaders, (req, res, next) => {
    res.end()
})

// PUT
app.put('*', setResponseMetaData, setDirectoryDetail, (req, res, next) => {
    (async () => {
        if (req.stat) return res.status(405).send('Method Not Allowed');
        await mkdirp.promise(req.dirPath)
        if(!req.isDir) {
            req.pipe(fs.createWriteStream(req.filePath))
        }
        res.end()
    })().catch(next)
})

// POST
app.post('*', setResponseMetaData, setDirectoryDetail, (req, res, next) => {
    (async() => {
        let stat = req.stat
        let isDirectory = req.isDirectory
        if(!stat) {
            return res.send(405, 'File not found')
        }
        if(isDirectory) {
            return res.send(405, 'Path is directory')
        }

        await  fs.promise.truncate(req.filePath)
        res.end()
    })().catch(next)
})

// DELETE
app.delete('*', (req, res, next) => {
    (async() => {
        let stat = req.stat
        let isDirectory = stat.isDirectory

        // Check request
        if(!stat) {
            return res.send(400, 'Invalid path')
        }
        if(isDirectory) {
            return res.send(405, 'Path is Directory')
        }

        await fs.promise.truncate(req.filePath, 0)
        req.pipe(fs.createWriteStream(req.filePath))
        res.end()
    })().catch(next)
})


// Extend request and response data
function setDirectoryDetail(req, res, next) {
    let filePath = req.filePath
    let isEndWithSlash = filePath.charAt(filePath.length-1) === path.sep
    let isHasExt = path.extname(filePath) !== ''
    req.isDir = isEndWithSlash || !isHasExt
    req.dirPath = req.isDir ? filePath : path.dirname(filePath)
    next()
}

function setResponseMetaData(req, res, next) {
    req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
    let filePath = req.filePath

    fs.promise.stat(filePath)
        .then(stat => req.stat = stat)
        .nodeify(next)
}

function setResponseHeaders(req, res, next) {
    nodeify((async ()=> {
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

    })(), next)

}

// TCP
var socketServer = net.createServer()
socketServer.listen(SOCKET_PORT)
socketServer.on('connection', function (socket) {
    async ()=>{
        socket = new jsonSocket(socket)
        let watcher = chokidar.watch('.', {ignored: /[\/\\]\./, ignoreInitial: true})
        let content = ""
        let type = null
        let action = ""
        let filePathClient = ""

        watcher.on('all', (event, path, stat) => {
            filePathClient = path
            console.log("Event: " + event + " Path: " + path)
            if (event === 'change') {
                action = 'update'
                type = 'file'
                content = fs.readFileSync(path, 'utf8')
            }
            if (event === 'add' || event === 'addDir') {
                let isDirectory = event === 'addDir'
                action = 'create'
                content = isDirectory ? null : fs.readFileSync(path, 'utf8')
                type = isDirectory ? 'dir' : 'file'
            }
            if (event === 'unlinkDir' || event === 'unlinkDir') {
                action == 'delete'
                content = null
                type = event === 'unlinkDir' ? 'dir' : 'file'
            }

            socket.sendMessage({
                "action": action,
                "path": filePathClient,
                "type": type,
                "contents": content,
                "updated": Date.now()
            })
        })
    }
})





























