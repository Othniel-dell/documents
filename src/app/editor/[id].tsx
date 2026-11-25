import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  type GestureResponderEvent,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { DocActionModal } from '@/components/DocActionModal';
import { SignatureModal } from '@/components/SignatureModal';
import { Colors } from '@/constants/theme';
import { useDocuments } from '@/context/DocumentContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { AnnotationItem } from '@/types/document';
import { goBackOrHome } from '@/utils/navigation';

let annIdSeq = 100;
const nextAnnId = () => `ann-${++annIdSeq}`;

export default function DocumentEditorScreen() {
  const { id, tool } = useLocalSearchParams<{ id: string; tool?: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];

  const {
    getDocumentById,
    updateDocument,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
  } = useDocuments();

  const doc = getDocumentById(id);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [bold, setBold] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(tool === 'sign');
  const [docActionsOpen, setDocActionsOpen] = useState(false);
  const [liveDrawPath, setLiveDrawPath] = useState('');
  const liveDrawRef = useRef('');
  const bodyInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleDrawStart = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    const p = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
    liveDrawRef.current = p;
    setLiveDrawPath(p);
  };

  const handleDrawMove = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    const next = `${liveDrawRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
    liveDrawRef.current = next;
    setLiveDrawPath(next);
  };

  const handleDrawEnd = () => {
    if (liveDrawRef.current && doc) {
      const ann: AnnotationItem = {
        id: nextAnnId(),
        type: 'draw',
        x: 0,
        y: 0,
        color: '#2563EB',
        paths: [liveDrawRef.current],
      };
      addAnnotation(doc.id, ann);
    }
    liveDrawRef.current = '';
    setLiveDrawPath('');
  };

  if (!doc) {
    return (
      <SafeAreaView style={[styles.missingRoot, { backgroundColor: theme.background }]}>
        <Text style={[styles.missingTitle, { color: theme.text }]}>Document not found</Text>
        <Pressable onPress={goBackOrHome} style={styles.backPill}>
          <Text style={styles.backPillText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const primaryPage = doc.pages[0];

  const handleAddTextNote = () => {
    const newAnn: AnnotationItem = {
      id: `ann-${Date.now()}`,
      type: 'text',
      x: 28,
      y: 120 + (doc.annotations.length * 26) % 180,
      text: 'Approved & Reviewed',
      fontSize: 14,
      bold: true,
      color: '#16325B',
    };
    addAnnotation(doc.id, newAnn);
    setSelectedAnnId(newAnn.id);
  };

  const handleInsertImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const newAnn: AnnotationItem = {
        id: `ann-${Date.now()}`,
        type: 'image',
        x: 40,
        y: 160,
        imageUri: res.assets[0].uri,
        width: 110,
        height: 80,
      };
      addAnnotation(doc.id, newAnn);
      setSelectedAnnId(newAnn.id);
    }
  };

  const handleConfirmSignature = (paths: string[], color: string) => {
    const sigAnn: AnnotationItem = {
      id: `ann-${Date.now()}`,
      type: 'signature',
      x: 130,
      y: 280,
      color,
      paths,
    };
    addAnnotation(doc.id, sigAnn);
    setSignatureModalOpen(false);
    setSelectedAnnId(sigAnn.id);
  };

  const handleUndo = () => {
    if (doc.annotations.length === 0) return;
    const last = doc.annotations[doc.annotations.length - 1];
    removeAnnotation(doc.id, last.id);
    if (selectedAnnId === last.id) setSelectedAnnId(null);
  };

  const handleExportPdf = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 32px; color: #111827;">
            <h1 style="color: #16325B;">${primaryPage?.contentTitle ?? doc.title}</h1>
            <pre style="white-space: pre-wrap; font-family: sans-serif; line-height: 1.6;">${primaryPage?.contentBody ?? ''}</pre>
            ${
              doc.isSigned
                ? '<p style="margin-top: 32px; color: #16A34A; font-weight: bold;">✓ Digitally Signed via CamDocs WPS</p>'
                : ''
            }
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('PDF Exported', `Saved to ${uri}`);
      }
    } catch {
      Alert.alert('Export', 'PDF export is ready on iOS/Android devices.');
    }
  };

  const handleMore = () => {
    setDocActionsOpen(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <DocActionModal
        doc={docActionsOpen ? doc : null}
        onClose={() => setDocActionsOpen(false)}
        onDeleted={goBackOrHome}
        hideOpenAction
      />
      <SignatureModal
        visible={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={handleConfirmSignature}
      />

      {/* Top Gradient Header (Image 4 Right Screen) */}
      <LinearGradient
        colors={[theme.aquaTop, theme.aquaMid, theme.background]}
        locations={[0, 0.7, 1]}
        style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={goBackOrHome}
              style={[styles.circleBtn, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>

            <Pressable
              onPress={() => setDocActionsOpen(true)}
              style={styles.headerTitleCol}>
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                Edit Document
              </Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {doc.title} ✎
              </Text>
            </Pressable>

            <Pressable
              onPress={handleExportPdf}
              style={[styles.circleBtn, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="share-outline" size={20} color={theme.navy} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Document Canvas + Bottom Toolbar wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.canvasScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          style={styles.paperCard}
          onStartShouldSetResponder={() => drawMode}
          onMoveShouldSetResponder={() => drawMode}
          onResponderGrant={handleDrawStart}
          onResponderMove={handleDrawMove}
          onResponderRelease={handleDrawEnd}>
          {primaryPage?.imageUri && (
            <Image
              source={{ uri: primaryPage.imageUri }}
              style={styles.scannedPhoto}
              resizeMode="contain"
            />
          )}

          <View style={styles.editableBlock}>
            <TextInput
              editable={!drawMode}
              value={primaryPage?.contentTitle ?? ''}
              onChangeText={(val) =>
                updateDocument(doc.id, {
                  pages: [{ ...primaryPage, contentTitle: val }],
                })
              }
              style={styles.paperTitleInput}
              placeholder="Document Title"
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              ref={bodyInputRef}
              editable={!drawMode}
              value={primaryPage?.contentBody ?? ''}
              onChangeText={(val) =>
                updateDocument(doc.id, {
                  pages: [{ ...primaryPage, contentBody: val }],
                })
              }
              multiline
              placeholder="Tap here to start typing..."
              placeholderTextColor="#94A3B8"
              style={[
                styles.paperBodyInput,
                {
                  fontSize,
                  fontWeight: bold ? '700' : '400',
                  textDecorationLine: underline ? 'underline' : 'none',
                },
              ]}
            />
          </View>

          {/* Freehand Drawing Overlay */}
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
            {doc.annotations
              .filter((a) => a.type === 'draw')
              .map((a) =>
                a.paths?.map((d, idx) => (
                  <Path
                    key={`${a.id}-${idx}`}
                    d={d}
                    stroke={a.color ?? '#2563EB'}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))
              )}
            {liveDrawPath ? (
              <Path
                d={liveDrawPath}
                stroke="#2563EB"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>

          {/* Interactive Annotations (Text, Signature, Image) */}
          {doc.annotations
            .filter((a) => a.type !== 'draw')
            .map((ann) => {
              const selected = selectedAnnId === ann.id;
              return (
                <Pressable
                  key={ann.id}
                  onPress={() => setSelectedAnnId(selected ? null : ann.id)}
                  style={[
                    styles.annotationBox,
                    { left: ann.x, top: ann.y },
                    selected && styles.annotationSelected,
                  ]}>
                  {ann.type === 'text' && (
                    <Text
                      style={{
                        color: ann.color ?? '#16325B',
                        fontSize: ann.fontSize ?? 14,
                        fontWeight: ann.bold ? '700' : '500',
                      }}>
                      {ann.text}
                    </Text>
                  )}
                  {ann.type === 'signature' && (
                    <Svg width={150} height={54} viewBox="0 0 180 65">
                      {ann.paths?.map((d, idx) => (
                        <Path
                          key={idx}
                          d={d}
                          stroke={ann.color ?? '#16325B'}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ))}
                    </Svg>
                  )}
                  {ann.type === 'image' && ann.imageUri && (
                    <Image
                      source={{ uri: ann.imageUri }}
                      style={{ width: ann.width ?? 100, height: ann.height ?? 75, borderRadius: 6 }}
                    />
                  )}
                </Pressable>
              );
            })}

          {/* Floating Context Menu (Image 4: Edit, Copy, Delete) */}
          {selectedAnnId && (
            <View style={styles.contextMenu}>
              <Pressable
                onPress={() => {
                  const target = doc.annotations.find((a) => a.id === selectedAnnId);
                  if (target?.type === 'text') {
                    updateAnnotation(doc.id, target.id, {
                      text: target.text === 'Approved & Reviewed' ? 'Verified ✓' : 'Approved & Reviewed',
                    });
                  } else {
                    setSignatureModalOpen(true);
                  }
                }}
                style={styles.contextItem}>
                <Ionicons name="create-outline" size={16} color="#1E293B" />
                <Text style={styles.contextLabel}>Edit</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const target = doc.annotations.find((a) => a.id === selectedAnnId);
                  if (target) {
                    addAnnotation(doc.id, {
                      ...target,
                      id: `ann-${Date.now()}`,
                      x: target.x + 16,
                      y: target.y + 20,
                    });
                  }
                }}
                style={styles.contextItem}>
                <Ionicons name="copy-outline" size={16} color="#1E293B" />
                <Text style={styles.contextLabel}>Copy</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  removeAnnotation(doc.id, selectedAnnId);
                  setSelectedAnnId(null);
                }}
                style={styles.contextItem}>
                <Ionicons name="trash-outline" size={16} color="#E53935" />
                <Text style={[styles.contextLabel, { color: '#E53935' }]}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Edit Tools & Formatting Toolbar (Image 4 Right Screen) */}
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.bottomPanel,
          { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
        ]}>
        <View style={styles.editToolsHeader}>
          <Text style={[styles.editToolsTitle, { color: theme.text }]}>Edit Tools</Text>
          <Pressable
            onPress={() => router.push(`/ai-chat?docId=${doc.id}`)}
            style={styles.aiMiniBtn}>
            <Ionicons name="sparkles" size={13} color="#2563EB" />
            <Text style={styles.aiMiniText}>Ask AI</Text>
          </Pressable>
        </View>

        <View style={styles.toolsRow}>
          <Pressable
            onPress={() => setSignatureModalOpen(true)}
            style={[styles.toolBtn, { backgroundColor: theme.backgroundSelected }]}>
            <MaterialCommunityIcons name="draw-pen" size={20} color={theme.navy} />
            <Text style={[styles.toolBtnLabel, { color: theme.text }]}>Sign</Text>
          </Pressable>

          <Pressable
            onPress={() => setDrawMode((v) => !v)}
            style={[
              styles.toolBtn,
              { backgroundColor: drawMode ? theme.navy : theme.backgroundSelected },
            ]}>
            <Ionicons name="pencil" size={18} color={drawMode ? '#FFFFFF' : theme.navy} />
            <Text
              style={[
                styles.toolBtnLabel,
                { color: drawMode ? '#FFFFFF' : theme.text },
              ]}>
              Draw
            </Text>
          </Pressable>

          <Pressable
            onPress={handleAddTextNote}
            style={[styles.toolBtn, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.toolGlyph, { color: theme.navy }]}>T</Text>
            <Text style={[styles.toolBtnLabel, { color: theme.text }]}>Text</Text>
          </Pressable>

          <Pressable
            onPress={handleInsertImage}
            style={[styles.toolBtn, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="image-outline" size={19} color={theme.navy} />
            <Text style={[styles.toolBtnLabel, { color: theme.text }]}>Image</Text>
          </Pressable>

          <Pressable
            onPress={handleUndo}
            style={[styles.toolBtn, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="arrow-undo" size={19} color={theme.navy} />
            <Text style={[styles.toolBtnLabel, { color: theme.text }]}>Undo</Text>
          </Pressable>
        </View>

        {/* Bottom Formatting Strip */}
        <View style={[styles.formatRow, { borderTopColor: theme.border }]}>
          <Pressable
            onPress={() => {
              if (keyboardOpen) {
                Keyboard.dismiss();
              } else {
                setDrawMode(false);
                bodyInputRef.current?.focus();
              }
            }}
            style={styles.formatItem}>
            <Ionicons
              name="keypad-outline"
              size={18}
              color={keyboardOpen ? theme.navy : theme.textSecondary}
            />
            <Text
              style={[
                styles.formatLabel,
                { color: keyboardOpen ? theme.navy : theme.textSecondary },
              ]}>
              {keyboardOpen ? 'Hide Keys' : 'Keyboard'}
            </Text>
          </Pressable>

          <Pressable onPress={() => setBold((v) => !v)} style={styles.formatItem}>
            <Text
              style={[
                styles.formatGlyph,
                { color: bold ? theme.navy : theme.text, fontWeight: '900' },
              ]}>
              B
            </Text>
            <Text style={[styles.formatLabel, { color: bold ? theme.navy : theme.textSecondary }]}>
              Bold
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFontSize((s) => Math.max(10, s - 1))}
            style={styles.formatItem}>
            <Text style={[styles.formatGlyph, { color: theme.text }]}>A-</Text>
            <Text style={[styles.formatLabel, { color: theme.textSecondary }]}>Size -</Text>
          </Pressable>

          <Pressable
            onPress={() => setFontSize((s) => Math.min(22, s + 1))}
            style={styles.formatItem}>
            <Text style={[styles.formatGlyph, { color: theme.text }]}>A+</Text>
            <Text style={[styles.formatLabel, { color: theme.textSecondary }]}>Size +</Text>
          </Pressable>

          <Pressable onPress={() => setUnderline((v) => !v)} style={styles.formatItem}>
            <Text
              style={[
                styles.formatGlyph,
                {
                  color: underline ? theme.navy : theme.text,
                  textDecorationLine: 'underline',
                },
              ]}>
              U
            </Text>
            <Text
              style={[
                styles.formatLabel,
                { color: underline ? theme.navy : theme.textSecondary },
              ]}>
              Underline
            </Text>
          </Pressable>

          <Pressable onPress={handleMore} style={styles.formatItem}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
            <Text style={[styles.formatLabel, { color: theme.textSecondary }]}>More</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  missingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  missingTitle: { fontSize: 18, fontWeight: '700' },
  backPill: {
    backgroundColor: '#16325B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backPillText: { color: '#FFFFFF', fontWeight: '700' },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    gap: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitleCol: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 11.5, marginTop: 1 },
  canvasScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    minHeight: 430,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  scannedPhoto: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 14,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  paperBody: {
    color: '#334155',
    lineHeight: 20,
  },
  editableBlock: { gap: 10 },
  paperTitleInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
  },
  paperBodyInput: {
    color: '#334155',
    lineHeight: 20,
    minHeight: 220,
    textAlignVertical: 'top',
  },
  annotationBox: {
    position: 'absolute',
    padding: 6,
    borderRadius: 8,
  },
  annotationSelected: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  contextMenu: {
    position: 'absolute',
    top: 88,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contextItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  bottomPanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  editToolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editToolsTitle: { fontSize: 14, fontWeight: '700' },
  aiMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  aiMiniText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 3,
  },
  toolGlyph: { fontSize: 17, fontWeight: '800' },
  toolBtnLabel: { fontSize: 10.5, fontWeight: '600' },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 4,
  },
  formatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  formatGlyph: { fontSize: 15, fontWeight: '700' },
  formatLabel: { fontSize: 10, fontWeight: '500' },
});
