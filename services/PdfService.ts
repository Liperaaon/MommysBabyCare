import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateAndSharePdf(htmlContent: string, fileName: string) {
  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Ficha de Atendimento',
        UTI: 'com.adobe.pdf'
      });
    } else {
      console.warn('Sharing is not available on this platform');
    }
  } catch (error) {
    console.error('Failed to generate or share PDF', error);
    throw error;
  }
}
