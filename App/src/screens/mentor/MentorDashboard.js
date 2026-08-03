import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme';
import { Avatar, Badge, Button, Card, Icon, StatCard, Stars } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getReviewsForMentor, getSessionsForUser, getUserById } from '../../data/mockData';

export default function MentorDashboard() {
  const { user } = useAuth();
  const sessions = getSessionsForUser(user.id, 'mentor');
  const [handled, setHandled] = useState({});
  const pending = sessions.filter((s) => s.status === 'Pending');
  const confirmed = sessions.filter((s) => s.status === 'Confirmed');
  const reviews = getReviewsForMentor(user.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant }}>Welcome back,</Text>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: colors.onSurface }}>{user.name.split(' ')[1] || user.name}</Text>
          </View>
          <Avatar name={user.name} size={48} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <StatCard value={pending.length} label="Pending requests" icon="pending_actions" />
          <StatCard value={confirmed.length} label="Upcoming" icon="event_available" />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          <StatCard value={user.rating?.toFixed(1) || '—'} label="Rating" icon="star" />
          <StatCard value={`$${(user.hourlyRate * 8).toLocaleString()}`} label="Earnings (mo)" icon="payments" />
        </View>

        {/* Incoming requests */}
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: colors.onSurface, marginTop: 26, marginBottom: 12 }}>Incoming Requests</Text>
        {pending.length === 0 ? (
          <Card><Text style={{ fontFamily: fonts.body, color: colors.onSurfaceVariant }}>No pending requests right now.</Text></Card>
        ) : (
          pending.map((s) => {
            const mentee = getUserById(s.menteeId);
            const state = handled[s.id];
            return (
              <Card key={s.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={mentee?.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface }}>{mentee?.name}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.onSurfaceVariant }}>{s.type} · {s.dateTime}</Text>
                  </View>
                </View>
                {state ? (
                  <Badge label={state === 'accepted' ? 'Accepted' : 'Declined'} variant={state === 'accepted' ? 'confirmed' : 'cancelled'} style={{ marginTop: 12 }} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Button title="Accept" size="sm" onPress={() => setHandled((h) => ({ ...h, [s.id]: 'accepted' }))} />
                    <Button title="Decline" variant="outline" size="sm" onPress={() => setHandled((h) => ({ ...h, [s.id]: 'declined' }))} />
                  </View>
                )}
              </Card>
            );
          })
        )}

        {/* Recent reviews */}
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: colors.onSurface, marginTop: 18, marginBottom: 12 }}>Recent Reviews</Text>
        {reviews.length === 0 ? (
          <Card><Text style={{ fontFamily: fonts.body, color: colors.onSurfaceVariant }}>No reviews yet.</Text></Card>
        ) : reviews.map((r) => (
          <Card key={r.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.onSurface }}>{r.author}</Text>
              <Stars rating={r.rating} size={13} />
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 20 }}>{r.text}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
