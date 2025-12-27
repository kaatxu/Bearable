import { Text, View } from "react-native";
import WaveBackground from "../components/WaveBackground";
import BottomBar from "../components/BottomBar";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "#EFE5DA" }}>
      <WaveBackground />
    </View>
  );
}
