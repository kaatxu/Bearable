import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import {BluetoothService} from "./Bluetooth";

export default class BluetoothNative implements BluetoothService {
  private manager: BleManager;
  private devices: Map<string, Device> = new Map();
  private connectedDevice: Device | null = null;
  private characteristic: Characteristic | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const permsGranted =
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted';

      if (!permsGranted) return false;
      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        return false;
      }

      return true;
    }

    if (Platform.OS === 'ios') {
      const state = await this.manager.state();
      return state === 'PoweredOn';
    }

    return true;
  }

  async startScan(onDeviceFound: (device: any) => void) {
    this.devices.clear();

    this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.warn('BLE Scan error:', error);
        return;
      }
      if (device && (device.name || device.localName) && !this.devices.has(device.id)) {
        this.devices.set(device.id, device);
        onDeviceFound(device);
      }
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  async connectToDevice(
    deviceId: string,
    serviceUUID?: string,
    characteristicUUID?: string
  ): Promise<Device> {
    try {
      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not powered on.');
      }

      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      if (serviceUUID && characteristicUUID) {
        const services = await device.services();
        for (const service of services) {
          if (service.uuid.toLowerCase() === serviceUUID.toLowerCase()) {
            const characteristics = await service.characteristics();
            this.characteristic =
              characteristics.find(
                (c) => c.uuid.toLowerCase() === characteristicUUID.toLowerCase()
              ) || null;
          }
        }
      }

      return device;
    } catch (error) {
      console.warn('BLE Connection error:', error);
      throw error;
    }
  }

  async sendBPM(bpm: number) {
    if (!this.characteristic || !this.connectedDevice) return;
    if (bpm < 0 || bpm > 255) {
      console.warn('BPM value must be between 0 and 255');
      return;
    }
    const data = Buffer.from(Uint8Array.of(bpm)).toString('base64');
    try {
      await this.characteristic.writeWithResponse(data);
    } catch (err) {
      console.warn("Failed to send BPM:", err);
    }
  }
  

  async disconnect(): Promise<void> {
    if (!this.connectedDevice) return;

    try {
      if (this.characteristic) {
        try {
          await (this.characteristic as any).stopNotifications();
        } catch (err) {
          console.warn("Failed to stop notifications:", err);
        }
        this.characteristic = null;
      }

      await this.connectedDevice.cancelConnection();
      console.log("Device disconnected successfully");
    } catch (err) {
      console.warn("Failed to disconnect device:", err);
    } finally {
      this.connectedDevice = null;
    }
  }
}

