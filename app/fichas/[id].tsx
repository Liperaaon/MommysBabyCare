import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { T, FichaAleitamento, EMPTY_FICHA, FichaForm, validateFicha } from './_shared';

export default function VisualizarFicha() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FichaAleitamento>(EMPTY_FICHA);
  const [createdAtLabel, setCreatedAtLabel] = useState('');

  const loadFicha = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ref = doc(db, 'maternal_consultations', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        Alert.alert('Não encontrada', 'Esta ficha não existe mais.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      const raw = snap.data();
      setData({ ...EMPTY_FICHA, ...raw } as FichaAleitamento);
      if (raw.created_at?.toDate) {
        setCreatedAtLabel(
          raw.created_at.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível carregar a ficha.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadFicha();
    }, [loadFicha])
  );

  const handleSave = async () => {
    const error = validateFicha(data);
    if (error) {
      Alert.alert('Campo obrigatório', error);
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'maternal_consultations', id);
      const { client_id, created_at, ...editableFields } = data as any;
      await updateDoc(ref, editableFields);
      setEditMode(false);
      Alert.alert('Atualizada', 'A ficha foi atualizada com sucesso.');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir ficha', 'Tem certeza que deseja excluir esta ficha? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'maternal_consultations', id));
            router.back();
          } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível excluir a ficha.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator color={T.rose600} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={T.dark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{data.motherName || 'Ficha de Aleitamento'}</Text>
          {createdAtLabel ? <Text style={s.headerSubtitle}>Registrada em {createdAtLabel}</Text> : null}
        </View>
        <TouchableOpacity onPress={handleDelete} style={s.iconBtn}>
          <Ionicons name="trash-outline" size={18} color={T.rose600} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <FichaForm data={data} onChange={setData} readOnly={!editMode} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        {editMode ? (
          <View style={s.footerRow}>
            <TouchableOpacity
              style={[s.btn, s.btnGhost]}
              activeOpacity={0.8}
              onPress={() => {
                setEditMode(false);
                loadFicha();
              }}
            >
              <Text style={s.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnPrimary]} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={T.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={T.white} />
                  <Text style={s.btnPrimaryText}>Salvar alterações</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[s.btn, s.btnPrimary]} activeOpacity={0.85} onPress={() => setEditMode(true)}>
            <Ionicons name="create-outline" size={18} color={T.white} />
            <Text style={s.btnPrimaryText}>Editar Ficha</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.rose50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: T.border,
    backgroundColor: T.white,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.rose50,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: T.dark },
  headerSubtitle: { fontSize: 11, color: T.mid, marginTop: 1 },
  footer: { padding: 16, borderTopWidth: 0.5, borderTopColor: T.border, backgroundColor: T.white },
  footerRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14,
  },
  btnPrimary: { backgroundColor: T.rose600 },
  btnPrimaryText: { color: T.white, fontSize: 14, fontWeight: '700' },
  btnGhost: { backgroundColor: T.rose50, borderWidth: 1, borderColor: T.border },
  btnGhostText: { color: T.dark, fontSize: 14, fontWeight: '700' },
});