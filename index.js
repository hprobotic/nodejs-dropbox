let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = process.cwd()

let app = express()

if (NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

app.listen(PORT, ()=> {
    console.log(`LSING @ http://127.0.0.1:${PORT}`)
})
