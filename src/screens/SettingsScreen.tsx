import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';

export default function SettingsScreen() {
  const { theme, colors, toggleTheme, isDark } = useTheme();
  const { balance, history, resetTokens } = useTokens();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: 16 },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.cardShadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    label: { fontSize: 16, color: colors.text },
    sublabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    themeText: { fontSize: 14, fontWeight: '600', color: colors.accent },
    tokenBalance: { fontSize: 36, fontWeight: '800', color: colors.accent, textAlign: 'center' },
    tokenLabel: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
    historyTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 8 },
    historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyAmount: { fontSize: 14, fontWeight: '600' },
    historyReason: { fontSize: 14, color: colors.text, flex: 1, marginHorizontal: 12 },
    historyTime: { fontSize: 12, color: colors.textMuted },
    emptyHistory: { textAlign: 'center', color: colors.textMuted, marginTop: 8, fontSize: 14 },
    dangerBtn: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    dangerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Appearance</Text>
        <TouchableOpacity style={styles.row} onPress={toggleTheme}>
          <View>
            <Text style={styles.label}>Dark Mode</Text>
            <Text style={styles.sublabel}>
              {isDark ? 'Dark theme active' : 'Light theme active'}
            </Text>
          </View>
          <Text style={styles.themeText}>
            {isDark ? '🌙 ON' : '☀️ OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🪙 Tokens</Text>
        <Text style={styles.tokenBalance}>{balance.toLocaleString()}</Text>
        <Text style={styles.tokenLabel}>Life OS Tokens</Text>

        {history.length > 0 && (
          <>
            <Text style={styles.historyTitle}>Recent Activity</Text>
            {history.slice(0, 20).map((entry, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={[styles.historyAmount, { color: entry.amount > 0 ? colors.success : colors.danger }]}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </Text>
                <Text style={styles.historyReason} numberOfLines={1}>
                  {entry.reason}
                </Text>
                <Text style={styles.historyTime}>
                  {new Date(entry.timestamp).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}
        {history.length === 0 && (
          <Text style={styles.emptyHistory}>
            Start using the app to earn tokens!
          </Text>
        )}

        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => {
            Alert.alert('Reset Tokens?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetTokens },
            ]);
          }}
        >
          <Text style={styles.dangerBtnText}>Reset Tokens</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <Text style={{ ...styles.sublabel, lineHeight: 22 }}>
          Life OS v1.0.0{'\n'}
          Your all-in-one daily assistant.{'\n'}
          Built with Expo & React Native.
        </Text>
      </View>
    </ScrollView>
  );
}
