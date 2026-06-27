import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { TextInputMask } from 'react-native-masked-text';
import { requestNotificationPermissions, scheduleReturnNotifications } from '@/services/NotificationService';

const T = {
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  dark: '#2B2B2B',
  mid: '#6B7280',
  white: '#FFFFFF',
  border: 'rgba(225,29,72,0.14)',
};

interface ClientOption {
  id: string;
  name: string;
  initials: string;
}

export default function NovaAgenda() {
  const router = useRouter();

  const [loadingClients, setLoadingClients] = useState(true);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  
  const [form, setForm] = useState({ date: '', time: '', type: 'consultoria', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const q = query(collection(db, 'clients'), orderBy('mother_name', 'asc'));
      const snap = await getDocs(q);
      const list: ClientOption[] = [];
      snap.forEach(d => {
        const c = d.data();
        const name = c.mother_name || 'Sem nome';
        const parts = name.trim().split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (name[0] || '?').toUpperCase();
        list.push({ id: d.id, name, initials });
      });
      setClients(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadClients(); requestNotificationPermissions(); }, [loadClients]));

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  const handleSave = async () => {
    if (!form.date || form.date.length !== 10) return Alert.alert('Atenção', 'Digite uma data válida no formato DD/MM/AAAA.');
    if (!form.time || form.time.length !== 5) return Alert.alert('Atenção', 'Digite uma hora válida no formato HH:MM.');
    if (!selectedClient) return Alert.alert('Atenção', 'Selecione a paciente primeiro.');

    setSaving(true);
    try {
      await addDoc(collection(db, 'scheduled_returns'), {
        client_id: selectedClient.id,
        attendance_type: form.type,
        return_date: form.date,
        return_time: form.time,
        notes: form.notes,
        status: 'pending',
        created_at: serverTimestamp()
      });

      await scheduleReturnNotifications(form.date, form.time, selectedClient.name);

      Alert.alert('Agendado!', 'Consulta agendada com sucesso. O aplicativo irá te notificar no dia e na véspera.', [
        { text: 'OK', onPress: () => router.push('/dashboard' as any) }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao agendar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Passo 1: seleção de paciente ──────────────────────────────────────────
  if (!selectedClient) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="close" size={24} color={T.dark} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Agendar Consulta</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={T.mid} />
          <TextInput style={s.searchInput} placeholder="Buscar paciente..." placeholderTextColor={T.mid} value={search} onChangeText={setSearch} />
        </View>

        {loadingClients ? (
          <View style={s.center}><ActivityIndicator color={T.rose600} /></View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 13, color: T.mid, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 }}>Selecione a paciente</Text>
            {filteredClients.map(c => (
              <TouchableOpacity key={c.id} style={s.clientRow} activeOpacity={0.75} onPress={() => setSelectedClient(c)}>
                <View style={s.clientAvatar}><Text style={s.clientInitials}>{c.initials}</Text></View>
                <Text style={s.clientName}>{c.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={T.rose300} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── Passo 2: formulário de agenda ──────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSelectedClient(null)} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.dark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Definir Data e Hora</Text>
          <Text style={s.headerSubtitle}>{selectedClient.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={s.card}>
            <Text style={s.label}>Data da Consulta</Text>
            <TextInputMask type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={s.input} value={form.date} onChangeText={t => setForm(p => ({ ...p, date: t }))} placeholder="DD/MM/AAAA" keyboardType="numeric" placeholderTextColor={T.mid} />

            <Text style={s.label}>Horário</Text>
            <TextInputMask type={'datetime'} options={{ format: 'HH:mm' }} style={s.input} value={form.time} onChangeText={t => setForm(p => ({ ...p, time: t }))} placeholder="HH:MM" keyboardType="numeric" placeholderTextColor={T.mid} />

            <Text style={s.label}>Tipo de Atendimento</Text>
            <View style={s.radioGroup}>
              <TouchableOpacity style={[s.radioBtn, form.type === 'consultoria' && s.radioBtnActive]} onPress={() => setForm(p => ({ ...p, type: 'consultoria' }))}>
                <Text style={[s.radioText, form.type === 'consultoria' && s.radioTextActive]}>Consultoria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.radioBtn, form.type === 'furo' && s.radioBtnActive]} onPress={() => setForm(p => ({ ...p, type: 'furo' }))}>
                <Text style={[s.radioText, form.type === 'furo' && s.radioTextActive]}>Furo Humanizado</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Observações (Opcional)</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={form.notes} onChangeText={t => setForm(p => ({ ...p, notes: t }))} placeholder="Ex: Retorno 15 dias..." multiline placeholderTextColor={T.mid} />
          </View>
          
          <TouchableOpacity style={s.saveBtn} activeOpacity={0.8} onPress={handleSave} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Agendando...' : 'Confirmar Agendamento'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.rose50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.white },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.rose50, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: T.dark, textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: T.rose600, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginVertical: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.white, borderRadius: 16, borderWidth: 1, borderColor: T.border },
  searchInput: { flex: 1, fontSize: 15, color: T.dark },
  center: { paddingVertical: 40, alignItems: 'center' },
  
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.white, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.rose100, alignItems: 'center', justifyContent: 'center' },
  clientInitials: { fontSize: 14, fontWeight: '800', color: T.rose600 },
  clientName: { flex: 1, fontSize: 15, fontWeight: '700', color: T.dark },
  
  card: { backgroundColor: T.white, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: T.dark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: T.rose50, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: T.dark, marginBottom: 20, borderWidth: 1, borderColor: T.border },
  
  radioGroup: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  radioBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: T.rose50, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  radioBtnActive: { backgroundColor: T.rose100, borderColor: T.rose600 },
  radioText: { fontSize: 14, fontWeight: '600', color: T.mid },
  radioTextActive: { color: T.rose600, fontWeight: '800' },

  saveBtn: { backgroundColor: T.dark, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  saveBtnText: { color: T.white, fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
