import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocBadge } from '@/components/DocBadge';

interface OnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function OnboardingModal({ visible, onDismiss }: OnboardingModalProps) {
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <LinearGradient
        colors={['#B8ECF4', '#E5F8FB', '#FFFFFF']}
        locations={[0, 0.55, 1]}
        style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topSection}>
            <View style={styles.dashedFrame}>
              <Text style={styles.title}>PDF Reader, Read{'\n'}All Docs</Text>
              <View style={styles.cornerDotTL} />
              <View style={styles.cornerDotTR} />
              <View style={styles.cornerDotBL} />
              <View style={styles.cornerDotBR} />
            </View>
            <Text style={styles.subtitle}>
              Read, manage, scan & sign all your PDFs and Office docs easily in one place.
            </Text>
          </View>

          <View style={styles.illustrationZone}>
            <View style={[styles.floatingBadge, styles.badgeLeftTop]}>
              <DocBadge type="docx" size="lg" />
            </View>
            <View style={[styles.floatingBadge, styles.badgeRightTop]}>
              <DocBadge type="pdf" size="lg" />
            </View>
            <View style={[styles.floatingBadge, styles.badgeLeftBottom]}>
              <DocBadge type="xlsx" size="lg" />
            </View>
            <View style={[styles.floatingBadge, styles.badgeRightBottom]}>
              <DocBadge type="pptx" size="lg" />
            </View>

            <View style={styles.centerCard}>
              <Image
                source={require('@/assets/images/docusmart-logo.png')}
                style={styles.logoBanner}
                resizeMode="contain"
              />
              <Text style={styles.centerCardTitle}>
                DocuSmart <Text style={{ color: '#4F46E5' }}>AI</Text>
              </Text>
              <Text style={styles.centerCardSub}>Scan • Convert • Summarize • More</Text>
              <View style={styles.featurePills}>
                <View style={styles.pill}>
                  <Ionicons name="scan-outline" size={14} color="#16325B" />
                  <Text style={styles.pillText}>Smart Scan</Text>
                </View>
                <View style={styles.pill}>
                  <Ionicons name="create-outline" size={14} color="#16325B" />
                  <Text style={styles.pillText}>Sign PDF</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
    gap: 14,
  },
  dashedFrame: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#7EC8D6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    position: 'relative',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F2342',
    textAlign: 'center',
    lineHeight: 38,
  },
  cornerDotTL: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  cornerDotTR: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  cornerDotBL: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  cornerDotBR: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
  },
  illustrationZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerCard: {
    width: 230,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#0F2342',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  logoBanner: {
    width: 170,
    height: 90,
    marginBottom: 8,
  },
  centerCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F2342',
  },
  centerCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  featurePills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16325B',
  },
  floatingBadge: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeLeftTop: {
    top: '18%',
    left: 16,
    transform: [{ rotate: '-12deg' }],
  },
  badgeRightTop: {
    top: '14%',
    right: 18,
    transform: [{ rotate: '12deg' }],
  },
  badgeLeftBottom: {
    bottom: '18%',
    left: 22,
    transform: [{ rotate: '-8deg' }],
  },
  badgeRightBottom: {
    bottom: '16%',
    right: 20,
    transform: [{ rotate: '10deg' }],
  },
  ctaButton: {
    backgroundColor: '#0F2B35',
    borderRadius: 999,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0F2B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
