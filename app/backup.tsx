import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const T = {
  pink: '#FFB7C5',
  pinkDark: '#e89aaa',
  blue: '#BAE1FF',
  blueDark: '#89b8d6',
  cream: '#FFFDF7',
  gold: '#C5A065',
  goldLight: 'rgba(197,160,101,0.14)',
  dark: '#2B2B2B',
  mid: '#6B7280',
  border: 'rgba(197,160,101,0.15)',
  white: '#FFFFFF',
  roseLight: 'rgba(255,183,197,0.18)',
  green: '#10B981',
  greenLight: 'rgba(16,185,129,0.15)',
};

export default function BackupScreen() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      // Buscar dados de todas as coleções
      const collectionsToExport = ['clients', 'maternal_consultations', 'furo_humanizado', 'scheduled_returns'];
      const backupData: any = {};

      for (const collName of collectionsToExport) {
        const snap = await getDocs(collection(db, collName));
        const docs: any[] = [];
        snap.forEach(d => {
          docs.push({ id: d.id, ...d.data() });
        });
        backupData[collName] = docs;
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Nova API do expo-file-system para o SDK 56+
      const backupFile = new File(Paths.document, `backup_mommys_${dateStr}.json`);
      await backupFile.write(jsonString);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Backup do Mommy\'s Baby Care',
          UTI: 'public.json'
        });
      } else {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao gerar o arquivo de backup.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Backup e Segurança', headerBackTitle: 'Voltar', headerTintColor: T.pinkDark }} />
      
      <View style={styles.cloudCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-done" size={48} color={T.green} />
        </View>
        <Text style={styles.title}>Nuvem Ativa e Segura</Text>
        <Text style={styles.desc}>
          Seu aplicativo está conectado diretamente aos servidores do Google (Firebase). Todos os seus cadastros, fichas e fotos são salvos instantaneamente de forma automática.
        </Text>
        
        <View style={styles.statusRow}>
          <Ionicons name="shield-checkmark" size={16} color={T.green} />
          <Text style={styles.statusText}>Proteção contra perda de celular</Text>
        </View>
        <View style={styles.statusRow}>
          <Ionicons name="sync" size={16} color={T.green} />
          <Text style={styles.statusText}>Sincronização em tempo real</Text>
        </View>
      </View>

      <View style={styles.exportSection}>
        <Text style={styles.exportTitle}>Cópia Local de Segurança</Text>
        <Text style={styles.exportDesc}>
          Se você deseja ter uma cópia de todos os textos preenchidos em planilhas para guardar no seu computador ou e-mail, você pode exportar um arquivo bruto (JSON) agora mesmo.
        </Text>

        <TouchableOpacity 
          style={[styles.exportBtn, isExporting && { opacity: 0.7 }]} 
          activeOpacity={0.8}
          onPress={handleExportBackup}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color={T.white} />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color={T.white} />
              <Text style={styles.exportBtnText}>Baixar Backup Manual (JSON)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.cream,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  cloudCard: {
    backgroundColor: T.white,
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.greenLight,
    shadowColor: T.green,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 30,
    marginTop: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: T.dark,
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: T.mid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.greenLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    width: '100%',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.green,
  },
  exportSection: {
    width: '100%',
    backgroundColor: T.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: T.dark,
    marginBottom: 8,
  },
  exportDesc: {
    fontSize: 13,
    color: T.mid,
    lineHeight: 20,
    marginBottom: 20,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: T.gold,
    paddingVertical: 14,
    borderRadius: 16,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: T.white,
  }
});
