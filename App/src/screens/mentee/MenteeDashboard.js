import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme';
import { Avatar, Badge, Button, Card, Icon, StatCard, Tag } from '../../components/ui';
import { MentorCard } from '../../components/MentorCard';
import { useAuth } from '../../context/AuthContext';
import { getApprovedMentors, getSessionsForUser, getUserById } from '../../data/mockData';

export default function MenteeDashboard({ navigation }) {
  const { user } = useAuth();
  const mentors = getApprovedMentors().slice(0, 3);
  const sessions = getSessionsForUser(user.id, 'mentee');
  const upcoming = sessions.filter((s) => ['Confirmed', 'Pending'].includes(s.status));
  const completed = sessions.filter((s) => s.status === 'Completed');

  const openMentor = (id) => navigation.navigate('MentorProfile', { mentorId: id });
  const book = (id) => navigation.navigate('Booking', { mentorId: id });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Greeting */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant }}>Welcome back,</Text>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: colors.onSurface }}>{user.name.split(' ')[0]}</Text>
          </View>
          <Avatar name={user.name} size={48} />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <StatCard value={upcoming.length} label="Upcoming sessions" icon="event_available" />
          <StatCard value={completed.length} label="Completed" icon="task_alt" />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          <StatCard value={getApprovedMentors().length} label="Mentors available" icon="groups" />
          <StatCard value={`${completed.length * 1}`} label="Hours mentored" icon="schedule" />
        </View>

        {/* Recommended mentors */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: colors.onSurface }}>Recommended Mentors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Find Mentors')}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.secondary }}>View all</Text>
          </TouchableOpacity>
        </View>
        {mentors.map((m) => <MentorCard key={m.id} mentor={m} onView={() => openMentor(m.id)} onRequest={() => book(m.id)} />)}

        {/* Upcoming sessions */}
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: colors.onSurface, marginTop: 16, marginBottom: 12 }}>Your Sessions</Text>
        {upcoming.length === 0 ? (
          <Card><Text style={{ fontFamily: fonts.body, color: colors.onSurfaceVariant }}>No upcoming sessions yet.</Text></Card>
        ) : (
          upcoming.map((s) => {
            const mentor = getUserById(s.mentorId);
            return (
              <Card key={s.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={mentor?.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface }}>{mentor?.name}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.onSurfaceVariant, marginTop: 1 }}>{s.type} · {s.dateTime}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant }}>{s.time}</Text>
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
