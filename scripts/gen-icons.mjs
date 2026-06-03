import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'public')
const rounded = join(here, 'icon-rounded.svg')
const maskable = join(here, 'icon-maskable.svg')

await mkdir(pub, { recursive: true })

const jobs = [
  [rounded, 'pwa-192.png', 192],
  [rounded, 'pwa-512.png', 512],
  [maskable, 'maskable-512.png', 512],
  [maskable, 'apple-touch-icon.png', 180], // iOS: no transparent corners
  [rounded, 'favicon.png', 64],
]

for (const [src, out, size] of jobs) {
  await sharp(src).resize(size, size).png().toFile(join(pub, out))
  console.log('✓', out, size + 'px')
}
