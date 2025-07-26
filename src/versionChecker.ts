import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fetch from 'node-fetch'

const execAsync = promisify(exec)

export interface VersionInfo {
  current: string
  latest: string
  updateAvailable: boolean
  latestChangelog?: string
  changelogUpdateAvailable?: boolean
}

export async function getCurrentClaudeVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync('~/.claude/local/claude --version')
    const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/)
    if (versionMatch) {
      return versionMatch[1]
    }
    throw new Error('Could not parse Claude version from output')
  } catch (error) {
    throw new Error(`Failed to get Claude version: ${error}`)
  }
}

export async function getLatestClaudeVersion(): Promise<string> {
  try {
    const response = await fetch(
      'https://registry.npmjs.org/@anthropic-ai/claude-code',
    )
    if (!response.ok) {
      throw new Error(`npm registry returned ${response.status}`)
    }
    const data = (await response.json()) as any
    const latestVersion = data['dist-tags']?.latest
    if (!latestVersion) {
      throw new Error('Could not find latest version in npm registry response')
    }
    return latestVersion
  } catch (error) {
    throw new Error(`Failed to fetch latest version from npm: ${error}`)
  }
}

export async function getLatestChangelogVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `gh api repos/anthropics/claude-code/contents/CHANGELOG.md --jq '.content' | base64 -d | head -200`,
    )

    const versionMatches = stdout.match(/^## (\d+\.\d+\.\d+)/m)
    if (versionMatches && versionMatches[1]) {
      return versionMatches[1]
    }

    throw new Error('Could not parse latest version from changelog')
  } catch (error) {
    throw new Error(`Failed to fetch latest version from changelog: ${error}`)
  }
}

export function compareVersions(current: string, latest: string): boolean {
  const parseVersion = (version: string) => {
    const parts = version.split('.').map(Number)
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    }
  }

  const currentParsed = parseVersion(current)
  const latestParsed = parseVersion(latest)

  if (latestParsed.major > currentParsed.major) return true
  if (latestParsed.major < currentParsed.major) return false

  if (latestParsed.minor > currentParsed.minor) return true
  if (latestParsed.minor < currentParsed.minor) return false

  return latestParsed.patch > currentParsed.patch
}

export async function checkForUpdate(): Promise<VersionInfo> {
  const current = await getCurrentClaudeVersion()
  const [latest, latestChangelog] = await Promise.all([
    getLatestClaudeVersion(),
    getLatestChangelogVersion().catch(() => undefined),
  ])

  const updateAvailable = compareVersions(current, latest)
  const changelogUpdateAvailable = latestChangelog
    ? compareVersions(current, latestChangelog)
    : undefined

  return {
    current,
    latest,
    updateAvailable,
    latestChangelog,
    changelogUpdateAvailable,
  }
}
