import React, { useRef, useState } from "react";
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  Text,
  useWindowDimensions,
} from "react-native";

import PlayButton from "../assets/icons/play-button.svg";
import PauseButton from "../assets/icons/pause-button.svg";

export default function WifiButton() {
  const { width, height } = useWindowDimensions();

  // Dynamically sized button
  const BUTTON_SIZE = Math.min(width * 0.32, 140);
  const RIPPLE_SIZE = BUTTON_SIZE * 1.25;

  const [isPaused, setIsPaused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Ripples
  const ripples = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const animateRipplesOut = () => {
    ripples.forEach((r, i) => {
      r.setValue(0);
      Animated.timing(r, {
        toValue: 1,
        duration: 1000,
        delay: (ripples.length - 1 - i) * 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
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
        useNativeDriver: true,
      }).start();
    });
  };

  // Button press animation
  const pressAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(8)).current;

  const animatePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 2,
        duration: 90,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatePressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 8,
        duration: 90,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const shadowHeight = shadowAnim.interpolate({
    inputRange: [0, 12],
    outputRange: [0, 12],
  });

  const handlePress = () => {
    if (!isPaused) {
      showAnimatedPopup();
    } else {
      animateRipplesIn();
      setIsPaused(false);
    }
  };

  const confirmStartPairing = () => {
    hideAnimatedPopup();
    setIsPaused(true);
    animateRipplesOut();
  };

  // Popup animation
  const popupTranslateY = useRef(new Animated.Value(height * 0.4)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;

  const showAnimatedPopup = () => {
    setShowPopup(true);
    Animated.parallel([
      Animated.timing(popupTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(dimAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAnimatedPopup = () => {
    Animated.parallel([
      Animated.timing(popupTranslateY, {
        toValue: height * 0.4,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(dimAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPopup(false));
  };

  const ButtonIcon = isPaused ? PauseButton : PlayButton;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.buttonWrapper,
          { width: BUTTON_SIZE, height: BUTTON_SIZE },
        ]}
      >
        {ripples.map((r, i) => {
          const startScale = i * 0.2;
          const endScale = startScale + 1.0 + i * 0.2;

          const scale = r.interpolate({
            inputRange: [0, 1],
            outputRange: [startScale, endScale],
          });

          const opacity = r.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.45],
          });

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

        <TouchableWithoutFeedback
          onPressIn={animatePressIn}
          onPressOut={() => {
            animatePressOut();
            handlePress();
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateY: pressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, BUTTON_SIZE * 0.05],
                  }),
                },
                {
                  scale: pressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.97],
                  }),
                },
              ],
              elevation: shadowAnim,
              shadowOffset: { width: 0, height: shadowHeight },
              shadowOpacity: 0.3,
              shadowRadius: 6,
            }}
          >
            <View
              style={[
                styles.imageContainer,
                {
                  width: BUTTON_SIZE,
                  height: BUTTON_SIZE,
                  borderRadius: BUTTON_SIZE / 2,
                },
              ]}
            >
              <ButtonIcon width={BUTTON_SIZE} height={BUTTON_SIZE} />
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>

      {showPopup && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: dimAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
              }),
              justifyContent: "flex-end",
              alignItems: "center",
            },
          ]}
        >
          <Animated.View
            style={[
              styles.popup,
              {
                width: Math.min(width * 0.8, 300),
                transform: [{ translateY: popupTranslateY }],
              },
            ]}
          >
            <Text style={[styles.popupText, { fontSize: Math.min(width * 0.045, 18) }]}>
              Start Pairing?
            </Text>

            <TouchableWithoutFeedback onPress={confirmStartPairing}>
              <View style={styles.popupButton}>
                <Text style={[styles.popupButtonText, { fontSize: Math.min(width * 0.04, 16) }]}>
                  Start
                </Text>
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={hideAnimatedPopup}>
              <View
                style={[
                  styles.popupButton,
                  { backgroundColor: "#ccc" },
                ]}
              >
                <Text style={[styles.popupButtonText, { fontSize: Math.min(width * 0.04, 16) }]}>
                  Cancel
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: '10%',
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  ripple: {
    position: "absolute",
    backgroundColor: "#726f6d",
  },
  popup: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ddd9d7",
    alignItems: "center",
    marginBottom: 20,
  },
  popupText: {
    marginBottom: 20,
  },
  popupButton: {
    backgroundColor: "#726f6d",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  popupButtonText: {
    color: "white",
  },
});
