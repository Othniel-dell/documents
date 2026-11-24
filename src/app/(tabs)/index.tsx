import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocBadge } from '@/components/DocBadge';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Colors } from '@/constants/theme';
import { guessDocTypeFromName, useDocuments } from '@/context/DocumentContext';
import { useThemePreference } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocType, DocumentItem } from '@/types/document';

type FilterTab = 'all' | 'pdf' | 'docx' | 'xlsx' | 'pptx';

const FILTER_ITEMS: { key: FilterTab; label: string; iconColor: string; badge?: string }[] = [
  { key: 'all', label: 'All', iconColor: '#F59E0B' },
  { key: 'pdf', label: 'PDF', iconColor: '#E53935', badge: 'PDF' },
  { key: 'docx', label: 'Word', iconColor: '#2563EB', badge: 'W' },
  { key: 'xlsx', label: 'Excel', iconColor: '#16A34A', badge: 'X' },
  { key: 'pptx', label: 'PPT', iconColor: '#EA580C', badge: 'P' },
];

export default function HomeScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const { toggleTheme } = useThemePreference();
  const {
    documents,
    hasSeenOnboarding,
    setHasSeenOnboarding,
    addDocument,
    deleteDocument,
    duplicateDocument,
  } = useDocuments();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType =
        activeFilter === 'all' ||
        doc.type === activeFilter ||
        (activeFilter === 'pdf' && doc.type === 'scan');
      const matchesQuery =
        search.trim() === '' || doc.title.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [documents, activeFilter, search]);

  const handleImportGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const created = addDocument({
        title: `Scan_${new Date().toISOString().slice(0, 10)}.pdf`,
        type: 'scan',
        size: asset.fileSize ? `${(asset.fileSize / 1024).toFixed(1)} KB` : '420.0 KB',
        uri: asset.uri,
        pages: [{ id: `p-${Date.now()}`, imageUri: asset.uri, filter: 'magic' }],
        annotations: [],
      });
      router.push(`/editor/${created.id}` as Href);
    }
  };

  const handleImportFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/*',
      ],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const file = result.assets[0];
      const type: DocType = guessDocTypeFromName(file.name);
      const created = addDocument({
        title: file.name,
        type,
        size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '128.0 KB',
        uri: file.uri,
        pages: [
          {
            id: `p-${Date.now()}`,
            imageUri: type === 'scan' ? file.uri : undefined,
            contentTitle: file.name,
            contentBody: `Imported ${type.toUpperCase()} document.\n\nTap any edit tool below to add text, highlight, draw, or place your signature.`,
          },
        ],
        annotations: [],
      });
      router.push(`/editor/${created.id}` as Href);
    }
  };

  const handleCreateBlankDoc = () => {
    const created = addDocument({
      title: `Untitled_Doc_${documents.length + 1}.docx`,
      type: 'docx',
      size: '12.4 KB',
      pages: [
        {
          id: `p-${Date.now()}`,
          contentTitle: 'New Document',
          contentBody: 'Start typing or use the Edit Tools below to annotate and sign.',
        },
      ],
      annotations: [],
    });
    router.push(`/editor/${created.id}` as Href);
  };

  const handleDocMenu = (doc: DocumentItem) => {
    Alert.alert(doc.title, 'Choose an action', [
      { text: 'Edit & Sign', onPress: () => router.push(`/editor/${doc.id}` as Href) },
      { text: 'Ask AI Summary', onPress: () => router.push(`/ai-chat?docId=${doc.id}`) },
      { text: 'Duplicate', onPress: () => duplicateDocument(doc.id) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDocument(doc.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const quickTools = [
    {
      label: 'Gallery',
      icon: 'images-outline' as const,
      onPress: handleImportGallery,
    },
    {
      label: 'Files',
      icon: 'document-outline' as const,
      onPress: handleImportFile,
    },
    {
      label: 'ID Card',
      icon: 'card-outline' as const,
      onPress: () => router.push('/scanner?mode=ID Card'),
    },
    {
      label: 'Documents',
      icon: 'folder-outline' as const,
      onPress: () => router.push('/(tabs)/documents'),
    },
    {
      label: 'Sign PDF',
      icon: 'create-outline' as const,
      onPress: () => {
        const firstPdf = documents.find((d) => d.type === 'pdf' || d.type === 'scan') ?? documents[0];
        if (firstPdf) {
          router.push(`/editor/${firstPdf.id}?tool=sign` as Href);
        }
      },
    },
    {
      label: 'PDF to JPG',
      icon: 'image-outline' as const,
      onPress: () => {
        const firstPdf = documents.find((d) => d.type === 'pdf') ?? documents[0];
        if (firstPdf) {
          Alert.alert('PDF to Image', `Ready to export "${firstPdf.title}" pages as JPG.`, [
            { text: 'Open Editor', onPress: () => router.push(`/editor/${firstPdf.id}` as Href) },
            { text: 'OK' },
          ]);
        }
      },
    },
    {
      label: 'AI Summary',
      icon: 'sparkles-outline' as const,
      onPress: () => router.push('/ai-chat'),
    },
    {
      label: 'New Doc',
      icon: 'add-circle-outline' as const,
      onPress: handleCreateBlankDoc,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <OnboardingModal
        visible={!hasSeenOnboarding}
        onDismiss={() => setHasSeenOnboarding(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[theme.aquaTop, theme.aquaMid, theme.background]}
          locations={[0, 0.65, 1]}
          style={styles.headerGradient}>
          <SafeAreaView edges={['top']}>
            {/* Top Brand Row */}
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={[styles.brandIcon, { backgroundColor: theme.navy }]}>
                  <MaterialCommunityIcons name="file-document-edit" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.greetingTitle, { color: theme.text }]}>
                  CamDocs <Text style={styles.greetingSub}>WPS</Text>
                </Text>
              </View>

              <View style={styles.topActions}>
                <Pressable
                  onPress={toggleTheme}
                  accessibilityLabel="Toggle dark or light theme"
                  style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons
                    name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                    size={18}
                    color={scheme === 'dark' ? '#FBBF24' : theme.navy}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/ai-chat')}
                  style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="sparkles" size={18} color={theme.aiBlue} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/settings')}
                  style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="settings-outline" size={19} color={theme.text} />
                </Pressable>
              </View>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search your documents..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Hero Scan Banner (CamDocs Image 2) */}
          <Pressable
            onPress={() => router.push('/scanner')}
            style={({ pressed }) => [
              styles.heroBanner,
              { backgroundColor: theme.navy, opacity: pressed ? 0.94 : 1 },
            ]}>
            <View style={styles.heroIconBox}>
              <Ionicons name="camera" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Scan Document</Text>
              <Text style={styles.heroSub}>Take a photo or import from gallery</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#CBD5E1" />
          </Pressable>

          {/* Quick Tools 4-Column Grid */}
          <View style={styles.toolsGrid}>
            {quickTools.map((tool) => (
              <Pressable
                key={tool.label}
                onPress={tool.onPress}
                style={({ pressed }) => [
                  styles.toolCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}>
                <View style={[styles.toolIconBg, { backgroundColor: theme.backgroundSelected }]}>
                  <Ionicons name={tool.icon} size={20} color={theme.navy} />
                </View>
                <Text style={[styles.toolLabel, { color: theme.text }]} numberOfLines={1}>
                  {tool.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* WPS File-Type Filter Strip (Image 4) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterStrip}>
            {FILTER_ITEMS.map((item) => {
              const selected = activeFilter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setActiveFilter(item.key)}
                  style={styles.filterItem}>
                  <View
                    style={[
                      styles.filterIconBox,
                      {
                        backgroundColor: selected ? theme.navy : theme.backgroundElement,
                        borderColor: selected ? theme.navy : theme.border,
                      },
                    ]}>
                    {item.badge ? (
                      <View
                        style={[
                          styles.miniTypeBadge,
                          { backgroundColor: item.iconColor },
                        ]}>
                        <Text style={styles.miniTypeText}>{item.badge}</Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="folder"
                        size={22}
                        color={selected ? '#FFFFFF' : item.iconColor}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.filterLabel,
                      {
                        color: selected ? theme.navy : theme.textSecondary,
                        fontWeight: selected ? '700' : '500',
                      },
                    ]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Recent Documents Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Documents</Text>
            <Pressable onPress={() => router.push('/(tabs)/documents')}>
              <Text style={[styles.viewAll, { color: theme.navy }]}>View All</Text>
            </Pressable>
          </View>

          {/* Documents List */}
          {filteredDocs.length === 0 ? (
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
            <View style={styles.docList}>
              {filteredDocs.map((doc) => (
                <Pressable
                  key={doc.id}
                  onPress={() => router.push(`/editor/${doc.id}` as Href)}
                  style={({ pressed }) => [
                    styles.docCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}>
                  <DocBadge type={doc.type} size="md" />
                  <View style={styles.docMeta}>
                    <Text style={[styles.docTitle, { color: theme.text }]} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <View style={styles.docSubRow}>
                      <Text style={[styles.docSub, { color: theme.textSecondary }]}>
                        {doc.date} • {doc.size}
                      </Text>
                      {doc.isSigned && (
                        <View style={styles.signedTag}>
                          <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                          <Text style={styles.signedTagText}>Signed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDocMenu(doc)}
                    hitSlop={10}
                    style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  headerGradient: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  greetingCaption: {
    fontSize: 12,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBar: {
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
  body: {
    paddingHorizontal: 18,
    gap: 16,
  },
  heroBanner: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#16325B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  heroSub: {
    color: '#CBD5E1',
    fontSize: 12.5,
    marginTop: 2,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  toolCard: {
    width: '23.2%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 7,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  toolIconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterStrip: {
    gap: 14,
    paddingVertical: 2,
  },
  filterItem: {
    alignItems: 'center',
    gap: 6,
  },
  filterIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniTypeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  filterLabel: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
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
  docList: {
    gap: 10,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  docMeta: {
    flex: 1,
    gap: 3,
  },
  docTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  docSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docSub: {
    fontSize: 12,
  },
  signedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  signedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  moreBtn: {
    padding: 4,
  },
});
