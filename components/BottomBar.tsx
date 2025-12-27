import React, { useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  ViewStyle,
} from "react-native";

import ControlIcon from "../assets/icons/control-button.svg";
import ConnectIcon from "../assets/icons/connect-button.svg";

interface BottomBarProps {
  style?: ViewStyle | ViewStyle[];
}

export default function BottomBar({ style }: BottomBarProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const CONTAINER_WIDTH = Math.min(width * 0.92, 460);
  const HEIGHT = Math.max(62, Math.min(78, width * 0.18));
  const OUTER_PADDING = Math.max(12, Math.min(18, width * 0.045));
  const PILL_INSET = Math.max(6, Math.min(10, width * 0.025));
  const TAB_WIDTH = (CONTAINER_WIDTH - OUTER_PADDING * 2) / 2;

  const [active, setActive] = useState<0 | 1>(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const leftOpacity = useRef(new Animated.Value(1)).current;
  const rightOpacity = useRef(new Animated.Value(0)).current;

  const switchTab = (index: 0 | 1) => {
    setActive(index);

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: index * TAB_WIDTH,
        useNativeDriver: true,
        damping: 20,
        stiffness: 170,
      }),
      Animated.timing(leftOpacity, {
        toValue: index === 0 ? 1 : 0,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(rightOpacity, {
        toValue: index === 1 ? 1 : 0,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
    if (index === 0) router.push("/");
    if (index === 1) router.push("/control");
  };

  const iconSize = Math.max(20, Math.min(26, width * 0.06));
  const fontSize = Math.max(14, Math.min(17, width * 0.042));

  return (
    <View style={[styles.wrapper, { paddingBottom: 56 }, style]}>
      <View
        style={[
          styles.container,
          {
            width: CONTAINER_WIDTH,
            height: HEIGHT,
            borderRadius: HEIGHT / 2,
            padding: OUTER_PADDING,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.pill,
            {
              top: PILL_INSET,
              left: PILL_INSET,
              width: TAB_WIDTH - (PILL_INSET - OUTER_PADDING),
              height: HEIGHT - PILL_INSET * 2,
              borderRadius: (HEIGHT - PILL_INSET * 2) / 2,
              transform: [{ translateX }],
            },
          ]}
        />
        <TouchableWithoutFeedback onPress={() => switchTab(0)}>
          <View style={[styles.tab, { width: TAB_WIDTH }]}>
            {active !== 0 && (
              <ConnectIcon width={iconSize} height={iconSize} opacity={0.55} />
            )}
            <Animated.View
              style={[
                styles.activeContent,
                { opacity: leftOpacity },
              ]}
            >
              <ConnectIcon width={iconSize} height={iconSize} />
              <Text style={[styles.activeText, { fontSize }]}>Connect</Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => switchTab(1)}>
          <View style={[styles.tab, { width: TAB_WIDTH }]}>
            {active !== 1 && (
              <ControlIcon width={iconSize} height={iconSize} opacity={0.55} />
            )}
            <Animated.View
              style={[
                styles.activeContent,
                { opacity: rightOpacity },
              ]}
            >
              <ControlIcon width={iconSize} height={iconSize} />
              <Text style={[styles.activeText, { fontSize }]}>Control</Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#d8d1cb",
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  },
  pill: {
    position: "absolute",
    backgroundColor: "#f1ece8",
  },
  tab: {
    justifyContent: "center",
    alignItems: "center",
  },
  activeContent: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 8,
  },
  activeText: {
    fontWeight: "600",
    color: "#555",
  },
});
