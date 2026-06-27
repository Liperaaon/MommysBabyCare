import { storage } from '@/firebase/config';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Faz o upload de uma imagem local (file://) para o Firebase Storage
 * @param uri Caminho local da imagem (file://...)
 * @param path Caminho de destino no Storage (ex: 'furos/cliente_id/foto.jpg')
 * @returns A URL pública de download da imagem
 */
export async function uploadImageFromUri(uri: string, path: string): Promise<string> {
  try {
    // 1. Converter a URI local em um Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Criar a referência no Firebase Storage
    const storageRef = ref(storage, path);

    // 3. Fazer o upload do Blob
    await uploadBytes(storageRef, blob);

    // 4. Obter a URL pública
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
}

/**
 * Faz o upload de uma imagem em Base64 (ex: Assinaturas) para o Firebase Storage
 * @param base64DataString A string Base64 completa (ex: data:image/png;base64,iVBORw0KGgo...)
 * @param path Caminho de destino no Storage (ex: 'assinaturas/cliente_id/termo.png')
 * @returns A URL pública de download da assinatura
 */
export async function uploadBase64String(base64DataString: string, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    // O react-native-signature-canvas retorna uma data_url válida.
    await uploadString(storageRef, base64DataString, 'data_url');
    
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Erro ao fazer upload do base64:', error);
    throw error;
  }
}
