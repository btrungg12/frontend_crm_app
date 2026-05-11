import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { login as loginRequest, register as registerRequest } from "../../api/authApi";
import { HeaderCircleBtn, MeshScroll, NavFn, TFn } from "../../mesh/MeshComponents";
import { Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

const copy: Record<string, string> = {
  welcome: "Welcome to Mesh",
  welcomeSub: "Remember people, moments, and the little details that make relationships warmer.",
  login: "Log in",
  createAccount: "Create account",
  termsNotice: "By continuing, you agree to Mesh Terms and Privacy Policy.",
  loginWelcome: "Welcome back.\nLet's pick up where you left off.",
  emailOrPhone: "Email or phone",
  password: "Password",
  incorrectLogin: "Email or password is incorrect.",
  forgotPassword: "Forgot password?",
  continueGoogle: "Continue with Google",
  noAccount: "No account?",
  signup: "Sign up",
  or: "or",
  registerWelcome: "Start building better relationships.",
  confirmPassword: "Confirm password",
  emailExists: "This email is already registered.",
  haveAccount: "Already have an account?",
  verifyEmail: "Verify your email",
  verifyEmailDesc: "We sent a verification link to",
  checkInbox: "Check your inbox and tap the link to continue.",
  didntReceive: "Didn't receive it?",
  spamHint: "Check spam or resend the email.",
  resendEmail: "Resend email",
  verifyPhone: "Verify phone",
  sentCodeTo: "We sent a code to",
  enterCode: "Enter the 6-digit code",
  resendIn: "Resend in",
  resendCode: "Resend code",
  verify: "Verify",
  verified: "Verified",
  verifiedDesc: "Your account is ready. Let's start with the people who matter.",
  continue: "Continue",
  forgotTitle: "Reset your password",
  forgotDesc: "Enter your email or phone and we'll send reset instructions.",
  sendResetLink: "Send reset link",
  remember: "Remembered it?",
  resetPassword: "Reset password",
  resetDesc: "Create a new secure password.",
  pwLen: "At least 8 characters",
  pwSym: "Includes a number or symbol",
  pwCommon: "Avoid common passwords",
  loading: "Getting things ready",
  loadingDesc: "Preparing your relationship space..."
};

function tx(t: TFn, key: string) {
  const value = t(key);
  return value === key ? copy[key] || key : value;
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function AuthShell({ children, showBack, onBack, scroll = true, dark = false }: { children: ReactNode; showBack?: boolean; onBack?: () => void; scroll?: boolean; dark?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: dark ? mesh.green700 : mesh.green50 }}>
      <LeafBg dark={dark} />
      {showBack ? <View style={{ position: "absolute", top: 48, left: 16, zIndex: 10 }}><HeaderCircleBtn icon="chevron-back" onPress={onBack} /></View> : null}
      {scroll ? (
        <MeshScroll style={{ paddingHorizontal: 28, paddingTop: 64 }} bottom={28}>{children}</MeshScroll>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 84, paddingBottom: 28 }}>{children}</View>
      )}
    </View>
  );
}

function LeafBg({ dark }: { dark?: boolean }) {
  const color = dark ? "rgba(255,255,255,0.12)" : "rgba(31,112,72,0.10)";
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <View style={{ position: "absolute", right: -40, top: 60, width: 96, height: 260, borderRadius: 80, backgroundColor: color, transform: [{ rotate: "32deg" }] }} />
      <View style={{ position: "absolute", left: -30, bottom: 120, width: 82, height: 210, borderRadius: 80, backgroundColor: color, transform: [{ rotate: "-28deg" }] }} />
    </View>
  );
}

function Logo({ size = 56, color = mesh.green600 }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="git-network-outline" size={size * 0.78} color={color} />
    </View>
  );
}

function PrimaryButton({ disabled, label, loading, onPress }: { disabled?: boolean; label: string; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={{ borderRadius: mesh.radiusXl, backgroundColor: mesh.green700, opacity: disabled || loading ? 0.72 : 1, paddingVertical: 15, alignItems: "center", width: "100%" }}>
      {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>{label}</Text>}
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, icon }: { label: string; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: mesh.radiusXl, borderWidth: 1.5, borderColor: mesh.green700, backgroundColor: "#FFFFFF", paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, width: "100%" }}>
      {icon ? <Ionicons name={icon} size={20} color={mesh.green700} /> : null}
      <Text style={{ color: mesh.green700, fontSize: 15, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function MeshInput({ error, icon, onChangeText, placeholder, secure, value }: { error?: boolean; icon: keyof typeof Ionicons.glyphMap; onChangeText?: (value: string) => void; placeholder: string; secure?: boolean; value?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: error ? mesh.pink : mesh.line, borderRadius: mesh.radiusLg, backgroundColor: "#FFFFFF", paddingHorizontal: 14, minHeight: 52 }}>
      <Ionicons name={icon} size={18} color={error ? mesh.pink : mesh.ink400} />
      <TextInput autoCapitalize="none" onChangeText={onChangeText} value={value} placeholder={placeholder} placeholderTextColor={mesh.ink400} secureTextEntry={secure} style={{ flex: 1, color: mesh.ink900, fontSize: 15 }} />
    </View>
  );
}

function Divider({ t }: { t: TFn }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 14 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: mesh.line }} />
      <Text style={{ color: mesh.ink400, fontSize: 13 }}>{tx(t, "or")}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: mesh.line }} />
    </View>
  );
}

export function WelcomeScreen({ t, nav }: Props) {
  return (
    <AuthShell scroll={false}>
      <View style={{ flex: 1, justifyContent: "space-between", paddingTop: 20 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Logo />
          <Text style={{ color: mesh.green800, fontSize: 36, fontWeight: "900", marginTop: 32, textAlign: "center" }}>{tx(t, "welcome")}</Text>
          <Text style={{ color: mesh.ink500, fontSize: 15, lineHeight: 23, marginTop: 14, textAlign: "center", maxWidth: 280 }}>{tx(t, "welcomeSub")}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 28 }}><View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: mesh.green600 }} /><View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: mesh.green100 }} /><View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: mesh.green100 }} /></View>
        </View>
        <PrimaryButton label={tx(t, "login")} onPress={() => nav("login")} />
        <View style={{ height: 10 }} />
        <SecondaryButton label={tx(t, "createAccount")} onPress={() => nav("register")} />
        <Text style={{ color: mesh.ink400, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 18 }}>{tx(t, "termsNotice")}</Text>
      </View>
    </AuthShell>
  );
}

export function LoginScreen({ t, nav, error = false }: Props & { error?: boolean }) {
  const [emailOrPhone, setEmailOrPhone] = useState(error ? "an.nguyen@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(error ? tx(t, "incorrectLogin") : "");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setFormError("");
      await loginRequest(emailOrPhone.trim(), password);
      nav("dashboard");
    } catch (err) {
      setFormError(messageFromError(err, tx(t, "incorrectLogin")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showBack onBack={() => nav("welcome")}>
      <AuthTitle t={t} title="login" sub="loginWelcome" />
      <View style={{ gap: 12, marginBottom: 12 }}>
        <MeshInput icon="person-outline" onChangeText={setEmailOrPhone} placeholder={tx(t, "emailOrPhone")} value={emailOrPhone} />
        <MeshInput icon="lock-closed-outline" secure onChangeText={setPassword} placeholder={tx(t, "password")} value={password} error={Boolean(formError)} />
      </View>
      {formError ? <ErrorText text={formError} /> : null}
      <Pressable onPress={() => nav("forgot")} style={{ alignSelf: "flex-end", marginBottom: 16 }}><Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{tx(t, "forgotPassword")}</Text></Pressable>
      <PrimaryButton disabled={!emailOrPhone.trim() || !password} label={tx(t, "login")} loading={submitting} onPress={handleLogin} />
      <Divider t={t} />
      <SecondaryButton label={tx(t, "continueGoogle")} icon="logo-google" onPress={() => nav("loading")} />
      <InlineLink text={tx(t, "noAccount")} link={tx(t, "signup")} onPress={() => nav("register")} />
    </AuthShell>
  );
}

export function RegisterScreen({ t, nav, error = false }: Props & { error?: boolean }) {
  const [emailOrPhone, setEmailOrPhone] = useState(error ? "an.nguyen@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(error ? tx(t, "emailExists") : "");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setFormError("Password confirmation does not match.");
      return;
    }

    const trimmed = emailOrPhone.trim();
    const identityPayload = trimmed.includes("@") ? { email: trimmed } : { phone: trimmed };

    try {
      setSubmitting(true);
      setFormError("");
      await registerRequest({
        emailOrPhone: trimmed,
        password,
        ...identityPayload
      });
      nav("verifyEmail");
    } catch (err) {
      setFormError(messageFromError(err, tx(t, "emailExists")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showBack onBack={() => nav("welcome")}>
      <AuthTitle t={t} title="createAccount" sub="registerWelcome" />
      <View style={{ gap: 12, marginBottom: 12 }}>
        <MeshInput icon="person-outline" onChangeText={setEmailOrPhone} placeholder={tx(t, "emailOrPhone")} value={emailOrPhone} error={Boolean(formError)} />
        <MeshInput icon="lock-closed-outline" secure onChangeText={setPassword} placeholder={tx(t, "password")} value={password} />
        <MeshInput icon="lock-closed-outline" secure onChangeText={setConfirmPassword} placeholder={tx(t, "confirmPassword")} value={confirmPassword} />
      </View>
      {formError ? <ErrorText text={formError} /> : null}
      <PrimaryButton disabled={!emailOrPhone.trim() || !password || !confirmPassword} label={tx(t, "createAccount")} loading={submitting} onPress={handleRegister} />
      <Divider t={t} />
      <SecondaryButton label={tx(t, "continueGoogle")} icon="logo-google" />
      <InlineLink text={tx(t, "haveAccount")} link={tx(t, "login")} onPress={() => nav("login")} />
    </AuthShell>
  );
}

function AuthTitle({ t, title, sub }: { t: TFn; title: string; sub: string }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 28 }}>
      <Logo size={44} />
      <Text style={{ color: mesh.green800, fontSize: 28, fontWeight: "900", marginTop: 14 }}>{tx(t, title)}</Text>
      <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" }}>{tx(t, sub)}</Text>
    </View>
  );
}

function ErrorText({ text }: { text: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}><Ionicons name="close-circle-outline" size={14} color={mesh.pink} /><Text style={{ color: mesh.pink, fontSize: 13 }}>{text}</Text></View>;
}

function InlineLink({ text, link, onPress }: { text: string; link: string; onPress: () => void }) {
  return <Pressable onPress={onPress}><Text style={{ color: mesh.ink500, fontSize: 13, textAlign: "center", marginTop: 22 }}>{text} <Text style={{ color: mesh.green700, fontWeight: "900" }}>{link}</Text></Text></Pressable>;
}

export function VerifyEmailScreen({ t, nav }: Props) {
  return (
    <AuthShell showBack onBack={() => nav("register")}>
      <CenteredIcon icon="mail-outline" />
      <Text style={stylesTitle}>{tx(t, "verifyEmail")}</Text>
      <Text style={stylesBody}>{tx(t, "verifyEmailDesc")} <Text style={{ color: mesh.ink900, fontWeight: "900" }}>an.nguyen@gmail.com</Text></Text>
      <Text style={[stylesBody, { marginTop: 12 }]}>{tx(t, "checkInbox")}</Text>
      <View style={{ flex: 1, minHeight: 160 }} />
      <View style={{ backgroundColor: mesh.bgSubtle, borderRadius: mesh.radiusLg, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: mesh.ink900, fontSize: 13, fontWeight: "900" }}>{tx(t, "didntReceive")}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 4, marginBottom: 12 }}>{tx(t, "spamHint")}</Text>
        <SecondaryButton label={tx(t, "resendEmail")} onPress={() => nav("verifySuccess")} />
      </View>
    </AuthShell>
  );
}

export function VerifyPhoneScreen({ t, nav, resend = false }: Props & { resend?: boolean }) {
  const code = resend ? ["2", "4", "8", "1", "0", "6"] : ["", "", "", "", "", ""];
  return (
    <AuthShell showBack onBack={() => nav("register")}>
      <CenteredIcon icon="phone-portrait-outline" />
      <Text style={stylesTitle}>{tx(t, "verifyPhone")}</Text>
      <Text style={stylesBody}>{tx(t, "sentCodeTo")}{`\n`}<Text style={{ color: mesh.ink900, fontWeight: "900" }}>+84 912 345 678</Text></Text>
      <Text style={{ color: mesh.ink500, fontSize: 13, textAlign: "center", marginTop: 10, marginBottom: 24 }}>{tx(t, "enterCode")}</Text>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 18 }}>
        {code.map((digit, index) => <View key={index} style={{ width: 44, height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: digit ? mesh.green600 : mesh.ink200, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Text style={{ color: mesh.ink900, fontSize: 24, fontWeight: "900" }}>{digit}</Text></View>)}
      </View>
      <Text style={{ color: mesh.ink500, fontSize: 13, textAlign: "center" }}>{tx(t, "resendIn")} <Text style={{ color: mesh.green700, fontWeight: "900" }}>{resend ? "00:05" : "00:28"}</Text></Text>
      <View style={{ flex: 1, minHeight: 180 }} />
      {resend ? <><SecondaryButton label={tx(t, "resendCode")} onPress={() => nav("verifyPhone")} /><View style={{ height: 10 }} /></> : null}
      <PrimaryButton label={tx(t, "verify")} onPress={() => nav("verifySuccess")} />
    </AuthShell>
  );
}

export function VerifySuccessScreen({ t, nav }: Props) {
  return (
    <AuthShell scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: mesh.green600, alignItems: "center", justifyContent: "center", shadowColor: mesh.green700, shadowOpacity: 0.18, shadowRadius: 36, elevation: 8 }}>
          <Ionicons name="checkmark" size={50} color="#FFFFFF" />
        </View>
        <Text style={{ color: mesh.green800, fontSize: 30, fontWeight: "900", marginTop: 32 }}>{tx(t, "verified")}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 280, marginTop: 10 }}>{tx(t, "verifiedDesc")}</Text>
      </View>
      <PrimaryButton label={tx(t, "continue")} onPress={() => nav("dashboard")} />
    </AuthShell>
  );
}

export function ForgotScreen({ t, nav }: Props) {
  return (
    <AuthShell showBack onBack={() => nav("login")}>
      <CenteredIcon icon="lock-closed-outline" />
      <Text style={stylesTitle}>{tx(t, "forgotTitle")}</Text>
      <Text style={stylesBody}>{tx(t, "forgotDesc")}</Text>
      <View style={{ height: 28 }} />
      <MeshInput icon="person-outline" placeholder={tx(t, "emailOrPhone")} />
      <View style={{ height: 16 }} />
      <PrimaryButton label={tx(t, "sendResetLink")} onPress={() => nav("verifyEmail")} />
      <InlineLink text={tx(t, "remember")} link={tx(t, "login")} onPress={() => nav("login")} />
    </AuthShell>
  );
}

export function ResetScreen({ t, nav }: Props) {
  return (
    <AuthShell showBack onBack={() => nav("forgot")}>
      <CenteredIcon icon="lock-closed-outline" />
      <Text style={stylesTitle}>{tx(t, "resetPassword")}</Text>
      <Text style={stylesBody}>{tx(t, "resetDesc")}</Text>
      <View style={{ height: 28 }} />
      <View style={{ gap: 12 }}><MeshInput icon="lock-closed-outline" secure placeholder={tx(t, "newPassword")} /><MeshInput icon="lock-closed-outline" secure placeholder={tx(t, "confirmNewPassword")} /></View>
      <View style={{ gap: 8, paddingVertical: 16 }}>{["pwLen", "pwSym", "pwCommon"].map((key) => <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: mesh.green600, alignItems: "center", justifyContent: "center" }}><Ionicons name="checkmark" size={11} color="#FFFFFF" /></View><Text style={{ color: mesh.ink700, fontSize: 13 }}>{tx(t, key)}</Text></View>)}</View>
      <PrimaryButton label={tx(t, "resetPassword")} onPress={() => nav("verifySuccess")} />
    </AuthShell>
  );
}

export function LoadingScreen({ t }: Props) {
  return (
    <AuthShell scroll={false} dark>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Logo color="#FFFFFF" />
        <ActivityIndicator color="#FFFFFF" size="small" style={{ marginTop: 28, marginBottom: 18 }} />
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginBottom: 6 }}>{tx(t, "loading")}</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{tx(t, "loadingDesc")}</Text>
      </View>
    </AuthShell>
  );
}

function CenteredIcon({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 20 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: mesh.line, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={34} color={mesh.green700} />
      </View>
    </View>
  );
}

const stylesTitle = { color: mesh.green800, fontSize: 26, fontWeight: "900" as const, marginTop: 18, marginBottom: 8, textAlign: "center" as const };
const stylesBody = { color: mesh.ink500, fontSize: 14, lineHeight: 21, textAlign: "center" as const, maxWidth: 310, alignSelf: "center" as const };
