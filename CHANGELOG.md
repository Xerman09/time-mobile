# WorkShift Mobile App - Changelog

All notable changes to the WorkShift mobile application will be documented in this file.

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
