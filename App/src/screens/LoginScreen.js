import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Button, Card, Icon, Input } from '../components/ui';
import { BrandMark } from '../components/MentorCard';
import { useAuth } from '../context/AuthContext';

const DEMO = [
  { role: 'mentee', label: 'Mentee', email: 'mentee@prolign.com', pwd: 'mentee123', icon: 'school' },
  { role: 'mentor', label: 'Mentor', email: 'mentor@prolign.com', pwd: 'mentor123', icon: 'workspace_premium' },
  { role: 'admin', label: 'Admin', email: 'admin@prolign.com', pwd: 'password123', icon: 'shield' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    const res = login(email, password);
    if (!res.ok) setError(res.error);
  };

  const fill = (d) => { setEmail(d.email); setPassword(d.pwd); setError(''); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            <Icon name="arrow_back" size={18} color={colors.onSurfaceVariant} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.onSurfaceVariant }}>Home</Text>
          </TouchableOpacity>

          {/* Brand hero */}
          <View style={{ backgroundColor: colors.primary, marginHorizontal: 16, borderRadius: radius.xxl, padding: 22, marginTop: 6 }}>
            <BrandMark color={colors.onPrimary} />
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: colors.onPrimary, marginTop: 16, lineHeight: 32 }}>
              Grow Faster with Expert Mentorship
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
              Connect with experienced mentors and accelerate your professional journey.
            </Text>
          </View>

          {/* Auth card */}
          <Card style={{ marginHorizontal: 16, marginTop: 18 }}>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 24, color: colors.onSurface }}>Welcome Back</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 18 }}>
              Sign in to continue your mentorship journey.
            </Text>

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorContainer, borderRadius: radius.md, padding: 12, marginBottom: 14 }}>
                <Icon name="error" size={18} color={colors.onErrorContainer} />
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.onErrorContainer, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.onSurface, marginBottom: 6 }}>Email Address</Text>
            <Input value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail" keyboardType="email-address" />

            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.onSurface, marginTop: 14, marginBottom: 6 }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Input value={password} onChangeText={setPassword} placeholder="Enter your password" icon="lock" secureTextEntry={!show} />
              </View>
              <TouchableOpacity onPress={() => setShow(!show)} style={{ position: 'absolute', right: 12, padding: 8 }}>
                <Icon name={show ? 'visibility_off' : 'visibility'} size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Button title="Login" full size="lg" onPress={submit} style={{ marginTop: 20 }} />
          </Card>

          {/* Quick demo logins */}
          <View style={{ marginHorizontal: 16, marginTop: 18 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Quick login
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {DEMO.map((d) => (
                <TouchableOpacity key={d.role} activeOpacity={0.85} onPress={() => fill(d)} style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', gap: 6 }}>
                  <Icon name={d.icon} size={22} color={colors.primary} />
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.onSurface }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' }}>
              Tap a role to auto-fill its demo credentials, then press Login.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
