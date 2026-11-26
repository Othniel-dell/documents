import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { PAGE_TEMPLATES } from '@/components/RedesignModal';
import type { DocumentItem } from '@/types/document';

function buildDocumentHtml(doc: DocumentItem, forWord = false): string {
  const page = doc.pages[0];
  const tpl =
    PAGE_TEMPLATES.find((t) => t.key === (page?.template ?? 'classic')) ??
    PAGE_TEMPLATES[0];

  const safeTitle = (page?.contentTitle ?? doc.title)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeBody = (page?.contentBody ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const imageHtml =
    page?.imageUri && !page?.hideImage
      ? `<div style="margin-bottom: 16px; text-align: center;">
           <img src="${page.imageUri}" style="max-width: 100%; max-height: 420px; border-radius: 8px;" />
         </div>`
      : '';

  const signedHtml = doc.isSigned
    ? `<p style="margin-top: 28px; color: #16A34A; font-weight: bold;">✓ Digitally Signed via DocuSmart AI</p>`
    : '';

  const wordNamespaces = forWord
    ? `xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"`
    : '';

  return `<!DOCTYPE html>
<html ${wordNamespaces}>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 32px; background-color: ${tpl.paperBg}; color: ${page?.textColor ?? '#111827'};">
    <div style="height: 6px; background-color: ${tpl.accent}; margin-bottom: 20px; border-radius: 4px;"></div>
    ${imageHtml}
    <h1 style="color: ${tpl.titleColor}; text-align: ${page?.textAlign ?? 'left'}; margin-bottom: 12px;">${safeTitle}</h1>
    <div style="line-height: 1.65; font-size: 14px; text-align: ${page?.textAlign ?? 'left'};">${safeBody}</div>
    ${signedHtml}
  </body>
</html>`;
}

export async function exportDocumentAsPdf(doc: DocumentItem) {
  const html = buildDocumentHtml(doc, false);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  } else {
    Alert.alert('PDF Saved', `Saved to ${uri}`);
  }
}

export async function exportDocumentAsWord(doc: DocumentItem) {
  const wordHtml = buildDocumentHtml(doc, true);
  const baseName = doc.title.replace(/\.[^.]+$/, '') || 'DocuSmart_Document';
  const fileName = `${baseName}.doc`;

  if (Platform.OS === 'web') {
    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.write(wordHtml);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/msword',
      UTI: 'com.microsoft.word.doc',
    });
  } else {
    Alert.alert('Word Document Saved', `Saved to ${file.uri}`);
  }
}

export async function exportDocumentAsExcel(doc: DocumentItem) {
  const page = doc.pages[0];
  const baseName = doc.title.replace(/\.[^.]+$/, '') || 'DocuSmart_Sheet';
  const fileName = `${baseName}.xls`;
  const rows = (page?.contentBody ?? '')
    .split(/\r?\n/)
    .map((line) => `<tr><td>${line.replace(/\|/g, '</td><td>')}</td></tr>`)
    .join('');

  const xlsHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head><meta charset="utf-8" /></head>
  <body>
    <table>
      <tr><th>${page?.contentTitle ?? doc.title}</th></tr>
      ${rows}
    </table>
  </body>
</html>`;

  if (Platform.OS === 'web') {
    const blob = new Blob(['\ufeff', xlsHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.write(xlsHtml);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/vnd.ms-excel' });
  } else {
    Alert.alert('Excel Saved', `Saved to ${file.uri}`);
  }
}

export async function exportDocumentAsPpt(doc: DocumentItem) {
  const pptHtml = buildDocumentHtml(doc, true);
  const baseName = doc.title.replace(/\.[^.]+$/, '') || 'DocuSmart_Slides';
  const fileName = `${baseName}.ppt`;

  if (Platform.OS === 'web') {
    const blob = new Blob(['\ufeff', pptHtml], { type: 'application/vnd.ms-powerpoint' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.write(pptHtml);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/vnd.ms-powerpoint' });
  } else {
    Alert.alert('PowerPoint Saved', `Saved to ${file.uri}`);
  }
}
