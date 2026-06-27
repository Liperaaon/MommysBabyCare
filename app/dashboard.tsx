import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { db } from '@/firebase/config';
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// ─── Design tokens do Mommy's Baby Care ──────────────────────────────────────
const T = {
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  // aliases usados no app
  pink: '#fb7185',
  pinkDark: '#e11d48',
  blue: '#fecdd3',
  blueDark: '#f43f5e',
  cream: '#fff1f2',
  gold: '#e11d48',
  goldLight: 'rgba(225,29,72,0.10)',
  dark: '#2B2B2B',
  mid: '#6B7280',
  border: 'rgba(225,29,72,0.14)',
  white: '#FFFFFF',
  roseLight: '#fda4af',
  blueLight: 'rgba(254,205,211,0.5)',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Stat { label: string; value: string | number; }
interface Appointment { id: string; dow: string; day: number; client: string; type: string; time: string; color: string; clientId: string; }
interface Client { id: string; initials: string; name: string; lastVisit: string; badge: string; }
interface QuickAction { icon: string; label: string; desc: string; bg: string; iconColor: string; route: string; }
interface Reminder { id: string; text: string; date: string; done: boolean; notification_ids?: string[]; }

const ACTIONS: QuickAction[] = [
  { icon: 'add', label: 'Novo Atendimento', desc: 'Cadastrar paciente', route: '/clientes/create', bg: T.roseLight, iconColor: T.pinkDark },
  { icon: 'calendar-outline', label: 'Agendar', desc: 'Consulta ou Retorno', route: '/agenda/nova', bg: T.blueLight, iconColor: T.blueDark },
  { icon: 'water', label: 'Ficha de Aleitamento', desc: 'Selecionar paciente e preencher', bg: T.roseLight, iconColor: T.pinkDark, route: '/fichas/nova' },
  { icon: 'time', label: 'Histórico', desc: 'Ver atendimentos', bg: T.roseLight, iconColor: T.pinkDark, route: '/clientes' },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  const [stats, setStats] = useState<Stat[]>([
    { label: 'Clientes', value: 0 },
    { label: 'Fichas', value: 0 },
    { label: 'Atend.', value: 0 },
    { label: 'Retornos', value: 0 },
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [fichaCount, setFichaCount] = useState({ maternal: 0, furo: 0 });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [showReminderInput, setShowReminderInput] = useState(false);

  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [currentMonthClients, setCurrentMonthClients] = useState(0);

  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      // 1. STATS
      const clientsCount = await getCountFromServer(collection(db, 'clients'));
      const consCount = await getCountFromServer(collection(db, 'maternal_consultations'));
      const furosCount = await getCountFromServer(collection(db, 'furo_humanizado'));

      const returnsQuery = query(collection(db, 'scheduled_returns'), where('status', '==', 'pending'));
      const returnsCount = await getCountFromServer(returnsQuery);

      setStats([
        { label: 'Clientes', value: clientsCount.data().count },
        { label: 'Fichas', value: consCount.data().count + furosCount.data().count },
        { label: 'Atend.', value: consCount.data().count + furosCount.data().count },
        { label: 'Retornos', value: returnsCount.data().count },
      ]);

      // Helper map for client names
      const clientsSnap = await getDocs(collection(db, 'clients'));
      const clientsMap: any = {};
      clientsSnap.forEach(d => { clientsMap[d.id] = d.data(); });

      // 2. APPOINTMENTS
      // Firestore string sorting for dates is not strictly chronological if format is DD/MM/YYYY.
      // Assuming a small dataset, we fetch pending and sort in memory.
      const retSnap = await getDocs(returnsQuery);
      let rawReturns: any[] = [];
      retSnap.forEach(d => { rawReturns.push({ id: d.id, ...d.data() }); });

      rawReturns = rawReturns.sort((a, b) => {
        const pa = a.return_date ? new Date(a.return_date.split('/').reverse().join('-')).getTime() : 0;
        const pb = b.return_date ? new Date(b.return_date.split('/').reverse().join('-')).getTime() : 0;
        return pa - pb;
      }).slice(0, 5);

      const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const mappedAppts = rawReturns.map((r, i) => {
        // parsing DD/MM/YYYY
        let d = new Date();
        if (r.return_date) {
          const parts = r.return_date.split('/');
          if (parts.length === 3) {
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
          }
        }

        const clientName = clientsMap[r.client_id]?.mother_name || 'Desconhecida';

        return {
          id: r.id,
          clientId: r.client_id,
          day: d.getDate(),
          dow: dayNamesShort[d.getDay()],
          client: clientName,
          type: r.notes || 'Retorno Agendado',
          time: r.return_time || 'A confirmar',
          color: i % 2 === 0 ? T.pink : T.blue
        };
      });
      setAppointments(mappedAppts);

      // 3. RECENT CLIENTS
      const recentQ = query(collection(db, 'clients'), orderBy('created_at', 'desc'), limit(4));
      const recentSnap = await getDocs(recentQ);

      const mappedClients: Client[] = [];
      recentSnap.forEach(d => {
        const c = d.data();
        const names = (c.mother_name || '').trim().split(' ');
        let initials = '?';
        if (names.length > 1) {
          initials = (names[0][0] + names[names.length - 1][0]).toUpperCase();
        } else if (names.length === 1 && names[0].length > 0) {
          initials = (names[0][0] + (names[0][1] || '')).toUpperCase();
        }

        mappedClients.push({
          id: d.id,
          initials,
          name: c.mother_name || 'Sem nome',
          lastVisit: 'Recente',
          badge: 'Novo'
        });
      });
      setRecentClients(mappedClients);

      // 4. FICHAS
      const maternalCount = await getCountFromServer(collection(db, 'maternal_consultations'));
      const furoCount = await getCountFromServer(collection(db, 'furo_humanizado'));
      setFichaCount({ maternal: maternalCount.data().count, furo: furoCount.data().count });

      // 5. LEMBRETES
      const remindersQ = query(collection(db, 'reminders'), orderBy('created_at', 'desc'), limit(5));
      const remSnap = await getDocs(remindersQ);
      const mappedReminders: Reminder[] = [];
      remSnap.forEach(d => {
        const r = d.data();
        mappedReminders.push({ id: d.id, text: r.text || '', date: r.date || '', done: r.done || false, notification_ids: r.notification_ids || [] });
      });
      setReminders(mappedReminders);

      // 7. FINANCEIRO
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Receitas (Entradas)
      const revQ = query(collection(db, 'clients'), where('created_at', '>=', startOfMonth), where('created_at', '<=', endOfMonth));
      const revSnap = await getDocs(revQ);
      let totalRev = 0;
      let monthClientsCount = 0;
      revSnap.forEach(d => {
        monthClientsCount++;
        const c = d.data();
        if (c.amount) {
          let val = 0;
          if (typeof c.amount === 'number') {
            val = c.amount;
          } else if (typeof c.amount === 'string') {
            const raw = c.amount.replace(/[^\d,]/g, '').replace(',', '.');
            val = Number(raw) || 0;
          }
          totalRev += val;
        }
      });

      // Despesas (Saídas)
      const expQ = query(collection(db, 'expenses'), where('date', '>=', startOfMonth), where('date', '<=', endOfMonth));
      const expSnap = await getDocs(expQ);
      let totalExp = 0;
      expSnap.forEach(d => {
        const e = d.data();
        if (e.amount) {
          totalExp += Number(e.amount) || 0;
        }
      });

      setRevenue(totalRev);
      setExpenses(totalExp); // Precisamos adicionar esse estado no topo do arquivo!
      setCurrentMonthClients(monthClientsCount);

      // 8. COFRE OFFLINE
      const { OfflineVaultService } = require('@/services/OfflineVaultService');
      const items = await OfflineVaultService.getPendingItems();
      setPendingItems(items);

    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncVault = async () => {
    if (isSyncing || pendingItems.length === 0) return;
    setIsSyncing(true);

    try {
      const { uploadImageFromUri, uploadBase64String } = require('@/services/StorageService');
      const { scheduleReturnNotifications } = require('@/services/NotificationService');
      const { OfflineVaultService } = require('@/services/OfflineVaultService');

      for (const item of pendingItems) {
        const { type, clientId: cId, data: form, id: uniqueId } = item;

        let finalPhotoBefore = form.photo_before;
        let finalPhotoAfter = form.photo_after;
        let finalSignatureClient = form.signature_client;
        let finalSignatureConsultant = form.signature_consultant;

        // Furo Humanizado (tem fotos e assinaturas)
        if (type === 'furo_humanizado') {
          if (finalPhotoBefore && finalPhotoBefore.startsWith('file://')) {
            finalPhotoBefore = await uploadImageFromUri(finalPhotoBefore, `furos/${cId}/${uniqueId}_antes.jpg`);
          }
          if (finalPhotoAfter && finalPhotoAfter.startsWith('file://')) {
            finalPhotoAfter = await uploadImageFromUri(finalPhotoAfter, `furos/${cId}/${uniqueId}_depois.jpg`);
          }
          if (finalSignatureClient && finalSignatureClient.startsWith('data:image')) {
            finalSignatureClient = await uploadBase64String(finalSignatureClient, `assinaturas/${cId}/${uniqueId}_furo_client.png`);
          }
          if (finalSignatureConsultant && finalSignatureConsultant.startsWith('data:image')) {
            finalSignatureConsultant = await uploadBase64String(finalSignatureConsultant, `assinaturas/${cId}/${uniqueId}_furo_consultant.png`);
          }
        }

        // Consultoria (apenas assinaturas)
        if (type === 'maternal_consultations') {
          if (finalSignatureClient && finalSignatureClient.startsWith('data:image')) {
            finalSignatureClient = await uploadBase64String(finalSignatureClient, `assinaturas/${cId}/${uniqueId}_consultoria_client.png`);
          }
          if (finalSignatureConsultant && finalSignatureConsultant.startsWith('data:image')) {
            finalSignatureConsultant = await uploadBase64String(finalSignatureConsultant, `assinaturas/${cId}/${uniqueId}_consultoria_consultant.png`);
          }
        }

        const payload = {
          client_id: cId,
          ...form,
          photo_before: finalPhotoBefore,
          photo_after: finalPhotoAfter,
          signature_client: finalSignatureClient,
          signature_consultant: finalSignatureConsultant,
          created_at: new Date().toISOString(),
          synced_at: new Date().toISOString()
        };

        const collRef = collection(db, type);
        await addDoc(collRef, payload);

        if (form.schedule_return && form.return_date && form.return_time) {
          const retRef = collection(db, 'scheduled_returns');
          await addDoc(retRef, {
            client_id: cId,
            attendance_type: type === 'furo_humanizado' ? 'furo' : 'consultoria',
            return_date: form.return_date,
            return_time: form.return_time,
            notes: form.return_reason,
            status: 'pending',
            created_at: new Date().toISOString()
          });
          // Não temos o babyName aqui no vault salvo separadamente, passamos genérico
          await scheduleReturnNotifications(form.return_date, form.return_time, 'o bebê');
        }

        await OfflineVaultService.removeItem(item.id);
      }

      Alert.alert('Sucesso', 'Todas as fichas pendentes foram sincronizadas com a nuvem!');
      setPendingItems([]);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao sincronizar. Verifique a sua conexão de internet e tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.trim()) return;
    try {
      const { scheduleReminderNotification, requestNotificationPermissions } = require('@/services/NotificationService');
      await requestNotificationPermissions(); // Pede permissão se não tiver
      const notifIds = await scheduleReminderNotification(newReminder.trim());

      const docRef = await addDoc(collection(db, 'reminders'), {
        text: newReminder.trim(),
        done: false,
        date: new Date().toLocaleDateString('pt-BR'),
        created_at: serverTimestamp(),
        notification_ids: notifIds
      });
      setReminders(prev => [{ id: docRef.id, text: newReminder.trim(), date: new Date().toLocaleDateString('pt-BR'), done: false, notification_ids: notifIds }, ...prev]);
      setNewReminder('');
      setShowReminderInput(false);
    } catch (e) { console.error(e); }
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      const newState = !reminder.done;
      await updateDoc(doc(db, 'reminders', reminder.id), { done: newState });
      setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, done: newState } : r));

      // Se marcou como concluído, cancela as notificações futuras
      if (newState && reminder.notification_ids?.length) {
        const { cancelNotifications } = require('@/services/NotificationService');
        await cancelNotifications(reminder.notification_ids);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteReminder = async (id: string) => {
    Alert.alert('Excluir lembrete', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            const reminderToDelete = reminders.find(r => r.id === id);
            if (reminderToDelete && reminderToDelete.notification_ids?.length) {
              const { cancelNotifications } = require('@/services/NotificationService');
              await cancelNotifications(reminderToDelete.notification_ids);
            }
            await deleteDoc(doc(db, 'reminders', id));
            setReminders(prev => prev.filter(r => r.id !== id));
          } catch (e) { console.error(e); }
        }
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const today = new Date();
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dateLabel = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;

  const nextAppt = appointments.length > 0 ? appointments[0] : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={T.cream} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Cabeçalho ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <Image
              source={{ uri: 'https://i.postimg.cc/bYmQCKWB/MARCADAGUA1.png' }}
              style={s.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={s.notifBtn}
              activeOpacity={0.7}
              onPress={async () => {
                const { requestNotificationPermissions } = require('@/services/NotificationService');
                const granted = await requestNotificationPermissions();
                if (granted) {
                  alert('Notificações ativadas! Você receberá lembretes das suas agendas (24h, 3h e 30m antes).');
                } else {
                  alert('Permissão negada ou não disponível neste ambiente (Expo Go).');
                }
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={T.gold} />
            </TouchableOpacity>
          </View>
          <Text style={s.greetSub}>{dateLabel}</Text>
          <Text style={s.greetMain}>{greeting}, Raquel 👋</Text>
        </View>

        {/* ── Cofre Offline Banner ── */}
        {pendingItems.length > 0 && (
          <View style={s.vaultCard}>
            <View style={s.vaultLeft}>
              <Ionicons name="cloud-offline" size={28} color="#FFF" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={s.vaultTitle}>Modo Offline Ativo</Text>
                <Text style={s.vaultSub}>Você tem {pendingItems.length} ficha(s) salva(s) apenas no celular aguardando envio.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.vaultBtn}
              activeOpacity={0.8}
              onPress={handleSyncVault}
            >
              {isSyncing ? (
                <ActivityIndicator color={T.pinkDark} size="small" />
              ) : (
                <Text style={s.vaultBtnText}>Sincronizar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Próximo atendimento ── */}
        {nextAppt ? (
          <View style={s.nextCard}>
            <View style={s.nextBlob} />
            <View style={{ flex: 1 }}>
              <Text style={s.nextTag}>Próximo Retorno</Text>
              <Text style={s.nextName}>{nextAppt.client}</Text>
              <Text style={s.nextInfo}>{nextAppt.type}</Text>
              <View style={s.nextRow}>
                <View style={s.nextPill}>
                  <Ionicons name="calendar-outline" size={14} color={T.rose600} />
                  <Text style={s.nextPillText}>{nextAppt.dow}, {nextAppt.day}</Text>
                </View>
                <View style={s.nextBtnWrap}>
                  <TouchableOpacity
                    style={s.nextBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/clientes/${nextAppt.clientId}`)}
                  >
                    <Ionicons name="arrow-forward" size={16} color={T.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[s.nextCard, { backgroundColor: T.rose50 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.nextTag, { color: T.rose600 }]}>Próximo Atendimento</Text>
              <Text style={[s.nextName, { color: T.dark }]}>Nenhum retorno pendente</Text>
              <Text style={[s.nextInfo, { color: T.mid }]}>Seus próximos agendamentos aparecerão aqui.</Text>
            </View>
          </View>
        )}

        {/* ── Financeiro Mensal ── */}
        <TouchableOpacity 
          style={s.financeCard} 
          activeOpacity={0.8}
          onPress={() => router.push('/financeiro' as any)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View>
              <Text style={s.financeTitle}>Lucro Líquido ({new Date().toLocaleString('pt-BR', { month: 'short' }).toUpperCase()})</Text>
              <Text style={s.financeVal}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue - expenses)}
              </Text>
            </View>
            <View style={s.financeIconWrap}>
              <Ionicons name="cash-outline" size={24} color={T.gold} />
            </View>
          </View>

          <View style={s.financeDivider} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.financeMiniLabel}>Entrada de Consultas</Text>
              <Text style={s.financeMiniIncome}>+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.financeMiniLabel}>Saída de Materiais</Text>
              <Text style={s.financeMiniExpense}>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Stats ── */}
        <View style={s.statsGrid}>
          {stats.map(st => (
            <View key={st.label} style={s.statBox}>
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Ações rápidas ── */}
        <SectionTitle title="Ações rápidas" />
        <View style={s.actionsGrid}>
          {ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={s.actionCard}
              activeOpacity={0.75}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[s.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={20} color={a.iconColor} />
              </View>
              <Text style={s.actionName}>{a.label}</Text>
              <Text style={s.actionDesc}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Agenda da semana ── */}
        <SectionTitle title="Próximos Retornos" />
        <View style={s.agendaBox}>
          {appointments.length > 0 ? appointments.map((ap, i) => (
            <TouchableOpacity
              key={ap.id}
              style={[s.agendaRow, i < appointments.length - 1 && s.agendaBorder]}
              onPress={() => router.push(`/clientes/${ap.clientId}`)}
            >
              <View style={[s.agendaDot, { backgroundColor: ap.color }]} />
              <View style={s.agendaDate}>
                <Text style={s.agendaDateNum}>{ap.day}</Text>
                <Text style={s.agendaDateDow}>{ap.dow}</Text>
              </View>
              <View style={s.agendaLine}>
                <Text style={s.agendaClient}>{ap.client}</Text>
                <Text style={s.agendaType}>{ap.type}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={T.border} />
            </TouchableOpacity>
          )) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: T.mid, fontSize: 12 }}>Nenhum retorno agendado.</Text>
            </View>
          )}
        </View>

        {/* ── Bloco Ficha ── */}
        <SectionTitle title="Fichas" />
        <TouchableOpacity
          style={s.fichaCardFull}
          activeOpacity={0.75}
          onPress={() => router.push('/fichas' as any)}
        >
          <View style={[s.fichaIconWrap, { backgroundColor: T.roseLight }]}>
            <Ionicons name="document-text-outline" size={22} color={T.pinkDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fichaCardFullTitle}>Fichas de Atendimento</Text>
            <Text style={s.fichaCardFullDesc}>{(fichaCount.maternal + fichaCount.furo)} fichas cadastradas</Text>
          </View>
          <TouchableOpacity
            style={s.fichaAddBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/fichas/nova' as any)}
          >
            <Ionicons name="add" size={18} color={T.white} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={18} color={T.gold} />
        </TouchableOpacity>

        {/* ── Bloco Lembretes ── */}
        <SectionTitle title="Lembretes" />
        <View style={[s.agendaBox, { marginBottom: 20 }]}>
          {/* Header do bloco */}
          <View style={s.reminderHeader}>
            <Text style={s.reminderHeaderText}>{reminders.filter(r => !r.done).length} pendente{reminders.filter(r => !r.done).length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity
              style={s.reminderAddBtn}
              activeOpacity={0.75}
              onPress={() => setShowReminderInput(v => !v)}
            >
              <Ionicons name={showReminderInput ? 'close' : 'add'} size={16} color={T.white} />
              <Text style={s.reminderAddText}>{showReminderInput ? 'Cancelar' : 'Novo'}</Text>
            </TouchableOpacity>
          </View>

          {/* Input novo lembrete */}
          {showReminderInput && (
            <View style={s.reminderInputRow}>
              <TextInput
                style={s.reminderInput}
                placeholder="Escreva o lembrete..."
                placeholderTextColor={T.mid}
                value={newReminder}
                onChangeText={setNewReminder}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddReminder}
              />
              <TouchableOpacity style={s.reminderSaveBtn} activeOpacity={0.8} onPress={handleAddReminder}>
                <Ionicons name="checkmark" size={18} color={T.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* Lista de lembretes */}
          {reminders.length > 0 ? reminders.map((r, i) => (
            <View key={r.id} style={[s.reminderRow, i < reminders.length - 1 && s.agendaBorder]}>
              <TouchableOpacity onPress={() => handleToggleReminder(r)} activeOpacity={0.7}>
                <View style={[s.reminderCheck, r.done && s.reminderCheckDone]}>
                  {r.done && <Ionicons name="checkmark" size={12} color={T.white} />}
                </View>
              </TouchableOpacity>
              <View style={s.reminderContent}>
                <Text style={[s.reminderText, r.done && s.reminderTextDone]}>{r.text}</Text>
                {r.date ? <Text style={s.reminderDate}>{r.date}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDeleteReminder(r.id)} activeOpacity={0.7} style={s.reminderDeleteBtn}>
                <Ionicons name="trash-outline" size={14} color="rgba(225,29,72,0.5)" />
              </TouchableOpacity>
            </View>
          )) : (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: T.mid, fontSize: 12 }}>Nenhum lembrete ainda. Toque em + Novo!</Text>
            </View>
          )}
        </View>

        {/* ── Clientes recentes ── */}
        <SectionTitle title="Clientes recentes" />
        <View style={[s.agendaBox, { marginBottom: 32 }]}>
          {recentClients.length > 0 ? recentClients.map((c, i) => (
            <TouchableOpacity
              key={c.id}
              style={[s.clientRow, i < recentClients.length - 1 && s.agendaBorder]}
              onPress={() => router.push(`/clientes/${c.id}`)}
            >
              <View style={s.clientAvatar}>
                <Text style={s.clientInitials}>{c.initials}</Text>
              </View>
              <View style={s.clientInfo}>
                <Text style={s.clientName}>{c.name}</Text>
                <Text style={s.clientLast}>{c.lastVisit}</Text>
              </View>
              <View style={s.clientBadge}>
                <Text style={s.clientBadgeText}>{c.badge}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: T.mid, fontSize: 12 }}>Nenhuma cliente cadastrada.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Título de seção ──────────────────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: { paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? 12 : 4, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  logo: { width: 110, height: 44 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: T.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.border,
    shadowColor: T.gold, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  greetSub: { fontSize: 11, color: T.gold, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  greetMain: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold', color: T.dark },

  financeCard: { backgroundColor: T.dark, borderRadius: 20, padding: 20, marginBottom: 24, marginHorizontal: 20, shadowColor: T.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  financeTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  financeVal: { color: T.white, fontSize: 32, fontFamily: 'Nunito_800ExtraBold' },
  financeIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(225,29,72,0.12)', alignItems: 'center', justifyContent: 'center' },
  financeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  financeMiniLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  financeMiniIncome: { color: '#10b981', fontSize: 16, fontWeight: '700' },
  financeMiniExpense: { color: '#ef4444', fontSize: 16, fontWeight: '700' },

  // Próximo atendimento
  nextCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, backgroundColor: T.roseLight, padding: 20, flexDirection: 'row', alignItems: 'center' },
  nextBlob: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: T.roseLight, top: -40, right: -30,
  },
  nextTag: { fontSize: 11, fontWeight: '700', color: T.gold, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  nextName: { fontSize: 18, fontWeight: '800', color: T.white, marginBottom: 4 },
  nextInfo: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  nextPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(254,205,211,0.7)', borderRadius: 30, paddingVertical: 7, paddingHorizontal: 14,
  },
  nextPillText: { fontSize: 12, fontWeight: '700', color: T.pink },
  nextBtnWrap: { alignItems: 'flex-end', justifyContent: 'center' },
  nextBtn: { backgroundColor: T.white, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // Cofre Offline
  vaultCard: { backgroundColor: T.rose600, borderRadius: 20, padding: 16, marginHorizontal: 20, marginBottom: 24, shadowColor: T.rose600, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6 },
  vaultLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vaultTitle: { color: '#FFF', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  vaultSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Nunito_500Medium', marginTop: 2, lineHeight: 18 },
  vaultBtn: { backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  vaultBtnText: { color: T.rose600, fontSize: 14, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: T.white, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center',
    borderWidth: 0.5, borderColor: T.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: T.dark, lineHeight: 22, marginBottom: 4 },
  statLbl: { fontSize: 9, fontWeight: '700', color: T.gold, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' },

  // Section title
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: T.gold,
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 22, marginBottom: 12,
  },

  // Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  actionCard: {
    width: '47.5%', backgroundColor: T.white, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: T.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionName: { fontSize: 13, fontWeight: '700', color: T.dark },
  actionDesc: { fontSize: 11, color: T.mid, marginTop: 2 },

  // Agenda
  agendaBox: {
    marginHorizontal: 16, marginBottom: 20, backgroundColor: T.white,
    borderRadius: 16, borderWidth: 0.5, borderColor: T.border,
    paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  agendaBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(43,43,43,0.06)' },
  agendaDot: { width: 8, height: 8, borderRadius: 4 },
  agendaDate: { minWidth: 36, alignItems: 'center' },
  agendaDateNum: { fontSize: 17, fontWeight: '800', color: T.dark, lineHeight: 19 },
  agendaDateDow: { fontSize: 9, color: T.gold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  agendaLine: { flex: 1 },
  agendaClient: { fontSize: 13, fontWeight: '700', color: T.dark },
  agendaType: { fontSize: 11, color: T.mid },
  agendaTime: { fontSize: 12, fontWeight: '600', color: T.gold },

  // Fichas
  fichaCardFull: {
    marginHorizontal: 16, marginBottom: 20, backgroundColor: T.white,
    borderRadius: 16, borderWidth: 0.5, borderColor: T.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fichaIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fichaCardFullTitle: { fontSize: 14, fontWeight: '700', color: T.dark, marginBottom: 2 },
  fichaCardFullDesc: { fontSize: 12, color: T.mid },
  fichaAddBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: T.pink,
    alignItems: 'center', justifyContent: 'center',
  },


  // Lembretes
  reminderHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(43,43,43,0.06)',
  },
  reminderHeaderText: { fontSize: 12, color: T.mid, fontWeight: '600' },
  reminderAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.gold, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
  },
  reminderAddText: { fontSize: 11, fontWeight: '700', color: T.white },
  reminderInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(43,43,43,0.06)',
  },
  reminderInput: {
    flex: 1, fontSize: 13, color: T.dark,
    backgroundColor: T.cream, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 0.5, borderColor: T.border,
  },
  reminderSaveBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: T.pink,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  reminderCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: T.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderCheckDone: { backgroundColor: T.gold, borderColor: T.gold },
  reminderContent: { flex: 1 },
  reminderText: { fontSize: 13, fontWeight: '600', color: T.dark },
  reminderTextDone: { textDecorationLine: 'line-through', color: T.mid },
  reminderDate: { fontSize: 10, color: T.mid, marginTop: 2 },
  reminderDeleteBtn: { padding: 4 },

  // Clients
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.roseLight, alignItems: 'center', justifyContent: 'center',
  },
  clientInitials: { fontSize: 13, fontWeight: '800', color: T.pinkDark },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 14, fontWeight: '700', color: T.dark },
  clientLast: { fontSize: 12, color: T.mid },
  clientBadge: { backgroundColor: T.goldLight, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  clientBadgeText: { fontSize: 10, fontWeight: '700', color: T.gold },
});