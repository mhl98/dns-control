# DNS Control (macOS DNS Changer)

DNS Control is a desktop app to **set DNS on Mac automatically** with a simple UI.
It helps you quickly switch DNS servers, save presets, and apply DNS to all macOS network services without manual Terminal commands every time.

If you searched for terms like **mac DNS changer**, **macOS DNS switcher**, **set DNS automatically on Mac**, or **change DNS for Wi-Fi and Ethernet on macOS**, this project is for you.

## Why DNS Control

Changing DNS on macOS is easy once, but repetitive when you do it often.
DNS Control gives you:

- One-click DNS apply for all network services
- Saved DNS presets (Google DNS, Cloudflare DNS, custom DNS, etc.)
- Current DNS view per service
- Clear DNS (reset to automatic)
- Optional helper to reduce repeated password prompts

## Features

- **Quick apply DNS:** Enter primary/secondary IPv4 DNS and apply immediately.
- **Preset management:** Save, apply, and remove named DNS presets.
- **Current DNS status:** Read current DNS servers for each macOS network service.
- **Clear DNS:** Reset DNS to automatic (`empty`) across services.
- **Privileged helper (optional):** Install a helper script plus a narrow `sudoers` rule for smoother apply/clear actions.

## Default DNS

The app starts with Google Public DNS:

- Primary: `8.8.8.8`
- Secondary: `8.8.4.4`

You can replace these with any valid IPv4 DNS addresses.

## How It Works

Under the hood, DNS Control uses macOS `networksetup` to:

- list network services
- read DNS for each service
- set DNS servers for each service
- clear DNS servers (reset to automatic)

When helper mode is not available, macOS asks for administrator permission through the standard password prompt.

## Requirements

- macOS
- Node.js 18+ (recommended)
- npm

## Run in Development

```bash
npm install
npm run dev
```

## Build App

```bash
npm run pack
```

Available packaging commands:

- `npm run pack` (default mac targets from electron-builder)
- `npm run pack:universal`
- `npm run pack:arm64`
- `npm run pack:x64`
- `npm run pack:arm64+tar`

Build outputs are written to the `release/` folder.

## Create GitHub Release Assets

After packaging, upload generated files from `release/` to your GitHub Release (for example `.dmg`, `.zip`, and optional `.tar.gz`).

If you want a tarball manually:

```bash
cd release
tar -czf "DNS-Control-1.0.0-arm64.tar.gz" "mac-arm64/DNS Control.app"
```

Adjust paths if your output folder is `mac`, `mac-x64`, or `mac-universal`.

## Security Notes

- DNS changes require elevated permissions on macOS.
- Helper installation writes:
  - `/usr/local/libexec/dns-control-helper.sh`
  - `/etc/sudoers.d/dns-control`
- The helper rule is scoped to your current user and intended only for this app flow.

## Keywords (Search Discoverability)

mac dns changer, macos dns changer, set dns on mac automatically, auto dns switcher mac, change dns mac app, networksetup dns tool, dns preset manager mac, mac dns utility, google dns mac, cloudflare dns mac, electron mac dns app

## License

Add your preferred license file (`LICENSE`) and update this section.
