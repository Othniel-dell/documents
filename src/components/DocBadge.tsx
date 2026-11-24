import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DocBadgeColors } from '@/constants/theme';
import type { DocType } from '@/types/document';

interface DocBadgeProps {
  type: DocType;
  size?: 'sm' | 'md' | 'lg';
}

export function DocBadge({ type, size = 'md' }: DocBadgeProps) {
  const palette = DocBadgeColors[type];
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 11;

  return (
    <View
      style={[
        styles.container,
        {
          width: dim,
          height: dim,
          borderRadius: size === 'sm' ? 8 : 12,
          backgroundColor: palette.accent,
        },
      ]}>
      <View style={styles.foldCorner} />
      {type === 'scan' ? (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={size === 'sm' ? 16 : 20}
          color="#FFFFFF"
        />
      ) : (
        <Text style={[styles.label, { fontSize }]}>{palette.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  foldCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderBottomLeftRadius: 6,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
