import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";

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
    subtitle: "Save important details about the people around you.",
  },
  {
    image: require("../../../assets/logo_2.png"),
    title: "Capture quick notes",
    subtitle: "Write down thoughts and small moments you want to remember.",
  },
  {
    image: require("../../../assets/logo_3.png"),
    title: "Create contacts",
    subtitle: "Keep meaningful information about the people who matter most.",
  },
];

const relishLogo = require("../../../assets/logo_1.png");
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

function MeshInput({ error, icon, onChangeText, onToggleSecure, placeholder, secure, showSecureToggle, value }: { error?: boolean; icon: keyof typeof Ionicons.glyphMap; onChangeText?: (value: string) => void; onToggleSecure?: () => void; placeholder: string; secure?: boolean; showSecureToggle?: boolean; value?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: error ? mesh.pink : mesh.line, borderRadius: mesh.radiusLg, backgroundColor: "#FFFFFF", paddingHorizontal: 14, minHeight: 52 }}>
      <Ionicons name={icon} size={18} color={error ? mesh.pink : mesh.ink400} />
      <TextInput autoCapitalize="none" onChangeText={onChangeText} value={value} placeholder={placeholder} placeholderTextColor={mesh.ink400} secureTextEntry={secure} style={{ flex: 1, color: mesh.ink900, fontSize: 15 }} />
      {showSecureToggle ? (
        <Pressable onPress={onToggleSecure} hitSlop={8} style={{ alignItems: "center", height: 32, justifyContent: "center", width: 32 }}>
          <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={19} color={mesh.ink400} />
        </Pressable>
      ) : null}
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
      <Image source={relishLogo} resizeMode="contain" style={{ height: 132, width: 132 }} />
      <Text style={{ color: mesh.green800, fontSize: 28, fontWeight: "900", marginTop: 4 }}>{tx(t, title)}</Text>
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
  const [introDone, setIntroDone] = useState(false);
  const pagerRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const finishIntro = () => {
    setIntroDone(true);
    setPage(0);
    scrollX.setValue(0);
    pagerRef.current?.scrollTo({ x: 0, animated: false });
  };

  const goToPage = (nextPage: number) => {
    const clamped = Math.max(0, Math.min(onboardingSlides.length - 1, nextPage));
    pagerRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
    setPage(clamped);
  };

  useEffect(() => {
    if (introDone) return undefined;

    const timers = [
      setTimeout(() => goToPage(1), 5000),
      setTimeout(() => goToPage(2), 10000),
    ];

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone, pageWidth]);

  const handlePagerScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  const handleIntroNext = () => {
    if (page < onboardingSlides.length - 1) {
      goToPage(page + 1);
      return;
    }

    finishIntro();
  };

  return (
    <AuthShell scroll={false} showLeafBg={false}>
      <View style={{ flex: 1, justifyContent: "space-between", paddingTop: 10 }}>
        <LinearGradient
          pointerEvents="none"
          colors={["#F4FAF6", "#F8FCF9", "#F4FAF6"]}
          locations={[0, 0.5, 1]}
          style={{ bottom: 0, left: -28, position: "absolute", right: -28, top: 0, zIndex: 0 }}
        />
        <View style={{ flex: 1, zIndex: 1 }}>
          <View pointerEvents="none" style={{ bottom: 210, left: -45, position: "absolute", top: 80, width: 220, zIndex: 0 }}>
            <Image source={welcomeLeafLeft} resizeMode="contain" style={{ height: 380, opacity: 1, width: 250 }} />
          </View>
          <View pointerEvents="none" style={{ bottom: 230, position: "absolute", right: 0, top: -70, width: 235, zIndex: 0 }}>
            <Image source={welcomeLeafRight} resizeMode="contain" style={{ height: 430, opacity: 1, width: 285 }} />
          </View>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,255,255,0.70)", "rgba(255,255,255,0.42)", "rgba(255,255,255,0)"]}
            locations={[0, 0.58, 1]}
            style={{ height: 460, left: -28, position: "absolute", right: -28, top: -12, zIndex: 1 }}
          />
          <View pointerEvents="none" style={{ backgroundColor: "rgba(31,112,72,0.16)", borderRadius: 3, height: 6, left: 28, position: "absolute", top: 146, width: 6, zIndex: 1 }} />
          <View pointerEvents="none" style={{ backgroundColor: "rgba(31,112,72,0.12)", borderRadius: 2, height: 4, left: 92, position: "absolute", top: 112, width: 4, zIndex: 1 }} />
          <View pointerEvents="none" style={{ backgroundColor: "rgba(31,112,72,0.15)", borderRadius: 2.5, height: 5, position: "absolute", right: 60, top: 118, width: 5, zIndex: 1 }} />
          <View pointerEvents="none" style={{ backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 2, height: 4, position: "absolute", right: 24, top: 198, width: 4, zIndex: 1 }} />
          {!introDone ? (
          <Pressable onPress={finishIntro} hitSlop={10} style={{ alignSelf: "flex-end", marginBottom: 10, zIndex: 2 }}>
            <Text style={{ color: mesh.green800, fontSize: 15, fontWeight: "800" }}>Skip</Text>
          </Pressable>
          ) : (
            <View style={{ height: 28, marginBottom: 10 }} />
          )}
          <View style={{ height: 480, position: "relative", zIndex: 2 }}>
            {onboardingSlides.map((slide, index) => {
              const slideOpacity = scrollX.interpolate({
                inputRange: [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth],
                outputRange: [0, 1, 0],
                extrapolate: "clamp",
              });
              const slideY = scrollX.interpolate({
                inputRange: [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth],
                outputRange: [10, 0, 10],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={slide.title}
                  pointerEvents="none"
                  style={{ alignItems: "center", left: 0, opacity: slideOpacity, paddingTop: 58, position: "absolute", right: 0, top: 0, transform: [{ translateY: slideY }], zIndex: 1 }}
                >
                  <View style={{ alignItems: "center", height: 230, justifyContent: "center", width: 230 }}>
                    <View style={{ borderColor: "rgba(6,69,50,0.10)", borderRadius: 135, borderWidth: 1, height: 270, position: "absolute", width: 270 }} />
                    <View style={{ borderColor: "rgba(6,69,50,0.065)", borderRadius: 155, borderWidth: 1, height: 310, position: "absolute", width: 310 }} />
                    <View style={{ borderColor: "rgba(6,69,50,0.035)", borderRadius: 175, borderWidth: 1, height: 350, position: "absolute", width: 350 }} />
                    <Image source={slide.image} resizeMode="contain" style={{ width: 230, height: 230 }} />
                  </View>
                  <Text style={{ color: mesh.green800, fontSize: 29, fontWeight: "700", lineHeight: 38, marginTop: 38, textAlign: "center", maxWidth: 330, letterSpacing: -0.2 }}>{slide.title}</Text>
                  <Text style={{ color: "rgba(31,42,38,0.56)", fontSize: 16, lineHeight: 25, marginTop: 14, textAlign: "center", maxWidth: 312 }}>{slide.subtitle}</Text>
                </Animated.View>
              );
            })}
            <Animated.ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              bounces={false}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={handlePagerScrollEnd}
              scrollEnabled={!introDone}
              style={{ bottom: 0, elevation: 3, left: 0, position: "absolute", right: 0, top: 0, zIndex: 3 }}
            >
              {onboardingSlides.map((slide) => (
                <View key={slide.title} style={{ height: 480, width: pageWidth }} />
              ))}
            </Animated.ScrollView>
          </View>
          {!introDone ? (
          <>
          <View style={{ flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 34 }}>
            {onboardingSlides.map((slide, index) => (
              <View
                key={slide.title}
                style={{
                  width: 54,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: page === index ? mesh.green700 : "rgba(6,69,50,0.12)",
                }}
              />
            ))}
          </View>
          <Pressable
            onPress={handleIntroNext}
            style={({ pressed }) => ({
              alignItems: "center",
              alignSelf: "center",
              backgroundColor: mesh.green800,
              borderRadius: 999,
              flexDirection: "row",
              gap: 10,
              height: 46,
              justifyContent: "center",
              marginTop: 26,
              opacity: pressed ? 0.9 : 1,
              paddingHorizontal: 22,
            })}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>
              {page === onboardingSlides.length - 1 ? "Get started" : "Next"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </Pressable>
          </>
          ) : null}
        </View>
        {introDone ? (
        <>
        <View style={{ gap: 14 }}>
          <Pressable
            onPress={() => nav("login")}
            style={({ pressed }) => ({
              height: 58,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: mesh.green800,
              opacity: pressed ? 0.9 : 1,
              shadowColor: "#064532",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 18,
              elevation: 2,
            })}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{tx(t, "login")}</Text>
          </Pressable>

          <Pressable
            onPress={() => nav("register")}
            style={({ pressed }) => ({
              height: 58,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.82)",
              borderWidth: 1.5,
              borderColor: mesh.green700,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text style={{ color: mesh.green700, fontSize: 17, fontWeight: "900" }}>{tx(t, "createAccount")}</Text>
          </Pressable>
        </View>
        <Text style={{ color: "rgba(65,75,70,0.48)", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 18, paddingHorizontal: 10 }}>{tx(t, "termsNotice")}</Text>
        </>
        ) : (
          <View style={{ height: 158 }} />
        )}
      </View>
    </AuthShell>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

export function LoginScreen({ t, nav, error = false }: Props & { error?: boolean }) {
  const [emailOrPhone, setEmailOrPhone] = useState(error ? "an.nguyen@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthShell showBack onBack={() => nav("welcome")} showLeafBg={false}>
      <View style={{ paddingTop: 70 }}>
        <AuthTitle t={t} title="login" sub="loginWelcome" />
        <View style={{ gap: 12, marginBottom: 12 }}>
          <MeshInput icon="person-outline" onChangeText={setEmailOrPhone} placeholder={tx(t, "emailOrPhone")} value={emailOrPhone} />
          <MeshInput icon="lock-closed-outline" secure={!showPassword} showSecureToggle onToggleSecure={() => setShowPassword((v) => !v)} onChangeText={setPassword} placeholder={tx(t, "password")} value={password} error={Boolean(formError)} />
        </View>
        {formError ? <ErrorText text={formError} /> : null}
        <Pressable onPress={() => nav("forgot")} style={{ alignSelf: "flex-end", marginBottom: 16 }}><Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{tx(t, "forgotPassword")}</Text></Pressable>
        <PrimaryButton disabled={!emailOrPhone.trim() || !password} label={tx(t, "login")} loading={submitting} onPress={handleLogin} />
        <Divider t={t} />
        <SecondaryButton label={tx(t, "continueGoogle")} icon="logo-google" onPress={() => nav("loading")} />
        <InlineLink text={tx(t, "noAccount")} link={tx(t, "signup")} onPress={() => nav("register")} />
      </View>
    </AuthShell>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function RegisterScreen({ t, nav, error = false }: Props & { error?: boolean }) {
  const [emailOrPhone, setEmailOrPhone] = useState(error ? "an.nguyen@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <AuthShell showBack onBack={() => nav("welcome")} showLeafBg={false}>
      <View style={{ paddingTop: 56 }}>
        <AuthTitle t={t} title="createAccount" sub="registerWelcome" />
        <View style={{ gap: 12, marginBottom: 12 }}>
          <MeshInput icon="person-outline" onChangeText={setEmailOrPhone} placeholder={tx(t, "emailOrPhone")} value={emailOrPhone} error={Boolean(formError)} />
          <MeshInput icon="lock-closed-outline" secure={!showPassword} showSecureToggle onToggleSecure={() => setShowPassword((v) => !v)} onChangeText={setPassword} placeholder={tx(t, "password")} value={password} />
          <MeshInput icon="lock-closed-outline" secure={!showConfirmPassword} showSecureToggle onToggleSecure={() => setShowConfirmPassword((v) => !v)} onChangeText={setConfirmPassword} placeholder={tx(t, "confirmPassword")} value={confirmPassword} />
        </View>
        {formError ? <ErrorText text={formError} /> : null}
        <PrimaryButton disabled={!emailOrPhone.trim() || !password || !confirmPassword} label={tx(t, "createAccount")} loading={submitting} onPress={handleRegister} />
        <Divider t={t} />
        <SecondaryButton label={tx(t, "continueGoogle")} icon="logo-google" />
        <InlineLink text={tx(t, "haveAccount")} link={tx(t, "login")} onPress={() => nav("login")} />
      </View>
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
