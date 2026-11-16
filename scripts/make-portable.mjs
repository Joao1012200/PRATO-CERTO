import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const builtFile = path.join(root, 'portable-temp', 'index.html')
const imageDir = path.join(root, 'public', 'images')
const outputFile = path.join(root, 'Prato-Certo.html')

let html = fs.readFileSync(builtFile, 'utf8')

for (const fileName of fs.readdirSync(imageDir)) {
  const absolutePath = path.join(imageDir, fileName)
  if (!fs.statSync(absolutePath).isFile()) continue
  const extension = path.extname(fileName).slice(1).toLowerCase()
  const mime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`
  const dataUri = `data:${mime};base64,${fs.readFileSync(absolutePath).toString('base64')}`
  // o caminho mais longo primeiro, para não sobrar um "." antes do data URI
  for (const reference of [`./images/${fileName}`, `/images/${fileName}`, `images/${fileName}`]) {
    html = html.split(reference).join(dataUri)
  }
}

html = html
  .replace(/\s*<link rel="preconnect"[^>]*>/g, '')
  .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '')
  .replace('<title>Prato Certo</title>', '<title>Prato Certo — Versão Local</title>')

fs.writeFileSync(outputFile, html)
fs.rmSync(path.join(root, 'portable-temp'), { recursive: true, force: true })

console.log(outputFile)
