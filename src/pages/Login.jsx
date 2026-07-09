import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { authApi, catalogApi } from "../services/api";
import { friendlyFirebaseError } from "../services/firebaseAuth";
import { trackEvent } from "../services/tracking";
import { useAsync } from "../hooks/useAsync";

const icons = {
  bag: <svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>,
  email: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>,
  heart: <svg viewBox="0 0 24 24"><path d="M20.8 8.6c0 5.3-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.6A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8.8 1.4Z" /></svg>,
  lock: <svg viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2" /><rect x="5" y="10" width="14" height="10" rx="2" /></svg>,
  phone: <svg viewBox="0 0 24 24"><path d="M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3Z" /><path d="M11 17h2" /></svg>,
  plane: <svg viewBox="0 0 24 24"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>,
  shield: <svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>,
  tag: <svg viewBox="0 0 24 24"><path d="M20 13 13 20 4 11V4h7l9 9Z" /><circle cx="8" cy="8" r="1.2" /></svg>,
  truck: <svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>,
};

function IconBubble({ icon, label, tint }) {
  return (
    <span className={`auth-ref-bubble auth-ref-bubble-${tint}`}>
      <span aria-hidden="true">{icons[icon]}</span>
      <strong>{label}</strong>
    </span>
  );
}

function AuthField({ icon, ...inputProps }) {
  return (
    <span className="auth-ref-field">
      <span className="auth-input-icon" aria-hidden="true">{icons[icon]}</span>
      <input {...inputProps} />
    </span>
  );
}

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

  function update(index, nextValue) {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(""));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  return (
    <div className="otp-boxes" aria-label="One-time password">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { refs.current[index] = element; }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${index + 1}`}
          value={digit}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) refs.current[index - 1]?.focus();
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (pasted) {
              event.preventDefault();
              onChange(pasted);
              refs.current[Math.min(pasted.length, 6) - 1]?.focus();
            }
          }}
          maxLength="1"
        />
      ))}
    </div>
  );
}

function customerSafeError(err, mode) {
  if (err?.code) return friendlyFirebaseError(err);
  if (mode === "phone" && err?.status >= 500) return "Phone OTP is temporarily unavailable. Please try again shortly.";
  if (err?.status >= 500) return "We could not complete that request right now. Please try again in a moment.";
  return err?.message || "Please check your details and try again.";
}

export function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedMode = new URLSearchParams(location.search).get("mode");
  const requestedAdmin = location.pathname === "/admin-login";
  const [authMode, setAuthMode] = useState("signin");
  const [emailForm, setEmailForm] = useState({ name: "", email: "", password: "" });
  const [phoneForm, setPhoneForm] = useState({ countryCode: "+91", phone: "" });
  const [otpSent, setOtpSent] = useState(requestedMode === "phone");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const { login, register, googleLogin, phoneLogin, forgotPassword } = useAuth();
  const { data: settingsData } = useAsync(() => catalogApi.settings().catch(() => ({ settings: {} })), []);
  const logoUrl = settingsData?.settings?.store?.logoUrl || "/salty-pumpkin-logo.svg";

  useEffect(() => {
    if (requestedMode === "phone") {
      document.querySelector(".auth-ref-mobile-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [requestedMode]);

  useEffect(() => {
    if (cooldown <= 0 && expiresIn <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
      setExpiresIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown, expiresIn]);

  async function submitEmail(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const session = authMode === "signin"
        ? await login({ email: emailForm.email, password: emailForm.password })
        : await register({ name: emailForm.name, email: emailForm.email, password: emailForm.password });
      await trackEvent("login", { method: authMode === "signin" ? "email" : "register" });
      const returnTo = location.state?.from || (requestedAdmin ? "/admin" : "");
      navigate(session.user.role === "admin" ? (returnTo || "/admin") : (returnTo && returnTo !== "/admin" ? returnTo : "/account"), { replace: true });
    } catch (err) {
      setError(customerSafeError(err, "email"));
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const session = await googleLogin();
      await trackEvent("login", { method: "google" });
      const returnTo = location.state?.from || (requestedAdmin ? "/admin" : "");
      navigate(session.user.role === "admin" ? (returnTo || "/admin") : (returnTo && returnTo !== "/admin" ? returnTo : "/account"), { replace: true });
    } catch (err) {
      setError(customerSafeError(err, "google"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError("");
    setNotice("");
    if (!emailForm.email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(emailForm.email);
      setNotice("Password reset instructions have been sent if the email is registered.");
    } catch (err) {
      setError(customerSafeError(err, "email"));
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    setError("");
    setNotice("");
    setPhoneLoading(true);
    try {
      const data = await authApi.sendOtp(phoneForm);
      setOtpSent(true);
      setOtp("");
      setCooldown(Number(data.retryAfter || 30));
      setExpiresIn(Number(data.expiresIn || 300));
      setNotice(data.message || "OTP sent successfully.");
    } catch (err) {
      setError(customerSafeError(err, "phone"));
    } finally {
      setPhoneLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setNotice("");
    setPhoneLoading(true);
    try {
      const data = await authApi.verifyOtp({ ...phoneForm, otp });
      const session = await phoneLogin(data);
      setNotice(data.message || "Phone verified successfully.");
      await trackEvent("login", { method: "phone", user_data: { phone: `${phoneForm.countryCode}${phoneForm.phone}` } });
      const returnTo = location.state?.from || (requestedAdmin ? "/admin" : "");
      navigate(session.user.role === "admin" ? (returnTo || "/admin") : (returnTo && returnTo !== "/admin" ? returnTo : "/account"), { replace: true });
    } catch (err) {
      setError(customerSafeError(err, "phone"));
    } finally {
      setPhoneLoading(false);
    }
  }

  function switchMode(nextMode) {
    setAuthMode(nextMode);
    setError("");
    setNotice("");
  }

  return (
    <section className="auth-page auth-ref-page">
      <div className="auth-ref-shell">
        <header className="auth-ref-topbar">
          <Link className="auth-ref-logo" to="/">
            {logoUrl ? <img src={logoUrl} alt="Salty Pumpkin" /> : <span>Salty Pumpkin</span>}
          </Link>
          <nav className="auth-ref-actions" aria-label="Account shortcuts">
            <Link to="/wishlist"><span aria-hidden="true">{icons.heart}</span>Wishlist</Link>
            <Link to="/cart"><span aria-hidden="true">{icons.bag}</span>Cart</Link>
            <Link to="/login"><span aria-hidden="true">{icons.phone}</span>Login</Link>
          </nav>
        </header>

        <div className="auth-ref-main">
          <aside className="auth-ref-story">
            <span className="auth-ref-doodle auth-ref-heart" aria-hidden="true">♡</span>
            <span className="auth-ref-doodle auth-ref-plane" aria-hidden="true">{icons.plane}</span>
            <h1>Welcome Back!</h1>
            <p>Sign in to continue shopping adorable outfits for your little ones.</p>
            <div className="auth-ref-bubbles" aria-label="Shopping benefits">
              <IconBubble icon="bag" label="Easy Shopping" tint="pink" />
              <IconBubble icon="heart" label="Save Wishlist" tint="green" />
              <IconBubble icon="tag" label="Exclusive Offers" tint="purple" />
              <IconBubble icon="shield" label="Secure & Safe" tint="gold" />
            </div>
            <div className="auth-ref-kids" aria-hidden="true">
              <img src="/uploads/103_Pink-103.jpg" alt="" />
              <img src="/uploads/103_Blue-103.jpg" alt="" />
            </div>
          </aside>

          <div className="auth-ref-card-stack">
            <form className="form-card auth-card auth-ref-card" onSubmit={submitEmail}>
              <div className="auth-ref-card-head">
                <div>
                  <h2>{requestedAdmin ? "Admin Sign In" : authMode === "signin" ? "Sign In" : "Create Account"}</h2>
                  <span />
                </div>
                {!requestedAdmin && <button type="button" className="auth-ref-switch" onClick={() => switchMode(authMode === "signin" ? "register" : "signin")}>
                  {authMode === "signin" ? "New here? Sign Up" : "Already joined? Sign In"}
                </button>}
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}
              {notice && <div className="form-success" role="status">{notice}</div>}

              {authMode === "register" && (
                <AuthField
                  icon="phone"
                  type="text"
                  value={emailForm.name}
                  onChange={(event) => setEmailForm({ ...emailForm, name: event.target.value })}
                  placeholder="Full name"
                  autoComplete="name"
                  required
                />
              )}
              <AuthField
                icon="email"
                type="email"
                value={emailForm.email}
                onChange={(event) => setEmailForm({ ...emailForm, email: event.target.value })}
                placeholder="Email address"
                autoComplete="email"
                required
              />
              <PasswordField
                premium
                label=""
                value={emailForm.password}
                onChange={(value) => setEmailForm({ ...emailForm, password: value })}
                placeholder="Password"
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                minLength={authMode === "signin" ? 4 : 6}
                required
              />

              {authMode === "signin" && (
                <div className="auth-ref-options">
                  <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember me</label>
                  <button type="button" onClick={resetPassword}>Forgot password?</button>
                </div>
              )}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading && <span className="button-spinner" aria-hidden="true" />}
                {loading ? "Please wait..." : authMode === "signin" ? "Sign In" : "Sign Up"}
              </button>

              <div className="auth-divider"><span>OR</span></div>
              <button className="google-auth-button" type="button" disabled={loading} onClick={loginWithGoogle}>
                <span aria-hidden="true">G</span> Continue with Google
              </button>
            </form>

            <div className="form-card auth-ref-mobile-card">
              <h3>Or Sign In with Mobile</h3>
              <div className="phone-input-row auth-ref-phone-row">
                <select aria-label="Country code" value={phoneForm.countryCode} onChange={(event) => setPhoneForm({ ...phoneForm, countryCode: event.target.value })}>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+971">+971</option>
                </select>
                <AuthField
                  icon="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phoneForm.phone}
                  onChange={(event) => setPhoneForm({ ...phoneForm, phone: event.target.value.replace(/\D/g, "") })}
                  placeholder="Mobile number"
                  pattern="[0-9]{7,12}"
                  required
                />
              </div>
              {otpSent && <OtpBoxes value={otp} onChange={setOtp} />}
              {otpSent && (
                <div className="otp-meta">
                  <span>{expiresIn > 0 ? `OTP expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, "0")}` : "OTP expired"}</span>
                  <button type="button" className="link-button" disabled={phoneLoading || cooldown > 0} onClick={sendOtp}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}</button>
                </div>
              )}
              <button className="auth-submit auth-ref-otp-button" type="button" disabled={phoneLoading || (otpSent && (otp.length !== 6 || expiresIn <= 0))} onClick={otpSent ? verifyOtp : sendOtp}>
                {phoneLoading && <span className="button-spinner" aria-hidden="true" />}
                {phoneLoading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
                {!phoneLoading && <span aria-hidden="true">{icons.plane}</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="auth-ref-trust-band">
          <span>{icons.shield}<strong>Secure & Private</strong><em>Your data is safe with us.</em></span>
          <span>{icons.tag}<strong>Premium Quality</strong><em>Best outfits for your little ones.</em></span>
          <span>{icons.truck}<strong>Fast Delivery</strong><em>Quick and reliable delivery.</em></span>
          <span>{icons.heart}<strong>Easy Returns</strong><em>Hassle-free returns.</em></span>
        </div>

        <footer className="auth-ref-footer">
          <Link to="/contact">Need help? Contact Us</Link>
          <Link to="/about">About Us</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </footer>
      </div>
    </section>
  );
}