# WorkShift Mobile App - Changelog

All notable changes to the WorkShift mobile application will be documented in this file.

## [Build 6] - 2026-11-22
### Added
- **"My Information" Profile View & Employee Card**:
  - Added dedicated **MY INFORMATION** card in the Profile tab showing Employee ID, Full Name, Username, Company Name, Account Code, Department, and Position.
  - Included Company Name in profile header badge, employee ID banner, and employment details whenever a company is assigned.
  - Built an interactive **My Information Modal / Employee ID Card** featuring personal details, workplace geofence address, assigned timezone, and GPS tracking status.
- **Full Shift Lifecycle Timestamps in Attendance**:
  - Upgraded Attendance cards to explicitly display all punch timestamps: **Time In**, **Break In**, **Break Out**, and **Time Out**.
  - Added dedicated Break Summary badge showing exact break interval and total break duration (e.g. `12:00 PM – 1:00 PM (1h 00m)`).
  - Added fallback timestamp resolution (`resolveTs`) supporting both epoch seconds and ISO string dates across Home and History screens.
- **Settings & Password Management**:
  - Added dedicated **SETTINGS** section to the profile screen.
  - Added interactive **Change Password** modal with toggleable visibility for current password, new password, and confirmation.
  - Implemented client-side validation and backend integration with `/api/change_password.php`.

### Fixed
- **Attendance History Pagination & Infinite Scroll**:
  - Resolved hidden history logs: previous shifts were paginated behind the 80px bottom tab bar. Expanded bottom insets (`paddingBottom: 120`).
  - Added seamless **Infinite Scroll**: automatically loads older shifts as you scroll down through all 96 records.
  - Added an interactive **Load More Shifts** button and a live counter badge (`Showing X of 96 Shifts`).
- **Persistent Session & Auto-Healing**:
  - Implemented silent background re-authentication in `lib/api.ts` to automatically renew expired PHP sessions using saved credentials instead of kicking users to the login screen.
  - Enhanced session rehydration in `useAuth.tsx` to keep remembered users signed in between app restarts.
  - Resolved `"Not authenticated (branch/user missing)"` in local web preview by setting up a dedicated local Web API proxy (`dev-proxy.js`) that forwards session cookies seamlessly to `time.usintellix.com`.

### Changed
- **Decluttered Attendance History UI**:
  - Replaced cramped 4-column layout with a spacious, airy 2-column format for **TIME IN** and **TIME OUT** with vertical separation.
  - Eliminated awkward line-breaks (e.g. `10:52:36 \n PM`) by utilizing standard `hh:mm A` typography.
  - Formatted breaks into a clean, contextual coffee badge (e.g. `☕ Break: 12:00 PM → 1:00 PM • 1h`) that only displays when a break was recorded, eliminating empty placeholder dashes.
  - Fixed runaway elapsed timer on incomplete past shifts (e.g. `72:41:24`).
  - Added expandable table for second-level exact timestamps and GPS location details.
- **Profile Screen Clean Up**: Removed `Status` and `Branch ID` from Account Details to simplify the profile view.
- **Custom WorkShift Splash & Loading Screen**:
  - Replaced the default Expo splash with native WorkShift logo splash in `app.json` and `splash-icon.png`.
  - Built a custom in-app startup loading screen in `_layout.tsx` featuring the WorkShift logo, pulsing animation, and branded status indicator.

---

## [Build 5] - 2026-11-21
### Added
- **Interactive Shift Card Expansion**: Tap any attendance row to expand breakdown details including exact break periods and verified GPS location address.
- **Enhanced Attendance History Screen**:
  - Top shifts counter badge (`X Shifts`).
  - Redesigned pagination bar with previous/next chevron buttons and active page indicator.
  - Re-styled empty state with instant one-tap refresh button.
- **Automated Update Release Pipeline**: Added `version.json` build artifact for real-time in-app update checks.

### Changed
- Replaced legacy EAS cloud update service with direct GitHub Releases update mechanism.
- Locked `BASE_URL` permanently to `https://time.usintellix.com`.
- Hardened session persistence by extracting `session_id` directly from authentication payloads into `PHPSESSID` cookie jar.

---

## [Build 4] - 2026-11-21
### Fixed
- Replaced obsolete EAS update checker in `useAppUpdates.ts` to resolve `"Unable to reach the update service"`.
- Added GitHub Release check with one-tap APK download button.

---

## [Build 3] - 2026-11-21
### Added
- Locked production API endpoint to `https://time.usintellix.com`.
- Added `setSessionId()` to store and forward `session_id` across all authenticated requests.

---

## [Build 2] - 2026-11-21
### Added
- Automated GitHub Actions Android APK build pipeline (`build-apk.yml`).
- JVM heap and Node memory optimization for reliable CI compilation.
