import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import AccordionSection from '@/components/AccordionSection';
import { db } from '@/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { scheduleReturnNotifications } from '@/services/NotificationService';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { TextInputMask } from 'react-native-masked-text';
import { uploadBase64String } from '@/services/StorageService';

export default function CreateConsultationScreen() {
  const router = useRouter();
  const { clientId, clientName, babyName } = useLocalSearchParams();

  const cId = Array.isArray(clientId) ? clientId[0] : clientId;
  const cName = Array.isArray(clientName) ? clientName[0] : clientName;
  const bName = Array.isArray(babyName) ? babyName[0] : babyName;

  const [form, setForm] = useState({
    mother_age: '',
    gestational_age: '',
    current_weight: '',
    delivery_type: '',
    pregnancy_complications: '',
    skin_to_skin: '',
    breastfed_in_delivery_room: '',
    breastfeeding_status: '',
    feeding_frequency: '',
    artificial_nipples: [] as string[],
    pain_level: '0',
    diaper_pee: '',
    diaper_poop: '',
    breasts_exam: '',
    nipples_exam: '',
    breast_lesions: [] as string[],
    bleeding_side: '',
    latch_eval: '',
    position_eval: '',
    suck_eval: '',
    discussed_topics: [] as string[],
    action_plan: '',
    observations: '',
    signature_consultant: '',
    signature_client: '',
    schedule_return: false,
    return_date: '',
    return_time: '',
    return_reason: ''
  });

  const refConsultant = React.useRef<SignatureViewRef>(null);
  const refClient = React.useRef<SignatureViewRef>(null);

  const [showSignatures, setShowSignatures] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: 'artificial_nipples' | 'breast_lesions' | 'discussed_topics', item: string) => {
    setForm(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      const netState = await NetInfo.fetch();
      
      if (netState.isConnected === false) {
        const { OfflineVaultService } = require('@/services/OfflineVaultService');
        await OfflineVaultService.saveItem({
          type: 'maternal_consultations',
          clientId: cId,
          data: form
        });
        Alert.alert('Modo Offline', 'Ficha salva no cofre do seu celular! Não esqueça de sincronizar quando tiver internet.');
        router.dismissAll();
        router.push(`/clientes/${cId}`);
        return;
      }

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const uniqueId = Date.now().toString();

      let finalSignatureClient = form.signature_client;
      let finalSignatureConsultant = form.signature_consultant;

      // Upload assinaturas
      if (finalSignatureClient && finalSignatureClient.startsWith('data:image')) {
        finalSignatureClient = await uploadBase64String(finalSignatureClient, `assinaturas/${cId}/${uniqueId}_consultoria_client.png`);
      }
      if (finalSignatureConsultant && finalSignatureConsultant.startsWith('data:image')) {
        finalSignatureConsultant = await uploadBase64String(finalSignatureConsultant, `assinaturas/${cId}/${uniqueId}_consultoria_consultant.png`);
      }

      const payload = {
        client_id: cId,
        date: dateStr,
        ...form,
        signature_client: finalSignatureClient,
        signature_consultant: finalSignatureConsultant,
        created_at: new Date().toISOString()
      };

      const collRef = collection(db, 'maternal_consultations');
      await addDoc(collRef, payload);

      if (form.schedule_return && form.return_date && form.return_time) {
        const retRef = collection(db, 'scheduled_returns');
        await addDoc(retRef, {
          client_id: cId,
          attendance_type: 'consultoria',
          return_date: form.return_date,
          return_time: form.return_time,
          notes: form.return_reason,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        await scheduleReturnNotifications(form.return_date, form.return_time, bName || 'o bebê');
      }

      Alert.alert('Sucesso', 'Consultoria salva com sucesso!');
      router.dismissAll();
      router.push(`/clientes/${cId}`);

    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a consultoria e as assinaturas.');
    } finally {
      setIsSaving(false);
    }
  };

  const Radio = ({ label, field, value }: { label: string, field: string, value: string }) => {
    const isSelected = form[field as keyof typeof form] === value;
    return (
      <Pressable style={[styles.radio, isSelected && styles.radioSelected]} onPress={() => handleChange(field, value)}>
        <Text style={[styles.radioText, isSelected && styles.radioTextSelected]}>{label}</Text>
      </Pressable>
    );
  };

  const Check = ({ label, field, value }: { label: string, field: 'artificial_nipples' | 'breast_lesions' | 'discussed_topics', value: string }) => {
    const isSelected = form[field].includes(value);
    return (
      <Pressable style={styles.checkRow} onPress={() => toggleArray(field, value)}>
        <View style={[styles.checkOuter, isSelected && styles.checkOuterSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ title: 'Consultoria Materna', headerBackTitle: 'Voltar', headerTintColor: Colors.primary }} />

      <View style={styles.clientHeader}>
        <Text style={styles.clientHeaderText}>Mãe: {cName}</Text>
        {bName ? <Text style={styles.clientHeaderSub}>Bebê: {bName}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Seção 1 */}
        <AccordionSection title="1. Informações Gerais" defaultExpanded>
          <Text style={styles.label}>Idade da mãe</Text>
          <TextInput style={styles.input} value={form.mother_age} onChangeText={t => handleChange('mother_age', t)} keyboardType="numeric" placeholder="Ex: 28" />
          
          <Text style={styles.label}>Idade gestacional (semanas)</Text>
          <TextInput style={styles.input} value={form.gestational_age} onChangeText={t => handleChange('gestational_age', t)} keyboardType="numeric" placeholder="Ex: 39" />
          
          <Text style={styles.label}>Peso atual do bebê (g)</Text>
          <TextInput style={styles.input} value={form.current_weight} onChangeText={t => handleChange('current_weight', t)} keyboardType="numeric" placeholder="Ex: 3200" />
        </AccordionSection>

        {/* Seção 2 */}
        <AccordionSection title="2. Histórico Gestacional e Parto">
          <Text style={styles.label}>Tipo de parto</Text>
          <View style={styles.row}>
            <Radio label="Vaginal" field="delivery_type" value="Vaginal" />
            <Radio label="Cesárea" field="delivery_type" value="Cesárea" />
          </View>

          <Text style={styles.label}>Intercorrências?</Text>
          <TextInput style={styles.input} value={form.pregnancy_complications} onChangeText={t => handleChange('pregnancy_complications', t)} placeholder="Descreva se sim" />

          <Text style={styles.label}>Contato pele a pele na 1ª hora?</Text>
          <View style={styles.row}>
            <Radio label="Sim" field="skin_to_skin" value="Sim" />
            <Radio label="Não" field="skin_to_skin" value="Não" />
          </View>

          <Text style={styles.label}>Amamentou na sala de parto?</Text>
          <View style={styles.row}>
            <Radio label="Sim" field="breastfed_in_delivery_room" value="Sim" />
            <Radio label="Não" field="breastfed_in_delivery_room" value="Não" />
          </View>
        </AccordionSection>

        {/* Seção 3 */}
        <AccordionSection title="3. Histórico da Amamentação">
          <Text style={styles.label}>Como está hoje?</Text>
          <View style={styles.row}>
            <Radio label="Exclusiva" field="breastfeeding_status" value="Exclusiva" />
            <Radio label="Mista" field="breastfeeding_status" value="Mista" />
            <Radio label="Fórmula" field="breastfeeding_status" value="Fórmula" />
          </View>

          <Text style={styles.label}>Frequência das mamadas</Text>
          <View style={styles.row}>
            <Radio label="Livre demanda" field="feeding_frequency" value="Livre demanda" />
            <Radio label="Horários fixos" field="feeding_frequency" value="Horários fixos" />
          </View>

          <Text style={styles.label}>Uso de bicos artificiais</Text>
          <Check label="Chupeta" field="artificial_nipples" value="Chupeta" />
          <Check label="Mamadeira" field="artificial_nipples" value="Mamadeira" />
          <Check label="Intermediário de Silicone" field="artificial_nipples" value="Intermediário" />
          <Check label="Nenhum" field="artificial_nipples" value="Nenhum" />

          <Text style={styles.label}>Dor ao amamentar (0-10)</Text>
          <View style={styles.row}>
            <Radio label="0" field="pain_level" value="0" />
            <Radio label="1-3" field="pain_level" value="1-3" />
            <Radio label="4-6" field="pain_level" value="4-6" />
            <Radio label="7-10" field="pain_level" value="7-10" />
          </View>

          <Text style={styles.label}>Fraldas (24h)</Text>
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, {flex:1, marginRight:8}]} value={form.diaper_pee} onChangeText={t => handleChange('diaper_pee', t)} placeholder="Xixi (Qtd)" keyboardType="numeric" />
            <TextInput style={[styles.input, {flex:1}]} value={form.diaper_poop} onChangeText={t => handleChange('diaper_poop', t)} placeholder="Cocô (Qtd)" keyboardType="numeric" />
          </View>
        </AccordionSection>

        {/* Seção 4 */}
        <AccordionSection title="4. Exame Físico Materno">
          <Text style={styles.label}>Mamas</Text>
          <View style={styles.rowWrap}>
            <Radio label="Flácidas" field="breasts_exam" value="Flácidas" />
            <Radio label="Cheias" field="breasts_exam" value="Cheias" />
            <Radio label="Ingurgitadas" field="breasts_exam" value="Ingurgitadas" />
            <Radio label="Sinais de infecção" field="breasts_exam" value="Infecção" />
          </View>

          <Text style={styles.label}>Mamilos</Text>
          <View style={styles.rowWrap}>
            <Radio label="Protusos" field="nipples_exam" value="Protusos" />
            <Radio label="Planos" field="nipples_exam" value="Planos" />
            <Radio label="Invertidos" field="nipples_exam" value="Invertidos" />
          </View>

          <Text style={styles.label}>Lesões Mamárias</Text>
          <Check label="Nenhuma" field="breast_lesions" value="Nenhuma" />
          <Check label="Fissuras" field="breast_lesions" value="Fissuras" />
          <Check label="Escoriações" field="breast_lesions" value="Escoriações" />
          <Check label="Sangramento" field="breast_lesions" value="Sangramento" />
          
          {form.breast_lesions.includes('Sangramento') && (
             <View style={styles.rowWrap}>
              <Radio label="Esquerda" field="bleeding_side" value="Esquerda" />
              <Radio label="Direita" field="bleeding_side" value="Direita" />
            </View>
          )}
        </AccordionSection>

        {/* Seção 5 */}
        <AccordionSection title="5. Avaliação da Mamada">
          <Text style={styles.label}>Pega</Text>
          <View style={styles.row}>
            <Radio label="Correta" field="latch_eval" value="Correta" />
            <Radio label="Incorreta" field="latch_eval" value="Incorreta" />
          </View>
          <Text style={styles.label}>Posicionamento</Text>
          <View style={styles.row}>
            <Radio label="Adequado" field="position_eval" value="Adequado" />
            <Radio label="Inadequado" field="position_eval" value="Inadequado" />
          </View>
          <Text style={styles.label}>Sucção</Text>
          <View style={styles.row}>
            <Radio label="Nutritiva" field="suck_eval" value="Nutritiva" />
            <Radio label="Não Nutritiva" field="suck_eval" value="Não Nutritiva" />
          </View>
        </AccordionSection>

        {/* Seção 6 */}
        <AccordionSection title="6. Tópicos Abordados">
          <Check label="Anatomia e Fisiologia" field="discussed_topics" value="Anatomia" />
          <Check label="Posicionamento e Pega" field="discussed_topics" value="Pega" />
          <Check label="Sinais de Fome" field="discussed_topics" value="Sinais" />
          <Check label="Prevenção de Complicações" field="discussed_topics" value="Complicações" />
          <Check label="Rotina e Ordenha" field="discussed_topics" value="Rotina" />
        </AccordionSection>

        {/* Seção 7 */}
        <AccordionSection title="7. Plano de Ação">
          <TextInput 
            style={[styles.input, styles.textAreaLarge]} 
            value={form.action_plan} 
            onChangeText={t => handleChange('action_plan', t)} 
            placeholder="Orientações, recomendações e condutas..." 
            multiline textAlignVertical="top" 
          />
        </AccordionSection>

        {/* Seção 8 */}
        <AccordionSection title="8. Observações Extras">
          <TextInput 
            style={[styles.input, styles.textAreaLarge]} 
            value={form.observations} 
            onChangeText={t => handleChange('observations', t)} 
            placeholder="Anotações livres..." 
            multiline textAlignVertical="top" 
          />
        </AccordionSection>

        {/* Seção 9 */}
        <AccordionSection title="9. Agendar Retorno">
          <View style={styles.row}>
            <Radio label="Sim" field="schedule_return" value={true as any} />
            <Radio label="Não" field="schedule_return" value={false as any} />
          </View>

          {form.schedule_return && (
            <View style={{ marginTop: 10 }}>
              <TextInputMask type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={styles.input} value={form.return_date} onChangeText={t => handleChange('return_date', t)} placeholder="Data: DD/MM/AAAA" keyboardType="numeric" />
              <TextInputMask type={'datetime'} options={{ format: 'HH:mm' }} style={styles.input} value={form.return_time} onChangeText={t => handleChange('return_time', t)} placeholder="Hora: HH:MM" keyboardType="numeric" />
              <TextInput style={styles.input} value={form.return_reason} onChangeText={t => handleChange('return_reason', t)} placeholder="Motivo do retorno..." />
            </View>
          )}
        </AccordionSection>

        {/* Seção 10 */}
        <AccordionSection title="10. Assinaturas">
          {!showSignatures ? (
            <Pressable style={styles.signBtn} onPress={() => setShowSignatures(true)}>
              <Text style={styles.signBtnText}>Abrir Canvas de Assinatura</Text>
            </Pressable>
          ) : (
            <View>
              <Text style={styles.label}>Sua Assinatura (Consultora)</Text>
              <View style={styles.canvasContainer}>
                <SignatureScreen
                  ref={refConsultant}
                  onOK={(sig) => handleChange('signature_consultant', sig)}
                  webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0; width: 100%; height: 100%;}`}
                />
              </View>
              <Pressable style={styles.clearBtn} onPress={() => refConsultant.current?.clearSignature()}>
                <Text style={styles.clearBtnText}>Limpar</Text>
              </Pressable>

              <Text style={[styles.label, {marginTop: 20}]}>Assinatura da Cliente</Text>
              <View style={styles.canvasContainer}>
                <SignatureScreen
                  ref={refClient}
                  onOK={(sig) => handleChange('signature_client', sig)}
                  webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0; width: 100%; height: 100%;}`}
                />
              </View>
              <Pressable style={styles.clearBtn} onPress={() => refClient.current?.clearSignature()}>
                <Text style={styles.clearBtnText}>Limpar</Text>
              </Pressable>

              <Pressable style={styles.confirmSignBtn} onPress={() => {
                refConsultant.current?.readSignature();
                refClient.current?.readSignature();
                Alert.alert('Ok', 'Assinaturas validadas para salvar!');
              }}>
                <Text style={styles.signBtnText}>Validar Assinaturas na Tela</Text>
              </Pressable>
            </View>
          )}
        </AccordionSection>

        <Pressable 
          style={[styles.saveMainBtn, isSaving && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveMainBtnText}>{isSaving ? 'Enviando p/ Nuvem...' : 'Concluir Consultoria'}</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  clientHeader: { backgroundColor: Colors.primary, padding: 16, paddingTop: 10 },
  clientHeaderText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  clientHeaderSub: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_500Medium', opacity: 0.9 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#555', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 15, fontFamily: 'Nunito_500Medium', color: Colors.text, marginBottom: 12 },
  textAreaLarge: { height: 120 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  rowWrap: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  rowInputs: { flexDirection: 'row', marginBottom: 12 },
  radio: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#FAFAFA' },
  radioSelected: { borderColor: Colors.primary, backgroundColor: '#FFF2F5' },
  radioText: { fontFamily: 'Nunito_600SemiBold', color: '#666' },
  radioTextSelected: { color: Colors.primary, fontFamily: 'Nunito_700Bold' },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkOuter: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkOuterSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { fontSize: 15, fontFamily: 'Nunito_500Medium', color: '#555' },
  canvasContainer: { height: 150, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fafafa' },
  signBtn: { backgroundColor: '#FFF2F5', borderWidth: 1, borderColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  signBtnText: { color: Colors.primary, fontFamily: 'Nunito_700Bold' },
  clearBtn: { alignSelf: 'flex-end', marginTop: 8, padding: 4 },
  clearBtnText: { color: '#888', fontFamily: 'Nunito_600SemiBold' },
  confirmSignBtn: { backgroundColor: '#E8F4FD', borderWidth: 1, borderColor: '#17A2B8', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveMainBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 20, marginBottom: 40, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  saveMainBtnText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_800ExtraBold' }
});
