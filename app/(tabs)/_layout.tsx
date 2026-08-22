import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

function TabIcon({ icon, label, focused }: { icon: keyof typeof Feather.glyphMap; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Feather name={icon} size={22} color={focused ? '#0d9488' : '#94a3b8'} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isAdmin } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="file-text" label="History" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar" label="Leave" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="user" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1.5,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60,
  },
  tabItemFocused: {
    backgroundColor: '#ccfbf1',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 4,
  },
  tabLabelFocused: { color: '#0d9488' },
});
