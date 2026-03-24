import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CheckCircle2, AlertCircle, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";

export function AuthPage() {
  const { signIn, signUp, verifyOTP } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(signInData.email, signInData.password);
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signUpData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(signUpData.email, signUpData.password, signUpData.name);
      setPendingEmail(signUpData.email);
      setShowOTPVerification(true);
      
      if (result.otp) {
        // For development: show the OTP in a toast
        toast.success(`Account created! Your verification code is: ${result.otp}`, { duration: 10000 });
      } else {
        toast.success("Account created! Please check your email for the verification code.");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Provide helpful error messages
      if (error.message?.includes("Unable to connect") || error.message?.includes("fetch")) {
        toast.error(
          "Cannot connect to server. Please check your internet connection.",
          { duration: 8000 }
        );
      } else if (error.message?.includes("email")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else {
        toast.error(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpValue.length !== 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }

    setLoading(true);

    try {
      await verifyOTP(pendingEmail, otpValue);
      toast.success("Email verified successfully! You can now sign in.");
      setShowOTPVerification(false);
      setOtpValue("");
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignUp = () => {
    setShowOTPVerification(false);
    setOtpValue("");
    setPendingEmail("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              {showOTPVerification ? (
                <Mail className="h-10 w-10 text-white" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-white" />
              )}
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold">
            {showOTPVerification ? "Verify Your Email" : "Welcome to Taskly"}
          </h1>
          <p className="text-muted-foreground">
            {showOTPVerification 
              ? `We've sent a 6-digit code to ${pendingEmail}`
              : "Your smart task management companion"
            }
          </p>
        </div>

        {showOTPVerification ? (
          /* OTP Verification Card - Same theme as login UI */
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription>
                We've sent a 6-digit code to {pendingEmail}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="otp" className="text-center block">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={(value) => setOtpValue(value)}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleBackToSignUp}
                    disabled={loading}
                  >
                    Back to Sign Up
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Regular Auth Card */
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* Sign In Tab */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signInData.email}
                        onChange={(e) =>
                          setSignInData({ ...signInData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInData.password}
                        onChange={(e) =>
                          setSignInData({ ...signInData, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>Demo account:</p>
                    <p className="font-mono">demo@taskly.com / demo123</p>
                  </div>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        value={signUpData.name}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signUpData.email}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpData.password}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signUpData.confirmPassword}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Features - Always shown */}
        <div className="mt-8 grid gap-4 text-center text-sm text-muted-foreground">
          <div>
            <div className="mb-1 text-2xl">🎯</div>
            <p>Organize your tasks efficiently</p>
          </div>
          <div>
            <div className="mb-1 text-2xl">📊</div>
            <p>Track your progress and streaks</p>
          </div>
          <div>
            <div className="mb-1 text-2xl">🐣</div>
            <p>Grow your virtual pet companion</p>
          </div>
        </div>

        {/* Supabase Setup Info - Always shown */}
        <div className="mt-6">
          <button
            onClick={() => setShowSetupInfo(!showSetupInfo)}
            className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Having trouble signing up? Click for setup instructions</span>
          </button>

          {showSetupInfo && (
            <Card className="mt-4 border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
              <CardContent className="pt-6 space-y-3 text-sm">
                <p className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Supabase Configuration Required
                </p>
                <p>
                  To use authentication, you need to disable email confirmation in your Supabase project:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to your Supabase Dashboard</li>
                  <li>Navigate to Authentication → Settings</li>
                  <li>Under "Email Auth", disable "Enable email confirmations"</li>
                  <li>Save changes and try signing up again</li>
                </ol>
                <a
                  href="https://supabase.com/dashboard/project/_/auth/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Open Supabase Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}