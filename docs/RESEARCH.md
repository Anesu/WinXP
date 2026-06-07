# WinXP — Architecture Notes

Current architecture as of v1.0 (post-integration).

## Stack

| Layer | Technology |
|-------|------------|
| Shell | React 16 + styled-components ([ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP)) |
| Productivity apps | Vanilla JS in `public/apps/apps/` |
| Data | `public/apps/stores.js` — localStorage |
| Bridge | `src/WinXP/apps/EmbeddedApp/` — mounts app templates inside XP windows |
| Theme | `public/apps/xp-theme.css` — Luna overrides on legacy control classes |

## App identity map

Custom apps use XP names where they replace stock programs:

| Internal key | Desktop / Start name | Replaces |
|--------------|---------------------|----------|
| `mail` | Outlook Express | Stock E-mail |
| `journal` | Notepad | Stock Notepad |
| `mycomputer` | My Computer | Stock My Computer |
| `controlpanel` | Control Panel | — |
| `recyclebin` | Recycle Bin | — |
| `clippy` | Office Assistant | — |

## Backups

- **Export:** `.winxp` files (`winxp-backup-YYYY-MM-DD-HHMM.winxp`)
- **Import:** `.winxp` and legacy `.win95` files
- **Storage keys:** `win95_fs` (unchanged for cross-project data compatibility)

## Run & build

```powershell
npm.cmd install
npm.cmd start    # http://localhost:3002 (see .env)
npm.cmd run build
```

## Credits

- [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP) — MIT — Luna shell
- [1j01/98](https://github.com/1j01/98) — icons/sounds (with permission)