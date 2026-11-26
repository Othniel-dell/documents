import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { useState } from 'react';
import {
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

import { Colors } from '@/constants/theme';
import { useDocuments } from '@/context/DocumentContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PageTemplate } from '@/types/document';
import { goBackOrHome } from '@/utils/navigation';

interface CvPreset {
  key: string;
  template: PageTemplate;
  name: string;
  subtitle: string;
  accent: string;
  bg: string;
  textColor: string;
  sample: {
    fullName: string;
    jobTitle: string;
    contact: string;
    summary: string;
    experience: string;
    education: string;
    skills: string;
  };
}

const CV_PRESETS: CvPreset[] = [
  {
    key: 'exec',
    template: 'executive',
    name: 'Executive Pro',
    subtitle: 'Leadership & Management',
    accent: '#16325B',
    bg: '#FFFFFF',
    textColor: '#1E293B',
    sample: {
      fullName: 'Daniel O. Mensah',
      jobTitle: 'Operations & Strategy Lead',
      contact: 'daniel.mensah@email.com  |  +1 (555) 392-8810  |  LinkedIn /in/dmensah',
      summary:
        'Strategic Operations Leader with 8+ years scaling cross-functional teams, optimizing workflows, and driving measurable revenue growth across enterprise SaaS.',
      experience:
        'DIRECTOR OF OPERATIONS — Apex Global (2022–Present)\n• Scaled regional operations across 4 markets, reducing delivery cost by 22%.\n• Led a 24-person team and launched automated KPI reporting.\n\nOPERATIONS MANAGER — Horizon Corp (2019–2022)\n• Streamlined vendor onboarding, cutting turnaround time by 40%.',
      education: 'MBA, Business Administration — Metro Business School (2019)',
      skills: 'Strategic Planning  •  P&L Management  •  Process Automation  •  Team Leadership',
    },
  },
  {
    key: 'modern',
    template: 'modern',
    name: 'Modern Tech',
    subtitle: 'Engineering & Product',
    accent: '#2563EB',
    bg: '#F8FAFC',
    textColor: '#0F172A',
    sample: {
      fullName: 'Alex Morgan',
      jobTitle: 'Senior Product & Software Engineer',
      contact: 'alex.morgan@email.com  |  github.com/amorgan  |  San Francisco, CA',
      summary:
        'Full-stack Product Engineer specializing in React Native, TypeScript, and AI-assisted mobile workflows with a track record of shipping 4.9★ apps.',
      experience:
        'SENIOR MOBILE ENGINEER — CloudDocs Inc. (2023–Present)\n• Architected document scanning & e-signature pipeline serving 500K+ MAU.\n• Reduced app cold-start time by 35%.\n\nSOFTWARE ENGINEER — PixelLabs (2020–2023)\n• Built real-time collaborative editor and PDF export engine.',
      education: 'B.S. Computer Science — State University (2020)',
      skills: 'TypeScript  •  React Native  •  Expo  •  Node.js  •  UI/UX Systems  •  GraphQL',
    },
  },
  {
    key: 'classic',
    template: 'legal',
    name: 'Classic Corporate',
    subtitle: 'Finance, Law & Consulting',
    accent: '#334155',
    bg: '#FFFFFF',
    textColor: '#111827',
    sample: {
      fullName: 'Claire V. Bennett',
      jobTitle: 'Senior Financial Analyst',
      contact: 'c.bennett@email.com  |  +1 (555) 741-2209  |  Chicago, IL',
      summary:
        'Detail-oriented Financial Analyst (CFA Level II) with deep expertise in financial modeling, M&A due diligence, and quarterly executive reporting.',
      experience:
        'SENIOR FINANCIAL ANALYST — Sterling Capital (2022–Present)\n• Built 3-statement valuation models for $120M+ in mid-market acquisitions.\n• Prepared board-ready quarterly variance & cash-flow briefs.\n\nFINANCIAL ANALYST — NorthStar Advisory (2019–2022)\n• Conducted industry benchmarking and risk analysis for 15+ clients.',
      education: 'B.S. Finance & Economics — Lakeview University (2019)',
      skills: 'Financial Modeling  •  Valuation  •  Excel & VBA  •  Due Diligence  •  Risk Analysis',
    },
  },
  {
    key: 'creative',
    template: 'warm',
    name: 'Editorial Minimal',
    subtitle: 'Design, Media & Marketing',
    accent: '#D97706',
    bg: '#FFFDF7',
    textColor: '#292524',
    sample: {
      fullName: 'Sofia Chen',
      jobTitle: 'Brand & Product Designer',
      contact: 'sofia.chen@email.com  |  sofiachen.design  |  Austin, TX',
      summary:
        'Multidisciplinary Brand & UX Designer crafting memorable digital products, visual identities, and high-converting editorial experiences.',
      experience:
        'LEAD PRODUCT DESIGNER — StudioCraft (2022–Present)\n• Redesigned flagship mobile workspace, lifting user activation by 31%.\n• Directed brand refresh across web, iOS, and Android.\n\nVISUAL DESIGNER — BrightWave Media (2020–2022)\n• Delivered 40+ campaign systems for consumer tech brands.',
      education: 'B.F.A. Communication Design — Arts Institute (2020)',
      skills: 'Brand Identity  •  Figma  •  Design Systems  •  Prototyping  •  Art Direction',
    },
  },
];

export default function CvMakerScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const { addDocument } = useDocuments();

  const [selectedPreset, setSelectedPreset] = useState<CvPreset>(CV_PRESETS[0]);
  const [fullName, setFullName] = useState(CV_PRESETS[0].sample.fullName);
  const [jobTitle, setJobTitle] = useState(CV_PRESETS[0].sample.jobTitle);
  const [contact, setContact] = useState(CV_PRESETS[0].sample.contact);
  const [summary, setSummary] = useState(CV_PRESETS[0].sample.summary);
  const [experience, setExperience] = useState(CV_PRESETS[0].sample.experience);
  const [education, setEducation] = useState(CV_PRESETS[0].sample.education);
  const [skills, setSkills] = useState(CV_PRESETS[0].sample.skills);

  const applyPreset = (preset: CvPreset, fillContent = true) => {
    setSelectedPreset(preset);
    if (fillContent) {
      setFullName(preset.sample.fullName);
      setJobTitle(preset.sample.jobTitle);
      setContact(preset.sample.contact);
      setSummary(preset.sample.summary);
      setExperience(preset.sample.experience);
      setEducation(preset.sample.education);
      setSkills(preset.sample.skills);
    }
  };

  const handleClearFields = () => {
    setFullName('');
    setJobTitle('');
    setContact('');
    setSummary('');
    setExperience('');
    setEducation('');
    setSkills('');
  };

  const handleCreateCv = () => {
    const name = fullName.trim() || 'My_CV';
    const role = jobTitle.trim();
    const headerTitle = role ? `${name}\n${role}` : name;

    const sections = [
      contact.trim() ? contact.trim() : null,
      summary.trim() ? `PROFESSIONAL SUMMARY\n${summary.trim()}` : null,
      experience.trim() ? `WORK EXPERIENCE\n${experience.trim()}` : null,
      education.trim() ? `EDUCATION\n${education.trim()}` : null,
      skills.trim() ? `CORE SKILLS\n${skills.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n\n──────────────────────────\n\n');

    const safeFileName = `${name.replace(/\s+/g, '_')}_CV.pdf`;
    const created = addDocument({
      title: safeFileName,
      type: 'pdf',
      size: '48.0 KB',
      summary: summary.trim() || `Professional CV for ${name}.`,
      pages: [
        {
          id: `p-${Date.now()}`,
          contentTitle: headerTitle,
          contentBody:
            sections ||
            'PROFESSIONAL SUMMARY\nAdd your summary, work experience, education, and skills.',
          template: selectedPreset.template,
          textColor: selectedPreset.textColor,
        },
      ],
      annotations: [],
    });

    router.replace(`/editor/${created.id}` as Href);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.aquaTop, theme.aquaMid, theme.background]}
        locations={[0, 0.7, 1]}
        style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={goBackOrHome}
              style={[styles.circleBtn, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Professional CV Maker
            </Text>
            <Pressable
              onPress={handleClearFields}
              style={[styles.samplePill, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.sampleText, { color: theme.navy }]}>Clear</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Visual Professional CV Templates */}
          <Text style={[styles.label, { color: theme.text }]}>
            Choose a Professional Template
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetScroll}>
            {CV_PRESETS.map((preset) => {
              const active = selectedPreset.key === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  onPress={() => applyPreset(preset, true)}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: preset.bg,
                      borderColor: active ? preset.accent : theme.border,
                      borderWidth: active ? 2.5 : 1,
                    },
                  ]}>
                  {/* Mini CV Header Preview */}
                  <View style={[styles.miniHeader, { backgroundColor: preset.accent }]}>
                    <View style={styles.miniAvatar} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={styles.miniNameBar} />
                      <View style={styles.miniRoleBar} />
                    </View>
                  </View>

                  {/* Mini CV Body Lines */}
                  <View style={styles.miniBody}>
                    <View style={[styles.miniSectionBar, { backgroundColor: preset.accent }]} />
                    <View style={styles.miniLine} />
                    <View style={styles.miniLineShort} />
                    <View style={[styles.miniSectionBar, { backgroundColor: preset.accent, marginTop: 4 }]} />
                    <View style={styles.miniLine} />
                  </View>

                  <View style={styles.presetFooter}>
                    <Text style={styles.presetName} numberOfLines={1}>
                      {preset.name}
                    </Text>
                    <Text style={styles.presetSub} numberOfLines={1}>
                      {preset.subtitle}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Alex Morgan"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Job Title / Target Role</Text>
          <TextInput
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder="e.g. Software Engineer"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Contact Info (Email, Phone, City)</Text>
          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder="email@example.com | +1 555-0199 | City"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Professional Summary</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            multiline
            placeholder="Brief overview of your experience and strengths..."
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.textArea,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Work Experience</Text>
          <TextInput
            value={experience}
            onChangeText={setExperience}
            multiline
            placeholder="ROLE — Company (Year–Year)&#10;• Key achievement..."
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.textAreaLarge,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Education</Text>
          <TextInput
            value={education}
            onChangeText={setEducation}
            multiline
            placeholder="Degree — University (Year)"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.textArea,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Core Skills</Text>
          <TextInput
            value={skills}
            onChangeText={setSkills}
            multiline
            placeholder="Skill 1  •  Skill 2  •  Skill 3"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.textArea,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          <Pressable
            onPress={handleCreateCv}
            style={[styles.createBtn, { backgroundColor: selectedPreset.accent }]}>
            <Ionicons name="document-text-outline" size={19} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Generate & Export CV</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17.5, fontWeight: '800' },
  samplePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  sampleText: { fontSize: 12.5, fontWeight: '700' },
  formScroll: { padding: 18, gap: 10, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  presetScroll: { gap: 12, paddingVertical: 4 },
  presetCard: {
    width: 142,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  miniNameBar: {
    height: 5,
    width: '75%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  miniRoleBar: {
    height: 3.5,
    width: '55%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  miniBody: {
    padding: 8,
    gap: 4,
  },
  miniSectionBar: {
    height: 3.5,
    width: '45%',
    borderRadius: 2,
  },
  miniLine: {
    height: 3,
    width: '92%',
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  miniLineShort: {
    height: 3,
    width: '68%',
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  presetFooter: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 2,
  },
  presetName: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  presetSub: { fontSize: 10, color: '#64748B', marginTop: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 76,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 124,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  createBtn: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
});
