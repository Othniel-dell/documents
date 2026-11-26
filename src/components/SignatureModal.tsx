import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useDocuments } from '@/context/DocumentContext';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (paths: string[], color: string) => void;
}

const INK_COLORS = ['#16325B', '#0F172A', '#2563EB'];

export function SignatureModal({ visible, onClose, onConfirm }: SignatureModalProps) {
  const { savedSignatures, addSavedSignature } = useDocuments();
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [inkColor, setInkColor] = useState<string>(INK_COLORS[0]);
  const currentPathRef = useRef('');
  const isDrawingRef = useRef(false);
  const padRef = useRef<React.ComponentRef<typeof View>>(null);
  const padOriginRef = useRef({ x: 0, y: 0 });

  const getLocalCoords = (evt: GestureResponderEvent) => {
    const ne = evt.nativeEvent as GestureResponderEvent['nativeEvent'] & {
      offsetX?: number;
      offsetY?: number;
      clientX?: number;
      clientY?: number;
    };
    if (typeof ne.locationX === 'number' && typeof ne.locationY === 'number') {
      return { x: ne.locationX, y: ne.locationY };
    }
    if (typeof ne.offsetX === 'number' && typeof ne.offsetY === 'number') {
      return { x: ne.offsetX, y: ne.offsetY };
    }
    const px = ne.pageX ?? ne.clientX ?? 0;
    const py = ne.pageY ?? ne.clientY ?? 0;
    return {
      x: Math.max(0, px - padOriginRef.current.x),
      y: Math.max(0, py - padOriginRef.current.y),
    };
  };

  const handleDrawStart = (evt: GestureResponderEvent) => {
    isDrawingRef.current = true;
    padRef.current?.measureInWindow((x, y) => {
      padOriginRef.current = { x, y };
    });
    const { x, y } = getLocalCoords(evt);
    const start = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    currentPathRef.current = start;
    setCurrentPath(start);
  };

  const handleDrawMove = (evt: GestureResponderEvent) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getLocalCoords(evt);
    const next = `${currentPathRef.current} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    currentPathRef.current = next;
    setCurrentPath(next);
  };

  const handleDrawEnd = () => {
    isDrawingRef.current = false;
    if (currentPathRef.current) {
      const finished = currentPathRef.current;
      setPaths((prev) => [...prev, finished]);
      currentPathRef.current = '';
      setCurrentPath('');
    }
  };

  const handleClear = () => {
    currentPathRef.current = '';
    setCurrentPath('');
    setPaths([]);
  };

  const handleApply = () => {
    if (paths.length === 0) return;
    addSavedSignature({
      name: `Signature ${savedSignatures.length + 1}`,
      paths,
      color: inkColor,
    });
    onConfirm(paths, inkColor);
    handleClear();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Create Signature</Text>
          <Pressable
            onPress={handleApply}
            disabled={paths.length === 0}
            style={[styles.applyBtn, paths.length === 0 && { opacity: 0.4 }]}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>

        {/* Saved Signatures Strip */}
        {savedSignatures.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionLabel}>Tap a saved signature to reuse</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRow}>
              {savedSignatures.map((sig) => (
                <Pressable
                  key={sig.id}
                  onPress={() => onConfirm(sig.paths, sig.color)}
                  style={styles.savedCard}>
                  <Svg width={120} height={46} viewBox="0 0 170 60">
                    {sig.paths.map((p, idx) => (
                      <Path
                        key={idx}
                        d={p}
                        stroke={sig.color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ))}
                  </Svg>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Drawing Pad */}
        <View style={styles.padWrapper}>
          <View
            ref={padRef}
            style={styles.pad}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleDrawStart}
            onResponderMove={handleDrawMove}
            onResponderRelease={handleDrawEnd}>
            <Svg style={StyleSheet.absoluteFill}>
              {paths.map((d, idx) => (
                <Path
                  key={idx}
                  d={d}
                  stroke={inkColor}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
              {currentPath ? (
                <Path
                  d={currentPath}
                  stroke={inkColor}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null}
            </Svg>
            {paths.length === 0 && !currentPath && (
              <Text pointerEvents="none" style={styles.placeholder}>
                Sign here with your finger
              </Text>
            )}
            <View pointerEvents="none" style={styles.baseline} />
          </View>
        </View>

        {/* Ink Colors & Clear */}
        <View style={styles.footer}>
          <View style={styles.colorRow}>
            {INK_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setInkColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  inkColor === c && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>

          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color="#475569" />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  applyBtn: {
    backgroundColor: '#16325B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  applyText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  savedSection: { paddingHorizontal: 18, gap: 8, marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  savedRow: { gap: 10 },
  savedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
  },
  padWrapper: {
    flex: 1,
    padding: 18,
  },
  pad: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  baseline: {
    position: 'absolute',
    bottom: 48,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#38BDF8',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  clearText: { fontSize: 13, fontWeight: '700', color: '#334155' },
});
