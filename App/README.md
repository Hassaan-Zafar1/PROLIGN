# ProLign — Mobile App (Expo, SDK 54, JavaScript)

React Native (Expo) frontend for ProLign. Same earthy-green theme, fonts and layout
as the web app. **Frontend only** — no backend, no database. Uses mock login + dummy data.

## Requirements
- Node.js 18+ (LTS recommended)
- The **Expo Go** app on your phone (Android/iOS) — make sure it supports **SDK 54**
- Same Wi-Fi for phone and computer (or use tunnel)

## Run it (3 steps)
```bash
cd ProLignApp
npm install
npx expo start
```
Then scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

If versions ever mismatch with your installed Expo, run once:
```bash
npx expo install --fix
```

Helpful: if QR doesn't connect on your network, use a tunnel:
```bash
npx expo start --tunnel
```

## Mock Login (no real auth / no DB)
| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Mentee | mentee@prolign.com   | mentee123   |
| Mentor | mentor@prolign.com   | mentor123   |
| Admin  | admin@prolign.com    | password123 |

On the Login screen you can also tap **Mentee / Mentor / Admin** under "Quick login"
to auto-fill the credentials, then press **Login**.

## What's inside
- **Landing** — hero, stats, how it works, featured mentors, testimonials
- **Login** — mock auth + quick role login
- **Mentee** tabs — Dashboard, Find Mentors (search + filters), Sessions, Profile
- **Mentor profile** + **Booking** (date/time + mock JazzCash/card payment + confirmation)
- **Mentor** tabs — Dashboard (requests + reviews), Sessions, Profile
- **Admin** tabs — Overview (stats + mentors/mentees lists), Verification, Profile

## Structure
```
App.js                  font loading + providers + navigation
src/theme.js            colors + fonts (copied from the web app's index.css)
src/data/mockData.js    all dummy data + mock credentials (mirrors the web seed db)
src/context/AuthContext.js
src/components/          ui.js (Button, Card, Badge, Avatar, Input, Icon...), MentorCard.js
src/navigation/         RootNavigator.js (role-based tabs + stack)
src/screens/            Landing, Login, Profile, MentorProfile, Booking
src/screens/mentee/     MenteeDashboard, DiscoveryScreen, SessionsScreen
src/screens/mentor/     MentorDashboard
src/screens/admin/      AdminDashboard, AdminVerification
```

## Notes
- This is dummy/mock data only. Backend (Node.js) + MongoDB will be added later.
- Fonts: Playfair Display (headings) + Source Sans 3 (body), same as the web app.
