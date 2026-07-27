import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme';
import { Avatar, Badge, Card, Icon, StatCard } from '../../components/ui';
import { AppHeader } from '../../components/MentorCard';
import { getUsersByRole, getApprovedMentors, getPendingMentors, SESSIONS } from '../../data/mockData';

export default function AdminDashboard() {
  const [tab, setTab] = useState('mentors');
  const mentors = getUsersByRole('mentor');
  const mentees = getUsersByRole('mentee');
  const list = tab === 'mentors' ? mentors : mentees;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Admin" subtitle="Platform overview" right={<Avatar name="System Admin" size={40} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        {/* Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <StatCard value={mentors.length} label="Registered Mentors" icon="workspace_premium" />
          <StatCard value={mentees.length} label="Registered Mentees" icon="school" />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          <StatCard value={SESSIONS.length} label="Sessions Booked" icon="event_available" />
          <StatCard value={getPendingMentors().length} label="Pending Approval" icon="pending_actions" />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 22, marginBottom: 12 }}>
          {[{ id: 'mentors', label: 'Mentors' }, { id: 'mentees', label: 'Mentees' }].map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)}
              style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: tab === t.id ? colors.primaryContainer : 'transparent' }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: tab === t.id ? colors.onPrimaryContainer : colors.onSurfaceVariant }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <Card padded={false}>
          {list.map((u, i) => (
            <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.outlineVariant, backgroundColor: i % 2 ? colors.surfaceContainerLow : 'transparent' }}>
              <Avatar name={u.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.onSurface }}>{u.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant }} numberOfLines={1}>
                  {u.email || `${u.title || u.role}`}
                </Text>
              </View>
              {tab === 'mentors'
                ? <Badge label={u.status === 'approved' ? 'Verified' : 'Pending'} variant={u.status === 'approved' ? 'approved' : 'pending'} />
                : <Badge label="Active" variant="approved" />}
            </View>
          ))}
        </Card>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 10 }}>
          Read-only view · {list.length} {tab} total
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
