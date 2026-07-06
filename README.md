# Mesh CRM Mobile App

Mesh is a personal CRM mobile app built with Expo and React Native. The app helps users manage relationships, contacts, notes, reminders, special days, and notifications in one calm mobile workspace.

## Preview

![Mesh CRM demo](assets/demo.gif)

## Features

- Authentication flow with welcome, login, register, verification, forgot password, and reset password screens.
- Dashboard with upcoming reminders, special days, recent activity, unread notifications, and quick actions.
- Contact management for creating, editing, viewing, and tracking relationship timelines.
- Notes workflow with note lists, note detail, create/edit screens, reminders, and contact linking.
- Relationship status management with create, edit, empty, and delete confirmation states.
- Notifications and settings screens with profile, account, password, and logout flows.
- Expo push notification setup with secure token storage and notification tap routing.
- Real API integration through the hosted backend client.

## Tech Stack

- Expo 54
- React 19
- React Native 0.81
- TypeScript
- Expo Notifications
- Expo Secure Store
- Expo Mesh Gradient
- React Native SVG

## Project Structure

```text
.
+-- App.tsx
+-- app.json
+-- assets/
+-- src/
|   +-- api/
|   +-- components/
|   +-- data/
|   +-- mesh/
|   +-- screens/
|   +-- state/
|   +-- storage/
|   +-- theme/
|   +-- utils/
+-- Screenshot/
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

## Type Checking

```bash
npm run typecheck
```

## API

The app currently points to:

```text
https://personal-crm-backend-5uab.onrender.com/api
```

The API client is located at `src/api/client.ts`.

## Push Notifications

Push notification support is wired through `expo-notifications`. For production builds, configure the EAS project ID in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

Test push notifications on a physical iOS or Android device.

## Screenshots

The repository includes reference screenshots under the `Screenshot/` directory for auth, dashboard, contact, note, status, settings, empty states, and confirmation flows.
