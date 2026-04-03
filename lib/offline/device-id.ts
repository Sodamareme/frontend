const MEAL_SCAN_DEVICE_ID_STORAGE_KEY = 'restaurateur_scan_device_id';

export function getOrCreateMealScanDeviceId() {
  if (typeof window === 'undefined') {
    return 'server-side-device';
  }

  const existingDeviceId = localStorage.getItem(MEAL_SCAN_DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const generatedDeviceId = `device-${crypto.randomUUID()}`;
  localStorage.setItem(MEAL_SCAN_DEVICE_ID_STORAGE_KEY, generatedDeviceId);
  return generatedDeviceId;
}
