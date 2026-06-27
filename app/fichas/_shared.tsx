import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Paleta (mesma do dashboard) ───────────────────────────────────────────
export const T = {
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

// ─── Tipos ──────────────────────────────────────────────────────────────────
export interface FichaAleitamento {
  // Informações gerais da mãe
  motherName: string;
  motherAge: string;
  address: string;
  phone: string;
  email: string;
  referredBy: string;
  profession: string;

  // Informações gerais do bebê
  babyName: string;
  babyBirthDate: string;
  birthWeight: string;
  dischargeWeight: string;
  currentWeight: string;
  apgar: string;
  birthPathologies: string;
  
  // Saúde
  maternityCapillaryGlycemia: string;
  maternityFormulaUse: boolean;
  maternityFormulaDays: string;
  skinColor: string;
  diabetesDiagnosis: string;
  preEclampsia: boolean;
  livesWithPartner: boolean;
  hasHelpWithBaby: boolean;
  numberOfChildren: string;
  howLongBreastfed: string;
  motherMedication: string;
  babyMedication: string;

  // Dados do Pediatra
  pediatricianName: string;
  pediatricianPhone: string;

  // Dados da Gestação
  gestationSymptoms: string[];

  // Dados do Parto
  deliveryType: 'Vaginal' | 'Cesárea' | '';
  gestationalWeeks: string;
  breastfedInDeliveryRoom: boolean;
  breastfedInDeliveryRoomTime: string;
  hadComplications: boolean;
  complicationsDesc: string;
  maternityName: string;
  obstetricianName: string;
  obstetricianPhone: string;
  chiefComplaint: string;

  // Avaliação das Mamas
  leftBreast: string;
  rightBreast: string;
  breastResources: string[];

  // Avaliação da Mamada
  averageFeedDuration: string;
  alternateBreasts: boolean;
  oneBreastAtATime: boolean;
  painWhen: string[];
  emptyingSensation: boolean;
  babyReleasesBreastSpontaneously: boolean;
  peeDiapers: string;
  poopDiapers: string;
  motherReport: string;

  // Avaliação (Mãe e Bebê)
  motherStatus: string[];
  babyStatus: string[];
  
  // Posição, Pega e Sucção
  babyPosition: string[];
  latchDetails: string[];
  suctionDetails: string[];

  // Diagnóstico inicial e tratamento
  initialDiagnosisAndTreatment: string;
  laserTherapySessions: string;
  notes: string;
  guidance: string;
  
  // Checklist de Amamentação
  checklist: string[];
}

export const EMPTY_FICHA: FichaAleitamento = {
  motherName: '', motherAge: '', address: '', phone: '', email: '', referredBy: '', profession: '',
  babyName: '', babyBirthDate: '', birthWeight: '', dischargeWeight: '', currentWeight: '', apgar: '', birthPathologies: '',
  maternityCapillaryGlycemia: '', maternityFormulaUse: false, maternityFormulaDays: '',
  skinColor: '', diabetesDiagnosis: '', preEclampsia: false,
  livesWithPartner: false, hasHelpWithBaby: false, numberOfChildren: '', howLongBreastfed: '',
  motherMedication: '', babyMedication: '',
  pediatricianName: '', pediatricianPhone: '',
  gestationSymptoms: [],
  deliveryType: '', gestationalWeeks: '', breastfedInDeliveryRoom: false, breastfedInDeliveryRoomTime: '',
  hadComplications: false, complicationsDesc: '', maternityName: '', obstetricianName: '', obstetricianPhone: '', chiefComplaint: '',
  leftBreast: '', rightBreast: '', breastResources: [],
  averageFeedDuration: '', alternateBreasts: false, oneBreastAtATime: false,
  painWhen: [], emptyingSensation: false, babyReleasesBreastSpontaneously: false,
  peeDiapers: '', poopDiapers: '', motherReport: '',
  motherStatus: [], babyStatus: [], babyPosition: [], latchDetails: [], suctionDetails: [],
  initialDiagnosisAndTreatment: '', laserTherapySessions: '', notes: '', guidance: '', checklist: [],
};

export const GUIDANCE_SUGGESTIONS = [
  'Pega correta e posicionamento', 'Sinais precoces de fome', 'Prevenção de fissuras',
  'Manejo de ingurgitamento', 'Livre demanda', 'Ordenha e armazenamento do leite',
];

// ─── Constantes para multi-seleção ──────────────────────────────────────────
const GESTATION_SYMPTOMS = ['Enjôo', 'Vômito', 'Sonolência', 'Desejos', 'Acolhimento familiar'];
const SKIN_COLORS = ['Branca', 'Ruiva', 'Amarela', 'Parda', 'Negra'];
const DIABETES_TYPES = ['Gestacional', 'Tipo I', 'Tipo II'];
const BREAST_RESOURCES = ['Bomba elétrica', 'Bomba Manual', 'Pomada cicatrizante', 'Conchas', 'Bico de Silicone', 'Mamadeira', 'Chupeta', 'Sonda de Relactação', 'Redução de mama', 'Prótese de Silicone'];
const PAIN_WHEN = ['Início', 'Durante', 'Após', 'Ardência'];
const MOTHER_STATUS = ['Mãe parece saudável', 'Mãe parece doente ou deprimida', 'Mãe relaxada e confortável', 'Mãe parece tensa e desconfortável', 'Mamas parecem saudáveis', 'Mamas avermelhadas/inchadas', 'Mama bem apoiada', 'Mama segurada com dedos na aréola'];
const BABY_STATUS = ['Bebê parece saudável', 'Bebê parece sonolento/doente', 'Bebê calmo e relaxado', 'Bebê inquieto ou chorando', 'Sinais de vínculo mãe/bebê', 'Sem contato visual/apoio frágil', 'Busca a mama quando com fome', 'Não busca, nem alcança a mama'];
const BABY_POSITION = ['Corpo/cabeça alinhados', 'Pescoço/cabeça girados', 'Seguro próximo ao corpo', 'Não é seguro próximo', 'De frente para a mama', 'Queixo/lábio afastados', 'Bebê apoiado', 'Bebê não apoiado'];
const LATCH_DETAILS = ['Aréola mais vista acima', 'Aréola mais vista abaixo', 'Boca bem aberta', 'Boca não bem aberta', 'Lábio inferior virado para fora', 'Lábios para frente/dentro', 'Queixo toca a mama', 'Queixo não toca a mama'];
const SUCTION_DETAILS = ['Lentas e profundas com pausas', 'Rápidas e superficiais', 'Solta a mama quando termina', 'Mãe tira o bebê da mama', 'Sinais de reflexo da oxitocina', 'Sem sinais de reflexo', 'Mamas leves após mamada', 'Mamas duras e brilhantes'];
const AMAMENTACAO_CHECKLIST = [
  'Parte interna da mama', 'Atrativos da mama para o bebê', 'Golden hour (hora de ouro)', 'Capacidade gástrica do bebê', 
  'Características do colostro', 'Apojadura (descida do leite)', 'Compressas', 'Chá de camomila', 'Hormônios', 
  'Baby Blue', 'Ingesta hídrica e descanso', 'Alimentação X cólica no bebê', 'Massagem e seus motivos', 
  'Sentido da sequência da massagem', 'Ordenha manual', 'Mamada ideal', 'O que não pode ocorrer na mamada', 
  'Estralo, boca invertida, chupetar', 'Como tirar o bebê do seio', 'Intervalos das mamadas', 
  'Materiais (Bomba, tipoia, concha, etc)', 'Posições para amamentação', 'Sinais de bebê satisfeito', 
  'Colocar após mamada (refluxo)', 'Fraldas dia x amamentação', 'Melhor horário para trocar fralda'
];

// ─── Helper: alterna valor em seleção múltipla ──────────────────────────────
export function toggleMultiValue(current: string[], option: string): string[] {
  if (current.includes(option)) return current.filter(v => v !== option);
  return [...current, option];
}

// ─── Componentes ────────────────────────────────────────────────────────────
export function SectionLabel({ title, icon }: { title: string; icon?: string }) {
  return (
    <View style={s.sectionLabelRow}>
      {icon ? <Ionicons name={icon as any} size={14} color={T.rose600} /> : null}
      <Text style={s.sectionLabelText}>{title}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function FieldInput({
  label, value, onChangeText, placeholder, keyboardType, multiline, flex,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric'; multiline?: boolean; flex?: number;
}) {
  return (
    <View style={[s.fieldWrap, flex ? { flex } : null]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, multiline && s.fieldInputMultiline]}
        value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={T.mid}
        keyboardType={keyboardType || 'default'} multiline={multiline}
      />
    </View>
  );
}

export function FieldSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void; }) {
  return (
    <View style={s.switchRow}>
      <Text style={s.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: T.rose100, true: T.rose300 }} thumbColor={value ? T.rose600 : T.white} />
    </View>
  );
}

export function OptionSelector({
  label, options, value, onChange, multi, fullWidth
}: {
  label: string; options: string[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean; fullWidth?: boolean;
}) {
  const selected = (opt: string) => multi ? (value as string[]).includes(opt) : value === opt;
  const handlePress = (opt: string) => {
    if (multi) onChange(toggleMultiValue(value as string[], opt));
    else onChange(value === opt ? '' : opt);
  };
  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <View style={s.chipsRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[s.chip, selected(opt) && s.chipSelected, fullWidth && { width: '100%' }]}
            activeOpacity={0.8}
            onPress={() => handlePress(opt)}
          >
            <Text style={[s.chipText, selected(opt) && s.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Formulário completo ────────────────────────────────────────────────────
export function FichaForm({
  data, onChange, readOnly,
}: {
  data: FichaAleitamento; onChange: (next: FichaAleitamento) => void; readOnly?: boolean;
}) {
  const set = <K extends keyof FichaAleitamento>(key: K, value: FichaAleitamento[K]) => {
    if (readOnly) return;
    onChange({ ...data, [key]: value });
  };

  return (
    <View pointerEvents={readOnly ? 'none' : 'auto'} style={readOnly && { opacity: 0.7 }}>
      {/* ── Informações Gerais ── */}
      <SectionLabel title="Identificação" icon="person-outline" />
      <Card>
        <FieldInput label="Nome da mãe" value={data.motherName} onChangeText={t => set('motherName', t)} />
        <View style={s.row}>
          <FieldInput label="Idade" value={data.motherAge} onChangeText={t => set('motherAge', t)} keyboardType="numeric" flex={1} />
          <FieldInput label="Profissão" value={data.profession} onChangeText={t => set('profession', t)} flex={2} />
        </View>
        <FieldInput label="Endereço" value={data.address} onChangeText={t => set('address', t)} />
        <View style={s.row}>
          <FieldInput label="Telefones" value={data.phone} onChangeText={t => set('phone', t)} flex={1} />
          <FieldInput label="Indicado por" value={data.referredBy} onChangeText={t => set('referredBy', t)} flex={1} />
        </View>
        <FieldInput label="E-mail" value={data.email} onChangeText={t => set('email', t)} />
      </Card>

      <SectionLabel title="Dados do Bebê" icon="happy-outline" />
      <Card>
        <FieldInput label="Nome do bebê" value={data.babyName} onChangeText={t => set('babyName', t)} />
        <View style={s.row}>
          <FieldInput label="Data de nasc." value={data.babyBirthDate} onChangeText={t => set('babyBirthDate', t)} placeholder="DD/MM/AAAA" flex={1} />
          <FieldInput label="Apgar" value={data.apgar} onChangeText={t => set('apgar', t)} flex={1} />
        </View>
        <View style={s.row}>
          <FieldInput label="Peso nascimento (g)" value={data.birthWeight} onChangeText={t => set('birthWeight', t)} keyboardType="numeric" flex={1} />
          <FieldInput label="Peso alta (g)" value={data.dischargeWeight} onChangeText={t => set('dischargeWeight', t)} keyboardType="numeric" flex={1} />
          <FieldInput label="Peso atual (g)" value={data.currentWeight} onChangeText={t => set('currentWeight', t)} keyboardType="numeric" flex={1} />
        </View>
        <FieldInput label="Patologias ao nascer" value={data.birthPathologies} onChangeText={t => set('birthPathologies', t)} />
        <FieldInput label="Glicemia capilar na maternidade?" value={data.maternityCapillaryGlycemia} onChangeText={t => set('maternityCapillaryGlycemia', t)} />
      </Card>

      <SectionLabel title="Saúde e Histórico" icon="medkit-outline" />
      <Card>
        <OptionSelector label="Cor da pele" options={SKIN_COLORS} value={data.skinColor} onChange={v => set('skinColor', v)} />
        <OptionSelector label="Diagnóstico de Diabetes" options={DIABETES_TYPES} value={data.diabetesDiagnosis} onChange={v => set('diabetesDiagnosis', v)} />
        <FieldSwitch label="Pré-Eclâmpsia" value={data.preEclampsia} onChange={v => set('preEclampsia', v)} />
        
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        
        <FieldSwitch label="Vive com companheiro(a)?" value={data.livesWithPartner} onChange={v => set('livesWithPartner', v)} />
        <FieldSwitch label="Tem ajuda com o bebê?" value={data.hasHelpWithBaby} onChange={v => set('hasHelpWithBaby', v)} />
        <View style={s.row}>
          <FieldInput label="Nº de Filhos" value={data.numberOfChildren} onChangeText={t => set('numberOfChildren', t)} keyboardType="numeric" flex={1} />
          <FieldInput label="Tempo amamentou (meses)" value={data.howLongBreastfed} onChangeText={t => set('howLongBreastfed', t)} flex={1} />
        </View>
        
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />

        <FieldInput label="Uso de medicação atual (Mãe)" value={data.motherMedication} onChangeText={t => set('motherMedication', t)} />
        <FieldInput label="Uso de medicação atual (Bebê)" value={data.babyMedication} onChangeText={t => set('babyMedication', t)} />
        
        <FieldSwitch label="Uso de fórmula na maternidade?" value={data.maternityFormulaUse} onChange={v => set('maternityFormulaUse', v)} />
        {data.maternityFormulaUse && (
          <FieldInput label="Quantos dias?" value={data.maternityFormulaDays} onChangeText={t => set('maternityFormulaDays', t)} keyboardType="numeric" />
        )}
      </Card>

      <SectionLabel title="Dados do Pediatra e Obstetra" icon="medical-outline" />
      <Card>
        <View style={s.row}>
          <FieldInput label="Nome Pediatra" value={data.pediatricianName} onChangeText={t => set('pediatricianName', t)} flex={1} />
          <FieldInput label="Telefone" value={data.pediatricianPhone} onChangeText={t => set('pediatricianPhone', t)} flex={1} />
        </View>
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        <View style={s.row}>
          <FieldInput label="Nome Obstetra" value={data.obstetricianName} onChangeText={t => set('obstetricianName', t)} flex={1} />
          <FieldInput label="Telefone" value={data.obstetricianPhone} onChangeText={t => set('obstetricianPhone', t)} flex={1} />
        </View>
        <FieldInput label="Nome da Maternidade" value={data.maternityName} onChangeText={t => set('maternityName', t)} />
      </Card>

      <SectionLabel title="Dados da Gestação e Parto" icon="egg-outline" />
      <Card>
        <OptionSelector label="Sintomas / Gestação" options={GESTATION_SYMPTOMS} value={data.gestationSymptoms} onChange={v => set('gestationSymptoms', v)} multi />
        
        <View style={s.row}>
          <OptionSelector label="Tipo de Parto" options={['Vaginal', 'Cesárea']} value={data.deliveryType} onChange={v => set('deliveryType', v)} />
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <FieldInput label="Idade Gestacional" value={data.gestationalWeeks} onChangeText={t => set('gestationalWeeks', t)} keyboardType="numeric" />
          </View>
        </View>
        
        <FieldSwitch label="Intercorrências" value={data.hadComplications} onChange={v => set('hadComplications', v)} />
        {data.hadComplications && (
          <FieldInput label="Quais intercorrências?" value={data.complicationsDesc} onChangeText={t => set('complicationsDesc', t)} multiline />
        )}

        <FieldSwitch label="Mamou na sala de parto?" value={data.breastfedInDeliveryRoom} onChange={v => set('breastfedInDeliveryRoom', v)} />
        {data.breastfedInDeliveryRoom && (
          <FieldInput label="Quanto tempo após?" value={data.breastfedInDeliveryRoomTime} onChangeText={t => set('breastfedInDeliveryRoomTime', t)} />
        )}
        
        <FieldInput label="Queixa Principal" value={data.chiefComplaint} onChangeText={t => set('chiefComplaint', t)} multiline />
      </Card>

      <SectionLabel title="Avaliação das Mamas e Mamada" icon="body-outline" />
      <Card>
        <FieldInput label="Mama Esquerda (Aspecto/Condição)" value={data.leftBreast} onChangeText={t => set('leftBreast', t)} multiline />
        <FieldInput label="Mama Direita (Aspecto/Condição)" value={data.rightBreast} onChangeText={t => set('rightBreast', t)} multiline />
        
        <OptionSelector label="Recursos / Intervenções" options={BREAST_RESOURCES} value={data.breastResources} onChange={v => set('breastResources', v)} multi />
        
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        
        <FieldInput label="Duração média da mamada" value={data.averageFeedDuration} onChangeText={t => set('averageFeedDuration', t)} />
        <FieldSwitch label="Alternância de mamas?" value={data.alternateBreasts} onChange={v => set('alternateBreasts', v)} />
        <FieldSwitch label="Uma mama por vez?" value={data.oneBreastAtATime} onChange={v => set('oneBreastAtATime', v)} />
        
        <OptionSelector label="Presença de Dor" options={PAIN_WHEN} value={data.painWhen} onChange={v => set('painWhen', v)} multi />
        
        <FieldSwitch label="Sensação de espertar (esvaziar)?" value={data.emptyingSensation} onChange={v => set('emptyingSensation', v)} />
        <FieldSwitch label="Bebê solta o seio por vontade própria?" value={data.babyReleasesBreastSpontaneously} onChange={v => set('babyReleasesBreastSpontaneously', v)} />
        
        <View style={s.row}>
          <FieldInput label="Fraldas Xixi (24h)" value={data.peeDiapers} onChangeText={t => set('peeDiapers', t)} keyboardType="numeric" flex={1} />
          <FieldInput label="Fraldas Cocô (24h)" value={data.poopDiapers} onChangeText={t => set('poopDiapers', t)} keyboardType="numeric" flex={1} />
        </View>
        <FieldInput label="Relato da mãe acerca da amamentação" value={data.motherReport} onChangeText={t => set('motherReport', t)} multiline />
      </Card>

      <SectionLabel title="Avaliação Clínica Direta" icon="eye-outline" />
      <Card>
        <OptionSelector label="Avaliação da Mãe" options={MOTHER_STATUS} value={data.motherStatus} onChange={v => set('motherStatus', v)} multi fullWidth />
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        <OptionSelector label="Avaliação do Bebê" options={BABY_STATUS} value={data.babyStatus} onChange={v => set('babyStatus', v)} multi fullWidth />
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        <OptionSelector label="Posição do Bebê" options={BABY_POSITION} value={data.babyPosition} onChange={v => set('babyPosition', v)} multi fullWidth />
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        <OptionSelector label="Pega" options={LATCH_DETAILS} value={data.latchDetails} onChange={v => set('latchDetails', v)} multi fullWidth />
        <View style={{ height: 1, backgroundColor: T.rose100, marginVertical: 8 }} />
        <OptionSelector label="Sucção" options={SUCTION_DETAILS} value={data.suctionDetails} onChange={v => set('suctionDetails', v)} multi fullWidth />
      </Card>

      <SectionLabel title="Diagnóstico e Plano" icon="document-text-outline" />
      <Card>
        <FieldInput label="Diagnóstico inicial e tratamento" value={data.initialDiagnosisAndTreatment} onChangeText={t => set('initialDiagnosisAndTreatment', t)} multiline />
        <FieldInput label="Sessões de laserterapia (Qtd)" value={data.laserTherapySessions} onChangeText={t => set('laserTherapySessions', t)} keyboardType="numeric" />
        <FieldInput label="Observações extras" value={data.notes} onChangeText={t => set('notes', t)} multiline />
        
        <Text style={s.fieldLabel}>Orientações dadas</Text>
        <View style={s.chipsRow}>
          {GUIDANCE_SUGGESTIONS.map(sugg => (
            <TouchableOpacity key={sugg} style={s.suggestionChip} activeOpacity={0.8} onPress={() => {
              if (readOnly) return;
              if (data.guidance.includes(sugg)) return;
              set('guidance', data.guidance ? `${data.guidance}\n• ${sugg}` : `• ${sugg}`);
            }}>
              <Ionicons name="add" size={12} color={T.rose600} />
              <Text style={s.suggestionChipText}>{sugg}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[s.fieldInput, s.fieldInputMultiline, { marginTop: 8 }]}
          value={data.guidance} onChangeText={t => set('guidance', t)}
          placeholder="Anotações livres..." placeholderTextColor={T.mid} multiline
        />
      </Card>

      <SectionLabel title="Checklist Amamentação" icon="checkbox-outline" />
      <Card>
        <OptionSelector label="Orientações e Passos Verificados" options={AMAMENTACAO_CHECKLIST} value={data.checklist} onChange={v => set('checklist', v)} multi fullWidth />
      </Card>
    </View>
  );
}

// ─── Validação ──────────────────────────────────────────────────────────────
export function validateFicha(data: FichaAleitamento): string | null {
  if (!data.motherName.trim()) return 'Informe o nome da mãe.';
  if (!data.babyName.trim()) return 'Informe o nome do bebê.';
  return null;
}

// ─── Estilos compartilhados ──────────────────────────────────────────────────
const s = StyleSheet.create({
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginBottom: 8, marginTop: 18 },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: T.rose600, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: T.white, borderRadius: 16, borderWidth: 0.5, borderColor: T.border, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  row: { flexDirection: 'row', gap: 10 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: T.mid },
  fieldInput: { backgroundColor: T.rose50, borderRadius: 10, borderWidth: 0.5, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: T.dark },
  fieldInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: T.dark, flex: 1, marginRight: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: T.rose50, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  chipSelected: { backgroundColor: T.rose600, borderColor: T.rose600 },
  chipText: { fontSize: 12, fontWeight: '600', color: T.dark, textAlign: 'center' },
  chipTextSelected: { color: T.white },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: T.rose50, borderWidth: 1, borderColor: T.border },
  suggestionChipText: { fontSize: 11, fontWeight: '600', color: T.rose600 },
});

export const sharedStyles = s;

export default function SharedComponentsDummy() { return null; }
