import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import AccordionSection from '@/components/AccordionSection';
import { db } from '@/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { scheduleReturnNotifications } from '@/services/NotificationService';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { TextInputMask } from 'react-native-masked-text';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageFromUri, uploadBase64String } from '@/services/StorageService';

export default function CreateFuroScreen() {
  const router = useRouter();
  const { clientId, clientName, babyName } = useLocalSearchParams();

  const cId = Array.isArray(clientId) ? clientId[0] : clientId;
  const cName = Array.isArray(clientName) ? clientName[0] : clientName;
  const bName = Array.isArray(babyName) ? babyName[0] : babyName;

  const [form, setForm] = useState({
    date: new Date().toLocaleDateString('pt-BR'),
    time: '',
    local: '',
    procedure_notes: '',
    jewel_material: '',
    jewel_model: '',
    jewel_color: '',
    jewel_batch: '',
    jewel_supplier: '',
    allergies: '',
    medications: '',
    pre_eval_notes: '',
    left_side: '',
    right_side: '',
    complications: '',
    hygiene_guidance: false,
    pos_guidance: false,
    healing_guidance: false,
    jewel_change_guidance: false,
    alert_signs: false,
    photo_before: '',
    photo_after: '',
    consent_terms: false,
    signature_client: '',
    signature_consultant: '',
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

  const pickImage = async (field: 'photo_before' | 'photo_after') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso às suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleChange(field, result.assets[0].uri);
    }
  };

  const takePhoto = async (field: 'photo_before' | 'photo_after') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à sua câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleChange(field, result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.consent_terms) {
      Alert.alert('Atenção', 'A cliente precisa concordar com os termos de consentimento.');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      const netState = await NetInfo.fetch();
      
      if (netState.isConnected === false) {
        const { OfflineVaultService } = require('@/services/OfflineVaultService');
        await OfflineVaultService.saveItem({
          type: 'furo_humanizado',
          clientId: cId,
          data: form
        });
        Alert.alert('Modo Offline', 'Ficha salva no cofre do seu celular! Não esqueça de sincronizar quando tiver internet.');
        router.dismissAll();
        router.push(`/clientes/${cId}`);
        return;
      }

      let finalPhotoBefore = form.photo_before;
      let finalPhotoAfter = form.photo_after;
      let finalSignatureClient = form.signature_client;
      let finalSignatureConsultant = form.signature_consultant;

      const uniqueId = Date.now().toString();

      // Upload fotos
      if (finalPhotoBefore && finalPhotoBefore.startsWith('file://')) {
        finalPhotoBefore = await uploadImageFromUri(finalPhotoBefore, `furos/${cId}/${uniqueId}_antes.jpg`);
      }
      if (finalPhotoAfter && finalPhotoAfter.startsWith('file://')) {
        finalPhotoAfter = await uploadImageFromUri(finalPhotoAfter, `furos/${cId}/${uniqueId}_depois.jpg`);
      }

      // Upload assinaturas
      if (finalSignatureClient && finalSignatureClient.startsWith('data:image')) {
        finalSignatureClient = await uploadBase64String(finalSignatureClient, `assinaturas/${cId}/${uniqueId}_furo_client.png`);
      }
      if (finalSignatureConsultant && finalSignatureConsultant.startsWith('data:image')) {
        finalSignatureConsultant = await uploadBase64String(finalSignatureConsultant, `assinaturas/${cId}/${uniqueId}_furo_consultant.png`);
      }

      const collRef = collection(db, 'furo_humanizado');
      const payload = {
        client_id: cId,
        ...form,
        photo_before: finalPhotoBefore,
        photo_after: finalPhotoAfter,
        signature_client: finalSignatureClient,
        signature_consultant: finalSignatureConsultant,
        created_at: new Date().toISOString()
      };
      await addDoc(collRef, payload);

      if (form.schedule_return && form.return_date && form.return_time) {
        const retRef = collection(db, 'scheduled_returns');
        await addDoc(retRef, {
          client_id: cId,
          attendance_type: 'furo',
          return_date: form.return_date,
          return_time: form.return_time,
          notes: form.return_reason,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        await scheduleReturnNotifications(form.return_date, form.return_time, bName || 'o bebê');
      }

      Alert.alert('Sucesso', 'Furo Humanizado salvo com sucesso!');
      router.dismissAll();
      router.push(`/clientes/${cId}`);

    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o registro e as imagens.');
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

  const BooleanCheck = ({ label, field }: { label: string, field: keyof typeof form }) => {
    const isSelected = form[field] as boolean;
    return (
      <Pressable style={styles.checkRow} onPress={() => handleChange(field, !isSelected)}>
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
      <Stack.Screen options={{ title: 'Furo Humanizado', headerBackTitle: 'Voltar', headerTintColor: Colors.primary }} />

      <View style={styles.clientHeader}>
        <Text style={styles.clientHeaderText}>Mãe: {cName}</Text>
        {bName ? <Text style={styles.clientHeaderSub}>Bebê: {bName}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Seção 1 */}
        <AccordionSection title="1. Detalhes do Procedimento" defaultExpanded>
          <Text style={styles.label}>Data</Text>
          <TextInputMask type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={styles.input} value={form.date} onChangeText={t => handleChange('date', t)} placeholder="DD/MM/AAAA" keyboardType="numeric" />
          
          <Text style={styles.label}>Horário</Text>
          <TextInputMask type={'datetime'} options={{ format: 'HH:mm' }} style={styles.input} value={form.time} onChangeText={t => handleChange('time', t)} placeholder="HH:MM" keyboardType="numeric" />
          
          <Text style={styles.label}>Local (ex: Domicílio, Clínica)</Text>
          <TextInput style={styles.input} value={form.local} onChangeText={t => handleChange('local', t)} placeholder="Onde foi realizado?" />
          
          <Text style={styles.label}>Observações (Opcional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={form.procedure_notes} onChangeText={t => handleChange('procedure_notes', t)} placeholder="..." multiline textAlignVertical="top" />
        </AccordionSection>

        {/* Seção 2 */}
        <AccordionSection title="2. Joia Utilizada">
          <Text style={styles.label}>Material</Text>
          <TextInput style={styles.input} value={form.jewel_material} onChangeText={t => handleChange('jewel_material', t)} placeholder="Ouro 18k, Aço Cirúrgico..." />
          <Text style={styles.label}>Modelo</Text>
          <TextInput style={styles.input} value={form.jewel_model} onChangeText={t => handleChange('jewel_model', t)} placeholder="Bolinha, Florzinha..." />
          <Text style={styles.label}>Cor</Text>
          <TextInput style={styles.input} value={form.jewel_color} onChangeText={t => handleChange('jewel_color', t)} placeholder="Dourada, Prateada..." />
          <Text style={styles.label}>Lote da Joia</Text>
          <TextInput style={styles.input} value={form.jewel_batch} onChangeText={t => handleChange('jewel_batch', t)} placeholder="Número do lote" />
          <Text style={styles.label}>Fornecedor</Text>
          <TextInput style={styles.input} value={form.jewel_supplier} onChangeText={t => handleChange('jewel_supplier', t)} placeholder="Nome do fornecedor" />
        </AccordionSection>

        {/* Seção 3 */}
        <AccordionSection title="3. Avaliação Pré-Procedimento">
          <Text style={styles.label}>Alergias Conhecidas?</Text>
          <TextInput style={styles.input} value={form.allergies} onChangeText={t => handleChange('allergies', t)} placeholder="Nenhuma ou descreva..." />
          <Text style={styles.label}>Uso de Medicamentos?</Text>
          <TextInput style={styles.input} value={form.medications} onChangeText={t => handleChange('medications', t)} placeholder="Nenhum ou descreva..." />
          <Text style={styles.label}>Outras Anotações</Text>
          <TextInput style={[styles.input, styles.textArea]} value={form.pre_eval_notes} onChangeText={t => handleChange('pre_eval_notes', t)} placeholder="..." multiline textAlignVertical="top" />
        </AccordionSection>

        {/* Seção 4 */}
        <AccordionSection title="4. Procedimento">
          <Text style={styles.label}>Lado Esquerdo</Text>
          <View style={styles.row}>
            <Radio label="Sucesso" field="left_side" value="Sucesso" />
            <Radio label="Não realizado" field="left_side" value="Não realizado" />
          </View>

          <Text style={styles.label}>Lado Direito</Text>
          <View style={styles.row}>
            <Radio label="Sucesso" field="right_side" value="Sucesso" />
            <Radio label="Não realizado" field="right_side" value="Não realizado" />
          </View>

          <Text style={styles.label}>Intercorrências?</Text>
          <TextInput style={[styles.input, styles.textArea]} value={form.complications} onChangeText={t => handleChange('complications', t)} placeholder="Houve alguma dificuldade ou problema?" multiline textAlignVertical="top" />
        </AccordionSection>

        {/* Seção 5 */}
        <AccordionSection title="5. Orientações Fornecidas">
          <BooleanCheck label="Higienização" field="hygiene_guidance" />
          <BooleanCheck label="Cuidados pós-furo" field="pos_guidance" />
          <BooleanCheck label="Tempo de cicatrização" field="healing_guidance" />
          <BooleanCheck label="Troca da joia" field="jewel_change_guidance" />
          <BooleanCheck label="Sinais de alerta" field="alert_signs" />
        </AccordionSection>

        {/* Seção 6 */}
        <AccordionSection title="6. Fotos">
          <View style={styles.photoGrid}>
            <View style={styles.photoCol}>
              <Text style={styles.label}>Antes do Furo</Text>
              {form.photo_before ? (
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri: form.photo_before }} style={styles.photoPreview} />
                  <Pressable style={styles.photoRemove} onPress={() => handleChange('photo_before', '')}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoBtns}>
                  <Pressable style={styles.photoBtn} onPress={() => pickImage('photo_before')}><Ionicons name="images" size={24} color={Colors.primary} /></Pressable>
                  <Pressable style={styles.photoBtn} onPress={() => takePhoto('photo_before')}><Ionicons name="camera" size={24} color={Colors.primary} /></Pressable>
                </View>
              )}
            </View>

            <View style={styles.photoCol}>
              <Text style={styles.label}>Depois do Furo</Text>
              {form.photo_after ? (
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri: form.photo_after }} style={styles.photoPreview} />
                  <Pressable style={styles.photoRemove} onPress={() => handleChange('photo_after', '')}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoBtns}>
                  <Pressable style={styles.photoBtn} onPress={() => pickImage('photo_after')}><Ionicons name="images" size={24} color={Colors.primary} /></Pressable>
                  <Pressable style={styles.photoBtn} onPress={() => takePhoto('photo_after')}><Ionicons name="camera" size={24} color={Colors.primary} /></Pressable>
                </View>
              )}
            </View>
          </View>
        </AccordionSection>

        {/* Seção 7 */}
        <AccordionSection title="7. Retorno / Acompanhamento">
          <Text style={styles.label}>Agendar Revisão?</Text>
          <View style={styles.row}>
            <Radio label="Sim" field="schedule_return" value={true as any} />
            <Radio label="Não" field="schedule_return" value={false as any} />
          </View>

          {form.schedule_return && (
            <View style={{ marginTop: 10 }}>
              <TextInputMask type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={styles.input} value={form.return_date} onChangeText={t => handleChange('return_date', t)} placeholder="Data: DD/MM/AAAA" keyboardType="numeric" />
              <TextInputMask type={'datetime'} options={{ format: 'HH:mm' }} style={styles.input} value={form.return_time} onChangeText={t => handleChange('return_time', t)} placeholder="Hora: HH:MM" keyboardType="numeric" />
              <TextInput style={styles.input} value={form.return_reason} onChangeText={t => handleChange('return_reason', t)} placeholder="Motivo: Avaliação do furo..." />
            </View>
          )}
        </AccordionSection>

        {/* Seção 8 */}
        <AccordionSection title="8. Termo e Assinaturas">
          <BooleanCheck label="Li, compreendi e autorizo o procedimento detalhado no Termo de Consentimento Livre e Esclarecido." field="consent_terms" />

          {!showSignatures ? (
            <Pressable style={styles.signBtn} onPress={() => setShowSignatures(true)}>
              <Text style={styles.signBtnText}>Abrir Canvas de Assinatura</Text>
            </Pressable>
          ) : (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.label}>Sua Assinatura (Profissional)</Text>
              <View style={styles.canvasContainer}>
                <SignatureScreen
                  ref={refConsultant}
                  onOK={(sig) => handleChange('signature_consultant', sig)}
                  webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0; width: 100%; height: 100%;}`}
                />
              </View>
              <Pressable style={styles.clearBtn} onPress={() => refConsultant.current?.clearSignature()}><Text style={styles.clearBtnText}>Limpar</Text></Pressable>

              <Text style={[styles.label, {marginTop: 20}]}>Assinatura do(a) Responsável</Text>
              <View style={styles.canvasContainer}>
                <SignatureScreen
                  ref={refClient}
                  onOK={(sig) => handleChange('signature_client', sig)}
                  webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0; width: 100%; height: 100%;}`}
                />
              </View>
              <Pressable style={styles.clearBtn} onPress={() => refClient.current?.clearSignature()}><Text style={styles.clearBtnText}>Limpar</Text></Pressable>

              <Pressable style={styles.confirmSignBtn} onPress={() => {
                refConsultant.current?.readSignature();
                refClient.current?.readSignature();
                Alert.alert('Ok', 'Assinaturas processadas. Lembre-se de Concluir.');
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
          <Text style={styles.saveMainBtnText}>{isSaving ? 'Enviando p/ Nuvem...' : 'Concluir Furo Humanizado'}</Text>
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
  textArea: { height: 100 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  radio: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#FAFAFA' },
  radioSelected: { borderColor: Colors.primary, backgroundColor: '#FFF2F5' },
  radioText: { fontFamily: 'Nunito_600SemiBold', color: '#666' },
  radioTextSelected: { color: Colors.primary, fontFamily: 'Nunito_700Bold' },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingRight: 20 },
  checkOuter: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkOuterSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { fontSize: 15, fontFamily: 'Nunito_500Medium', color: '#555', flexShrink: 1, lineHeight: 20 },
  
  photoGrid: { flexDirection: 'row', gap: 16 },
  photoCol: { flex: 1 },
  photoBtns: { flexDirection: 'row', gap: 8 },
  photoBtn: { flex: 1, backgroundColor: '#FFF2F5', borderWidth: 1, borderColor: '#FFB7C5', height: 60, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  photoPreviewWrapper: { position: 'relative', width: '100%', height: 150, borderRadius: 8, overflow: 'hidden', backgroundColor: '#eee' },
  photoPreview: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  
  canvasContainer: { height: 150, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fafafa' },
  signBtn: { backgroundColor: '#FFF2F5', borderWidth: 1, borderColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  signBtnText: { color: Colors.primary, fontFamily: 'Nunito_700Bold' },
  clearBtn: { alignSelf: 'flex-end', marginTop: 8, padding: 4 },
  clearBtnText: { color: '#888', fontFamily: 'Nunito_600SemiBold' },
  confirmSignBtn: { backgroundColor: '#E8F4FD', borderWidth: 1, borderColor: '#17A2B8', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveMainBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 20, marginBottom: 40, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  saveMainBtnText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_800ExtraBold' }
});
