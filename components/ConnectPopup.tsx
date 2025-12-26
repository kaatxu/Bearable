import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import DeviceRefresh from "../assets/icons/device-refresh.svg";

interface PopupProps {
  visible: boolean;
  onConfirm: (deviceId: string) => Promise<void>;
  onCancel: () => void;
  stopScan?: () => void; // Pass a function to stop BLE scan
  message?: string;
  devices?: { id: string; name: string }[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function Popup({
  visible,
  onConfirm,
  onCancel,
  stopScan,
  message = "Available Devices",
  devices = [],
  refreshing = false,
  onRefresh,
}: PopupProps) {
  const { width, height } = useWindowDimensions();
  const scale = width / 375;
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const REFRESH_SIZE = clamp(28 * scale, 22, 36);

  const popupTranslateY = useRef(new Animated.Value(height)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const [isMounted, setIsMounted] = useState(visible);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [pairing, setPairing] = useState(false);

  const pairingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animate popup in
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(popupTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(dimAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const hidePopup = () => {
    // Stop scanning immediately
    if (stopScan) stopScan();

    Animated.parallel([
      Animated.timing(popupTranslateY, {
        toValue: height,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(dimAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsMounted(false);
      setSelectedDevice(null);
      setPairing(false);

      // Clear pairing timeout
      if (pairingTimeout.current) {
        clearTimeout(pairingTimeout.current);
        pairingTimeout.current = null;
      }

      onCancel();
    });
  };

  // Spin animation for refresh
  useEffect(() => {
    if (refreshing) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [refreshing]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!isMounted) return null;

  const handleConfirm = async () => {
    if (!selectedDevice) return;

    setPairing(true);

    // Start pairing timeout (reset if pairing takes too long)
    pairingTimeout.current = setTimeout(() => {
      setPairing(false);
      setSelectedDevice(null);
    }, 60000);

    try {
      await onConfirm(selectedDevice);
      // pairing successful
      if (pairingTimeout.current) {
        clearTimeout(pairingTimeout.current);
        pairingTimeout.current = null;
      }
      hidePopup();
    } catch (err) {
      // pairing failed
      setPairing(false);
      setSelectedDevice(null);
    }
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: dimAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
          }),
          justifyContent: "flex-end",
        },
      ]}
    >
      <Animated.View
        style={{
          width,
          transform: [{ translateY: popupTranslateY }],
          paddingHorizontal: width * 0.05,
          paddingTop: clamp(18 * scale, 16, 28),
          paddingBottom: clamp(28 * scale, 22, 36),
          backgroundColor: "#ddd9d7",
          borderTopLeftRadius: clamp(18 * scale, 14, 26),
          borderTopRightRadius: clamp(18 * scale, 14, 26),
          alignItems: "center",
        }}
      >
        {/* Close */}
        <TouchableWithoutFeedback onPress={hidePopup}>
          <Text
            style={{
              fontSize: clamp(26 * scale, 22, 34),
              color: "#726f6d",
              position: "absolute",
              top: 10 * scale,
              right: 16 * scale,
            }}
          >
            ×
          </Text>
        </TouchableWithoutFeedback>

        {/* Title */}
        <Text
          style={{
            fontSize: clamp(18 * scale, 16, 22),
            marginBottom: clamp(12 * scale, 8, 16),
            fontWeight: "600",
            color: "#726f6d",
            textAlign: "center",
          }}
        >
          {message}
        </Text>

        {/* Refresh + Devices */}
        <View style={{ width: "100%", marginTop: -12 * scale }}>
          {onRefresh && (
            <TouchableWithoutFeedback onPress={onRefresh}>
              <Animated.View
                style={{
                  width: REFRESH_SIZE,
                  height: REFRESH_SIZE,
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ rotate: spin }],
                  alignSelf: "flex-start",
                  marginBottom: 4 * scale,
                }}
              >
                <DeviceRefresh
                  width={REFRESH_SIZE}
                  height={REFRESH_SIZE}
                  fill="#7f7c7a"
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          )}

          <View
            style={{
              width: "100%",
              height: clamp(140 * scale, 110, 180),
              backgroundColor: "#e4e0dd",
              borderRadius: clamp(28 * scale, 22, 40),
              borderWidth: clamp(2 * scale, 1.5, 3),
              borderColor: "#9a9795",
              padding: 12 * scale,
              justifyContent: devices.length === 0 ? "center" : "flex-start",
            }}
          >
            {devices.length > 0 ? (
              <ScrollView
                contentContainerStyle={{ paddingTop: 6 * scale, paddingBottom: 8 * scale }}
              >
                {devices.map((d) => (
                  <TouchableWithoutFeedback
                    key={d.id}
                    onPress={() =>
                      setSelectedDevice(d.id === selectedDevice ? null : d.id)
                    }
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12 * scale,
                        paddingLeft: 12 * scale,
                        paddingTop: 6 * scale,
                      }}
                    >
                      <View
                        style={{
                          width: 22 * scale,
                          height: 22 * scale,
                          borderRadius: 4 * scale,
                          borderWidth: 2 * scale,
                          borderColor: "#7f7c7a",
                          marginRight: 12 * scale,
                          backgroundColor:
                            selectedDevice === d.id ? "#726f6d" : "transparent",
                        }}
                      />
                      <Text
                        style={{
                          color: "#7f7c7a",
                          fontSize: clamp(17 * scale, 15, 20),
                          fontWeight: "700",
                          paddingVertical: 2 * scale,
                        }}
                      >
                        {d.name}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                ))}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text
                  style={{
                    color: "#7f7c7a",
                    fontSize: clamp(15 * scale, 13, 18),
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {refreshing ? "Scanning..." : "No devices found"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableWithoutFeedback
          disabled={!selectedDevice || pairing}
          onPress={handleConfirm}
        >
          <View
            style={{
              width: "100%",
              marginTop: clamp(20 * scale, 16, 28),
              paddingVertical: clamp(14 * scale, 12, 20),
              borderRadius: clamp(25 * scale, 20, 40),
              backgroundColor:
                selectedDevice && !pairing ? "#726f6d" : "#999",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
                fontSize: clamp(16 * scale, 14, 20),
              }}
            >
              {pairing ? "Pairing..." : "Start Pairing"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  );
}
