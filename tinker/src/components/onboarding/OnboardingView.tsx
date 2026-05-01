import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "../../stores/uiStore";
import { useCreateShop } from "../../hooks/useShops";
import { nanoid } from "nanoid";
import { Check, ChevronLeft, Hexagon, Component, Blocks, Lightbulb } from "lucide-react";
import { cn } from "../../utils/cn";

export function OnboardingView() {
  const [step, setStep] = useState(1);
  const completeOnboarding = useUiStore((s) => s.completeOnboarding);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const createShop = useCreateShop();

  const [focus, setFocus] = useState("Woodworking");
  const [experience, setExperience] = useState("Just getting started");
  const [workspace, setWorkspace] = useState("Home Workshop");
  const [goal, setGoal] = useState("Solve problems faster");
  const [shopName, setShopName] = useState("My Workshop");
  const [shopIcon, setShopIcon] = useState("home");

  const next = () => setStep((s) => Math.min(10, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleComplete = () => {
    const shopId = nanoid();
    const now = new Date();
    
    // Optimistically proceed so the UI doesn't hang
    setActiveShop(shopId);
    completeOnboarding();
    
    createShop.mutateAsync({
      id: shopId,
      name: shopName,
      backgroundTexture: "pegboard",
      createdAt: now,
      updatedAt: now,
    }).catch((err) => {
      console.error("Failed to create shop during onboarding:", err);
    });
  };

  const handleStartTour = () => {
    const shopId = nanoid();
    const now = new Date();
    
    setActiveShop(shopId);
    useUiStore.getState().startTour();
    
    createShop.mutateAsync({
      id: shopId,
      name: shopName,
      backgroundTexture: "pegboard",
      createdAt: now,
      updatedAt: now,
    }).catch((err) => {
      console.error("Failed to create shop during onboarding:", err);
    });
  };

  const skipToQuestionnaire = () => setStep(5);

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FDF9F3] text-[var(--ui-text-1)] font-[var(--ui-font-sans)]">
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[#EBE5D9]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <h3 className="text-xl font-medium font-[var(--ui-font-display)] text-[#B78846] mb-8">tinker</h3>
              <h1 className="text-4xl font-semibold font-[var(--ui-font-display)] mb-4 leading-tight">Every failure has a lesson.</h1>
              <p className="text-[#847B6F] mb-8 text-[15px] leading-relaxed">Tinker helps you capture what didn't work, learn faster, and build true mastery.</p>

              <div className="h-48 rounded-xl bg-[#F4EFE7] mb-8 overflow-hidden relative border border-[#EBE5D9] flex items-center justify-center">
                <Hexagon className="w-16 h-16 text-[#C16D3B] opacity-50" />
              </div>

              <div className="mt-auto space-y-3">
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors shadow-sm" data-testid="btn-onboarding-get-started">Get Started</button>
                <button onClick={skipToQuestionnaire} className="w-full text-center text-sm text-[#A0988E] hover:text-[#C16D3B] transition-colors" data-testid="btn-onboarding-skip-intro">Skip intro</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846]">tinker</h3>
                 <button onClick={skipToQuestionnaire} className="text-sm text-[#A0988E] hover:text-[#C16D3B]">Skip</button>
              </div>
              <div className="text-center">
                 <h1 className="text-3xl font-semibold font-[var(--ui-font-display)] mb-4">Learn from what doesn't work.</h1>
                 <p className="text-[#847B6F] text-[15px] mb-12">Capture failures, mistakes, and lessons as you build.</p>

                 <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#EBE5D9] inline-block mb-12 shadow-sm text-left transform -rotate-2">
                    <p className="font-medium text-[15px] mb-1">Glue joint failed</p>
                    <p className="text-sm text-[#847B6F] mb-3">Not enough clamp pressure.</p>
                    <span className="inline-flex items-center gap-1.5 bg-[#F9EAEA] text-[#C64545] text-xs font-semibold px-2 py-1 rounded border border-[#F2D6D6]"><span className="w-1.5 h-1.5 rounded-full bg-[#C64545]"></span> Failed</span>
                 </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-center gap-2 mb-8">
                  <div className="w-2 h-2 rounded-full bg-[#C16D3B]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#EBE5D9]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#EBE5D9]"></div>
                </div>
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846]">tinker</h3>
                 <button onClick={skipToQuestionnaire} className="text-sm text-[#A0988E] hover:text-[#C16D3B]">Skip</button>
              </div>
              <div className="text-center">
                 <h1 className="text-3xl font-semibold font-[var(--ui-font-display)] mb-4 leading-tight">See patterns. Build real mastery.</h1>
                 <p className="text-[#847B6F] text-[15px] mb-12">Tinker connects your experiences so you can spot patterns and avoid repeating mistakes.</p>

                 <div className="relative h-40 flex items-center justify-center mb-8">
                    <div className="absolute w-full border-t border-dashed border-[#C16D3B]/30"></div>
                    <div className="relative z-10 w-16 h-16 rounded-full bg-[#FAF7F2] border-2 border-[#C16D3B] flex items-center justify-center text-[#C16D3B] shadow-sm">
                      <Lightbulb className="w-8 h-8" />
                    </div>
                 </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-center gap-2 mb-8">
                  <div className="w-2 h-2 rounded-full bg-[#EBE5D9]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#C16D3B]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#EBE5D9]"></div>
                </div>
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="4" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
               <div className="flex justify-between items-center mb-10">
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846]">tinker</h3>
                 <button onClick={skipToQuestionnaire} className="text-sm text-[#A0988E] hover:text-[#C16D3B]">Skip</button>
              </div>
              <div className="text-center">
                 <h1 className="text-3xl font-semibold font-[var(--ui-font-display)] mb-4">All your work.<br/>Organized.</h1>
                 <p className="text-[#847B6F] text-[15px] mb-10">Projects, references, skills, and insights - everything in one beautiful workspace.</p>

                 <div className="bg-[#FAF7F2] rounded-xl border border-[#EBE5D9] p-4 text-left shadow-sm mb-10">
                    <div className="flex items-center justify-between border-b border-[#EBE5D9] pb-3 mb-3">
                       <span className="text-xs font-semibold uppercase tracking-wider text-[#A0988E]">Projects</span>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#EBE5D9] rounded-md"></div><div className="h-2 w-24 bg-[#EBE5D9] rounded-full"></div></div>
                       <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#EBE5D9] rounded-md"></div><div className="h-2 w-16 bg-[#EBE5D9] rounded-full"></div></div>
                    </div>
                 </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-center gap-2 mb-8">
                  <div className="w-2 h-2 rounded-full bg-[#EBE5D9]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#EBE5D9]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#C16D3B]"></div>
                </div>
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="5" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846]">tinker</h3>
                 <span className="text-xs font-bold text-[#C16D3B] uppercase tracking-wider">Let's go!</span>
              </div>
              <h1 className="text-2xl font-semibold font-[var(--ui-font-display)] mb-2 text-center">What will you be working on?</h1>
              <p className="text-[#847B6F] text-sm text-center mb-8">This helps us personalize your experience.</p>

              <div className="space-y-3 mb-8">
                {["Woodworking", "Metalworking", "Electronics", "Other / Something else"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFocus(opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl border flex justify-between items-center transition-all",
                      focus === opt ? "bg-[#FAF2E8] border-[#E8A57A] text-[#91461A]" : "bg-white border-[#EBE5D9] text-[#554E46] hover:bg-[#FAF7F2]"
                    )}
                  >
                    <span className="font-medium text-sm">{opt}</span>
                    {focus === opt && <Check className="w-4 h-4 text-[#C16D3B]" />}
                  </button>
                ))}
              </div>
              <div className="mt-auto">
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="6" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex items-center mb-8">
                 <button onClick={prev} className="text-[#A0988E] hover:text-[#554E46] flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846] ml-auto">tinker</h3>
              </div>
              <h1 className="text-2xl font-semibold font-[var(--ui-font-display)] mb-2 text-center">What's your experience level?</h1>
              <p className="text-[#847B6F] text-sm text-center mb-8">We'll tailor tips and guidance just for you.</p>

              <div className="space-y-3 mb-8">
                {[
                  { title: "Just getting started", sub: "New to this craft" },
                  { title: "Some experience", sub: "I've made a few things" },
                  { title: "Very experienced", sub: "I teach or build professionally" }
                ].map(opt => (
                  <button
                    key={opt.title}
                    onClick={() => setExperience(opt.title)}
                    className={cn(
                      "w-full text-left px-5 py-3 rounded-xl border flex justify-between items-center transition-all",
                      experience === opt.title ? "bg-[#FAF2E8] border-[#E8A57A]" : "bg-white border-[#EBE5D9] hover:bg-[#FAF7F2]"
                    )}
                  >
                    <div>
                       <div className={cn("font-medium text-sm mb-0.5", experience === opt.title ? "text-[#91461A]" : "text-[#554E46]")}>{opt.title}</div>
                       <div className="text-xs text-[#A0988E]">{opt.sub}</div>
                    </div>
                    {experience === opt.title && <Check className="w-4 h-4 text-[#C16D3B]" />}
                  </button>
                ))}
              </div>
              <div className="mt-auto">
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="7" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex items-center mb-8">
                 <button onClick={prev} className="text-[#A0988E] hover:text-[#554E46] flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846] ml-auto">tinker</h3>
              </div>
              <h1 className="text-2xl font-semibold font-[var(--ui-font-display)] mb-2 text-center">Where will most of your work happen?</h1>
              <p className="text-[#847B6F] text-sm text-center mb-8">You can change this anytime.</p>

              <div className="space-y-3 mb-8">
                {["Home Workshop", "Garage / Shed", "Studio / Shared Space", "Other"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setWorkspace(opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl border flex justify-between items-center transition-all",
                      workspace === opt ? "bg-[#FAF2E8] border-[#E8A57A] text-[#91461A]" : "bg-white border-[#EBE5D9] text-[#554E46] hover:bg-[#FAF7F2]"
                    )}
                  >
                    <span className="font-medium text-sm">{opt}</span>
                    {workspace === opt && <Check className="w-4 h-4 text-[#C16D3B]" />}
                  </button>
                ))}
              </div>
              <div className="mt-auto">
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key="8" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex items-center mb-8">
                 <button onClick={prev} className="text-[#A0988E] hover:text-[#554E46] flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846] ml-auto">tinker</h3>
              </div>
              <h1 className="text-2xl font-semibold font-[var(--ui-font-display)] mb-2 text-center">What's your biggest goal right now?</h1>
              <p className="text-[#847B6F] text-sm text-center mb-8">Pick one to help us guide you.</p>

              <div className="space-y-3 mb-8">
                {["Build better projects", "Learn new skills", "Solve problems faster", "Document my process"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setGoal(opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl border flex justify-between items-center transition-all",
                      goal === opt ? "bg-[#FAF2E8] border-[#E8A57A] text-[#91461A]" : "bg-white border-[#EBE5D9] text-[#554E46] hover:bg-[#FAF7F2]"
                    )}
                  >
                    <span className="font-medium text-sm">{opt}</span>
                    {goal === opt && <Check className="w-4 h-4 text-[#C16D3B]" />}
                  </button>
                ))}
              </div>
              <div className="mt-auto">
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors">Next</button>
              </div>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key="9" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="flex items-center mb-8">
                 <button onClick={prev} className="text-[#A0988E] hover:text-[#554E46] flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
                 <h3 className="text-lg font-medium font-[var(--ui-font-display)] text-[#B78846] ml-auto">tinker</h3>
              </div>
              <h1 className="text-2xl font-semibold font-[var(--ui-font-display)] mb-2 text-center">Create your first workspace (Shop)</h1>
              <p className="text-[#847B6F] text-sm text-center mb-8">Name your space to get started.</p>

              <div className="space-y-6 mb-8">
                 <div>
                    <label className="block text-sm font-medium text-[#554E46] mb-2">Shop Name</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full border border-[#EBE5D9] rounded-xl px-4 py-3 bg-[#FAF7F2] focus:bg-white focus:ring-2 focus:ring-[#E8A57A] outline-none transition-all text-[#3D3730] font-medium"
                      data-testid="input-onboarding-shop-name"
                    />
                    <p className="text-xs text-[#A0988E] mt-2">You can always change this later</p>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-[#554E46] mb-2">Shop Icon</label>
                    <div className="flex gap-3">
                       {['home', 'camera', 'plug', 'blocks'].map(icon => (
                         <button
                           key={icon}
                           onClick={() => setShopIcon(icon)}
                           className={cn(
                             "w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                             shopIcon === icon ? "bg-[#FAF2E8] border-[#E8A57A] text-[#C16D3B]" : "bg-white border-[#EBE5D9] text-[#A0988E] hover:bg-[#FAF7F2]"
                           )}
                         >
                            {icon === 'home' && <Hexagon className="w-5 h-5" />}
                            {icon === 'camera' && <Component className="w-5 h-5" />}
                            {icon === 'plug' && <Blocks className="w-5 h-5" />}
                            {icon === 'blocks' && <Blocks className="w-5 h-5" />}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="mt-auto">
                <button onClick={next} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-3.5 font-medium hover:bg-[#A95A2E] transition-colors shadow-sm">Create My Shop</button>
              </div>
            </motion.div>
          )}

          {step === 10 && (
            <motion.div key="10" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full text-center relative min-h-[400px]">
              <div className="absolute inset-0 bg-[#FAF2E8] -mx-8 -my-8 px-8 py-8 flex flex-col items-center justify-center z-0">
                 <h1 className="text-4xl font-semibold font-[var(--ui-font-display)] mb-4 text-[#3D3730] z-10 relative">You're all set!</h1>
                 <p className="text-[#847B6F] text-[15px] mb-12 z-10 relative">Your workshop is ready.<br/>Let's build, learn, and tinker.</p>

                 <div className="w-32 h-32 mb-12 relative z-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-[#EBE5D9]">
                    <Hexagon className="w-16 h-16 text-[#C16D3B]" />
                 </div>

                 <div className="w-full space-y-3 mt-auto">
                   <button onClick={handleComplete} className="w-full rounded-[12px] bg-[#C16D3B] text-white py-4 font-semibold hover:bg-[#A95A2E] transition-colors shadow-md text-lg tracking-wide" data-testid="btn-onboarding-complete">Go to Workshop</button>
                   <button onClick={handleStartTour} className="w-full text-[#A0988E] hover:text-[#C16D3B] text-sm py-2 font-medium transition-colors">Take a Quick Tour</button>
                 </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
