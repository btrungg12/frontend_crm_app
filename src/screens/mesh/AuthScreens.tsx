import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useRef, useState } from "react";
import { ActivityIndicator, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";

import {
  forgotPassword as forgotPasswordRequest,
  login as loginRequest,
  register as registerRequest,
  resendOtp as resendOtpRequest,
  resetPassword as resetPasswordRequest,
  setupName as setupNameRequest,
  verifyOtp as verifyOtpRequest,
} from "../../api/authApi";
import { HeaderCircleBtn, MeshScroll, NavFn, TFn } from "../../mesh/MeshComponents";
import { Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";
import { registerPushToken } from "../../utils/registerPushToken";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

const copy: Record<string, string> = {
  welcome: "Welcome to Relish",
  welcomeSub: "Remember people, moments, and the little details that make relationships warmer.",
  login: "Log in",
  createAccount: "Create account",
  termsNotice: "By continuing, you agree to Relish Terms and Privacy Policy.",
  loginWelcome: "Welcome back.\nLet's pick up where you left off.",
  emailOrPhone: "Email or phone",
  password: "Password",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  incorrectLogin: "Email or password is incorrect.",
  forgotPassword: "Forgot password?",
  continueGoogle: "Continue with Google",
  noAccount: "No account?",
  signup: "Sign up",
  or: "or",
  registerWelcome: "Start building better relationships.",
  emailExists: "This email is already registered.",
  haveAccount: "Already have an account?",
  verifyEmail: "Verify your email",
  verifyEmailDesc: "We sent a 6-digit code to",
  enterCode: "Enter the 6-digit code",
  didntReceive: "Didn't receive it?",
  resendEmail: "Resend code",
  verifyPhone: "Verify phone",
  sentCodeTo: "We sent a code to",
  resendIn: "Resend in",
  resendCode: "Resend code",
  resending: "Resending...",
  verify: "Verify",
  verified: "Verified",
  verifiedDesc: "Your account is ready. Please log in to continue.",
  continue: "Continue",
  forgotTitle: "Reset your password",
  forgotDesc: "Enter your email or phone and we'll send you a reset code.",
  sendResetLink: "Send reset code",
  remember: "Remembered it?",
  resetPassword: "Reset password",
  resetDesc: "Enter the code we sent you and your new password.",
  otpCode: "OTP code",
  pwLen: "At least 6 characters",
  pwSym: "Includes a number or symbol",
  pwCommon: "Avoid common passwords",
  loading: "Getting things ready",
  loadingDesc: "Preparing your relationship space...",
  setupName: "What's your name?",
  setupNameSub: "Add your name so people know who you are.",
  yourName: "Your name",
};

const onboardingSlides = [
  {
    image: require("../../../assets/logo_1.png"),
    title: "Welcome to Relish",
    subtitle: "Build better relationships by saving what matters about the people around you.",
  },
  {
    image: require("../../../assets/logo_2.png"),
    title: "Capture quick notes",
    subtitle: "Write down thoughts, feelings, and small details you want to remember.",
  },
  {
    image: require("../../../assets/logo_3.png"),
    title: "Create contact profiles",
    subtitle: "Keep meaningful information about the people who matter most.",
  },
];

const welcomeLeafLeft = require("../../../assets/welcome_leaf_left.png");
const welcomeLeafRight = require("../../../assets/welcome_leaf_right.png");

function tx(t: TFn, key: string) {
  const value = t(key);
  return value === key ? copy[key] || key : value;
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function AuthShell({ children, showBack, onBack, scroll = true, dark = false, showLeafBg = true }: { children: ReactNode; showBack?: boolean; onBack?: () => void; scroll?: boolean; dark?: boolean; showLeafBg?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: dark ? mesh.green700 : mesh.green50 }}>
      {showLeafBg ? <LeafBg dark={dark} /> : null}
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

function SecondaryButton({ label, loading, onPress, icon }: { label: string; loading?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={{ borderRadius: mesh.radiusXl, borderWidth: 1.5, borderColor: mesh.green700, backgroundColor: "#FFFFFF", paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, width: "100%", opacity: loading ? 0.7 : 1 }}>
      {icon ? <Ionicons name={icon} size={20} color={mesh.green700} /> : null}
      {loading ? <ActivityIndicator color={mesh.green700} size="small" /> : <Text style={{ color: mesh.green700, fontSize: 15, fontWeight: "900" }}>{label}</Text>}
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

// ─── Welcome ─────────────────────────────────────────────────────────────────

export function WelcomeScreen({ t, nav }: Props) {
  const { width } = useWindowDimensions();
  const pageWidth = Math.max(280, width - 56);
  const [page, setPage] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  const goToPage = (nextPage: number) => {
    const clamped = Math.max(0, Math.min(onboardingSlides.length - 1, nextPage));
    pagerRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
    setPage(clamped);
  };

  const handlePagerScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
    <AuthShell scroll={false} showLeafBg={false}>
      <View style={{ flex: 1, justifyContent: "space-between", paddingTop: 20 }}>
        <View style={{ flex: 1 }}>
          <View pointerEvents="none" style={{ bottom: 210, left: -42, position: "absolute", top: 40, width: 220, zIndex: 0 }}>
            <Image source={welcomeLeafLeft} resizeMode="contain" style={{ height: 360, opacity: 0.9, width: 220 }} />
          </View>
          <View pointerEvents="none" style={{ bottom: 230, position: "absolute", right: -40, top: -70, width: 235, zIndex: 0 }}>
            <Image source={welcomeLeafRight} resizeMode="contain" style={{ height: 360, opacity: 0.9, width: 235 }} />
          </View>
          <Pressable onPress={() => goToPage(onboardingSlides.length - 1)} hitSlop={10} style={{ alignSelf: "flex-end", marginBottom: 10 }}>
            <Text style={{ color: mesh.green800, fontSize: 15, fontWeight: "800" }}>Skip</Text>
          </Pressable>
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePagerScrollEnd}
            style={{ flexGrow: 0 }}
          >
            {onboardingSlides.map((slide) => (
              <View key={slide.title} style={{ width: pageWidth, alignItems: "center", justifyContent: "center", paddingTop: 34 }}>
                <View style={{ width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.72)", borderWidth: 1, borderColor: "rgba(6,69,50,0.06)" }}>
                  <Image source={slide.image} resizeMode="contain" style={{ width: 170, height: 170 }} />
                </View>
                <Text style={{ color: mesh.green800, fontSize: 30, fontWeight: "900", lineHeight: 36, marginTop: 34, textAlign: "center" }}>{slide.title}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 15, lineHeight: 23, marginTop: 14, textAlign: "center", maxWidth: 300 }}>{slide.subtitle}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 10, justifyContent: "center", marginTop: 26 }}>
            {onboardingSlides.map((slide, index) => (
              <View
                key={slide.title}
                style={{
                  width: page === index ? 28 : 9,
                  height: 9,
                  borderRadius: 999,
                  backgroundColor: page === index ? mesh.green600 : "rgba(6,69,50,0.12)",
                }}
              />
            ))}
          </View>
        </View>
        <PrimaryButton label={tx(t, "login")} onPress={() => nav("login")} />
        <View style={{ height: 10 }} />
        <SecondaryButton label={tx(t, "createAccount")} onPress={() => nav("register")} />
        <Text style={{ color: mesh.ink400, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 18 }}>{tx(t, "termsNotice")}</Text>
      </View>
    </AuthShell>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

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
      registerPushToken().catch(() => undefined);
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

// ─── Register ─────────────────────────────────────────────────────────────────

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

    try {
      setSubmitting(true);
      setFormError("");
      await registerRequest({ emailOrPhone: trimmed, password });
      nav("verifyEmail", { emailOrPhone: trimmed });
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

// ─── Verify Email (OTP entry) ─────────────────────────────────────────────────
// Used after Register. emailOrPhone comes from nav props.
// Calls POST /auth/verify-otp → if needsName → setupName, else → verifySuccess.

export function VerifyEmailScreen({ t, nav, emailOrPhone }: Props & { emailOrPhone?: string }) {
  const target = emailOrPhone?.trim() || "";

  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const handleVerify = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length < 4) {
      setFormError("Please enter the verification code.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      const res = await verifyOtpRequest(target, trimmedOtp);
      if ((res as Record<string, unknown>).needsName) {
        nav("setupName");
      } else {
        nav("verifySuccess");
      }
    } catch (err) {
      setFormError(messageFromError(err, "Invalid or expired code. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!target) return;
    try {
      setResending(true);
      setFormError("");
      await resendOtpRequest(target);
      setResendDone(true);
    } catch (err) {
      setFormError(messageFromError(err, "Could not resend code. Try again."));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell showBack onBack={() => nav("register")}>
      <CenteredIcon icon="mail-outline" />
      <Text style={stylesTitle}>{tx(t, "verifyEmail")}</Text>
      <Text style={stylesBody}>
        {tx(t, "verifyEmailDesc")}{"\n"}
        <Text style={{ color: mesh.ink900, fontWeight: "900" }}>{target || "your email"}</Text>
      </Text>
      <View style={{ height: 24 }} />
      <MeshInput
        icon="keypad-outline"
        placeholder={tx(t, "enterCode")}
        value={otp}
        onChangeText={(v) => { setOtp(v); setFormError(""); }}
        error={Boolean(formError)}
      />
      {formError ? <ErrorText text={formError} /> : null}
      {resendDone ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Ionicons name="checkmark-circle-outline" size={14} color={mesh.green600} />
          <Text style={{ color: mesh.green600, fontSize: 13 }}>Code sent!</Text>
        </View>
      ) : null}
      <View style={{ height: 14 }} />
      <PrimaryButton
        disabled={otp.trim().length < 4}
        label={tx(t, "verify")}
        loading={submitting}
        onPress={handleVerify}
      />
      <View style={{ height: 10 }} />
      <SecondaryButton
        label={resending ? tx(t, "resending") : tx(t, "resendEmail")}
        loading={resending}
        onPress={handleResend}
      />
    </AuthShell>
  );
}

// ─── Setup Name (after OTP when needsName: true) ──────────────────────────────

export function SetupNameScreen({ t, nav }: Props) {
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSetupName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Please enter your name.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      await setupNameRequest(trimmed);
      registerPushToken().catch(() => undefined);
      nav("dashboard");
    } catch (err) {
      setFormError(messageFromError(err, "Could not save your name. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AuthTitle t={t} title="setupName" sub="setupNameSub" />
      <MeshInput
        icon="person-outline"
        placeholder={tx(t, "yourName")}
        value={name}
        onChangeText={(v) => { setName(v); setFormError(""); }}
        error={Boolean(formError)}
      />
      {formError ? <ErrorText text={formError} /> : null}
      <View style={{ height: 14 }} />
      <PrimaryButton
        disabled={!name.trim()}
        label={tx(t, "continue")}
        loading={submitting}
        onPress={handleSetupName}
      />
    </AuthShell>
  );
}

// ─── Verify Phone (secondary OTP screen for phone numbers) ────────────────────

export function VerifyPhoneScreen({ t, nav, emailOrPhone, phone, resend = false }: Props & { emailOrPhone?: string; phone?: string; resend?: boolean }) {
  const target = phone?.trim() || emailOrPhone?.trim() || "";
  const code = resend ? ["2", "4", "8", "1", "0", "6"] : ["", "", "", "", "", ""];

  return (
    <AuthShell showBack onBack={() => nav("register")}>
      <CenteredIcon icon="phone-portrait-outline" />
      <Text style={stylesTitle}>{tx(t, "verifyPhone")}</Text>
      <Text style={stylesBody}>{tx(t, "sentCodeTo")}{`\n`}<Text style={{ color: mesh.ink900, fontWeight: "900" }}>{target || "your phone"}</Text></Text>
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

// ─── Verify Success ───────────────────────────────────────────────────────────

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
      <PrimaryButton label={tx(t, "continue")} onPress={() => nav("login")} />
    </AuthShell>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
// Calls POST /auth/forgot-password, then navigates to ResetScreen with emailOrPhone.

export function ForgotScreen({ t, nav }: Props) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleForgot = async () => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      setFormError("");
      await forgotPasswordRequest(trimmed);
      nav("reset", { emailOrPhone: trimmed });
    } catch (err) {
      setFormError(messageFromError(err, "Could not send reset code. Check your email or phone."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showBack onBack={() => nav("login")}>
      <CenteredIcon icon="lock-closed-outline" />
      <Text style={stylesTitle}>{tx(t, "forgotTitle")}</Text>
      <Text style={stylesBody}>{tx(t, "forgotDesc")}</Text>
      <View style={{ height: 28 }} />
      <MeshInput
        icon="person-outline"
        placeholder={tx(t, "emailOrPhone")}
        value={emailOrPhone}
        onChangeText={(v) => { setEmailOrPhone(v); setFormError(""); }}
        error={Boolean(formError)}
      />
      {formError ? <ErrorText text={formError} /> : null}
      <View style={{ height: 16 }} />
      <PrimaryButton
        disabled={!emailOrPhone.trim()}
        label={tx(t, "sendResetLink")}
        loading={submitting}
        onPress={handleForgot}
      />
      <InlineLink text={tx(t, "remember")} link={tx(t, "login")} onPress={() => nav("login")} />
    </AuthShell>
  );
}

// ─── Reset Password ───────────────────────────────────────────────────────────
// Receives emailOrPhone from ForgotScreen via nav props.
// Calls POST /auth/reset-password with emailOrPhone + otp + newPassword.

export function ResetScreen({ t, nav, emailOrPhone: emailOrPhoneProp }: Props & { emailOrPhone?: string }) {
  const emailOrPhone = emailOrPhoneProp?.trim() || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (!otp.trim()) {
      setFormError("Please enter the OTP code.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      await resetPasswordRequest(emailOrPhone, otp.trim(), newPassword);
      nav("verifySuccess");
    } catch (err) {
      setFormError(messageFromError(err, "Could not reset password. Check your code and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showBack onBack={() => nav("forgot")}>
      <CenteredIcon icon="lock-closed-outline" />
      <Text style={stylesTitle}>{tx(t, "resetPassword")}</Text>
      <Text style={stylesBody}>{tx(t, "resetDesc")}</Text>
      <View style={{ height: 28 }} />
      <View style={{ gap: 12 }}>
        <MeshInput
          icon="keypad-outline"
          placeholder={tx(t, "otpCode")}
          value={otp}
          onChangeText={(v) => { setOtp(v); setFormError(""); }}
          error={Boolean(formError)}
        />
        <MeshInput
          icon="lock-closed-outline"
          secure
          placeholder={tx(t, "newPassword")}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <MeshInput
          icon="lock-closed-outline"
          secure
          placeholder={tx(t, "confirmPassword")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      {formError ? <ErrorText text={formError} /> : null}
      <View style={{ gap: 8, paddingVertical: 16 }}>
        {["pwLen", "pwSym", "pwCommon"].map((key) => (
          <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: mesh.green600, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
            <Text style={{ color: mesh.ink700, fontSize: 13 }}>{tx(t, key)}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton
        disabled={!otp.trim() || !newPassword || !confirmPassword}
        label={tx(t, "resetPassword")}
        loading={submitting}
        onPress={handleReset}
      />
    </AuthShell>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

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
