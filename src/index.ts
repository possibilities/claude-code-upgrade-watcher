import { Command } from 'commander'
import packageJson from '../package.json' assert { type: 'json' }
import { checkForUpdate } from './versionChecker.js'
import { UpdateNotifier } from './notifier.js'

const FIVE_MINUTES_MS = 5 * 60 * 1000

async function main() {
  const program = new Command()

  program
    .name('claude-code-upgrade-watcher')
    .description('Claude Code Upgrade Watcher CLI')
    .version(packageJson.version)
    .action(async () => {
      const notifier = new UpdateNotifier()

      console.log('Starting Claude Code upgrade watcher...')
      console.log('Checking for updates every 5 minutes')

      let isFirstCheck = true

      const checkAndNotify = async () => {
        try {
          const versionInfo = await checkForUpdate()

          console.log(`Current version: ${versionInfo.current}`)
          console.log(`Latest version: ${versionInfo.latest}`)

          if (
            versionInfo.updateAvailable &&
            !notifier.hasNotifiedVersion(versionInfo.latest)
          ) {
            console.log('Update available! Sending notification...')
            await notifier.notify(versionInfo.current, versionInfo.latest)
          } else if (versionInfo.updateAvailable) {
            console.log(
              'Update available, but already notified for this version',
            )
          } else {
            console.log('No update available')
            if (isFirstCheck) {
              await notifier.notifyNoUpdate(versionInfo.current)
            }
          }

          isFirstCheck = false
        } catch (error) {
          console.error('Error checking for updates:', error)
          await notifier.notifyError(`Failed to check for updates: ${error}`)
          process.exit(1)
        }
      }

      // Initial check
      await checkAndNotify()

      // Set up interval for continuous checking
      setInterval(checkAndNotify, FIVE_MINUTES_MS)

      // Keep the process running
      console.log('\nWatcher is running. Press Ctrl+C to stop.')
    })

  try {
    program.exitOverride()
    program.configureOutput({
      writeErr: str => process.stderr.write(str),
    })

    await program.parseAsync(process.argv)
  } catch (error: any) {
    if (
      error.code === 'commander.help' ||
      error.code === 'commander.helpDisplayed' ||
      error.code === 'commander.version'
    ) {
      process.exit(0)
    }
    console.error('Error:', error.message || error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
