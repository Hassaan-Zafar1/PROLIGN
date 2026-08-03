import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadowSm } from '../theme';
import { Avatar, Badge, Button, Card, Icon } from '../components/ui';
import { BrandMark, MentorCard } from '../components/MentorCard';
import { getApprovedMentors, TESTIMONIALS } from '../data/mockData';

const STATS = [
  { icon: 'groups', value: '500+', label: 'Mentors' },
  { icon: 'event_available', value: '10,000+', label: 'Sessions' },
  { icon: 'thumb_up', value: '95%', label: 'Satisfaction' },
  { icon: 'domain', value: '50+', label: 'Industries' },
];

const STEPS = [
  { icon: 'person_search', title: 'Find your mentor', desc: 'Browse verified mentors and match by skills, industry and goals.' },
  { icon: 'event', title: 'Book a session', desc: 'Pick an open slot and book a focused 1:1 video session.' },
  { icon: 'rocket_launch', title: 'Grow faster', desc: 'Get personalised guidance and accelerate your career.' },
];

export default function LandingScreen({ navigation }) {
  const mentors = getApprovedMentors().slice(0, 4);
  const goLogin = () => navigation.navigate('Login');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <BrandMark />
        <Button title="Login" variant="outline" size="sm" onPress={goLogin} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ backgroundColor: colors.primary, marginHorizontal: 16, borderRadius: radius.xxl, padding: 24, overflow: 'hidden' }}>
          <Badge label="Trusted by 10,000+ Professionals" variant="senior" icon="workspace_premium" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 34, color: colors.onPrimary, marginTop: 16, lineHeight: 40 }}>
            Grow Faster with Expert Mentorship
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15.5, color: 'rgba(255,255,255,0.78)', marginTop: 12, lineHeight: 22 }}>
            Connect with experienced mentors, gain career guidance, and accelerate your professional journey.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button title="Get Started" variant="accent" icon="person_add" onPress={goLogin} />
            <Button title="Find a Mentor" variant="outline" onPress={goLogin}
              style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            {STATS.map((s) => (
              <View key={s.label} style={{ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: radius.md, padding: 12 }}>
                <Icon name={s.icon} size={20} color="rgba(255,255,255,0.85)" />
                <View>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onPrimary }}>{s.value}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.onSurface }}>How it works</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 14 }}>
            Three simple steps to start growing.
          </Text>
          {STEPS.map((s, i) => (
            <Card key={s.title} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={24} color={colors.onPrimaryContainer} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.onSurface }}>{`${i + 1}. ${s.title}`}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 }}>{s.desc}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Featured mentors */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.onSurface, marginBottom: 4 }}>Featured Mentors</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.onSurfaceVariant, marginBottom: 14 }}>
            Verified experts ready to guide you.
          </Text>
          {mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} onView={goLogin} onRequest={goLogin} />
          ))}
        </View>

        {/* Testimonials */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.onSurface, marginBottom: 14 }}>What members say</Text>
          {TESTIMONIALS.map((t) => (
            <Card key={t.id} style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurface, lineHeight: 21, fontStyle: 'italic' }}>
                “{t.quote}”
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
                <Avatar name={t.name} size={40} />
                <View>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.onSurface }}>{t.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant }}>{t.role} · {t.company}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* CTA footer */}
        <View style={{ marginHorizontal: 16, marginTop: 18, backgroundColor: colors.tertiary, borderRadius: radius.xxl, padding: 24 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: '#fff' }}>Ready to start?</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6, marginBottom: 16 }}>
            Join the ProLign mentorship community today.
          </Text>
          <Button title="Create your account" variant="accent" icon="arrow_forward" onPress={goLogin} />
        </View>

        <Text style={{ textAlign: 'center', color: colors.onSurfaceVariant, fontFamily: fonts.body, fontSize: 12, marginTop: 22 }}>
          ProLign · Professional guidance, aligned.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
