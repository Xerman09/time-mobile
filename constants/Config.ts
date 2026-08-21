// Base API URL — change this to your machine's LAN IP for real device testing
// Android emulator uses 10.0.2.2 to reach localhost
// iOS simulator uses localhost
// Real device on same WiFi: use your machine's local IP e.g. http://192.168.1.x

export const BASE_URL = 'http://10.0.2.2/time'; // ← Change this if needed

export const ENDPOINTS = {
  login:      `${BASE_URL}/api/mobile_auth.php`,
  logout:     `${BASE_URL}/logout.php`,
  shift:      `${BASE_URL}/api/attendance_shift.php`,
  leaveApi:   `${BASE_URL}/api/leave_requests.php`,
  users:      `${BASE_URL}/api/user_management.php`,
  changePass: `${BASE_URL}/api/change_password.php`,
};
