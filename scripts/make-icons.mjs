// One-off generator for public/icons/*.png: a plain #1a1a1a square with "IS" in white.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (b) => {
  let c = 0xffffffff
  for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, c])
}

function png(size) {
  const bg = [0x1a, 0x1a, 0x1a], fg = [255, 255, 255]
  const u = size / 16 // letters are blocks on a 16-unit grid, centred in the safe zone
  const rects = [
    [3, 4, 3, 1], [4, 4, 1, 8], [3, 11, 3, 1],
    [8, 4, 5, 1], [8, 4, 1, 4], [8, 7, 5, 1], [12, 7, 1, 5], [8, 11, 5, 1],
  ]
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const on = rects.some(([rx, ry, rw, rh]) => x >= rx * u && x < (rx + rw) * u && y >= ry * u && y < (ry + rh) * u)
      const p = on ? fg : bg
      raw.set(p, y * (size * 3 + 1) + 1 + x * 3)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, png(s))
