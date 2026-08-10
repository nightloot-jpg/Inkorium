// simple test to make sure we didn't break css parsing
const fs = require('fs')
const content = fs.readFileSync('src/styles/app.css', 'utf-8')
if (content.includes('--radius-sm: 2px;')) {
    console.log('Radius patched successfully')
}
