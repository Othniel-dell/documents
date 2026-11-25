import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocActionModal } from '@/components/DocActionModal';
import { DocBadge } from '@/components/DocBadge';
import { Colors } from '@/constants/theme';
import { guessDocTypeFromName, useDocuments } from '@/context/DocumentContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocType, DocumentItem } from '@/types/document';

const FILTERS: { key: 'all' | DocType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pdf', label: 'PDF' },
  { key: 'docx', label: 'Word' },
  { key: 'xlsx', label: 'Excel' },
  { key: 'pptx', label: 'PPT' },
  { key: 'scan', label: 'Scans' },
];

export default function DocumentsScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const { documents, addDocument } = useDocuments();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | DocType>('all');
  const [signedOnly, setSignedOnly] = useState(false);
  const [actionDoc, setActionDoc] = useState<DocumentItem | null>(null);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (signedOnly && !doc.isSigned) return false;
      if (filter !== 'all' && doc.type !== filter) return false;
      if (query.trim() && !doc.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [documents, filter, query, signedOnly]);

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const file = result.assets[0];
      const type = guessDocTypeFromName(file.name);
      const created = addDocument({
        title: file.name,
        type,
        size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '100.0 KB',
        uri: file.uri,
        pages: [
          {
            id: `p-${Date.now()}`,
            imageUri: type === 'scan' ? file.uri : undefined,
            contentTitle: file.name,
            contentBody: `Imported ${type.toUpperCase()} document.`,
          },
        ],
        annotations: [],
      });
      router.push(`/editor/${created.id}` as Href);
    }
  };

  const handleDocOptions = (doc: DocumentItem) => {
    setActionDoc(doc);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <DocActionModal doc={actionDoc} onClose={() => setActionDoc(null)} />
      <LinearGradient
        colors={[theme.aquaTop, theme.aquaMid, theme.background]}
        locations={[0, 0.65, 1]}
        style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>All Documents</Text>
            <Pressable
              onPress={handleImport}
              style={[styles.importBtn, { backgroundColor: theme.navy }]}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.importBtnText}>Import</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your documents..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Dark "Recently Added" Banner (Image 4) */}
        <Pressable
          onPress={() => setSignedOnly((prev) => !prev)}
          style={[styles.recentBanner, { backgroundColor: '#0F2B35' }]}>
          <View style={styles.recentIcon}>
            <Ionicons name={signedOnly ? 'checkmark-done' : 'time'} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.recentText}>
            <Text style={styles.recentTitle}>
              {signedOnly ? 'Showing Signed Documents' : 'Recently Added'}
            </Text>
            <Text style={styles.recentSub}>
              {signedOnly
                ? 'Tap to show all files'
                : `${documents.length} files synced in one place`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </Pressable>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.navy : theme.backgroundElement,
                    borderColor: active ? theme.navy : theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Document Rows */}
        {filtered.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Ionicons name="document-outline" size={44} color="#CBD5E1" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Documents Yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Scan your first document or import a file to get started
            </Text>
            <Pressable
              onPress={() => router.push('/scanner')}
              style={[styles.emptyBtn, { backgroundColor: theme.navy }]}>
              <Text style={styles.emptyBtnText}>Scan Document</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((doc) => (
              <Pressable
                key={doc.id}
                onPress={() => router.push(`/editor/${doc.id}` as Href)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <DocBadge type={doc.type} size="md" />
                <View style={styles.rowMeta}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    {doc.isStarred && <Ionicons name="star" size={14} color="#F59E0B" />}
                  </View>
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                    {doc.date} • {doc.size}
                    {doc.isSigned ? ' • Signed' : ''}
                  </Text>
                </View>
                <Pressable onPress={() => handleDocOptions(doc)} hitSlop={10}>
                  <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 14,
  },
  recentBanner: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: { flex: 1 },
  recentTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  recentSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 1,
  },
  chipsRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  rowMeta: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontSize: 14.5, fontWeight: '700', flex: 1 },
  rowSub: { fontSize: 12 },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 230,
  },
  emptyBtn: {
    marginTop: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
