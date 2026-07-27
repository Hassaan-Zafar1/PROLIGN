import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Avatar, Badge, Button, Card, Icon, Stars, Tag } from './ui';
import { getMentorLevel } from '../data/mockData';

export function MentorCard({ mentor, onView, onRequest }) {
  const level = getMentorLevel(mentor);
  return (
    <Card style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar name={mentor.name} size={56} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontFamily: fonts.serifBold, fontSize: 17, color: colors.onSurface }}>{mentor.name}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 1 }}>
                {mentor.title} · {mentor.company}
              </Text>
            </View>
            <Stars rating={mentor.rating} />
          </View>
          {level.level ? (
            <View style={{ marginTop: 8 }}>
              <Badge label={level.label} variant={level.level} icon={level.level === 'senior' ? 'workspace_premium' : level.level === 'intermediate' ? 'trending_up' : undefined} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {mentor.skills.slice(0, 3).map((s) => <Tag key={s} label={s} />)}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.onSurface }}>
          ${mentor.hourlyRate}<Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant }}> /hr</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="View" variant="outline" size="sm" onPress={onView} />
          <Button title="Request" size="sm" onPress={onRequest} />
        </View>
      </View>
    </Card>
  );
}

export function AppHeader({ title, subtitle, right, onBack }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 10 }}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow_back" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 24, color: colors.onSurface }}>{title}</Text>
        {subtitle ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.onSurfaceVariant, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function BrandMark({ color = colors.primary, size = 22 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name="school" size={size + 4} color={color} />
      <Text style={{ fontFamily: fonts.serifBold, fontSize: size, color }}>ProLign</Text>
    </View>
  );
}
