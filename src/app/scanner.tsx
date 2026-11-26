import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { useDocuments } from '@/context/DocumentContext';
import type { ScanFilter, ScanMode } from '@/types/document';
import { goBackOrHome } from '@/utils/navigation';

const SCAN_MODES: ScanMode[] = ['Whiteboard', 'Form', 'Document', 'Business Card', 'ID Card'];
const FILTERS: { key: ScanFilter; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'magic', label: 'Magic Color' },
  { key: 'bw', label: 'B&W' },
  { key: 'grayscale', label: 'Grayscale' },
];

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: ScanMode =
    params.mode && SCAN_MODES.includes(params.mode as ScanMode)
      ? (params.mode as ScanMode)
      : 'Document';

  const { addDocument } = useDocuments();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<ScanMode>(initialMode);
  const [flash, setFlash] = useState<FlashMode>('auto');
  const [autoCapture, setAutoCapture] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ScanFilter>('magic');
  const [saveFormat, setSaveFormat] = useState<'pdf' | 'docx'>('pdf');
  const [viewfinderSize, setViewfinderSize] = useState({ width: 300, height: 420 });

  const cropToScanBox = async (uri: string, imgW: number, imgH: number): Promise<string> => {
    try {
      const viewRatio = viewfinderSize.width / Math.max(viewfinderSize.height, 1);
      const imgRatio = imgW / Math.max(imgH, 1);

      let visibleW = imgW;
      let visibleH = imgH;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > viewRatio) {
        visibleW = imgH * viewRatio;
        offsetX = (imgW - visibleW) / 2;
      } else {
        visibleH = imgW / viewRatio;
        offsetY = (imgH - visibleH) / 2;
      }

      // Match the 4-corner blue scan box (12%..88% X, 11%..89% Y)
      const originX = Math.max(0, Math.round(offsetX + visibleW * 0.12));
      const originY = Math.max(0, Math.round(offsetY + visibleH * 0.11));
      const width = Math.max(1, Math.min(imgW - originX, Math.round(visibleW * 0.76)));
      const height = Math.max(1, Math.min(imgH - originY, Math.round(visibleH * 0.78)));

      const result = await manipulateAsync(
        uri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch {
      return uri;
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
        if (photo?.uri) {
          const croppedUri =
            photo.width && photo.height
              ? await cropToScanBox(photo.uri, photo.width, photo.height)
              : photo.uri;
          setCapturedUri(croppedUri);
        }
      }
    } catch {
      // Fallback for simulators/web without camera hardware
      setCapturedUri('simulated-scan');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!res.canceled && res.assets[0]) {
      setCapturedUri(res.assets[0].uri);
    }
  };

  const handleSaveScan = (formatOverride?: 'pdf' | 'docx') => {
    const fmt = formatOverride ?? saveFormat;
    const ext = fmt === 'docx' ? '.docx' : '.pdf';
    const title = `${mode.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}${ext}`;
    const isSimulated = capturedUri === 'simulated-scan';
    const created = addDocument({
      title,
      type: fmt,
      size: '384.0 KB',
      uri: isSimulated ? undefined : capturedUri ?? undefined,
      pages: [
        {
          id: `p-${Date.now()}`,
          imageUri: isSimulated ? undefined : capturedUri ?? undefined,
          contentTitle: `${mode} Scan`,
          contentBody: `Scanned in ${mode} mode with ${selectedFilter.toUpperCase()} enhancement.\n\nTap "Sign" or "Text" below to annotate or add your signature.`,
          filter: selectedFilter,
        },
      ],
      annotations: [],
    });
    router.replace(`/editor/${created.id}` as Href);
  };

  const cycleFlash = () => {
    setFlash((prev) => (prev === 'auto' ? 'on' : prev === 'on' ? 'off' : 'auto'));
  };

  // Review & Filter screen after capture
  if (capturedUri) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setCapturedUri(null)} style={styles.topIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.topTitle}>Crop & Enhance ({mode})</Text>
          <Pressable onPress={() => handleSaveScan()} style={styles.savePill}>
            <Text style={styles.savePillText}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.previewStage}>
          {capturedUri === 'simulated-scan' ? (
            <View style={styles.simulatedPaper}>
              <Text style={styles.simTitle}>Scanned {mode}</Text>
              <Text style={styles.simLine}>Filter: {selectedFilter.toUpperCase()}</Text>
              <View style={styles.simDivider} />
              <Text style={styles.simBody}>
                Document edges detected and perspective-corrected automatically.
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: capturedUri }}
              style={[
                styles.capturedImage,
                selectedFilter === 'grayscale' && { opacity: 0.88 },
                selectedFilter === 'bw' && { opacity: 0.82 },
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map((f) => {
              const active = selectedFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setSelectedFilter(f.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.formatToggleRow}>
            <Pressable
              onPress={() => setSaveFormat('pdf')}
              style={[styles.formatPill, saveFormat === 'pdf' && styles.formatPillPdf]}>
              <Text style={styles.formatPillText}>Save as PDF</Text>
            </Pressable>
            <Pressable
              onPress={() => setSaveFormat('docx')}
              style={[styles.formatPill, saveFormat === 'docx' && styles.formatPillWord]}>
              <Text style={styles.formatPillText}>Save as Word</Text>
            </Pressable>
          </View>

          <View style={styles.reviewActions}>
            <Pressable onPress={() => setCapturedUri(null)} style={styles.retakeBtn}>
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable onPress={() => handleSaveScan()} style={styles.useScanBtn}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.useScanText}>
                Save {saveFormat === 'docx' ? 'Word' : 'PDF'} & Edit
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Bar (Image 1) */}
      <View style={styles.topBar}>
        <Pressable onPress={goBackOrHome} style={styles.topIconBtn}>
          <Ionicons name="home" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>{mode} Scanner</Text>
        </View>
        <Pressable onPress={cycleFlash} style={styles.topIconBtn}>
          <Ionicons
            name={flash === 'off' ? 'flash-off' : 'flash'}
            size={20}
            color={flash === 'on' ? '#FBBF24' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      {/* Camera Viewfinder + 4-Corner Blue Edge Overlay (Image 1) */}
      <View
        style={styles.viewfinder}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setViewfinderSize({ width, height });
          }
        }}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />
        ) : (
          <View style={styles.permissionFallback}>
            <Ionicons name="camera-outline" size={52} color="#64748B" />
            <Text style={styles.permTitle}>Camera Access Needed</Text>
            <Text style={styles.permSub}>
              Enable camera permission to scan documents live, or import from gallery.
            </Text>
            <View style={styles.permButtons}>
              <Pressable onPress={requestPermission} style={styles.permBtn}>
                <Text style={styles.permBtnText}>Allow Camera</Text>
              </Pressable>
              <Pressable onPress={handlePickGallery} style={styles.permBtnSecondary}>
                <Text style={styles.permBtnSecText}>Import Photo</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 4-Corner Blue Document Detection Overlay */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox="0 0 300 420" preserveAspectRatio="none">
            <Polygon
              points="36,46 264,46 264,374 36,374"
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#3B82F6"
              strokeWidth="2"
            />
            <Circle cx="36" cy="46" r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <Circle cx="264" cy="46" r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <Circle cx="36" cy="374" r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <Circle cx="264" cy="374" r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
          </Svg>
        </View>

        {/* Center "Capturing... hold steady" Pill */}
        <View pointerEvents="none" style={styles.holdSteadyPill}>
          {isCapturing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.bluePulseDot} />
          )}
          <Text style={styles.holdSteadyText}>
            {isCapturing ? 'Capturing... hold steady' : 'Align document inside frame'}
          </Text>
        </View>
      </View>

      {/* Bottom Mode Strip & Shutter Controls (Image 1) */}
      <View style={styles.controlsArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeStrip}>
          {SCAN_MODES.map((m) => {
            const active = mode === m;
            return (
              <Pressable key={m} onPress={() => setMode(m)} style={styles.modeTab}>
                <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.shutterRow}>
          <Pressable onPress={handlePickGallery} style={styles.sideControl}>
            <Ionicons name="images-outline" size={24} color="#FFFFFF" />
            <Text style={styles.sideControlText}>Gallery</Text>
          </Pressable>

          <Pressable
            onPress={() => setAutoCapture((v) => !v)}
            style={styles.sideControl}>
            <Ionicons
              name="aperture-outline"
              size={22}
              color={autoCapture ? '#3B82F6' : '#94A3B8'}
            />
            <Text style={[styles.sideControlText, autoCapture && { color: '#3B82F6' }]}>
              Auto
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCapture}
            style={({ pressed }) => [
              styles.shutterOuter,
              pressed && { transform: [{ scale: 0.93 }] },
            ]}>
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable onPress={cycleFlash} style={styles.sideControl}>
            <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideControlText}>{flash.toUpperCase()}</Text>
          </Pressable>

          <Pressable
            onPress={() => setCapturedUri('simulated-scan')}
            style={styles.sideControl}>
            <Ionicons name="document-text-outline" size={22} color="#CBD5E1" />
            <Text style={styles.sideControlText}>Demo</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  savePill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  savePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modeBadgeText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  viewfinder: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionFallback: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  permSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  permButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  permBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permBtnText: { color: '#FFFFFF', fontWeight: '700' },
  permBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permBtnSecText: { color: '#FFFFFF', fontWeight: '600' },
  holdSteadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  bluePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  holdSteadyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  controlsArea: {
    paddingTop: 12,
    paddingBottom: 14,
    gap: 14,
  },
  modeStrip: {
    paddingHorizontal: 20,
    gap: 20,
  },
  modeTab: {
    paddingVertical: 4,
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
  },
  sideControl: {
    alignItems: 'center',
    gap: 4,
    minWidth: 46,
  },
  sideControlText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  previewStage: {
    flex: 1,
    margin: 16,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  simulatedPaper: {
    width: '88%',
    aspectRatio: 0.72,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 22,
    gap: 12,
  },
  simTitle: { fontSize: 20, fontWeight: '800', color: '#0F2342' },
  simLine: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  simDivider: { height: 1, backgroundColor: '#E2E8F0' },
  simBody: { fontSize: 14, color: '#475569', lineHeight: 21 },
  filterBar: {
    paddingBottom: 16,
    gap: 14,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  reviewActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  formatToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  formatPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  formatPillPdf: {
    backgroundColor: '#E53935',
  },
  formatPillWord: {
    backgroundColor: '#2563EB',
  },
  formatPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  retakeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  useScanBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  useScanText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
