import { Text, View } from "react-native";
import WaveBackground from "../components/WaveBackground";
import WifiButton from "../components/WifiButton";
import BottomBar from "../components/BottomBar";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "#EFE5DA" }}>
      <WaveBackground />

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <WifiButton />
      </View>
    </View>
  );
}
