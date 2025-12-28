import React, { useRef, useState } from "react";
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
  Alert,
  Linking,
  Modal,
} from "react-native";

import PlayButton from "../assets/icons/play-button.svg";
import PauseButton from "../assets/icons/pause-button.svg";
import Popup from "./ConnectPopup";

import BluetoothNative from "../bluetooth/Bluetooth.native";
import BluetoothWeb from "../bluetooth/Bluetooth.web";

export default function WifiButton() {
  const bluetoothService = useRef(
    Platform.OS === "web" ? new BluetoothWeb() : new BluetoothNative()
  ).current;
  const isNativeBLE = Platform.OS !== "web";
  const SERVICE_UUID = "00001234-0000-1000-8000-00805f9b34fb";
  const CHARACTERISTIC_UUID = "00005678-0000-1000-8000-00805f9b34fb"; 

  const { width } = useWindowDimensions();
  const BUTTON_SIZE = Math.min(width * 0.4, 240);
  const RIPPLE_SIZE = BUTTON_SIZE * 1.25;

  const [isPaused, setIsPaused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const dimAnim = useRef(new Animated.Value(0)).current;

  const ripples = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const pressAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(8)).current;
  const [modalMounted, setModalMounted] = useState(false);

  const fadeInDim = () => {
    Animated.timing(dimAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const fadeOutDim = () => {
    Animated.timing(dimAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const animateRipplesOut = () => {
    ripples.forEach((r, i) => {
      r.setValue(0);
      Animated.timing(r, {
        toValue: 1,
        duration: 1000,
        delay: (ripples.length - 1 - i) * 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  };

  const animateRipplesIn = () => {
    ripples.forEach((r, i) => {
      Animated.timing(r, {
        toValue: 0,
        duration: 500,
        delay: i * 400,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  };

  const animatePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(shadowAnim, { toValue: 2, duration: 90, useNativeDriver: false }),
    ]).start();
  };

  const animatePressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, { toValue: 0, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(shadowAnim, { toValue: 8, duration: 90, useNativeDriver: false }),
    ]).start();
  };

  const shadowHeight = shadowAnim.interpolate({ inputRange: [0, 12], outputRange: [0, 12] });

  const startScan = async () => {
    setDevices([]);
    setRefreshing(true);

    try {
      bluetoothService.startScan((device: any) => {
        const name = device.name || device.localName;
        if (name) {
          setDevices((prev) =>
            prev.find((d) => d.id === device.id) ? prev : [...prev, { id: device.id, name }]
          );
        }
      });

      setTimeout(() => {
        bluetoothService.stopScan();
        setRefreshing(false);
      }, 5000);
    } catch (e) {
      console.warn("Scan cancelled", e);
      setRefreshing(false);
    }
  };

  const handlePress = async () => {
    if (!isPaused) {
      const ok = await bluetoothService.requestPermissions();
      if (!ok) {
        if (isNativeBLE) {
          Alert.alert(
            "Bluetooth Required",
            "Please turn on Bluetooth to continue.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" },
            ]
          );
        }
        return;
      }

      if (isNativeBLE) {
        setShowPopup(true);
        fadeInDim(); 
        startScan();
      }
    } else {
      try {
        await bluetoothService.disconnect();
      } catch (err) {
        console.warn("Disconnect failed", err);
      }
      animateRipplesIn();
      setIsPaused(false);
    }
  };

  const handleConfirmPairing = async (deviceId: string) => {
    try {
      setRefreshing(true);
      await bluetoothService.connectToDevice(deviceId, SERVICE_UUID, CHARACTERISTIC_UUID);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await bluetoothService.sendBPM(20);
      setShowPopup(false);
      setIsPaused(true);
      animateRipplesOut();
      setRefreshing(false);
    } catch (err) {
      console.warn("Connection failed", err);
      setRefreshing(false);
      Alert.alert("Connection failed", "Could not connect to device.");
    }
  };

  const cancelScan = () => {
    bluetoothService.stopScan();
    setShowPopup(false);
      Animated.timing(dimAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setShowPopup(false));
  };

  const ButtonIcon = isPaused ? PauseButton : PlayButton;

  return (
    <View style={styles.root}>
      <View style={[styles.buttonWrapper, { width: BUTTON_SIZE, height: BUTTON_SIZE }]}>
        {ripples.map((r, i) => {
          const scale = r.interpolate({ inputRange: [0, 1], outputRange: [i * 0.2, i * 0.2 + 1.0 + i * 0.2] });
          const opacity = r.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });
          return (
            <Animated.View
              key={i}
              style={[
                styles.ripple,
                {
                  width: RIPPLE_SIZE,
                  height: RIPPLE_SIZE,
                  borderRadius: RIPPLE_SIZE / 2,
                  top: (BUTTON_SIZE - RIPPLE_SIZE) / 2,
                  left: (BUTTON_SIZE - RIPPLE_SIZE) / 2,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}

        <TouchableWithoutFeedback onPressIn={animatePressIn} onPressOut={() => { animatePressOut(); handlePress(); }}>
          <Animated.View
            style={{
              transform: [
                { translateY: pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, BUTTON_SIZE * 0.05] }) },
                { scale: pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
              ],
              elevation: shadowAnim,
              shadowOffset: { width: 0, height: shadowHeight },
              shadowOpacity: 0.3,
              shadowRadius: 6,
            }}
          >
            <View style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2, justifyContent: "center", alignItems: "center" }}>
              <ButtonIcon width={BUTTON_SIZE} height={BUTTON_SIZE} />
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>

      <Modal
        visible={showPopup}
        transparent
        animationType="none"
        onRequestClose={cancelScan}
      >
        <TouchableWithoutFeedback onPress={cancelScan}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: dimAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Popup
          visible={showPopup}
          onConfirm={handleConfirmPairing}
          onCancel={cancelScan}
          stopScan={() => bluetoothService.stopScan()}
          devices={devices}
          refreshing={refreshing}
          onRefresh={startScan}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  buttonWrapper: { justifyContent: "center", alignItems: "center", marginBottom: "15%" },
  ripple: { position: "absolute", backgroundColor: "#726f6d" },
});
