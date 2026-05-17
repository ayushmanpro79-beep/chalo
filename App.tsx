import 'react-native-url-polyfill/auto';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import './lib/locationTracking';
import { ActiveTripScreen } from './screens/ActiveTripScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NewTripScreen } from './screens/NewTripScreen';
import { TripDetailsScreen } from './screens/TripDetailsScreen';
import { TripSummaryScreen } from './screens/TripSummaryScreen';
import { colors } from './theme';
import { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.accent,
    text: colors.text,
    border: colors.border
  }
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewTrip" component={NewTripScreen} options={{ title: 'New trip' }} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} options={{ title: 'Walking' }} />
        <Stack.Screen name="TripSummary" component={TripSummaryScreen} options={{ title: 'Trip summary' }} />
        <Stack.Screen name="TripDetails" component={TripDetailsScreen} options={{ title: 'Trip diary' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
