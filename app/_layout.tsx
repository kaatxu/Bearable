import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Index from './index';

const Stack = createNativeStackNavigator();

export default function Layout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ddd9d7' }, // global background
        animation: 'slide_from_right', // slide animation
      }}
    >
      <Stack.Screen name="Home" component={Index} />
    </Stack.Navigator>
  );
}
