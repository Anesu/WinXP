# WinXP Productivity Desktop

Browser-based **Windows XP Luna** desktop with a full productivity suite.

Built on [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP) (MIT). Productivity apps are embedded via a React bridge and styled with Luna chrome.

## Apps

| XP name | What it does |
|---------|----------------|
| **Outlook Express** | Mail templates & composition |
| **Notepad** | Rich notes & journal |
| **My Computer** | Explorer, backup & restore |
| **Control Panel** | Settings & data management |
| **Recycle Bin** | Deleted items |
| **Todo Tasks** | Task list with due dates |
| **Bible** | Scripture reader |
| **Calendar** | Events & scheduling |
| **Pomodoro Timer** | Focus sessions |
| **Kanban Board** | Project boards |
| **Office Assistant** | AI prompt library |
| **Compare Documents** | Text diff tool |
| **QRx Transmitter** | QR code utility |

**Classic XP demos:** Internet Explorer, Minesweeper, Winamp, Paint

## Quick start (Windows)

```powershell
cd C:\Users\Anesu\Documents\GitHub\WinXP
copy .env.example .env
npm.cmd install
npm.cmd start
```

Open **http://localhost:3002**

> **PowerShell:** Use `npm.cmd` instead of `npm` if you see an execution-policy error.  
> **Port 3002:** Set in `.env` because WSL often occupies port 3000 on Windows.

## Build for production

```powershell
npm.cmd run build
```

Output in `build/` — deploy to any static host (Vercel, GitHub Pages, etc.).

**GitHub Pages:** After pushing to `Anesu/WinXP`, enable Pages under repo Settings → Pages → Source: **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` publishes to https://anesu.github.io/WinXP

## Architecture

```
WinXP/
├── src/WinXP/              # React Luna shell (taskbar, windows, desktop)
├── src/WinXP/apps/EmbeddedApp/  # Bridge that hosts productivity apps
├── public/apps/apps/       # Productivity app JS + CSS
├── public/apps/stores.js   # localStorage data layer
└── public/apps/xp-theme.css    # Luna styling for embedded apps
```

## Backups

My Computer → **Backup to PC** exports a `.winxp` file. **Restore from PC** accepts `.winxp` and legacy `.win95` backups.

## Credits & license

This project is **MIT licensed**.

- **Shell:** [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP) — Copyright (c) 2019 Shizuku Yang — MIT
- **Icons/sounds:** [1j01/98](https://github.com/1j01/98) — used with permission
- **Productivity apps:** Original work by Anesu

See [LICENSE](LICENSE) for the full MIT license text (ShizukuIchi/winXP upstream).