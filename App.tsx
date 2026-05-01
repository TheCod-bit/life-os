import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import WhatToWearScreen from './src/screens/WhatToWearScreen';
import WhatsForDinnerScreen from './src/screens/WhatsForDinnerScreen';
import DontForgetScreen from './src/screens/DontForgetScreen';
import BirthdayAlarmScreen from './src/screens/BirthdayAlarmScreen';
import ExpiryCheckScreen from './src/screens/ExpiryCheckScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WhatToWear"
          component={WhatToWearScreen}
          options={{ title: '👗 What to Wear' }}
        />
        <Stack.Screen
          name="WhatsForDinner"
          component={WhatsForDinnerScreen}
          options={{ title: '🍽️ Dinner' }}
        />
        <Stack.Screen
          name="DontForget"
          component={DontForgetScreen}
          options={{ title: "📝 Don't Forget" }}
        />
        <Stack.Screen
          name="BirthdayAlarm"
          component={BirthdayAlarmScreen}
          options={{ title: '🎂 Birthday Alarm' }}
        />
        <Stack.Screen
          name="ExpiryCheck"
          component={ExpiryCheckScreen}
          options={{ title: '📅 Expiry Check' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
