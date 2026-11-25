import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import type { DocumentItem } from '@/types/document';
import { goBackOrHome } from '@/utils/navigation';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  title?: string;
  text: string;
  suggestions?: string[];
}

function extractDocumentText(doc: DocumentItem | undefined): string {
  if (!doc) return '';
  return doc.pages
    .map((p) => [p.contentTitle, p.contentBody].filter(Boolean).join('\n'))
    .join('\n\n')
    .trim();
}

function buildAgentReply(
  query: string,
  doc: DocumentItem | undefined,
  allDocs: DocumentItem[]
): { title: string; text: string; suggestions?: string[] } {
  const q = query.toLowerCase();

  if (!doc && allDocs.length === 0) {
    if (q.includes('scan') || q.includes('how') || q.includes('start') || q.includes('sign')) {
      return {
        title: 'Getting Started',
        text: 'Your workspace is currently empty. Here is how to get started:\n\n1. Tap the center camera button (or "Scan Document") to scan a paper page, ID card, or form.\n2. Or tap "Files" / "Gallery" on Home to import an existing PDF, Word, Excel, or image.\n3. Once added, open any document to add text notes, draw, sign with your finger, or ask me to analyze it!',
        suggestions: [
          'What file formats are supported?',
          'How does digital signing work?',
        ],
      };
    }

    return {
      title: 'No Document Loaded Yet',
      text: 'I do not see any documents in your workspace yet. Scan a document or import a PDF/Word/Image file first, and I can summarize it, extract key figures, list action items, or draft an email from its contents.',
      suggestions: [
        'How do I scan and sign my first document?',
        'What annotation tools are available?',
      ],
    };
  }

  const activeDoc = doc ?? allDocs[0];
  const rawText = extractDocumentText(activeDoc);
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const wordCount = rawText ? rawText.split(/\s+/).length : 0;

  // 1. Summarize / Overview
  if (q.includes('summar') || q.includes('overview') || q.includes('about') || q.includes('tldr')) {
    const previewLines = lines.slice(0, 5).map((l) => `• ${l}`).join('\n');
    return {
      title: `Overview — ${activeDoc.title}`,
      text:
        activeDoc.summary ??
        (rawText
          ? `Document type: ${activeDoc.type.toUpperCase()} (${activeDoc.size}, ~${wordCount} words, ${activeDoc.pages.length} page${activeDoc.pages.length > 1 ? 's' : ''}).\n\nKey highlights:\n${previewLines}`
          : `"${activeDoc.title}" is a ${activeDoc.type.toUpperCase()} (${activeDoc.size}) with ${activeDoc.annotations.length} annotation(s).`),
      suggestions: [
        'Extract key figures and dates',
        'List action items from this document',
        'Draft a short email about this document',
      ],
    };
  }

  // 2. Key figures, numbers, prices, dates
  if (q.includes('figure') || q.includes('number') || q.includes('cost') || q.includes('price') || q.includes('date') || q.includes('amount')) {
    const matches = rawText.match(/(\$[\d,.]+|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d+(?:\.\d+)?%)/g);
    const unique = matches ? Array.from(new Set(matches)) : [];
    return {
      title: 'Extracted Figures & Dates',
      text:
        unique.length > 0
          ? `I found ${unique.length} key figure(s) / date(s) in "${activeDoc.title}":\n\n${unique.map((m) => `• ${m}`).join('\n')}`
          : `No explicit currency amounts, percentages, or formatted dates were detected in the text of "${activeDoc.title}".`,
      suggestions: ['Summarize the full document', 'Check signature status'],
    };
  }

  // 3. Action items / Next steps / Tasks
  if (q.includes('action') || q.includes('todo') || q.includes('task') || q.includes('next step')) {
    const bullets = lines.filter((l) => l.startsWith('•') || l.startsWith('-') || /^\d+\./.test(l));
    return {
      title: 'Action Items & Checklist',
      text:
        bullets.length > 0
          ? `Here are the structured items found in "${activeDoc.title}":\n\n${bullets.slice(0, 6).join('\n')}${!activeDoc.isSigned ? '\n\n• Pending: Add your digital signature in the Editor.' : ''}`
          : `Recommended next steps for "${activeDoc.title}":\n• Review page contents (${wordCount} words)\n• ${activeDoc.isSigned ? 'Signature already applied ✓' : 'Open Editor → Sign to apply your signature'}\n• Export & share as PDF when finalized.`,
      suggestions: ['Draft a short email about this document', 'Check signature status'],
    };
  }

  // 4. Draft email / Rewrite / Formal
  if (q.includes('email') || q.includes('draft') || q.includes('reply') || q.includes('write') || q.includes('formal')) {
    const subject = activeDoc.title.replace(/\.[^.]+$/, '');
    return {
      title: 'Draft Email',
      text: `Subject: ${subject}\n\nHi,\n\nPlease find attached "${activeDoc.title}" (${activeDoc.size}). ${
        activeDoc.isSigned
          ? 'The document has been reviewed and digitally signed.'
          : 'Kindly review the details and let me know if any updates are needed before signing.'
      }\n\nBest regards,`,
      suggestions: ['Summarize the full document', 'How do I export as PDF?'],
    };
  }

  // 5. Signature & Annotation status
  if (q.includes('sign') || q.includes('status') || q.includes('annotat') || q.includes('tool')) {
    const sigCount = activeDoc.annotations.filter((a) => a.type === 'signature').length;
    const textCount = activeDoc.annotations.filter((a) => a.type === 'text').length;
    const drawCount = activeDoc.annotations.filter((a) => a.type === 'draw').length;
    return {
      title: 'Document Status & Tools',
      text: `"${activeDoc.title}" status:\n• Signed: ${activeDoc.isSigned ? 'Yes ✓' : 'Not yet'}\n• Signatures placed: ${sigCount}\n• Text notes: ${textCount}\n• Freehand drawings: ${drawCount}\n\nIn the Editor, tap Sign to draw or reuse a signature, Draw for freehand ink, Text to add notes, or More → Export & Share PDF.`,
      suggestions: ['Summarize the full document', 'Draft a short email about this document'],
    };
  }

  // 6. Export / PDF / Format questions
  if (q.includes('export') || q.includes('share') || q.includes('pdf') || q.includes('format')) {
    return {
      title: 'Export & Supported Formats',
      text: 'CamDocs WPS supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and scanned images. Open any document and tap the Share icon in the top-right (or More → Export & Share PDF) to generate and share a PDF.',
    };
  }

  // 7. Keyword search inside the active document
  const keywords = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const matchingLines = lines.filter((line) =>
    keywords.some((kw) => line.toLowerCase().includes(kw))
  );

  if (matchingLines.length > 0) {
    return {
      title: `Answer from ${activeDoc.title}`,
      text: `Here is what I found in "${activeDoc.title}" related to your question:\n\n${matchingLines
        .slice(0, 4)
        .map((l) => `• ${l}`)
        .join('\n')}`,
      suggestions: ['Summarize the full document', 'List action items'],
    };
  }

  return {
    title: `Analysis — ${activeDoc.title}`,
    text: `I checked "${activeDoc.title}" (${activeDoc.type.toUpperCase()}, ${wordCount} words). Ask me to summarize it, extract key figures, list action items, check signature status, or draft an email based on its content.`,
    suggestions: [
      'Summarize the full document',
      'List action items',
      'Draft a short email about this document',
    ],
  };
}

export default function AiChatScreen() {
  const { docId } = useLocalSearchParams<{ docId?: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const { documents, getDocumentById, updateDocument } = useDocuments();

  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(docId);
  const targetDoc = useMemo(
    () => (selectedDocId ? getDocumentById(selectedDocId) : undefined) ?? documents[0],
    [selectedDocId, getDocumentById, documents]
  );

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const idSeqRef = useRef(10);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial = buildAgentReply('Summarize the current document', targetDoc, documents);
    return [
      {
        id: 'm-1',
        role: 'user',
        text: targetDoc ? `Summarize "${targetDoc.title}"` : 'How can you help me?',
      },
      {
        id: 'm-2',
        role: 'ai',
        title: initial.title,
        text: initial.text,
        suggestions: initial.suggestions,
      },
    ];
  });

  const handleSend = (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query || isThinking) return;

    idSeqRef.current += 1;
    const userMsg: ChatMessage = {
      id: `u-${idSeqRef.current}`,
      role: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const reply = buildAgentReply(query, targetDoc, documents);
      idSeqRef.current += 1;
      const aiMsg: ChatMessage = {
        id: `a-${idSeqRef.current}`,
        role: 'ai',
        title: reply.title,
        text: reply.text,
        suggestions: reply.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 380);
  };

  const quickPrompts = [
    'Summarize',
    'Action items',
    'Key figures',
    'Draft email',
    'Signature status',
  ];

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={goBackOrHome} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            <Text style={{ color: '#2563EB' }}>Chat </Text>
            <Text style={{ color: '#A855F7' }}>with AI</Text>
          </Text>
          <Text style={[styles.headerContext, { color: theme.textSecondary }]} numberOfLines={1}>
            {targetDoc ? `Context: ${targetDoc.title}` : 'Workspace Assistant'}
          </Text>
        </View>
        <View style={styles.crownBadge}>
          <Ionicons name="sparkles" size={16} color="#4F46E5" />
        </View>
      </View>

      {/* Document Switcher Strip (if multiple docs exist) */}
      {documents.length > 1 && (
        <ScrollView
          horizontal
          style={styles.horizontalScrollFixed}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.docStrip, { borderBottomColor: theme.border }]}>
          {documents.map((d) => {
            const active = targetDoc?.id === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => setSelectedDocId(d.id)}
                style={[
                  styles.docPill,
                  {
                    backgroundColor: active ? theme.navy : theme.backgroundElement,
                    borderColor: active ? theme.navy : theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.docPillText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {d.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}>
          {messages.map((msg, idx) => {
            const msgKey = `${msg.id}-${idx}`;
            if (msg.role === 'user') {
              return (
                <View key={msgKey} style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{msg.text}</Text>
                </View>
              );
            }

            return (
              <View
                key={msgKey}
                style={[
                  styles.aiCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={styles.aiCardHeader}>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.aiCardTitle}>{msg.title ?? 'CamDocs AI'}</Text>
                  {targetDoc && (
                    <Pressable
                      onPress={() => {
                        const page = targetDoc.pages[0];
                        const nextBody = [page?.contentBody, msg.text]
                          .filter(Boolean)
                          .join('\n\n');
                        updateDocument(targetDoc.id, {
                          pages: [{ ...page, id: page?.id ?? 'p-1', contentBody: nextBody }],
                        });
                        goBackOrHome();
                      }}
                      style={styles.insertBtn}>
                      <Ionicons name="add-circle-outline" size={13} color="#2563EB" />
                      <Text style={styles.insertBtnText}>Insert</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.aiCardBody, { color: theme.text }]}>{msg.text}</Text>

                {msg.suggestions && (
                  <View style={styles.suggestionsBlock}>
                    <Text style={[styles.suggestionsHeader, { color: theme.textSecondary }]}>
                      Follow-up questions:
                    </Text>
                    {msg.suggestions.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => handleSend(s)}
                        style={styles.suggestionRow}>
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color="#2563EB"
                          style={{ marginTop: 2 }}
                        />
                        <Text style={styles.suggestionText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {isThinking && (
            <View
              style={[
                styles.thinkingRow,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={[styles.thinkingText, { color: theme.textSecondary }]}>
                Analyzing document...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompt Chips */}
        <View style={styles.quickRowWrapper}>
          <ScrollView
            horizontal
            style={styles.horizontalScrollFixed}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}>
            {quickPrompts.map((p) => (
              <Pressable
                key={p}
                onPress={() => handleSend(p)}
                style={[
                  styles.quickChip,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Text style={[styles.quickChipText, { color: theme.text }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View
          style={[
            styles.inputBar,
            { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
          ]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask AI anything about your document..."
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
            onSubmitEditing={() => handleSend()}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || isThinking}
            style={[
              styles.sendBtn,
              (!input.trim() || isThinking) && { opacity: 0.45 },
            ]}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerContext: { fontSize: 11, marginTop: 1 },
  crownBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docStrip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 180,
  },
  docPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatScroll: {
    padding: 16,
    gap: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    maxWidth: '84%',
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '600',
  },
  aiCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#6366F1',
  },
  insertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  insertBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  aiCardBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  suggestionsBlock: {
    marginTop: 6,
    gap: 9,
  },
  suggestionsHeader: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13.5,
    color: '#2563EB',
    fontWeight: '500',
    lineHeight: 19,
  },
  thinkingRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  thinkingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalScrollFixed: {
    flexGrow: 0,
    flexShrink: 0,
  },
  quickRowWrapper: {
    flexShrink: 0,
    paddingTop: 4,
    paddingBottom: 8,
  },
  quickRow: {
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
