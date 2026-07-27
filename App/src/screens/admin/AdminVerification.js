import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme';
import { Avatar, Badge, Button, Card, Icon, Tag } from '../../components/ui';
import { AppHeader } from '../../components/MentorCard';
import { getPendingMentors } from '../../data/mockData';

export default function AdminVerification() {
  const pending = getPendingMentors();
  const [decided, setDecided] = useState({});

  const remaining = pending.filter((m) => !decided[m.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <AppHeader title="Verification" subtitle="Review mentor applications" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        {remaining.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="verified" size={42} color={colors.success} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface, marginTop: 12 }}>All caught up</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 }}>No pending applications.</Text>
          </Card>
        ) : (
          remaining.map((m) => (
            <Card key={m.id} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Avatar name={m.name} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface }}>{m.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant }}>{m.title} · {m.company}</Text>
                  <Badge label="Pending OTP / Review" variant="pending" style={{ marginTop: 6 }} />
                </View>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.onSurfaceVariant, marginTop: 12, lineHeight: 20 }}>{m.bio}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {m.skills.map((s) => <Tag key={s} label={s} />)}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <Button title="Approve" icon="check" size="sm" onPress={() => setDecided((d) => ({ ...d, [m.id]: 'approved' }))} />
                <Button title="Reject" variant="outline" icon="close" size="sm" onPress={() => setDecided((d) => ({ ...d, [m.id]: 'rejected' }))} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
