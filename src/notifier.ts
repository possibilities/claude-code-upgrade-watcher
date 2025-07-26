import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export class UpdateNotifier {
  private notifiedVersions: Set<string> = new Set()

  async notifyNpmUpdate(
    currentVersion: string,
    latestVersion: string,
  ): Promise<void> {
    const key = `npm-${latestVersion}`
    if (this.notifiedVersions.has(key)) {
      return
    }

    const title = 'Claude CLI Update Available (npm)'
    const message = `New version ${latestVersion} is available on npm (current: ${currentVersion})`

    try {
      await execAsync(
        `notify-send "${title}" "${message}" --icon=software-update-available --expire-time=0`,
      )
      this.notifiedVersions.add(key)
    } catch (error) {
      console.error('Failed to send npm update notification:', error)
    }
  }

  async notifyChangelogUpdate(
    currentVersion: string,
    latestVersion: string,
  ): Promise<void> {
    const key = `changelog-${latestVersion}`
    if (this.notifiedVersions.has(key)) {
      return
    }

    const title = 'Claude CLI Update Available (Changelog)'
    const message = `New version ${latestVersion} is available in changelog (current: ${currentVersion})`

    try {
      await execAsync(
        `notify-send "${title}" "${message}" --icon=software-update-available --expire-time=0`,
      )
      this.notifiedVersions.add(key)
    } catch (error) {
      console.error('Failed to send changelog update notification:', error)
    }
  }

  async notifyBothUpdate(
    currentVersion: string,
    latestVersion: string,
  ): Promise<void> {
    const key = `both-${latestVersion}`
    if (this.notifiedVersions.has(key)) {
      return
    }

    const title = 'Claude CLI Update Available'
    const message = `New version ${latestVersion} is available on npm and in changelog (current: ${currentVersion})`

    try {
      await execAsync(
        `notify-send "${title}" "${message}" --icon=software-update-available --expire-time=0`,
      )
      this.notifiedVersions.add(key)
    } catch (error) {
      console.error('Failed to send update notification:', error)
    }
  }

  async notifyError(errorMessage: string): Promise<void> {
    const title = 'Claude Code Upgrade Watcher Error'

    try {
      await execAsync(
        `notify-send "${title}" "${errorMessage}" --icon=dialog-error --expire-time=0`,
      )
    } catch (error) {
      console.error('Failed to send error notification:', error)
    }
  }

  async notifyNoUpdate(currentVersion: string): Promise<void> {
    const title = 'Claude Code Upgrade Watcher'
    const message = `No update found (current: ${currentVersion}). Checking every 5 minutes.`

    try {
      await execAsync(
        `notify-send "${title}" "${message}" --icon=dialog-information --expire-time=0`,
      )
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  hasNotifiedVersion(
    version: string,
    source?: 'npm' | 'changelog' | 'both',
  ): boolean {
    if (source) {
      return this.notifiedVersions.has(`${source}-${version}`)
    }
    return (
      this.notifiedVersions.has(`npm-${version}`) ||
      this.notifiedVersions.has(`changelog-${version}`) ||
      this.notifiedVersions.has(`both-${version}`)
    )
  }
}
