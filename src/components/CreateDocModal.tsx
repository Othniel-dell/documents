import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, router } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DocBadge } from '@/components/DocBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocType } from '@/types/document';

interface CreateDocModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (type: Exclude<DocType, 'scan'>, title: string) => void;
}

const CREATE_OPTIONS: {
  type: Exclude<DocType, 'scan'>;
  label: string;
  ext: string;
  desc: string;
}[] = [
  { type: 'docx', label: 'Word Document', ext: '.docx', desc: 'Notes, letters, reports' },
  { type: 'xlsx', label: 'Excel Spreadsheet', ext: '.xlsx', desc: 'Tables, budgets, data' },
  { type: 'pptx', label: 'PowerPoint Deck', ext: '.pptx', desc: 'Slides & presentations' },
  { type: 'pdf', label: 'PDF Document', ext: '.pdf', desc: 'Formatted & signable PDF' },
];

export function CreateDocModal({ visible, onClose, onCreate }: CreateDocModalProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const [customTitle, setCustomTitle] = useState('');

  const handlePick = (opt: (typeof CREATE_OPTIONS)[number]) => {
    const base = customTitle.trim() || `Untitled_${opt.type.toUpperCase()}`;
    const finalTitle = base.toLowerCase().endsWith(opt.ext) ? base : `${base}${opt.ext}`;
    setCustomTitle('');
    onCreate(opt.type, finalTitle);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Create New Document</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="Optional file name (e.g. Budget_2026)"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          />

          <View style={styles.list}>
            {CREATE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.type}
                onPress={() => handlePick(opt)}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}>
                <DocBadge type={opt.type} size="md" />
                <View style={styles.optionMeta}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.label}</Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                    {opt.desc} ({opt.ext})
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color={theme.navy} />
              </Pressable>
            ))}

            <Pressable
              onPress={() => {
                onClose();
                router.push('/cv-maker' as Href);
              }}
              style={[
                styles.optionCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              <DocBadge type="pdf" size="md" />
              <View style={styles.optionMeta}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>CV / Resume Maker</Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                  Guided CV builder with templates
                </Text>
              </View>
              <Ionicons name="briefcase-outline" size={20} color={theme.navy} />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
  },
  list: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  optionMeta: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionSub: { fontSize: 12 },
});
