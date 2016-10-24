#!/usr/bin/env nodemon  --exec babel-node

let fs = require('fs')
let path = require('path')
let argv = require('yargs').argv
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')
let net = require('net')
let jsonSocket = require('json-socket')

require('songbird')

const ROOT_DIR = argv.dir ? path.resolve(argv.dir) : path.resolve(process.cwd())
const PORT = process.env.PORT || 8001
const HOST = '127.0.0.1'
var socket = new jsonSocket(new net.Socket())
socket.connect(PORT, HOST)
console.log(`Connected to server: ${HOST}:${PORT}`)

socket.on('connect', function () {
    // When have ping !!
    socket.on('message', function (json) {
        (async () => {
            let action = json.action
            let filePath = path.join(ROOT_DIR, json.path)
            console.log(`File path: ${filePath}`)

            let isDir = json.type === 'dir' ? true : false
            let dirPath = isDir ? filePath : path.dirname(filePath)

            if (action === 'create') {
                await mkdirp.promise(dirPath)
                if (!isDir) {
                    await  fs.promise.writeFile(filePath, json.contents)
                        .then(
                            console.log(`File created: ${filePath}`)
                        ).catch()
                    return
                }
            } else if (action === 'delete') {
                if(!isDir) {
                    console.log(filePath)
                    await rimraf.promise(filePath)
                        .then(
                            console.log(`Directory is deleted`)
                        )
                        .catch()
                    return
                } else {
                    await fs.promise.unlink(filePath)
                        .then(
                            console.log(`File is deleted`)
                        )
                        .catch()
                }
                return
            } else if(action === 'update') {
                await fs.promise.truncate((filePath, 0))
                await fs.promise.writeFile(filePath, json.contents).then(console.log(`File updated: ${filePath}`))
            }
        })().catch(console.log(``))
    })
})