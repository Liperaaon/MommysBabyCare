import { Platform, Alert } from 'react-native';

let Notifications: any = null;
let Device: any = null;

try {
  // Use require so the import doesn't crash the entire app in Expo Go (Android)
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn("expo-notifications não está disponível neste ambiente (Expo Go). As notificações push locais foram desativadas para evitar crash.");
}

export async function requestNotificationPermissions() {
  if (!Notifications || !Device) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB7C5',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return false;
      }
      return true;
    } else {
      return true; 
    }
  } catch (error) {
    console.warn("Erro ao pedir permissões:", error);
    return false;
  }
}

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    const [day, month, year] = dateStr.split('/');
    const [hours, minutes] = timeStr.split(':');
    if (!day || !month || !year || !hours || !minutes) return null;
    
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  } catch (e) {
    return null;
  }
}

export async function scheduleReturnNotifications(dateStr: string, timeStr: string, babyName: string) {
  if (!Notifications) {
    console.log("Simulando agendamento (Notificações desativadas no Expo Go):", dateStr, timeStr);
    return;
  }

  const targetDate = parseDateTime(dateStr, timeStr);
  if (!targetDate) return;

  const targetTime = targetDate.getTime();
  const now = Date.now();
  const baby = babyName || 'o bebê';

  try {
    const time24h = targetTime - (24 * 60 * 60 * 1000);
    if (time24h > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Retorno agendado amanhã 📅',
          body: `Você possui um acompanhamento agendado para ${baby}.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(time24h) } as any,
      });
    }

    const time3h = targetTime - (3 * 60 * 60 * 1000);
    if (time3h > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Retorno próximo ⏰',
          body: `O acompanhamento de ${baby} ocorrerá em algumas horas.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(time3h) } as any,
      });
    }

    const time30m = targetTime - (30 * 60 * 1000);
    if (time30m > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Atendimento em breve 🚗',
          body: `Prepare-se para o atendimento de ${baby}.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(time30m) } as any,
      });
    }
  } catch (error) {
    console.warn("Erro ao agendar notificação:", error);
  }
}

export async function scheduleReminderNotification(text: string): Promise<string[]> {
  if (!Notifications) return [];
  const ids: string[] = [];
  try {
    // 1 hora depois
    const id1 = await Notifications.scheduleNotificationAsync({
      content: { title: 'Lembrete (1h) 📝', body: text, sound: true, badge: 1 },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 } as any,
    });
    ids.push(id1);

    // Amanhã às 09:00
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    tmr.setHours(9, 0, 0, 0);
    if (tmr.getTime() > Date.now()) {
      const id2 = await Notifications.scheduleNotificationAsync({
        content: { title: 'Não esqueça! 📝', body: text, sound: true, badge: 1 },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tmr } as any,
      });
      ids.push(id2);
    }
    
    // Daqui a 3 dias às 09:00
    const tmr3 = new Date();
    tmr3.setDate(tmr3.getDate() + 3);
    tmr3.setHours(9, 0, 0, 0);
    if (tmr3.getTime() > Date.now()) {
      const id3 = await Notifications.scheduleNotificationAsync({
        content: { title: 'Ainda pendente: Lembrete! 🚨', body: text, sound: true, badge: 1 },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tmr3 } as any,
      });
      ids.push(id3);
    }
  } catch(e) {
    console.warn("Erro ao agendar lembrete:", e);
  }
  return ids;
}

export async function cancelNotifications(ids: string[]) {
  if (!Notifications || !ids || ids.length === 0) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch(e) {
      console.warn("Erro ao cancelar notificação:", e);
    }
  }
}
