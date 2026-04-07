import React from "react";
import { Shield, BookOpen, AlertTriangle, Heart, Zap, Lock, Eye, MapPin, Phone, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function Guidelines() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Emergency Response",
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      items: [
        { title: "Immediate Action", content: "If you feel immediate danger, hold the SOS button for 1 second. This triggers alerts to all guardians and activates the audio siren." },
        { title: "Direct Uplink", content: "Use the Direct Uplink buttons to contact local emergency services (Police: 100, Ambulance: 102) immediately." },
        { title: "Audio Deterrent", content: "The 'Test Audio Alarm' can be used as a deterrent. A loud siren may draw public attention and discourage potential threats." }
      ]
    },
    {
      title: "Physical Safety",
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
      items: [
        { title: "Situational Awareness", content: "Always stay aware of your surroundings. Avoid using headphones in unfamiliar or poorly lit areas." },
        { title: "Safe Routes", content: "Stick to well-lit, populated streets. Share your live location via SafeGuard when taking a new or late-night route." },
        { title: "Social Shield", content: "Use the 'Social Shield' fake call feature to create a discreet exit from uncomfortable social interactions." }
      ]
    },
    {
      title: "Digital Security",
      icon: <Lock className="w-5 h-5 text-blue-500" />,
      items: [
        { title: "Guardian Verification", content: "Regularly verify that your guardians' contact information is up to date. A dead link in your network is a security risk." },
        { title: "Access Keys", content: "Never share your SafeGuard access key (password). Your account contains sensitive location history and contact data." },
        { title: "Privacy Protocol", content: "SafeGuard uses end-to-end encryption for alerts. Your data is only shared with your verified guardians during an active SOS." }
      ]
    },
    {
      title: "Guardian Network",
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      items: [
        { title: "Redundancy", content: "Maintain at least 3 active guardians in your registry to ensure at least one is available during an emergency." },
        { title: "Briefing", content: "Inform your guardians about SafeGuard. Ensure they know that an alert from you requires immediate attention and action." },
        { title: "Location Lock", content: "Ensure your GPS is always active when using the app. Without a location lock, guardians won't know where to send help." }
      ]
    }
  ];

  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* System Status Bar */}
      <div className="bg-blue-600/10 border-b border-blue-500/20 py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-500/80">Documentation: Guidelines</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/80">Status: Verified</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Ref: SG-DOC-2026-V4
        </div>
      </div>

      <nav className="bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
              className="hover:bg-white/5 text-slate-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white uppercase">
              SAFE<span className="text-emerald-500">GUARD</span>
            </span>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 font-mono text-[10px] uppercase tracking-widest">
            Protocol Manual
          </Badge>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto p-6 py-12">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2"
          >
            <BookOpen className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase">Safety Guidelines</h1>
          <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
            Comprehensive operational protocols for maintaining personal security and maximizing the effectiveness of the SafeGuard infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-white/5 bg-[#0f0f0f] shadow-2xl h-full overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                <CardHeader className="pb-4 border-b border-white/5 bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                      {section.icon}
                    </div>
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-white">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {section.items.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Critical Disclaimer</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              SafeGuard is a supplementary safety tool and should not be your only line of defense. In life-threatening situations, always prioritize contacting official emergency services (911/100/102) if possible. SafeGuard does not guarantee immediate physical intervention by third parties.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/dashboard")}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 px-8"
          >
            Acknowledge & Return
          </Button>
        </div>
      </main>

      <footer className="max-w-[1200px] mx-auto px-6 py-12 border-t border-white/5 mt-12 text-center">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.3em]">
          © 2026 SAFEGUARD SECURE • OPERATIONAL MANUAL V4.0
        </p>
      </footer>
    </div>
  );
}
