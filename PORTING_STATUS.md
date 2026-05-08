# Porting Status

Source of truth: `D:\Project\Đồ án\Mobile\mobile-claude`

Target: React Native + Expo app in `D:\Project\Đồ án\Mobile\main-project`

## Ground Rules

- Do not redesign the app.
- Do not invent new flows unless needed only as a temporary navigation placeholder.
- Port from Claude's web prototype into React Native.
- Do not port `DesignCanvas`, `IOSDevice`, or `AndroidDevice`; those are only web presentation frames.
- Use screenshots in `main-project\Screenshot` only for visual checking.

## Source Files Read

- `index.html`: route/artboard list.
- `styles\tokens.css`: colors, radius, surfaces, shadows.
- `components\data.jsx`: i18n, contacts, notes, statuses, upcoming, notifications.
- `components\shared.jsx`: shared UI components.
- `screens\dashboard.jsx`: dashboard, notifications, settings/search source.
- `screens\notes.jsx`: notes list, note detail A/B, create/edit note, notes empty.
- `screens\contacts.jsx`: contacts list, contact detail/timeline, create/edit contact, contacts empty.
- `screens\extras.jsx`: status, create/edit status, notifications/settings/search source.
- `screens\more.jsx`: settings sub-screens, confirm dialog showcase screens, empty states.
- `screens\auth.jsx`: welcome/login/register/verification/forgot/reset/loading auth flow.

## Implemented In Target

- Expo TypeScript foundation.
- `src/mesh/meshData.ts`
- `src/mesh/meshTheme.ts`
- `src/mesh/MeshComponents.tsx`
- Mini router in `src/AppShell.tsx` using `nav(name, props)`.
- Primary flow:
  - Dashboard
  - Notes list
  - Note detail A/B
  - Create/edit note
  - Search
- Contact flow:
  - Contacts list
  - Contact detail/timeline
  - Create/edit contact
  - Contacts empty
- Relationship status:
  - Status list
  - Create/edit status
- System screens:
  - Notifications
  - All upcoming
  - Recent contacts
  - Settings
  - Edit profile
  - Change password
  - Language
  - Notification preferences
  - Status-in-use decision screen
- Empty states:
  - Dashboard empty
  - Notes empty
  - Contacts empty
  - Status empty
  - Notifications empty
- Confirm dialog showcase screens:
  - Delete note
  - Delete contact
  - Delete status
  - Delete special day
- Auth flow:
  - Welcome
  - Login / login error
  - Register / register error
  - Verify email
  - Verify phone / resend
  - Verify success
  - Forgot password
  - Reset password
  - Loading

## Remaining

- Full visual polish against exported screenshots.
- Any later functional wiring required by `Reference` beyond the static Claude prototype.

## Verification

Run:

```powershell
npm.cmd run typecheck
```

Expo preview/debug server has been used on `http://localhost:8083`, but mobile app is the target.
