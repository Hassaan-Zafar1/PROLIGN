import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Avatar, Badge, Button, Card, Icon, Stars, Tag } from '../components/ui';
import { AppHeader } from '../components/MentorCard';
import { getMentorLevel, getReviewsForMentor, getUserById } from '../data/mockData';

export default function MentorProfileScreen({ route, navigation }) {
  const { mentorId } = route.params || {};
  const mentor = getUserById(mentorId);
  if (!mentor) return null;
  const level = getMentorLevel(mentor);
  const reviews = getReviewsForMentor(mentorId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Mentor" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 120 }}>
        {/* Header card (primary) */}
        <View style={{ backgroundColor: colors.primary, borderRadius: radius.xxl, padding: 20 }}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Avatar name={mentor.name} size={66} bg={colors.secondaryContainer} color={colors.onSecondaryContainer} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.onPrimary }}>{mentor.name}</Text>
                <Icon name="verified" size={18} color={colors.primaryContainer === '#2e3d1c' ? '#b8d08c' : colors.onPrimaryContainer} />
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                {mentor.title} · {mentor.company}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="star" size={15} color="#f0c419" />
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.onPrimary }}>{mentor.rating > 0 ? mentor.rating.toFixed(1) : 'New'}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>({mentor.reviews})</Text>
                </View>
              </View>
            </View>
          </View>
          {level.level ? (
            <View style={{ marginTop: 14 }}>
              <Badge label={`${level.label} · ${level.yearsDisplay}`} variant={level.level} />
            </View>
          ) : null}
        </View>

        {/* About */}
        <Card style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface, marginBottom: 6 }}>About</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 21 }}>{mentor.bio}</Text>

          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface, marginTop: 16, marginBottom: 10 }}>Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {mentor.skills.map((s) => <Tag key={s} label={s} />)}
          </View>
        </Card>

        {/* Availability */}
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface }}>Availability</Text>
            <Icon name="event" size={20} color={colors.secondary} />
          </View>
          {mentor.availability.map((a) => (
            <View key={a} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.onSurface }}>{a}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.secondary }}>Open</Text>
            </View>
          ))}
        </Card>

        {/* Reviews */}
        {reviews.length ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>Reviews</Text>
            {reviews.map((r) => (
              <View key={r.id} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar name={r.author} size={32} />
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.onSurface }}>{r.author}</Text>
                  </View>
                  <Stars rating={r.rating} size={13} />
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 20 }}>{r.text}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.outlineVariant, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant }}>Session fee</Text>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.onSurface }}>${mentor.hourlyRate}<Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant }}> /hr</Text></Text>
        </View>
        <Button title="Request Session" icon="event_available" size="lg" onPress={() => navigation.navigate('Booking', { mentorId })} />
      </View>
    </SafeAreaView>
  );
}
