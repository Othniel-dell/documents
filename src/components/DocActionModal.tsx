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
import { useDocuments } from '@/context/DocumentContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocumentItem } from '@/types/document';

interface DocActionModalProps {
  doc: DocumentItem | null;
  onClose: () => void;
  onDeleted?: () => void;
  hideOpenAction?: boolean;
}

export function DocActionModal({
  doc,
  onClose,
  onDeleted,
  hideOpenAction = false,
}: DocActionModalProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const { updateDocument, duplicateDocument, deleteDocument } = useDocuments();

  const [mode, setMode] = useState<'menu' | 'rename' | 'confirmDelete'>('menu');
  const [draftTitle, setDraftTitle] = useState('');

  if (!doc) return null;

  const resetAndClose = () => {
    setMode('menu');
    setDraftTitle('');
    onClose();
  };

  const startRename = () => {
    setDraftTitle(doc.title);
    setMode('rename');
  };

  const confirmRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed) {
      updateDocument(doc.id, { title: trimmed });
    }
    resetAndClose();
  };

  const confirmDelete = () => {
    deleteDocument(doc.id);
    resetAndClose();
    onDeleted?.();
  };

  return (
    <Modal
      visible={Boolean(doc)}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}>
      <Pressable style={styles.backdrop} onPress={resetAndClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Document Header */}
          <View style={styles.docHeader}>
            <DocBadge type={doc.type} size="md" />
            <View style={styles.docMeta}>
              <Text style={[styles.docTitle, { color: theme.text }]} numberOfLines={1}>
                {doc.title}
              </Text>
              <Text style={[styles.docSub, { color: theme.textSecondary }]}>
                {doc.date} • {doc.size}
              </Text>
            </View>
            <Pressable onPress={resetAndClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {mode === 'rename' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                Rename Document
              </Text>
              <TextInput
                value={draftTitle}
                onChangeText={setDraftTitle}
                autoFocus
                selectTextOnFocus
                placeholder="Enter new document name"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onSubmitEditing={confirmRename}
              />
              <View style={styles.rowBtns}>
                <Pressable
                  onPress={() => setMode('menu')}
                  style={[styles.secondaryBtn, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmRename}
                  style={[styles.primaryBtn, { backgroundColor: theme.navy }]}>
                  <Text style={styles.primaryBtnText}>Save Name</Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'confirmDelete' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                Delete &ldquo;{doc.title}&rdquo;?
              </Text>
              <Text style={[styles.warnText, { color: theme.textSecondary }]}>
                This document and its annotations will be permanently removed.
              </Text>
              <View style={styles.rowBtns}>
                <Pressable
                  onPress={() => setMode('menu')}
                  style={[styles.secondaryBtn, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmDelete} style={styles.deleteConfirmBtn}>
                  <Text style={styles.primaryBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'menu' && (
            <View style={styles.menuList}>
              {!hideOpenAction && (
                <Pressable
                  onPress={() => {
                    const id = doc.id;
                    resetAndClose();
                    router.push(`/editor/${id}` as Href);
                  }}
                  style={styles.menuItem}>
                  <Ionicons name="create-outline" size={20} color={theme.navy} />
                  <Text style={[styles.menuText, { color: theme.text }]}>Open & Edit</Text>
                </Pressable>
              )}

              <Pressable onPress={startRename} style={styles.menuItem}>
                <Ionicons name="pencil-outline" size={20} color={theme.navy} />
                <Text style={[styles.menuText, { color: theme.text }]}>Rename Title</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const id = doc.id;
                  resetAndClose();
                  router.push(`/ai-chat?docId=${id}`);
                }}
                style={styles.menuItem}>
                <Ionicons name="sparkles-outline" size={20} color={theme.aiBlue} />
                <Text style={[styles.menuText, { color: theme.text }]}>Ask AI Summary</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  updateDocument(doc.id, { isStarred: !doc.isStarred });
                  resetAndClose();
                }}
                style={styles.menuItem}>
                <Ionicons
                  name={doc.isStarred ? 'star' : 'star-outline'}
                  size={20}
                  color="#F59E0B"
                />
                <Text style={[styles.menuText, { color: theme.text }]}>
                  {doc.isStarred ? 'Remove Star' : 'Star Document'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  duplicateDocument(doc.id);
                  resetAndClose();
                }}
                style={styles.menuItem}>
                <Ionicons name="copy-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.menuText, { color: theme.text }]}>Duplicate</Text>
              </Pressable>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <Pressable
                onPress={() => setMode('confirmDelete')}
                style={styles.menuItem}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
                <Text style={[styles.menuText, { color: '#E53935' }]}>Delete Document</Text>
              </Pressable>
            </View>
          )}
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
    gap: 16,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docMeta: { flex: 1, gap: 2 },
  docTitle: { fontSize: 15.5, fontWeight: '800' },
  docSub: { fontSize: 12 },
  menuList: { gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  menuText: { fontSize: 15, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 15, fontWeight: '700' },
  warnText: { fontSize: 13.5, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    fontWeight: '600',
  },
  rowBtns: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E53935',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
