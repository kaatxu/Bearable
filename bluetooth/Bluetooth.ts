export interface BluetoothService {
  requestPermissions(): Promise<boolean>;
  startScan(onDeviceFound: (device: any) => void): Promise<void>;
  stopScan(): void;
}