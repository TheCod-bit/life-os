import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TokenProvider } from './src/context/TokenContext';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WhatToWearScreen from './src/screens/WhatToWearScreen';
import WhatsForDinnerScreen from './src/screens/WhatsForDinnerScreen';
import DontForgetScreen from './src/screens/DontForgetScreen';
import BirthdayAlarmScreen from './src/screens/BirthdayAlarmScreen';
import ExpiryCheckScreen from './src/screens/ExpiryCheckScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WhatToWear" component={WhatToWearScreen} options={{ title: '👗 What to Wear' }} />
      <Stack.Screen name="WhatsForDinner" component={WhatsForDinnerScreen} options={{ title: '🍽️ Dinner' }} />
      <Stack.Screen name="DontForget" component={DontForgetScreen} options={{ title: "📝 Don't Forget" }} />
      <Stack.Screen name="BirthdayAlarm" component={BirthdayAlarmScreen} options={{ title: '🎂 Birthday Alarm' }} />
      <Stack.Screen name="ExpiryCheck" component={ExpiryCheckScreen} options={{ title: '📅 Expiry Check' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.icon, { opacity: focused ? 1 : 0.5 }]}>{label}</Text>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TokenProvider>
        <AppNavigator />
      </TokenProvider>
    </ThemeProvider>
  );
}

function AppNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.accent,
          background: colors.bg,
          card: colors.tabBar,
          text: colors.text,
          border: colors.tabBarBorder,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '800' as const },
        },
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon label="🏠" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon label="⚙️" focused={focused} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
});
