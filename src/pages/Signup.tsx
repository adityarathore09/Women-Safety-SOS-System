import React, { useState } from "react";
import { Shield, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db, googleProvider } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with name
      await updateProfile(user, { displayName: name });

      // Initialize user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: "user",
        createdAt: serverTimestamp(),
      });

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Initialize user document if it doesn't exist
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: "user",
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast.success("Successfully signed up with Google!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google signup error:", error);
      toast.error(error.message || "Failed to sign up with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-[#0a0a0a] text-slate-200 p-4 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-hidden relative">
      {/* Technical Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/5 via-transparent to-rose-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[120px] opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-emerald-600 p-4 rounded-2xl shadow-2xl shadow-emerald-900/40 mb-6 relative group"
          >
            <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
            <Shield className="w-10 h-10 text-white relative z-10" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
            SAFE<span className="text-emerald-500">GUARD</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">New Operative Registration</p>
          </div>
        </div>

        <Card className="border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl shadow-2xl shadow-black overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-rose-500 to-emerald-600 opacity-50" />
          <CardHeader className="space-y-1 p-8 pb-4">
            <CardTitle className="text-2xl font-bold text-white">Signup Page</CardTitle>
            <CardDescription className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
              Join the encrypted safety network
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all font-mono text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-slate-500">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all font-mono text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all font-mono text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    Sign-Up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 p-8 pt-0">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                <span className="bg-[#0f0f0f] px-3 text-slate-600">Alternative Gateway</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full">
              <Button 
                variant="outline" 
                className="h-12 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold uppercase tracking-widest text-[10px] transition-colors"
                onClick={handleGoogleSignup}
                disabled={isLoading}
              >
                <svg className="mr-3 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google Authentication
              </Button>
            </div>
            <p className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Existing operative?{" "}
              <Link to="/login" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                Sign-In
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <div className="flex items-center justify-center gap-6 mt-10">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-emerald-500/50" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-emerald-500/50" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Isolated</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Verified</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
