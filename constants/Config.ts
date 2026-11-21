import { Platform } from 'react-native';

// Production Live Server for WorkShift
export const BASE_URL = 'https://time.usintellix.com';

// App Build & Release Configuration
export const APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 5; // Build #5
export const GITHUB_REPO = 'Xerman09/time-mobile';
export const UPDATE_VERSION_URL = `https://github.com/${GITHUB_REPO}/releases/download/latest-apk/version.json`;
export const UPDATE_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/latest-apk`;
export const LATEST_APK_URL = `https://github.com/${GITHUB_REPO}/releases/download/latest-apk/WorkShift-latest.apk`;

export const ENDPOINTS = {
  login:      `${BASE_URL}/api/mobile_auth.php`,
  logout:     `${BASE_URL}/api/mobile_logout.php`,
  shift:      `${BASE_URL}/api/attendance_shift.php`,
  leaveApi:   `${BASE_URL}/api/leave_requests.php`,
  users:      `${BASE_URL}/api/user_management.php`,
  changePass: `${BASE_URL}/api/change_password.php`,
};
