import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocumentPage, PageTemplate, ScanFilter } from '@/types/document';

export const PAGE_TEMPLATES: {
  key: PageTemplate;
  label: string;
  paperBg: string;
  accent: string;
  borderColor: string;
  titleColor: string;
}[] = [
  {
    key: 'classic',
    label: 'Classic',
    paperBg: '#FFFFFF',
    accent: '#E2E8F0',
    borderColor: '#E2E8F0',
    titleColor: '#0F172A',
  },
  {
    key: 'executive',
    label: 'Executive',
    paperBg: '#FFFFFF',
    accent: '#16325B',
    borderColor: '#CBD5E1',
    titleColor: '#16325B',
  },
  {
    key: 'modern',
    label: 'Modern',
    paperBg: '#F8FAFC',
    accent: '#2563EB',
    borderColor: '#BFDBFE',
    titleColor: '#1E3A8A',
  },
  {
    key: 'legal',
    label: 'Legal',
    paperBg: '#FFFFFF',
    accent: '#334155',
    borderColor: '#94A3B8',
    titleColor: '#0F172A',
  },
  {
    key: 'warm',
    label: 'Warm Paper',
    paperBg: '#FFFDF7',
    accent: '#D97706',
    borderColor: '#FDE68A',
    titleColor: '#78350F',
  },
  {
    key: 'invoice',
    label: 'Invoice',
    paperBg: '#FFFFFF',
    accent: '#0EA5E9',
    borderColor: '#BAE6FD',
    titleColor: '#0369A1',
  },
];

const FILTERS: { key: ScanFilter; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'magic', label: 'Magic Color' },
  { key: 'bw', label: 'B&W' },
  { key: 'grayscale', label: 'Grayscale' },
];

const TEXT_COLORS = ['#0F172A', '#16325B', '#2563EB', '#0F766E', '#7C3AED'];

interface RedesignModalProps {
  visible: boolean;
  page: DocumentPage | undefined;
  onClose: () => void;
  onUpdatePage: (patch: Partial<DocumentPage>) => void;
  onConvertToEditable: () => void;
}

export function RedesignModal({
  visible,
  page,
  onClose,
  onUpdatePage,
  onConvertToEditable,
}: RedesignModalProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];

  const activeTemplate = page?.template ?? 'classic';
  const activeFilter = page?.filter ?? 'magic';
  const activeAlign = page?.textAlign ?? 'left';
  const activeColor = page?.textColor ?? '#334155';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="color-palette" size={20} color={theme.navy} />
              <Text style={[styles.title, { color: theme.text }]}>
                Edit & Redesign Document
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Page Templates */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Page Design Template
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateRow}>
              {PAGE_TEMPLATES.map((tpl) => {
                const selected = activeTemplate === tpl.key;
                return (
                  <Pressable
                    key={tpl.key}
                    onPress={() => onUpdatePage({ template: tpl.key })}
                    style={[
                      styles.templateCard,
                      {
                        backgroundColor: tpl.paperBg,
                        borderColor: selected ? '#2563EB' : tpl.borderColor,
                        borderWidth: selected ? 2.5 : 1,
                      },
                    ]}>
                    <View style={[styles.templateBar, { backgroundColor: tpl.accent }]} />
                    <View style={styles.templateLines}>
                      <View style={[styles.lineShort, { backgroundColor: tpl.titleColor }]} />
                      <View style={styles.lineLong} />
                      <View style={styles.lineLong} />
                    </View>
                    <Text style={styles.templateLabel}>{tpl.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Scan Image Controls */}
            {page?.imageUri && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Scanned Image Controls
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() =>
                      onUpdatePage({ rotation: ((page.rotation ?? 0) + 90) % 360 })
                    }
                    style={[styles.actionBtn, { backgroundColor: theme.backgroundSelected }]}>
                    <Ionicons name="refresh" size={16} color={theme.navy} />
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>Rotate 90°</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onUpdatePage({ hideImage: !page.hideImage })}
                    style={[styles.actionBtn, { backgroundColor: theme.backgroundSelected }]}>
                    <Ionicons
                      name={page.hideImage ? 'eye-outline' : 'eye-off-outline'}
                      size={16}
                      color={theme.navy}
                    />
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>
                      {page.hideImage ? 'Show Photo' : 'Hide Photo'}
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}>
                  {FILTERS.map((f) => {
                    const active = activeFilter === f.key;
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => onUpdatePage({ filter: f.key })}
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor: active ? theme.navy : theme.background,
                            borderColor: active ? theme.navy : theme.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.filterPillText,
                            { color: active ? '#FFFFFF' : theme.text },
                          ]}>
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  onPress={() => {
                    onConvertToEditable();
                    onClose();
                  }}
                  style={[styles.convertBtn, { backgroundColor: '#2563EB' }]}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.convertBtnText}>
                    Convert Scan to Clean Editable Page
                  </Text>
                </Pressable>
              </>
            )}

            {/* Alignment & Text Color */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Text Alignment & Color
            </Text>
            <View style={styles.styleRow}>
              <View style={styles.alignGroup}>
                {(['left', 'center', 'right'] as const).map((align) => {
                  const active = activeAlign === align;
                  return (
                    <Pressable
                      key={align}
                      onPress={() => onUpdatePage({ textAlign: align })}
                      style={[
                        styles.alignBtn,
                        {
                          backgroundColor: active ? theme.navy : theme.background,
                          borderColor: theme.border,
                        },
                      ]}>
                      <Ionicons
                        name={
                          align === 'left'
                            ? 'reorder-two-outline'
                            : align === 'center'
                              ? 'menu-outline'
                              : 'reorder-three-outline'
                        }
                        size={17}
                        color={active ? '#FFFFFF' : theme.text}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.colorGroup}>
                {TEXT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => onUpdatePage({ textColor: c })}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      activeColor === c && styles.colorDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
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
    maxHeight: '80%',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 17, fontWeight: '800' },
  body: { gap: 14, paddingBottom: 10 },
  sectionTitle: { fontSize: 13.5, fontWeight: '700', marginTop: 2 },
  templateRow: { gap: 10 },
  templateCard: {
    width: 84,
    height: 98,
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 6,
    justifyContent: 'space-between',
  },
  templateBar: { height: 10, width: '100%' },
  templateLines: { paddingHorizontal: 8, gap: 5 },
  lineShort: { height: 5, width: '65%', borderRadius: 3 },
  lineLong: { height: 4, width: '90%', borderRadius: 2, backgroundColor: '#CBD5E1' },
  templateLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  filterRow: { gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 12.5, fontWeight: '600' },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  convertBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
  styleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  alignGroup: { flexDirection: 'row', gap: 6 },
  alignBtn: {
    width: 38,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGroup: { flexDirection: 'row', gap: 8 },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  colorDotActive: { borderWidth: 3, borderColor: '#38BDF8' },
});
