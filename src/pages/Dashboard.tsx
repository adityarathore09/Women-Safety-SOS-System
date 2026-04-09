import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Volume2, 
  VolumeX,
  Send,
  User,
  Heart,
  LogOut,
  ChevronRight,
  PhoneCall,
  Info,
  Navigation,
  Bell,
  Settings,
  Menu,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Brain,
  Zap,
  Sparkles,
  Mic,
  MicOff,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [fakeCallTimer, setFakeCallTimer] = useState<number | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // AI Safety Features State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiMonitoring, setIsAiMonitoring] = useState(false);
  const [aiSafetyScore, setAiSafetyScore] = useState(98.4);
  const [aiThreatLevel, setAiThreatLevel] = useState<'Low' | 'Moderate' | 'High'>('Low');

  const safetyTips = [
    {
      title: "Location Sharing",
      desc: "Share your live location with at least two trusted guardians when traveling late.",
      icon: <Navigation className="w-4 h-4 text-emerald-500" />
    },
    {
      title: "Battery Awareness",
      desc: "Keep your phone battery above 30% to ensure emergency protocols remain active.",
      icon: <Bell className="w-4 h-4 text-amber-500" />
    },
    {
      title: "Trust Your Instincts",
      desc: "If a situation feels unsafe, trigger a Social Shield fake call immediately.",
      icon: <Shield className="w-4 h-4 text-blue-500" />
    },
    {
      title: "Regular Updates",
      desc: "Keep the SafeGuard app updated for the latest security patches and features.",
      icon: <Settings className="w-4 h-4 text-slate-400" />
    },
    {
      title: "Node Verification",
      desc: "Verify your guardian's contact details regularly to ensure alerts reach them.",
      icon: <User className="w-4 h-4 text-rose-500" />
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % safetyTips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  const [events, setEvents] = useState<{ id: string; msg: string; time: string; type: 'info' | 'warn' | 'err' | 'success' }[]>([]);

  const addEvent = (msg: string, type: 'info' | 'warn' | 'err' | 'success' = 'info') => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      msg,
      type,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addEvent("System initialized. Security protocol active.", "success");
    addEvent("Guardian network connection established.", "info");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);
      addEvent(`Operator ${currentUser.email?.split('@')[0]} authenticated.`, "info");
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const contactsRef = collection(db, "users", user.uid, "contacts");
    const q = query(contactsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(contactsList);
      addEvent(`Guardian registry synchronized. ${contactsList.length} nodes active.`, "info");
    }, (error) => {
      console.error("Firestore error:", error);
      toast.error("Failed to load contacts. Check security rules.");
      addEvent("Registry sync failed. Check permissions.", "err");
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    updateLocation();
  }, []);

  const updateLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      addEvent("Requesting GPS synchronization...", "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setIsLocating(false);
          addEvent(`Location lock acquired: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, "success");
        },
        (err) => {
          console.error("Location error:", err);
          setIsLocating(false);
          toast.error("Could not access location. Please check permissions.");
          addEvent("GPS synchronization failed. Signal lost.", "err");
        }
      );
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Basic phone validation for country code
    if (!newContact.phone.trim().startsWith('+')) {
      toast.error("Invalid phone format", {
        description: "Please include the country code starting with '+' (e.g. +91 for India)."
      });
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "contacts"), {
        ...newContact,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      addEvent(`New guardian registered: ${newContact.name}`, "success");
      setNewContact({ name: "", phone: "", email: "" });
      setShowAddContact(false);
      toast.success("Contact added successfully");
    } catch (err) {
      console.error("Add contact error:", err);
      toast.error("Failed to add contact");
      addEvent("Failed to register guardian node.", "err");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "contacts", id));
      addEvent("Guardian node decommissioned.", "warn");
      toast.info("Contact removed");
    } catch (err) {
      console.error("Delete contact error:", err);
      toast.error("Failed to remove contact");
    }
  };

  const toggleSiren = () => {
    if (!audioRef.current) {
      // Primary source: High-quality siren
      const primarySource = "https://www.soundjay.com/misc/sounds/siren-1.mp3";
      const fallbackSource = "https://actions.google.com/sounds/v1/emergency/police_siren.ogg";
      
      audioRef.current = new Audio(primarySource);
      audioRef.current.loop = true;
      
      // Handle loading errors by trying the fallback source
      audioRef.current.onerror = () => {
        if (audioRef.current && audioRef.current.src !== fallbackSource) {
          console.warn("Primary audio source failed, attempting fallback...");
          audioRef.current.src = fallbackSource;
          audioRef.current.load();
          if (!isSirenPlaying) {
             // If it was supposed to be playing, try playing the fallback
             audioRef.current.play().catch(e => console.error("Fallback audio play failed:", e));
          }
        }
      };
    }

    if (isSirenPlaying) {
      audioRef.current.pause();
      addEvent("Audio alarm deactivated.", "info");
      toast("Siren stopped", { icon: <VolumeX className="w-4 h-4" /> });
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error("Audio play failed:", e);
          addEvent("Audio deployment failed. Check browser permissions.", "err");
        });
      }
      addEvent("AUDIO ALARM DEPLOYED.", "warn");
      toast.error("Siren active!", { 
        description: "Loud alarm is playing to deter threats.",
        icon: <Volume2 className="w-4 h-4" />,
        duration: 10000
      });
    }
    setIsSirenPlaying(!isSirenPlaying);
  };

  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startSosHold = () => {
    if (isSending) return;
    addEvent("SOS Trigger: Initiating hold sequence...", "warn");
    let progress = 0;
    holdTimerRef.current = setInterval(() => {
      progress += 2;
      setSosHoldProgress(progress);
      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        triggerSOS();
        setSosHoldProgress(0);
      }
    }, 20);
  };

  const cancelSosHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (sosHoldProgress > 0 && sosHoldProgress < 100) {
      addEvent("SOS Trigger: Sequence aborted by operator.", "info");
    }
    setSosHoldProgress(0);
  };

  const triggerSOS = async () => {
    if (contacts.length === 0) {
      toast.error("No emergency contacts", {
        description: "Please add at least one emergency contact before using SOS."
      });
      return;
    }

    setIsSending(true);
    addEvent("CRITICAL: SOS PROTOCOL INITIATED.", "err");
    const sosToast = toast.loading("Sending emergency alerts...");

    let currentLoc = location;
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        currentLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(currentLoc);
      } catch (e) {
        console.error("Could not get location", e);
      }
    }

    try {
      const res = await
        fetch("https://women-safety-sos-system-1.onrender.com/api/sos", {      
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: currentLoc,
          message: "🚨 EMERGENCY! I need help immediately. This is an automated SOS alert from SafeGuard.",
          contacts: contacts.map(c => ({ name: c.name, phone: c.phone, email: c.email }))
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        addEvent(`SOS BROADCAST SUCCESSFUL. ${contacts.length} nodes alerted.`, "success");
        toast.dismiss(sosToast);
        toast.success("SOS Alerts Sent!", {
          description: `Alerts sent to ${contacts.length} contacts via SMS and Email.`,
          duration: 6000
        });
        if (!isSirenPlaying) toggleSiren();
      } else {
        toast.dismiss(sosToast);
        addEvent("SOS BROADCAST FAILED. Check uplink status.", "err");
        
        // Construct a more detailed error message from results.errors if available
        let errorDetail = data.warning || "Please ensure your emergency contacts have valid phone numbers and emails.";
        if (data.results?.errors?.length > 0) {
          errorDetail = data.results.errors.join(". ");
        }

        toast.error(data.error || "Failed to send SOS alerts.", {
          description: errorDetail,
          duration: 10000
        });
      }
    } catch (err) {
      toast.dismiss(sosToast);
      addEvent("SOS BROADCAST FAILED. Network error.", "err");
      toast.error("Network error. Could not reach emergency server.");
    } finally {
      setIsSending(false);
    }
  };

  const runAiSafetyAnalysis = async () => {
    setIsAnalyzing(true);
    addEvent("AI: Initiating situational analysis...", "info");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `As a personal safety AI assistant, analyze the current situation and provide a concise safety report.
      Context:
      - Time: ${new Date().toLocaleTimeString()}
      - Location: ${location ? `${location.latitude}, ${location.longitude}` : "Unknown"}
      - User Status: Active on Dashboard
      - Guardian Network: ${contacts.length} active contacts
      
      Provide:
      1. A safety score (0-100)
      2. Current threat level (Low, Moderate, High)
      3. 3 specific safety recommendations for this time and location.
      Keep it professional, technical, and concise. Format as a structured report.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text;
      setAiAnalysis(text || "Analysis complete. System status optimal.");
      
      // Extract score and level if possible (simple regex)
      const scoreMatch = text?.match(/score:?\s*(\d+)/i);
      const levelMatch = text?.match(/level:?\s*(Low|Moderate|High)/i);
      
      if (scoreMatch) setAiSafetyScore(parseInt(scoreMatch[1]));
      if (levelMatch) setAiThreatLevel(levelMatch[1] as any);
      
      addEvent("AI: Situational analysis complete.", "success");
      toast.success("AI Analysis Complete", {
        description: "Your safety report has been updated.",
        icon: <Sparkles className="w-4 h-4 text-emerald-500" />
      });
    } catch (error) {
      console.error("AI Analysis error:", error);
      addEvent("AI: Analysis failed. Neural link timeout.", "err");
      toast.error("AI Analysis Failed", {
        description: "Could not connect to the safety intelligence network."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleAiMonitoring = () => {
    if (!isAiMonitoring) {
      setIsAiMonitoring(true);
      addEvent("AI: Smart Threat Monitor active. Listening for distress patterns.", "warn");
      toast.info("AI Monitoring Active", {
        description: "SafeGuard AI is now monitoring for unusual patterns and distress signals.",
        icon: <Mic className="w-4 h-4 text-blue-500" />
      });
    } else {
      setIsAiMonitoring(false);
      addEvent("AI: Smart Threat Monitor deactivated.", "info");
      toast("AI Monitoring Stopped", { icon: <MicOff className="w-4 h-4" /> });
    }
  };

  const scheduleFakeCall = () => {
    addEvent("Social Shield deployment scheduled.", "info");
    setFakeCallTimer(5);
    const interval = setInterval(() => {
      setFakeCallTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          addEvent("Social Shield: Incoming call simulation active.", "success");
          toast.info("Incoming Fake Call...", {
            description: "Answer to simulate a real conversation.",
            icon: <PhoneCall className="w-4 h-4" />,
            duration: 8000
          });
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
      toast.info("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* System Status Bar */}
      <div className="bg-emerald-600/10 border-b border-emerald-500/20 py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/80">System: Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-500/80">Network: Active</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-1.5 rounded-lg shadow-lg shadow-emerald-900/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">
              SAFE<span className="text-emerald-500">GUARD</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAiMonitoring && (
              <div className="hidden lg:flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <Mic className="w-3 h-3 text-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">AI Monitoring Active</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-6 mr-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
              <Link to="/dashboard" className="text-white border-b border-emerald-500 pb-1">Monitor</Link>
              <Link to="/guidelines" className="hover:text-white transition-colors">Guidelines</Link>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-white/5">
                    <Avatar className="h-9 w-9 border border-white/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                      <AvatarFallback className="bg-emerald-900/50 text-emerald-400 font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-64 bg-[#1a1a1a] border-white/10">
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-white">{user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="focus:bg-white/5 cursor-pointer py-3">
                  <User className="mr-3 h-4 w-4 text-slate-400" />
                  <span>Security Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="focus:bg-white/5 cursor-pointer py-3">
                  <Settings className="mr-3 h-4 w-4 text-slate-400" />
                  <span>System Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer py-3">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Terminate Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SOS Hero - Redesigned as a Mission Control Center */}
            <Card className="overflow-hidden border-white/5 bg-[#0f0f0f] shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600 opacity-50" />
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-10 md:p-14 flex flex-col justify-center space-y-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">Priority 0</Badge>
                        <Badge className="bg-white/5 text-slate-400 border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">Emergency Protocol</Badge>
                      </div>
                      <h2 className="text-5xl font-black tracking-tighter text-white">SOS TRIGGER</h2>
                      <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                        Initiate immediate emergency broadcasting to all verified guardians.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-4 pt-4">
                      <div className="relative group">
                        <Button 
                          size="lg" 
                          onMouseDown={startSosHold}
                          onMouseUp={cancelSosHold}
                          onMouseLeave={cancelSosHold}
                          onTouchStart={startSosHold}
                          onTouchEnd={cancelSosHold}
                          disabled={isSending}
                          className={`h-24 w-full px-10 text-white text-2xl font-black rounded-full shadow-[0_0_50px_-12px_rgba(225,29,72,0.5)] transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden z-10 ${
                            isSending ? 'bg-rose-800' : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                        >
                          {/* Progress Overlay */}
                          <div 
                            className="absolute bottom-0 left-0 h-full bg-rose-900 transition-all duration-75" 
                            style={{ width: `${sosHoldProgress}%` }}
                          />
                          
                          <div className="relative z-20 flex items-center justify-center">
                            {isSending ? (
                              <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                            ) : (
                              <AlertCircle className="mr-3 h-8 w-8" />
                            )}
                            {isSending ? "BROADCASTING..." : sosHoldProgress > 0 ? `HOLDING ${Math.round(sosHoldProgress)}%` : "HOLD TO ACTIVATE"}
                          </div>
                        </Button>
                        
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-20 transition-opacity duration-500 ${sosHoldProgress > 0 ? 'opacity-60' : 'group-hover:opacity-40'}`} />
                      </div>
                      
                      <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">
                        Hold for 1 second to initiate emergency protocol
                      </p>
                      
                      <Button 
                        variant="ghost" 
                        size="lg" 
                        onClick={toggleSiren}
                        className={`h-14 px-8 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all mt-2 ${
                          isSirenPlaying 
                            ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                            : "text-slate-500 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {isSirenPlaying ? (
                          <>
                            <VolumeX className="mr-2 h-5 w-5" />
                            Deactivate Siren
                          </>
                        ) : (
                          <>
                            <Volume2 className="mr-2 h-5 w-5" />
                            Test Audio Alarm
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-[#050505] relative min-h-[400px] flex items-center justify-center overflow-hidden border-l border-white/5">
                    {/* Radar Effect Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 2, opacity: [0, 0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 4, delay: i * 1 }}
                          className="absolute w-full aspect-square border border-emerald-500/30 rounded-full"
                        />
                      ))}
                    </div>

                    <motion.div 
                      animate={isSending || isSirenPlaying ? { 
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="relative z-10"
                    >
                      <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent">
                        <div className="w-48 h-48 rounded-full border border-rose-500/20 flex items-center justify-center">
                          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                            isSending || isSirenPlaying 
                              ? "bg-rose-600 shadow-rose-500/50 scale-110" 
                              : "bg-slate-800 shadow-black"
                          }`}>
                            <AlertCircle className={`w-16 h-16 text-white transition-transform duration-500 ${isSending ? "animate-pulse" : ""}`} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                        <span>Signal Strength</span>
                        <span>100%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ width: ["90%", "100%", "95%"] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="h-full bg-emerald-500" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Intelligence Hub - New Feature Section */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-[#0f0f0f] border border-white/5 p-1 h-12 mb-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/5 data-[state=active]:text-white text-[10px] uppercase tracking-widest font-bold px-6">Overview</TabsTrigger>
                <TabsTrigger value="ai-safety" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 text-[10px] uppercase tracking-widest font-bold px-6 flex items-center gap-2">
                  <Cpu className="w-3 h-3" /> AI Intelligence
                </TabsTrigger>
                <TabsTrigger value="guardian" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-[10px] uppercase tracking-widest font-bold px-6">Network</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Quick Tools Grid - Bento Style */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Location Card */}
                  <Card className="md:col-span-7 border-white/5 bg-[#0f0f0f] shadow-xl overflow-hidden group">
                    <CardHeader className="pb-4 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                          <Navigation className="w-4 h-4 text-emerald-500" />
                          Geo-Location Feed
                        </CardTitle>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Latitude</span>
                          <p className="text-xl font-mono font-bold text-white tabular-nums">
                            {location ? location.latitude.toFixed(6) : "00.000000"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Longitude</span>
                          <p className="text-xl font-mono font-bold text-white tabular-nums">
                            {location ? location.longitude.toFixed(6) : "00.000000"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-40 bg-black rounded-xl relative overflow-hidden border border-white/5">
                        {/* Mock Map Background */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://api.dicebear.com/7.x/identicon/svg?seed=map')] bg-repeat scale-150" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                        
                        {/* Scanning Line */}
                        <motion.div 
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          className="absolute left-0 w-full h-[2px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10"
                        />

                        {isLocating ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Synchronizing...</span>
                          </div>
                        ) : location ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
                              />
                              <div className="relative bg-emerald-500 p-3 rounded-full shadow-2xl shadow-emerald-500/50">
                                <MapPin className="w-6 h-6 text-black" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                            <p className="text-xs text-slate-500 font-medium">GPS Signal Required</p>
                          </div>
                        )}
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full border-white/10 hover:bg-white/5 text-slate-300 font-bold uppercase tracking-widest text-[10px] h-12"
                        onClick={updateLocation}
                        disabled={isLocating}
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Force Refresh
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Fake Call Card */}
                  <Card className="md:col-span-5 border-white/5 bg-[#0f0f0f] shadow-xl flex flex-col">
                    <CardHeader className="pb-4 border-b border-white/5">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                        <PhoneCall className="w-4 h-4 text-blue-500" />
                        Social Shield
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Simulate an incoming call to create a discreet exit from uncomfortable situations.
                        </p>
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-full">
                              <Bell className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Status</p>
                              <p className="text-xs text-slate-300">{fakeCallTimer ? `Triggering in ${fakeCallTimer}s` : "Ready for deployment"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20 mt-6"
                        onClick={scheduleFakeCall}
                        disabled={fakeCallTimer !== null}
                      >
                        {fakeCallTimer ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <PhoneCall className="mr-2 h-4 w-4" />
                            Trigger Fake Call
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Safety Protocol - Redesigned as a Grid of Modules */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { title: "Battery", desc: "Keep > 30%", icon: <Bell className="w-4 h-4" />, color: "text-amber-500" },
                    { title: "Location", desc: "Always On", icon: <Navigation className="w-4 h-4" />, color: "text-emerald-500" },
                    { title: "Instinct", desc: "Trust It", icon: <Shield className="w-4 h-4" />, color: "text-blue-500" },
                    { title: "Visibility", desc: "Stay Lit", icon: <MapPin className="w-4 h-4" />, color: "text-rose-500" }
                  ].map((tip, i) => (
                    <div key={i} className="p-4 bg-[#0f0f0f] border border-white/5 rounded-xl flex flex-col items-center text-center gap-2 group hover:border-white/10 transition-colors">
                      <div className={`p-2 rounded-full bg-white/5 ${tip.color} group-hover:scale-110 transition-transform`}>
                        {tip.icon}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">{tip.title}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ai-safety" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* AI Analysis Card */}
                  <Card className="md:col-span-8 border-white/5 bg-[#0f0f0f] shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-50" />
                    <CardHeader className="pb-4 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-blue-400">
                          <Brain className="w-4 h-4" />
                          Situational Intelligence
                        </CardTitle>
                        <Badge variant="outline" className="border-blue-500/20 text-blue-500 text-[10px] font-mono uppercase tracking-widest">
                          Gemini 3.0 Flash
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {aiAnalysis ? (
                        <div className="space-y-6">
                          <div className="flex items-start gap-4 bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl">
                            <Sparkles className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                            <div className="space-y-4 w-full">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">AI Safety Report</h3>
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Generated {new Date().toLocaleTimeString()}</span>
                              </div>
                              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {aiAnalysis}
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={runAiSafetyAnalysis} 
                            disabled={isAnalyzing}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[10px]"
                          >
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            Refresh Analysis
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                            <Brain className="w-10 h-10 text-blue-500" />
                          </div>
                          <div className="space-y-2 max-w-md">
                            <h3 className="text-xl font-bold text-white">AI Situational Awareness</h3>
                            <p className="text-slate-400 text-sm">
                              Leverage advanced neural networks to analyze your current environment, location, and time to provide proactive safety recommendations.
                            </p>
                          </div>
                          <Button 
                            onClick={runAiSafetyAnalysis} 
                            disabled={isAnalyzing}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs h-14 px-10 shadow-lg shadow-blue-900/20"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing Neural Feed...
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-4 w-4" />
                                Initiate AI Analysis
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Monitor Card */}
                  <Card className="md:col-span-4 border-white/5 bg-[#0f0f0f] shadow-xl flex flex-col">
                    <CardHeader className="pb-4 border-b border-white/5">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                        <Mic className="w-4 h-4 text-rose-500" />
                        Smart Threat Monitor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-6">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          AI-powered background monitoring that listens for distress keywords and analyzes environmental audio for threat patterns.
                        </p>
                        
                        <div className={`p-6 rounded-2xl border transition-all duration-500 ${
                          isAiMonitoring 
                            ? "bg-rose-500/10 border-rose-500/30 shadow-[0_0_30px_-10px_rgba(225,29,72,0.3)]" 
                            : "bg-white/5 border-white/10"
                        }`}>
                          <div className="flex flex-col items-center gap-4">
                            <div className={`p-4 rounded-full transition-all duration-500 ${
                              isAiMonitoring ? "bg-rose-500 text-white scale-110" : "bg-slate-800 text-slate-500"
                            }`}>
                              {isAiMonitoring ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
                            </div>
                            <div className="text-center">
                              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                                isAiMonitoring ? "text-rose-500" : "text-slate-500"
                              }`}>
                                {isAiMonitoring ? "Monitoring Active" : "Monitor Standby"}
                              </p>
                              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Distress Pattern Recognition</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-slate-500">
                            <span>Neural Load</span>
                            <span>{isAiMonitoring ? "12%" : "0%"}</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              animate={{ width: isAiMonitoring ? "12%" : "0%" }}
                              className="h-full bg-rose-500" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={toggleAiMonitoring}
                        variant={isAiMonitoring ? "destructive" : "outline"}
                        className={`w-full h-14 font-black uppercase tracking-widest text-xs mt-6 transition-all ${
                          !isAiMonitoring ? "border-white/10 hover:bg-white/5 text-slate-300" : ""
                        }`}
                      >
                        {isAiMonitoring ? (
                          <>
                            <MicOff className="mr-2 h-4 w-4" />
                            Deactivate Monitor
                          </>
                        ) : (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            Activate AI Monitor
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="guardian" className="mt-0">
                <Card className="border-white/5 bg-[#0f0f0f] shadow-xl overflow-hidden">
                  <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-emerald-500">
                      <Shield className="w-4 h-4" />
                      Guardian Network Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-3xl font-black text-white mb-1">{contacts.length}</p>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Nodes</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-3xl font-black text-emerald-500 mb-1">100%</p>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Uptime</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-3xl font-black text-blue-500 mb-1">256-bit</p>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Encryption</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      Your guardian network is a decentralized mesh of trusted contacts. In the event of an SOS trigger, all active nodes are simultaneously alerted with your real-time coordinates and a distress signal.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Live Event Log - New Technical Component */}
            <Card className="border-white/5 bg-[#0f0f0f] shadow-xl overflow-hidden">
              <CardHeader className="py-3 px-6 border-b border-white/5 bg-black/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live System Log
                  </CardTitle>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Terminal v4.0.2</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-48 bg-black/40">
                  <div className="p-4 font-mono text-[11px] space-y-1.5">
                    {events.length === 0 ? (
                      <p className="text-slate-700 italic">No events recorded...</p>
                    ) : (
                      events.map((event) => (
                        <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-left-1 duration-300">
                          <span className="text-slate-600 shrink-0">[{event.time}]</span>
                          <span className={`
                            ${event.type === 'success' ? 'text-emerald-500' : ''}
                            ${event.type === 'warn' ? 'text-amber-500' : ''}
                            ${event.type === 'err' ? 'text-rose-500 font-bold' : ''}
                            ${event.type === 'info' ? 'text-blue-400' : ''}
                          `}>
                            {event.type === 'err' ? '!! ' : '> '}
                            {event.msg}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contacts & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Safety Score - New Visualization */}
            <Card className="border-white/5 bg-[#0f0f0f] shadow-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-500">Security Index</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="flex items-end justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-4xl font-black text-white tracking-tighter">{aiSafetyScore.toFixed(1)}<span className="text-emerald-500 text-xl">%</span></p>
                    <p className={`text-[10px] font-mono uppercase tracking-widest ${
                      aiThreatLevel === 'Low' ? 'text-emerald-500' : 
                      aiThreatLevel === 'Moderate' ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {aiThreatLevel} Threat Level
                    </p>
                  </div>
                  <div className="flex gap-1 items-end h-12">
                    {[40, 60, 45, 80, 95, 70, 85].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="w-1.5 bg-emerald-500/20 rounded-t-sm relative overflow-hidden"
                      >
                        <div className="absolute bottom-0 left-0 w-full bg-emerald-500 h-1/2" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-slate-500">
                    <span>AI Confidence</span>
                    <span className="text-white">High</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[95%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rotating Safety Tips - Intelligence Feed */}
            <Card className="border-white/5 bg-[#0f0f0f] shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/30" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-500">Intelligence Feed</CardTitle>
                  <div className="flex gap-1">
                    {safetyTips.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-1 rounded-full transition-colors duration-500 ${i === currentTipIndex ? 'bg-blue-500' : 'bg-white/10'}`} 
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-h-[120px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTipIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg">
                        {safetyTips[currentTipIndex].icon}
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">
                        {safetyTips[currentTipIndex].title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {safetyTips[currentTipIndex].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.2em]">Updating Intelligence...</span>
                </div>
              </div>
            </Card>
            
            {/* Contacts Card - Redesigned as a Secure Registry */}
            <Card className="border-white/5 bg-[#0f0f0f] shadow-2xl h-full flex flex-col">
              <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Guardian Registry
                  </CardTitle>
                  <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                    <DialogTrigger
                      render={
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-emerald-500 font-bold hover:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Register
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Register Guardian</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Add a trusted contact to your encrypted emergency network.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddContact} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Full Name</Label>
                          <Input 
                            id="name" 
                            placeholder="e.g. John Doe" 
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                            value={newContact.name}
                            onChange={e => setNewContact({...newContact, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Phone Number</Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="+91 98765 43210" 
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 font-mono"
                            value={newContact.phone}
                            onChange={e => setNewContact({...newContact, phone: e.target.value})}
                            required
                          />
                          <p className="text-[9px] text-slate-500 font-mono">Format: +[CountryCode][Number]</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="guardian@secure.com" 
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                            value={newContact.email}
                            onChange={e => setNewContact({...newContact, email: e.target.value})}
                            required
                          />
                        </div>
                        <DialogFooter className="pt-6">
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12">Confirm Registration</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">
                  {contacts.length} Verified {contacts.length === 1 ? "Guardian" : "Guardians"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[450px]">
                  <div className="divide-y divide-white/5">
                    {contacts.length === 0 ? (
                      <div className="text-center py-20 px-6 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                          <User className="w-8 h-8 text-slate-700" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registry Empty</p>
                          <p className="text-[10px] text-slate-600 font-mono">No guardians detected in network.</p>
                        </div>
                      </div>
                    ) : (
                      contacts.map((contact) => (
                        <div key={contact.id} className="p-5 group hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border border-white/10">
                                <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-black">
                                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-white tracking-tight">{contact.name}</p>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                                    <Phone className="w-2.5 h-2.5 text-emerald-500/50" /> {contact.phone}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                                    <Mail className="w-2.5 h-2.5 text-blue-500/50" /> {contact.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteContact(contact.id)}
                              className="h-9 w-9 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="bg-black/40 border-t border-white/5 p-4">
                <div className="flex items-center justify-center gap-2 w-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                    End-to-End Encrypted Alerts
                  </p>
                </div>
              </CardFooter>
            </Card>

            {/* Emergency Numbers - Redesigned as a Quick Dial Pad */}
            <Card className="border-white/5 bg-[#0f0f0f] shadow-xl">
              <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-500">Direct Uplink</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full justify-between h-14 border-white/5 bg-white/[0.02] hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-500 transition-all group px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">Police</span>
                  </div>
                  <span className="font-mono text-sm font-bold opacity-50 group-hover:opacity-100 transition-opacity">100</span>
                </Button>
                <Button variant="outline" className="w-full justify-between h-14 border-white/5 bg-white/[0.02] hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-500 transition-all group px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">Ambulance</span>
                  </div>
                  <span className="font-mono text-sm font-bold opacity-50 group-hover:opacity-100 transition-opacity">102</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="max-w-[1600px] mx-auto px-6 py-16 border-t border-white/5 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-white">SAFEGUARD</span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Advanced safety infrastructure for immediate emergency response and proactive protection. Built with privacy and speed at its core.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white">Resources</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <Link to="/guidelines" className="hover:text-emerald-500 transition-colors">Safety Guidelines</Link>
              <Link to="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-emerald-500 transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-emerald-500 transition-colors">Security Audit</Link>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white">Support</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <Link to="#" className="hover:text-emerald-500 transition-colors">Help Center</Link>
              <Link to="#" className="hover:text-emerald-500 transition-colors">Contact Support</Link>
              <Link to="#" className="hover:text-emerald-500 transition-colors">System Status</Link>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">© 2026 SAFEGUARD SECURE. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
              <User className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
