import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export class UpdateNotifier {
  private notifiedVersions: Set<string> = new Set()

  async notify(currentVersion: string, latestVersion: string): Promise<void> {
    if (this.notifiedVersions.has(latestVersion)) {
      return
    }

    const title = 'Claude CLI Update Available'
    const message = `New version ${latestVersion} is available (current: ${currentVersion})`

    try {
      await execAsync(
        `notify-send "${title}" "${message}" --icon=software-update-available --expire-time=0`,
      )
      this.notifiedVersions.add(latestVersion)
    } catch (error) {
      console.error('Failed to send notification:', error)
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

  hasNotifiedVersion(version: string): boolean {
    return this.notifiedVersions.has(version)
  }
}
