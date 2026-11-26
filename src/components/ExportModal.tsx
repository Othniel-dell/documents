import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocType, DocumentItem } from '@/types/document';
import {
  exportDocumentAsExcel,
  exportDocumentAsPdf,
  exportDocumentAsPpt,
  exportDocumentAsWord,
} from '@/utils/exportDocument';

interface ExportModalProps {
  visible: boolean;
  doc: DocumentItem;
  onClose: () => void;
  onChangeDocType: (type: DocType, newTitle: string) => void;
}

export function ExportModal({
  visible,
  doc,
  onClose,
  onChangeDocType,
}: ExportModalProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const [busy, setBusy] = useState<'pdf' | 'word' | 'excel' | 'ppt' | null>(null);

  const handleExport = async (kind: 'pdf' | 'word' | 'excel' | 'ppt') => {
    setBusy(kind);
    try {
      if (kind === 'pdf') await exportDocumentAsPdf(doc);
      else if (kind === 'word') await exportDocumentAsWord(doc);
      else if (kind === 'excel') await exportDocumentAsExcel(doc);
      else await exportDocumentAsPpt(doc);
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const handleConvertFormat = (target: 'pdf' | 'docx' | 'xlsx' | 'pptx') => {
    const base = doc.title.replace(/\.[^.]+$/, '');
    const ext = `.${target}`;
    onChangeDocType(target, `${base}${ext}`);
    onClose();
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
            <Text style={[styles.title, { color: theme.text }]}>Save & Export Document</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => handleExport('pdf')}
            disabled={busy !== null}
            style={[styles.optionCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={[styles.badge, { backgroundColor: '#E53935' }]}>
              <Text style={styles.badgeText}>PDF</Text>
            </View>
            <View style={styles.optionMeta}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Save as PDF (.pdf)</Text>
              <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                Export formatted PDF with scan & signature
              </Text>
            </View>
            {busy === 'pdf' ? (
              <ActivityIndicator size="small" color={theme.navy} />
            ) : (
              <Ionicons name="download-outline" size={20} color={theme.navy} />
            )}
          </Pressable>

          <Pressable
            onPress={() => handleExport('word')}
            disabled={busy !== null}
            style={[styles.optionCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={[styles.badge, { backgroundColor: '#2563EB' }]}>
              <Text style={styles.badgeText}>W</Text>
            </View>
            <View style={styles.optionMeta}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                Save as Word (.doc)
              </Text>
              <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                Editable Word document for Word & WPS
              </Text>
            </View>
            {busy === 'word' ? (
              <ActivityIndicator size="small" color={theme.navy} />
            ) : (
              <Ionicons name="download-outline" size={20} color={theme.navy} />
            )}
          </Pressable>

          <Pressable
            onPress={() => handleExport('excel')}
            disabled={busy !== null}
            style={[styles.optionCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={[styles.badge, { backgroundColor: '#16A34A' }]}>
              <Text style={styles.badgeText}>X</Text>
            </View>
            <View style={styles.optionMeta}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                Save as Excel (.xls)
              </Text>
              <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                Spreadsheet table for Excel & WPS Sheets
              </Text>
            </View>
            {busy === 'excel' ? (
              <ActivityIndicator size="small" color={theme.navy} />
            ) : (
              <Ionicons name="download-outline" size={20} color={theme.navy} />
            )}
          </Pressable>

          <Pressable
            onPress={() => handleExport('ppt')}
            disabled={busy !== null}
            style={[styles.optionCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={[styles.badge, { backgroundColor: '#EA580C' }]}>
              <Text style={styles.badgeText}>P</Text>
            </View>
            <View style={styles.optionMeta}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                Save as PowerPoint (.ppt)
              </Text>
              <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                Presentation slides for PowerPoint & WPS
              </Text>
            </View>
            {busy === 'ppt' ? (
              <ActivityIndicator size="small" color={theme.navy} />
            ) : (
              <Ionicons name="download-outline" size={20} color={theme.navy} />
            )}
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.convertLabel, { color: theme.textSecondary }]}>
            Convert file type in workspace
          </Text>
          <View style={styles.convertRow}>
            {(['pdf', 'docx', 'xlsx', 'pptx'] as const).map((fmt) => (
              <Pressable
                key={fmt}
                onPress={() => handleConvertFormat(fmt)}
                style={[styles.convertBtn, { backgroundColor: theme.backgroundSelected }]}>
                <Text style={[styles.convertBtnText, { color: theme.text }]}>
                  {fmt.toUpperCase()}
                </Text>
              </Pressable>
            ))}
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '800' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  optionMeta: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionSub: { fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  convertLabel: { fontSize: 12, fontWeight: '600' },
  convertRow: { flexDirection: 'row', gap: 10 },
  convertBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  convertBtnText: { fontSize: 13.5, fontWeight: '700' },
});
