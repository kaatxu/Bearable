import { BluetoothService } from "./Bluetooth";

export default class BluetoothWeb implements BluetoothService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor() {}

  async requestPermissions(): Promise<boolean> {
    if (!navigator.bluetooth) {
      return false;
    }
    return true;
  }

  async startScan(onDeviceFound: (device: any) => void) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["00001234-0000-1000-8000-00805f9b34fb"],
      });

      this.device = device;
      onDeviceFound(device);
    } catch (error) {
      console.warn("Web BLE scan cancelled or failed:", error);
    }
  }

  stopScan(): void {
  }

  async connectToDevice(): Promise<BluetoothDevice> {
    if (!this.device) {
      throw new Error("No device selected");
    }

    if (!this.device.gatt) {
      throw new Error("GATT not supported");
    }

    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(
      "00001234-0000-1000-8000-00805f9b34fb"
    );
    this.characteristic = await service.getCharacteristic(
      "00005678-0000-1000-8000-00805f9b34fb"
    );

    return this.device;
  }

  async sendBPM(bpm: number): Promise<void> {
    if (!this.characteristic) return;
    if (bpm < 0 || bpm > 255) {
      console.warn("BPM value must be between 0 and 255");
      return;
    }
    const data = new Uint8Array([bpm]);
    try {
      await this.characteristic.writeValue(data);
    } catch (err) {
      console.warn("Failed to send BPM:", err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  getDevicesList(): BluetoothDevice[] {
    return this.device ? [this.device] : [];
  }
}