import React, { createContext, useContext, useState } from 'react';

import type { AnnotationItem, DocumentItem, DocType, SavedSignature } from '@/types/document';

interface DocumentContextValue {
  documents: DocumentItem[];
  savedSignatures: SavedSignature[];
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  addDocument: (doc: Omit<DocumentItem, 'id' | 'date'> & { date?: string }) => DocumentItem;
  updateDocument: (id: string, patch: Partial<DocumentItem>) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => void;
  addAnnotation: (docId: string, annotation: AnnotationItem) => void;
  updateAnnotation: (docId: string, annotationId: string, patch: Partial<AnnotationItem>) => void;
  removeAnnotation: (docId: string, annotationId: string) => void;
  addSavedSignature: (sig: Omit<SavedSignature, 'id'>) => SavedSignature;
  getDocumentById: (id: string) => DocumentItem | undefined;
}

const INITIAL_DOCUMENTS: DocumentItem[] = [];

const INITIAL_SIGNATURES: SavedSignature[] = [];

const DocumentContext = createContext<DocumentContextValue | null>(null);

function formatCurrentDate() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>(INITIAL_SIGNATURES);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const addDocument = (
    doc: Omit<DocumentItem, 'id' | 'date'> & { date?: string }
  ): DocumentItem => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      date: doc.date ?? formatCurrentDate(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const updateDocument = (id: string, patch: Partial<DocumentItem>) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const duplicateDocument = (id: string) => {
    setDocuments((prev) => {
      const target = prev.find((d) => d.id === id);
      if (!target) return prev;
      const copy: DocumentItem = {
        ...target,
        id: `doc-${Date.now()}`,
        title: `${target.title.replace(/(\.[^.]+)$/, '')} (Copy)${target.title.match(/\.[^.]+$/)?.[0] ?? ''}`,
        date: formatCurrentDate(),
      };
      return [copy, ...prev];
    });
  };

  const addAnnotation = (docId: string, annotation: AnnotationItem) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              isSigned: d.isSigned || annotation.type === 'signature',
              annotations: [...d.annotations, annotation],
            }
          : d
      )
    );
  };

  const updateAnnotation = (
    docId: string,
    annotationId: string,
    patch: Partial<AnnotationItem>
  ) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              annotations: d.annotations.map((a) =>
                a.id === annotationId ? { ...a, ...patch } : a
              ),
            }
          : d
      )
    );
  };

  const removeAnnotation = (docId: string, annotationId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, annotations: d.annotations.filter((a) => a.id !== annotationId) }
          : d
      )
    );
  };

  const addSavedSignature = (sig: Omit<SavedSignature, 'id'>): SavedSignature => {
    const created: SavedSignature = { ...sig, id: `sig-${Date.now()}` };
    setSavedSignatures((prev) => [created, ...prev]);
    return created;
  };

  const getDocumentById = (id: string) => documents.find((d) => d.id === id);

  return (
    <DocumentContext.Provider
      value={{
        documents,
        savedSignatures,
        hasSeenOnboarding,
        setHasSeenOnboarding,
        addDocument,
        updateDocument,
        deleteDocument,
        duplicateDocument,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        addSavedSignature,
        getDocumentById,
      }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocuments must be used inside DocumentProvider');
  }
  return ctx;
}

export function guessDocTypeFromName(name: string): DocType {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) return 'xlsx';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'pptx';
  return 'scan';
}
