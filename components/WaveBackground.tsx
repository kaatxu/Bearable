import { useRef } from "react";
import { Animated, PanResponder, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function WaveBackground() {
  const { width, height } = useWindowDimensions();

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          tension: 60,
          friction: 10,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const translateY = Animated.add(
    pan.y.interpolate({
      inputRange: [-200, 200],
      outputRange: [-15, 15],
      extrapolate: "clamp",
    }),
    height * 0.30
  );

  return (
    <AnimatedSvg
      {...panResponder.panHandlers}
      width={width}
      height={height}
      viewBox="0 0 375 812"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        transform: [
          {
            translateY,
          },
        ],
      }}
    >
      <Path
        d="
          M0 240
          C 120 120 255 420 375 240
          L375 812
          L0 812
          Z
        "
        fill="#E3D5C6"
      />
      <Path
        d="
          M0 310
          C 110 340 240 460 500 50
          L375 812
          L0 812
          Z
        "
        fill="#D2C1AF"
      />
      <Path
        d="
          M0 400
          C 110 340 240 460 375 390
          L375 812
          L0 812
          Z
        "
        fill="#B8A693"
      />
    </AnimatedSvg>
  );
}
