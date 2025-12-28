import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  TextInput,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRef, useState } from "react";
import WaveBackground from "../components/WaveBackground";
import SetControlButton from "../assets/icons/set-control-button.svg";
import { bluetoothService } from "../bluetooth/BluetoothSingleton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN = 20;
const MAX = 200;

const CARD_WIDTH = Math.min(Math.max(SCREEN_WIDTH * 0.7, 280), 500);
const CARD_HEIGHT_TOP = Math.min(Math.max(SCREEN_HEIGHT * 0.25, 180), 400);
const CARD_HEIGHT_BOTTOM = Math.min(Math.max(SCREEN_HEIGHT * 0.25, 180), 400);

const TRACK_WIDTH = CARD_WIDTH * 0.55;
const TRACK_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.018, 12), 28);
const THUMB_SIZE = Math.min(Math.max(SCREEN_HEIGHT * 0.027, 18), 42);

const BUTTON_WIDTH = CARD_WIDTH * 0.95;
const BUTTON_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.09, 60), 140);

const FONT_LABEL = Math.min(Math.max(SCREEN_WIDTH * 0.035, 16), 28);
const FONT_SLIDER = Math.min(Math.max(SCREEN_WIDTH * 0.045, 14), 22);
const FONT_INPUT = Math.min(Math.max(SCREEN_WIDTH * 0.055, 16), 26);
const FONT_BUTTON = Math.min(Math.max(SCREEN_WIDTH * 0.027, 18), 26);

function clamp(v: number) {
  return Math.min(Math.max(v, MIN), MAX);
}

function PressableButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(12)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(shadowAnim, {
        toValue: 5,
        duration: 90,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(shadowAnim, {
        toValue: 12,
        duration: 90,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={() => { pressOut(); onPress?.(); }}>
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
            transform: [
              {
                translateY: pressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 7],
                }),
              },
              {
                scale: pressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.96],
                }),
              },
            ],
            elevation: shadowAnim,
            shadowOffset: { width: 0, height: shadowAnim },
          },
        ]}
      >
        <SetControlButton width={BUTTON_WIDTH} height={BUTTON_HEIGHT} />
        <View style={styles.buttonTextWrapper}>
          <Text style={[styles.buttonText, { fontSize: FONT_BUTTON }]}>{label}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function Index() {
  const [value, setValue] = useState(20);
  const [text, setText] = useState("20");
  const [isPaused, setIsPaused] = useState(false);
  const lastBpm = useRef(20);

  const handleSetTempo = async (newBpm: number) => {
    lastBpm.current = newBpm;
    await bluetoothService.sendBPM(newBpm);
  };

  const handleStartStop = async () => {
    if (isPaused) {
      await bluetoothService.sendBPM(lastBpm.current); // resume
      setIsPaused(false);
    } else {
      await bluetoothService.pause(); // pause without sending BPM 0
      setIsPaused(true);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const x = Math.min(Math.max(g.dx + valueToX(value), 0), TRACK_WIDTH);
        const v = clamp(xToValue(x));
        setValue(v);
        setText(String(v));
      },
    })
  ).current;

  function valueToX(v: number) {
    return ((v - MIN) / (MAX - MIN)) * TRACK_WIDTH;
  }

  function xToValue(x: number) {
    return Math.round(MIN + (x / TRACK_WIDTH) * (MAX - MIN));
  }

  const filledWidth = valueToX(value);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <WaveBackground />

        <View style={[styles.card, { height: CARD_HEIGHT_TOP, justifyContent: "center" }]}>
          <View style={styles.tempRow}>
            <Text style={[styles.label, { fontSize: FONT_LABEL }]}>Tempo:</Text>
            <TextInput
              value={text}
              keyboardType="number-pad"
              onChangeText={setText}
              onBlur={() => {
                const v = clamp(parseInt(text || "170", 10));
                setValue(v);
                setText(String(v));
              }}
              style={[styles.tempInput, { fontSize: FONT_INPUT }]}
            />
          </View>

          <View style={styles.sliderBlock}>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { fontSize: FONT_SLIDER }]}>20</Text>
              <Text style={[styles.sliderLabel, { fontSize: FONT_SLIDER }]}>200</Text>
            </View>

            <View style={[styles.sliderTrack, { height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2 }]}>
              <View style={[styles.sliderFill, { width: filledWidth, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2 }]} />
              <View
                style={[
                  styles.thumb,
                  {
                    left: filledWidth - THUMB_SIZE / 2,
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    borderRadius: THUMB_SIZE / 4,
                    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
                  },
                ]}
                {...pan.panHandlers}
              />
            </View>
          </View>
        </View>

        <View style={{ height: SCREEN_HEIGHT * 0.08 }} />

        <View style={[styles.card, { height: CARD_HEIGHT_BOTTOM, justifyContent: "center" }]}>
          <PressableButton label="Set tempo" onPress={() => handleSetTempo(value)} />
          <PressableButton label={isPaused ? "Start" : "Stop"} onPress={handleStartStop} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFE5DA",
    alignItems: "center",
    paddingTop: SCREEN_HEIGHT * 0.08,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#CFC7C1",
    borderRadius: 50,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: TRACK_WIDTH,
    marginBottom: SCREEN_HEIGHT * 0.012,
  },

  label: {
    fontFamily: 'Montserrat-ExtraBold',
    color: "#6F675F",
  },

  tempInput: {
    backgroundColor: "#E6E0DB",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 90,
    textAlign: "center",
    fontFamily: 'Montserrat-SemiBold',
    color: "#6F675F",
  },

  sliderBlock: {
    alignItems: "center",
  },

  sliderLabels: {
    width: TRACK_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SCREEN_HEIGHT * 0.01,
  },

  sliderLabel: {
    fontFamily: 'Montserrat-Medium',
    color: "#6F675F",
  },

  sliderTrack: {
    width: TRACK_WIDTH,
    backgroundColor: "#9A928A",
    justifyContent: "center",
  },

  sliderFill: {
    position: "absolute",
    backgroundColor: "#7C746C",
  },

  thumb: {
    position: "absolute",
    backgroundColor: "#6F675F",
  },

  buttonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    overflow: "hidden",
  },

  buttonTextWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontFamily: 'Montserrat-Bold',
    color: "#EFE5DA",
  },
});
