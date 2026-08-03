import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Avatar, Badge, Button, Card, Icon, Tag } from '../components/ui';
import { AppHeader } from '../components/MentorCard';
import { useAuth } from '../context/AuthContext';
import { getMentorLevel } from '../data/mockData';

const ROW = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}>
    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(26,40,10,0.07)', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={19} color={colors.primary} />
    </View>
    <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant, flex: 1 }}>{label}</Text>
    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.onSurface }}>{value}</Text>
  </View>
);

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const level = user.role === 'mentor' ? getMentorLevel(user) : null;
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Profile" subtitle="Your account details" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        <Card>
          <View style={{ alignItems: 'center' }}>
            <Avatar name={user.name} size={84} />
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.onSurface, marginTop: 12 }}>{user.name}</Text>
            {user.title ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 2 }}>{user.title}{user.company ? ` · ${user.company}` : ''}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Badge label={roleLabel} variant="senior" icon="verified" />
              {level?.level ? <Badge label={level.label} variant={level.level} /> : null}
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: 14 }}>
          <ROW icon="mail" label="Email" value={user.email || '—'} />
          <View style={{ height: 1, backgroundColor: colors.outlineVariant, opacity: 0.5 }} />
          <ROW icon="badge" label="Role" value={roleLabel} />
          {user.industry ? (<><View style={{ height: 1, backgroundColor: colors.outlineVariant, opacity: 0.5 }} /><ROW icon="domain" label="Industry" value={user.industry} /></>) : null}
          {user.hourlyRate ? (<><View style={{ height: 1, backgroundColor: colors.outlineVariant, opacity: 0.5 }} /><ROW icon="payments" label="Rate" value={`$${user.hourlyRate}/hr`} /></>) : null}
        </Card>

        {user.skills?.length ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface, marginBottom: 10 }}>Skills</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {user.skills.map((s) => <Tag key={s} label={s} />)}
            </View>
          </Card>
        ) : null}

        {user.bio ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface, marginBottom: 6 }}>About</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 21 }}>{user.bio}</Text>
          </Card>
        ) : null}

        <Button title="Log out" variant="error" icon="logout" full onPress={logout} style={{ marginTop: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
