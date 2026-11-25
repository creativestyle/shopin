import path from 'path'
import fs from 'fs'

const TRIPLE_REGEX = /^(\d{2})-(\d{2})-(\d{2})-[\w-]+\.js$/

export interface MigrationEntry {
  relativePath: string
  filename: string
  g: number
  s: number
  n: number
  sortKey: number
}

function walkDir(
  dir: string,
  baseDir: string,
  fileList: Omit<MigrationEntry, 'sortKey'>[] = []
): Omit<MigrationEntry, 'sortKey'>[] {
  if (!fs.existsSync(dir)) {
    return fileList
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    const relative = path.relative(baseDir, full)
    if (e.isDirectory()) {
      if (e.name === 'lib') {
        continue
      }
      walkDir(full, baseDir, fileList)
    } else if (e.isFile() && e.name.endsWith('.js')) {
      const m = e.name.match(TRIPLE_REGEX)
      if (m && m[1] != null && m[2] != null && m[3] != null) {
        fileList.push({
          relativePath: relative,
          filename: e.name,
          g: parseInt(m[1], 10),
          s: parseInt(m[2], 10),
          n: parseInt(m[3], 10),
        })
      }
    }
  }
  return fileList
}

export function getMigrationEntries(migrationsDir: string): MigrationEntry[] {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error('No dist/migrations found. Run npm run build first.')
  }
  const files = walkDir(migrationsDir, migrationsDir)
  files.sort(
    (a, b) =>
      a.g - b.g ||
      a.s - b.s ||
      a.n - b.n ||
      a.relativePath.localeCompare(b.relativePath)
  )
  return files.map((f) => ({
    ...f,
    sortKey: f.g * 10000 + f.s * 100 + f.n,
  }))
}

export function getMigrationFilePath(
  migrationsDir: string,
  relativePath: string
): string {
  return path.join(migrationsDir, relativePath)
}
