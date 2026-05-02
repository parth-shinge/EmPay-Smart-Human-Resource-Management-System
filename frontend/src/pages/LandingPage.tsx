import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import DecryptedText from '@/components/ui/DecryptedText';
import { useNavigate } from 'react-router-dom';

/* ──────────────────────────────────────────────
   3D Tilt Card – mouse-reactive perspective
   ────────────────────────────────────────────── */
function TiltCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)' });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(800px) rotateY(${x * 12}deg) rotateX(${y * -12}deg) scale3d(1.02,1.02,1.02)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)' });
  };

  return (
    <div
      ref={ref}
      className={`card-3d ${className}`}
      style={{ ...style, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Animated Counter
   ────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ──────────────────────────────────────────────
   Section Reveal Wrapper
   ────────────────────────────────────────────── */
function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Feature data
   ────────────────────────────────────────────── */
const features = [
  {
    icon: 'fingerprint',
    title: 'Smart Attendance',
    description:
      'Biometric-grade clock tracking with geo-fencing and real-time anomaly detection. Every second, accounted for.',
  },
  {
    icon: 'event_available',
    title: 'Leave Engine',
    description:
      'Multi-tier approval workflows with automatic balance calculations, carry-forward logic, and conflict detection.',
  },
  {
    icon: 'account_balance',
    title: 'Payroll Core',
    description:
      'One-click payroll processing with automatic tax deductions, PF calculations, and audit-ready payslip generation.',
  },
];

/* ══════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);



  return (
    <div className="min-h-screen bg-[#0c1324] text-white font-['Manrope'] selection:bg-cyan-500/30 overflow-x-hidden">

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-slate-800/40">
        <nav className="flex justify-between items-center px-6 md:px-10 py-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-500 text-2xl">memory</span>
            <span className="text-xl font-bold tracking-[0.15em] text-white font-['Space_Grotesk'] uppercase">
              EmPay
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Architecture'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-['Space_Grotesk'] text-xs tracking-[0.15em] uppercase text-slate-400 hover:text-cyan-400 transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          <button
            onClick={() => navigate('/login')}
            className="font-['Space_Grotesk'] tracking-[0.12em] uppercase text-cyan-400 text-xs font-bold border border-cyan-500/30 px-5 py-2 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all duration-300"
          >
            Sign In
          </button>
        </nav>
      </header>

      <main>
        {/* ─── HERO SECTION with Lamp Effect ─── */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
        >
          {/* Lamp Effect */}
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
            <div className="relative flex w-full h-full items-start justify-center isolate z-0" style={{ paddingTop: '60px' }}>
              <motion.div
                initial={{ opacity: 0.5, width: "15rem" }}
                whileInView={{ opacity: 1, width: "30rem" }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                style={{ backgroundImage: `conic-gradient(from 70deg at center top, rgb(6,182,212), transparent, transparent)` }}
                className="absolute right-1/2 h-[300px] overflow-visible w-[30rem] top-[60px]"
              >
                <div className="absolute w-full left-0 bg-[#0c1324] h-40 bottom-0 z-20" style={{ maskImage: 'linear-gradient(to top, white, transparent)' }} />
                <div className="absolute w-40 h-full left-0 bg-[#0c1324] bottom-0 z-20" style={{ maskImage: 'linear-gradient(to right, white, transparent)' }} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0.5, width: "15rem" }}
                whileInView={{ opacity: 1, width: "30rem" }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                style={{ backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, rgb(6,182,212))` }}
                className="absolute left-1/2 h-[300px] w-[30rem] top-[60px]"
              >
                <div className="absolute w-40 h-full right-0 bg-[#0c1324] bottom-0 z-20" style={{ maskImage: 'linear-gradient(to left, white, transparent)' }} />
                <div className="absolute w-full right-0 bg-[#0c1324] h-40 bottom-0 z-20" style={{ maskImage: 'linear-gradient(to top, white, transparent)' }} />
              </motion.div>
              {/* Bright glow bar */}
              <motion.div
                initial={{ width: "15rem" }}
                whileInView={{ width: "30rem" }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                className="absolute z-50 h-[2px] w-[30rem] top-[60px] bg-cyan-400"
              />
              {/* Glow bloom behind bar */}
              <motion.div
                initial={{ width: "8rem" }}
                whileInView={{ width: "16rem" }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                className="absolute z-30 h-36 w-64 top-[10px] rounded-full bg-cyan-400 blur-2xl"
              />
              {/* Large diffuse glow */}
              <div className="absolute z-20 h-36 w-[28rem] top-[20px] rounded-full bg-cyan-500 opacity-50 blur-3xl"></div>
              {/* Ceiling - hides everything above the bar */}
              <div className="absolute z-40 h-[62px] w-full top-0 bg-[#0c1324]"></div>
            </div>
          </div>

          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative z-10 text-center px-6 max-w-4xl"
          >
            {/* Headline */}
            <h1 className="font-['Space_Grotesk'] text-5xl sm:text-6xl lg:text-[76px] font-bold leading-[1.05] tracking-tighter mb-6 uppercase">
              <DecryptedText
                text="PRECISION HR"
                animateOn="view"
                sequential
                revealDirection="start"
                speed={50}
                className="text-white"
                encryptedClassName="text-cyan-500/40"
              />
              <br />
              <span className="text-cyan-400">
                <DecryptedText
                  text="& PAYROLL"
                  animateOn="view"
                  sequential
                  revealDirection="center"
                  speed={70}
                  className="text-cyan-400"
                  encryptedClassName="text-cyan-700/30"
                />
              </span>
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
              Engineered for modern organizations. Automate attendance, streamline workflows, and process payroll with surgical precision.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => navigate('/login')}
                className="bg-cyan-500 text-[#0c1324] px-8 py-4 rounded-lg font-['Space_Grotesk'] text-xs tracking-[0.15em] uppercase font-bold hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300"
              >
                Get Started
              </button>
              <a
                href="#features"
                className="border border-slate-700 text-white px-8 py-4 rounded-lg font-['Space_Grotesk'] text-xs tracking-[0.15em] uppercase font-bold hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300"
              >
                View Architecture
              </a>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-10 sm:gap-16">
              {[
                { value: 10, suffix: 'x', label: 'Faster Payroll' },
                { value: 100, suffix: '%', label: 'Audit Trail' },
                { value: 4, suffix: '', label: 'Role Layers' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-cyan-400 font-['Space_Grotesk']">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-slate-500 font-['Space_Grotesk'] tracking-[0.1em] uppercase mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bottom fade line */}
          <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        </motion.section>

        {/* ─── FEATURES BENTO ─── */}
        <section id="features" className="py-28 px-6 md:px-10 max-w-7xl mx-auto">
          <RevealSection className="mb-16 text-center">
            <span className="text-cyan-400 font-['Space_Grotesk'] text-xs tracking-[0.25em] uppercase mb-4 block">
              Architecture
            </span>
            <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl lg:text-[52px] font-bold text-white tracking-tighter uppercase">
              Engineering Excellence
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <RevealSection key={f.title} delay={i * 0.15}>
                <TiltCard className="group relative bg-slate-900/80 border border-slate-800 p-8 rounded-xl hover:border-cyan-500/60 transition-colors duration-500 overflow-hidden h-full">
                  {/* Hover glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/0 blur-[60px] rounded-full group-hover:bg-cyan-500/10 transition-colors duration-500" />

                  <div className="flex flex-col h-full relative z-10">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-[#070d1f] border border-slate-800 flex items-center justify-center mb-8 group-hover:border-cyan-500/50 group-hover:scale-110 transition-all duration-300">
                      <span className="material-symbols-outlined text-cyan-500">{f.icon}</span>
                    </div>

                    <h3 className="font-['Space_Grotesk'] text-2xl font-medium text-white mb-4 tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed text-[15px]">{f.description}</p>


                  </div>
                </TiltCard>
              </RevealSection>
            ))}
          </div>
        </section>

        {/* ─── PRODUCT SHOWCASE ─── */}
        <section id="architecture" className="py-28 px-6 md:px-10 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <RevealSection className="order-2 lg:order-1">
              <div className="inline-flex items-center px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                <span className="text-cyan-400 font-['Space_Grotesk'] text-[10px] tracking-[0.15em] uppercase">
                  Command Center
                </span>
              </div>

              <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight tracking-tighter uppercase">
                Total Operational Clarity.
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                A sophisticated dashboard designed for precision. Monitor attendance anomalies, process payroll in
                one click, and maintain a complete audit trail — all from a single command center.
              </p>

              <ul className="space-y-4">
                {[
                  'Role-Based Access Control (4 tiers)',
                  'One-Click Payroll Generation',
                  'Real-Time Attendance Analytics',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <span className="material-symbols-outlined text-cyan-500 text-lg">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </RevealSection>

            {/* Image side */}
            <RevealSection delay={0.2} className="order-1 lg:order-2 relative">
              <div className="relative group">
                <div className="aspect-[4/3] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/dashboard-preview.png"
                    alt="EmPay HR Dashboard — futuristic dark interface with cyan accents showing employee analytics and payroll data"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324]/70 via-transparent to-transparent" />

                  {/* Overlay info card */}
                  <div className="absolute bottom-5 left-5 right-5 p-5 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-cyan-400 font-['Space_Grotesk'] text-[10px] tracking-[0.15em] uppercase mb-1">
                          DASHBOARD_V4
                        </p>
                        <p className="text-white font-['Space_Grotesk'] text-lg font-medium">EmPay HR</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-['Space_Grotesk'] text-[10px] tracking-[0.1em] uppercase">
                          Uptime
                        </p>
                        <p className="text-white font-['Space_Grotesk'] text-lg font-medium">99.9%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating decorative frame */}
                <div className="absolute -inset-3 border border-cyan-500/10 rounded-3xl pointer-events-none" />
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ─── CTA SECTION ─── */}
        <section className="py-28 px-6 md:px-10">
          <RevealSection>
            <div className="max-w-3xl mx-auto text-center relative">
              {/* Background glow */}
              <div className="absolute inset-0 -m-20 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06),transparent_70%)]" />

              <span className="text-cyan-400 font-['Space_Grotesk'] text-xs tracking-[0.25em] uppercase mb-4 block relative z-10">
                Deploy Now
              </span>
              <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tighter uppercase relative z-10">
                Ready to Modernize HR?
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto relative z-10">
                EmPay delivers enterprise-grade HR management with the elegance of modern software. Start your journey today.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="relative z-10 bg-cyan-500 text-[#0c1324] px-10 py-4 rounded-lg font-['Space_Grotesk'] text-xs tracking-[0.15em] uppercase font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all duration-300"
              >
                Access Dashboard
              </button>
            </div>
          </RevealSection>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#070d1f] w-full py-12 border-t border-slate-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-cyan-500">memory</span>
              <span className="text-slate-200 font-semibold font-['Space_Grotesk'] tracking-[0.12em] uppercase">
                EmPay Systems
              </span>
            </div>
            <p className="font-['Space_Grotesk'] text-[10px] tracking-[0.12em] uppercase text-slate-500 leading-relaxed">
              © 2024 EmPay Systems. Precision Engineered HR.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {['Features', 'Architecture'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="font-['Space_Grotesk'] text-[11px] tracking-[0.12em] uppercase text-slate-500 hover:text-cyan-400 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
