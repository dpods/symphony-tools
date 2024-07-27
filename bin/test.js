import fs from 'fs'
import transit from 'transit-js'

const data = fs.readFileSync('./example.json', { encoding: 'utf8', flag: 'r' });

let r = transit.reader("json")

const getKey = (data, key) => {
    const index = data._entries.findIndex(obj => obj._name === key)

    if (index === -1) {
        throw new Error(`Key does not exist: ${key}`)
    }

    return data._entries[index + 1]
}

const payload = r.read(data)
const stats = getKey(payload, 'stats')

console.log(stats)

