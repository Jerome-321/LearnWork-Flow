import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSetupInfo, setShowSetupInfo] = useState(false);

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
      await signUp(signUpData.email, signUpData.password, signUpData.name);
      toast.success("Account created successfully! Welcome to Taskly! 🎉");
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Provide helpful error messages
      if (error.message?.includes("Unable to connect") || error.message?.includes("fetch")) {
        toast.error(
          "Cannot connect to Supabase. Please ensure:\n" +
          "1. Your Supabase project is active\n" +
          "2. Email confirmation is disabled in Authentication settings\n" +
          "3. You have internet connectivity",
          { duration: 8000 }
        );
      } else if (error.message?.includes("email")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else if (error.message?.includes("confirm")) {
        toast.info(
          "Please check your email to confirm your account. " +
          "If you don't receive an email, disable email confirmation in Supabase dashboard.",
          { duration: 8000 }
        );
      } else {
        toast.error(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Welcome to Taskly</h1>
          <p className="text-muted-foreground">
            Your smart task management companion
          </p>
        </div>

        {/* Auth Card */}
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

        {/* Features */}
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

        {/* Supabase Setup Info */}
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