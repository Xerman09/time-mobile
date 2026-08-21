import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost/time_system/time';
  }
  return 'http://10.0.2.2/time_system/time';
};

export const BASE_URL = getBaseUrl();

export const ENDPOINTS = {
  login:      `${BASE_URL}/api/mobile_auth.php`,
  logout:     `${BASE_URL}/api/mobile_logout.php`,
  shift:      `${BASE_URL}/api/attendance_shift.php`,
  leaveApi:   `${BASE_URL}/api/leave_requests.php`,
  users:      `${BASE_URL}/api/user_management.php`,
  changePass: `${BASE_URL}/api/change_password.php`,
};
