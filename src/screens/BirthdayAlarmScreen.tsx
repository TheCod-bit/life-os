import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BirthdayAlarmScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎂 Birthday Alarm</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
});
