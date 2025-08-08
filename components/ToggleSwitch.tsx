import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type ToggleSwitchProps = {
  value: boolean;
  onToggle: () => void;
};

export default function ToggleSwitch({ value, onToggle }: ToggleSwitchProps) {
  return (
    <TouchableOpacity
      style={[styles.container, value && styles.containerActive]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.thumb, value && styles.thumbActive]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  containerActive: {
    backgroundColor: '#4CAF50',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    transform: [{ translateX: 0 }],
  },
  thumbActive: {
    transform: [{ translateX: 20 }],
  },
});
