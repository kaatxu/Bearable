import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import DeviceRefresh from "../assets/icons/device-refresh.svg";

interface PopupProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export default function Popup({
  visible,
  onConfirm,
  onCancel,
  message = "Available Devices",
}: PopupProps) {
  const { width, height } = useWindowDimensions();
  const scale = width / 375;
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const REFRESH_SIZE = clamp(28 * scale, 22, 36);

  const popupTranslateY = useRef(new Animated.Value(height)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const [isMounted, setIsMounted] = useState(visible);
  const [refreshing, setRefreshing] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const mainState = useRef<"idle" | "scanning">("idle");
  const dotsInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      startRefresh(true);

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
    } else {
      stopDots();
    }
  }, [visible]);

  const hidePopup = (cb: () => void) => {
    stopDots();
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
      cb();
    });
  };

  const fadeText = (text: string, skipFade = false) => {
    if (!skipFade) {
      Animated.timing(textOpacity, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
        setDisplayText(text);
        Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      });
    } else {
      setDisplayText(text);
    }
  };

  const startDots = () => {
    stopDots();
    let count = 0;
    dotsInterval.current = setInterval(() => {
      if (mainState.current === "scanning") {
        count = (count % 3) + 1;
        setDisplayText(`Scanning for devices${".".repeat(count)}`);
      }
    }, 400);
  };

  const stopDots = () => {
    if (dotsInterval.current) {
      clearInterval(dotsInterval.current);
      dotsInterval.current = null;
    }
  };

  const startRefresh = (skipFade = false) => {
    if (refreshing) return;
    setRefreshing(true);
    spinAnim.setValue(0);
    mainState.current = "scanning";
    if (!skipFade) {
      fadeText("Scanning for devices");
    } else {
      setDisplayText("Scanning for devices");
    }
    startDots();

    Animated.timing(spinAnim, {
      toValue: 2,
      duration: 2700,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      stopDots();
      setRefreshing(false);
      mainState.current = "idle";
      fadeText("No devices found");
    });
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 2], outputRange: ["0deg", "720deg"] });

  if (!isMounted) return null;

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
          paddingVertical: clamp(18 * scale, 16, 28),
          backgroundColor: "#ddd9d7",
          borderTopLeftRadius: clamp(18 * scale, 14, 26),
          borderTopRightRadius: clamp(18 * scale, 14, 26),
          alignItems: "center",
        }}
      >
        <TouchableWithoutFeedback onPress={() => hidePopup(onCancel)}>
          <Text style={{ fontSize: clamp(26 * scale, 22, 34), color: "#726f6d", position: "absolute", top: 10, right: 16 }}>
            ×
          </Text>
        </TouchableWithoutFeedback>

        <Text style={{ fontSize: clamp(18 * scale, 16, 22), marginBottom: clamp(12 * scale, 8, 16), fontWeight: "600", color: "#726f6d" }}>
          {message}
        </Text>

        <View style={{ width: width * 0.9, marginTop: clamp(20 * scale, 16, 28) }}>
          <TouchableWithoutFeedback onPress={() => startRefresh(false)}>
            <Animated.View
              style={{
                position: "absolute",
                top: -REFRESH_SIZE * 1.4,
                left: REFRESH_SIZE * 0.5,
                width: REFRESH_SIZE,
                height: REFRESH_SIZE,
                justifyContent: "center",
                alignItems: "center",
                transform: [{ rotate: spin }],
                zIndex: 10,
              }}
            >
              <DeviceRefresh width={REFRESH_SIZE} height={REFRESH_SIZE} fill="#7f7c7a" />
            </Animated.View>
          </TouchableWithoutFeedback>

          <View
            style={{
              width: "100%",
              height: clamp(120 * scale, 95, 160),
              backgroundColor: "#e4e0dd",
              borderRadius: clamp(28 * scale, 22, 40),
              borderWidth: clamp(2 * scale, 1.5, 3),
              borderColor: "#9a9795",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.Text
              style={{
                color: "#7f7c7a",
                fontSize: clamp(15 * scale, 13, 18),
                fontWeight: "700",
                opacity: textOpacity,
              }}
            >
              {displayText}
            </Animated.Text>
          </View>
        </View>

        <View
          style={{
            width: width * 0.9,
            marginTop: clamp(50 * scale, 30, 80),
            paddingVertical: clamp(14 * scale, 12, 20),
            borderRadius: clamp(25 * scale, 20, 40),
            backgroundColor: "#726f6d",
            opacity: 0.45,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: clamp(16 * scale, 14, 20) }}>Start Pairing</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
