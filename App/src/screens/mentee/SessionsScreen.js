import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme';
import { Avatar, Badge, Card, Icon } from '../../components/ui';
import { AppHeader } from '../../components/MentorCard';
import { useAuth } from '../../context/AuthContext';
import { getSessionsForUser, getUserById } from '../../data/mockData';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function SessionsScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const sessions = getSessionsForUser(user.id, user.role);

  const filtered = sessions.filter((s) => {
    if (tab === 'upcoming') return ['Confirmed', 'Pending'].includes(s.status);
    if (tab === 'completed') return s.status === 'Completed';
    return s.status === 'Cancelled';
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Sessions" subtitle="Your mentorship bookings" />

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)}
            style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: tab === t.id ? colors.primaryContainer : 'transparent' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: tab === t.id ? colors.onPrimaryContainer : colors.onSurfaceVariant }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="event_busy" size={40} color={colors.outline} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.onSurface, marginTop: 12 }}>No {tab} sessions</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 }}>They’ll show up here.</Text>
          </Card>
        ) : (
          filtered.map((s) => {
            const other = getUserById(user.role === 'mentor' ? s.menteeId : s.mentorId);
            return (
              <Card key={s.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={other?.name} size={46} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface }}>{other?.name}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 1 }}>{s.type}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Icon name="schedule" size={14} color={colors.onSurfaceVariant} />
                      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.onSurfaceVariant }}>{s.dateTime} · {s.time}</Text>
                    </View>
                  </View>
                  <Badge label={s.status} variant={s.status.toLowerCase()} />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
