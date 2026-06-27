import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  T,
  FichaAleitamento,
  EMPTY_FICHA,
  FichaForm,
  validateFicha,
} from './_shared';

interface ClientOption {
  id: string;
  name: string;
  initials: string;
}

export default function NovaFicha() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();

  const [loadingClients, setLoadingClients] = useState(true);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [data, setData] = useState<FichaAleitamento>(EMPTY_FICHA);
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
        const initials =
          parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (name[0] || '?').toUpperCase();
        list.push({ id: d.id, name, initials });
      });
      setClients(list);

      // Se veio clientId pela rota, já seleciona direto
      if (params.clientId) {
        const found = list.find(c => c.id === params.clientId);
        if (found) {
          setSelectedClient(found);
          setData(prev => ({ ...prev, motherName: found.name }));
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível carregar a lista de pacientes.');
    } finally {
      setLoadingClients(false);
    }
  }, [params.clientId]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSelectClient = (c: ClientOption) => {
    setSelectedClient(c);
    setData(prev => ({ ...prev, motherName: c.name }));
  };

  const handleSave = async () => {
    const error = validateFicha(data);
    if (error) {
      Alert.alert('Campo obrigatório', error);
      return;
    }
    if (!selectedClient) {
      Alert.alert('Selecione a paciente', 'Escolha a paciente antes de salvar a ficha.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'maternal_consultations'), {
        ...data,
        client_id: selectedClient.id,
        created_at: serverTimestamp(),
      });
      Alert.alert('Ficha salva', 'A ficha de aleitamento foi registrada com sucesso.', [
        { text: 'OK', onPress: () => router.replace(`/clientes/${selectedClient.id}`) },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar a ficha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Passo 1: seleção de paciente ──────────────────────────────────────────
  if (!selectedClient) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={T.dark} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Selecionar Paciente</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={T.mid} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar paciente..."
            placeholderTextColor={T.mid}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loadingClients ? (
          <View style={s.center}>
            <ActivityIndicator color={T.rose600} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            {filteredClients.length > 0 ? (
              filteredClients.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={s.clientRow}
                  activeOpacity={0.75}
                  onPress={() => handleSelectClient(c)}
                >
                  <View style={s.clientAvatar}>
                    <Text style={s.clientInitials}>{c.initials}</Text>
                  </View>
                  <Text style={s.clientName}>{c.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={T.rose300} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={s.center}>
                <Text style={{ color: T.mid, fontSize: 13 }}>Nenhuma paciente encontrada.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── Passo 2: formulário da ficha ──────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSelectedClient(null)} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={T.dark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Ficha de Aleitamento Materno</Text>
          <Text style={s.headerSubtitle}>{selectedClient.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <FichaForm data={data} onChange={setData} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={T.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color={T.white} />
              <Text style={s.saveBtnText}>Salvar Ficha</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.rose50 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: T.border,
    backgroundColor: T.white,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.rose50,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: T.dark, textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: T.rose600, fontWeight: '600', textAlign: 'center', marginTop: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: T.white, borderRadius: 12, borderWidth: 0.5, borderColor: T.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.dark },
  center: { paddingVertical: 40, alignItems: 'center' },
  clientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.white, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: T.border,
  },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.rose100,
    alignItems: 'center', justifyContent: 'center',
  },
  clientInitials: { fontSize: 13, fontWeight: '800', color: T.rose600 },
  clientName: { flex: 1, fontSize: 14, fontWeight: '700', color: T.dark },
  footer: {
    padding: 16, borderTopWidth: 0.5, borderTopColor: T.border, backgroundColor: T.white,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: T.rose600, borderRadius: 14, paddingVertical: 14,
  },
  saveBtnText: { color: T.white, fontSize: 14, fontWeight: '700' },
});