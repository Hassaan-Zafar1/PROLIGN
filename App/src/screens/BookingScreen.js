import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Avatar, Button, Card, Icon, Input } from '../components/ui';
import { AppHeader } from '../components/MentorCard';
import { getUserById } from '../data/mockData';

const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
const DAYS = ['Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18'];

export default function BookingScreen({ route, navigation }) {
  const { mentorId } = route.params || {};
  const mentor = getUserById(mentorId);
  const [day, setDay] = useState('Mon 14');
  const [time, setTime] = useState('');
  const [method, setMethod] = useState('jazzcash');
  const [confirmed, setConfirmed] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNo, setCardNo] = useState('');

  if (!mentor) return null;
  const fee = Math.round(mentor.hourlyRate * 0.05);
  const total = mentor.hourlyRate + fee;

  if (confirmed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.successContainer, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check_circle" size={48} color={colors.success} />
          </View>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 24, color: colors.onSurface, marginTop: 18 }}>Booking Confirmed!</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center', lineHeight: 21 }}>
            Your 30-minute session with {mentor.name} is booked for {day} at {time}. A reminder has been added.
          </Text>
          <Button title="Done" size="lg" full onPress={() => navigation.popToTop()} style={{ marginTop: 26 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Confirm & Pay" subtitle="Review and complete your booking" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        {/* Mentor summary */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={mentor.name} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface }}>{mentor.name}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant }}>{mentor.title}</Text>
            </View>
          </View>
        </Card>

        {/* Pick a day */}
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface, marginTop: 18, marginBottom: 10 }}>Select a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {DAYS.map((d) => (
            <TouchableOpacity key={d} onPress={() => setDay(d)}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: day === d ? colors.primary : colors.outlineVariant, backgroundColor: day === d ? colors.primaryContainer : colors.surfaceContainerLowest }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: day === d ? colors.onPrimaryContainer : colors.onSurface }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pick a time */}
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface, marginTop: 18, marginBottom: 10 }}>Select a time</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TIMES.map((t) => (
            <TouchableOpacity key={t} onPress={() => setTime(t)}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: time === t ? colors.primary : colors.outlineVariant, backgroundColor: time === t ? colors.primaryContainer : colors.surfaceContainerLowest }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: time === t ? colors.onPrimaryContainer : colors.onSurface }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment method */}
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface, marginTop: 20, marginBottom: 10 }}>Payment method</Text>
        {[{ id: 'jazzcash', label: 'JazzCash (Sandbox)', icon: 'account_balance_wallet' }, { id: 'card', label: 'Card (Mock)', icon: 'credit_card' }].map((m) => (
          <TouchableOpacity key={m.id} onPress={() => setMethod(m.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: method === m.id ? colors.primary : colors.outlineVariant, backgroundColor: method === m.id ? colors.primaryContainer : colors.surfaceContainerLowest, marginBottom: 10 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: method === m.id ? colors.primary : colors.outline, alignItems: 'center', justifyContent: 'center' }}>
              {method === m.id ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} /> : null}
            </View>
            <Icon name={m.icon} size={20} color={colors.onSurface} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.onSurface }}>{m.label}</Text>
          </TouchableOpacity>
        ))}

        {method === 'card' ? (
          <View style={{ marginTop: 4, gap: 10 }}>
            <Input value={cardName} onChangeText={setCardName} placeholder="Name on card" autoCapitalize="words" />
            <Input value={cardNo} onChangeText={setCardNo} placeholder="Card number" keyboardType="number-pad" />
          </View>
        ) : null}

        {/* Price summary */}
        <Card style={{ marginTop: 18 }}>
          <Row label="Session fee" value={`$${mentor.hourlyRate}`} />
          <Row label="Service fee (5%)" value={`$${fee}`} />
          <View style={{ height: 1, backgroundColor: colors.outlineVariant, opacity: 0.5, marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface }}>Total</Text>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: colors.primary }}>${total}</Text>
          </View>
        </Card>

        <Button
          title={`Confirm and Pay · $${total}`}
          size="lg" full
          disabled={!time}
          onPress={() => setConfirmed(true)}
          style={{ marginTop: 18 }}
        />
        {!time ? <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>Select a time slot to continue.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
    <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant }}>{label}</Text>
    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.onSurface }}>{value}</Text>
  </View>
);
