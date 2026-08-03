import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme';
import { Icon, Tag } from '../../components/ui';
import { AppHeader, MentorCard } from '../../components/MentorCard';
import { getApprovedMentors, EXPERTISE_OPTIONS } from '../../data/mockData';

export default function DiscoveryScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const all = getApprovedMentors();

  const mentors = useMemo(() => {
    return all.filter((m) => {
      const matchQ = !query ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.skills.join(' ').toLowerCase().includes(query.toLowerCase()) ||
        (m.industry || '').toLowerCase().includes(query.toLowerCase());
      const matchF = filter === 'All' || m.industry === filter;
      return matchQ && matchF;
    });
  }, [query, filter]);

  const openMentor = (id) => navigation.navigate('MentorProfile', { mentorId: id });
  const book = (id) => navigation.navigate('Booking', { mentorId: id });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Discover Mentors" subtitle="Find the right expert for your goals" />

      {/* Search */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, paddingHorizontal: 14, height: 50 }}>
          <Icon name="search" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, skill or role…"
            placeholderTextColor="#9a9688"
            style={{ flex: 1, marginLeft: 8, fontFamily: fonts.body, fontSize: 15, color: colors.onSurface }}
          />
        </View>
      </View>

      {/* Filter chips */}
      <View style={{ marginTop: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {EXPERTISE_OPTIONS.map((opt) => (
            <Text
              key={opt}
              onPress={() => setFilter(opt)}
              style={{
                fontFamily: fonts.bodySemi, fontSize: 13,
                color: filter === opt ? colors.onPrimary : colors.onSurfaceVariant,
                backgroundColor: filter === opt ? colors.primary : colors.surfaceContainerHigh,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, overflow: 'hidden',
              }}
            >
              {opt}
            </Text>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 12 }}>
          {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} · sorted by relevance
        </Text>
        {mentors.map((m) => <MentorCard key={m.id} mentor={m} onView={() => openMentor(m.id)} onRequest={() => book(m.id)} />)}
      </ScrollView>
    </SafeAreaView>
  );
}
