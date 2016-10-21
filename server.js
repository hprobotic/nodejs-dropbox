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


app.get('*', (req, res, next) => {
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





































