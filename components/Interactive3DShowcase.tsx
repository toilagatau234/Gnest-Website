'use client';

import { useState, useRef, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Sparkles, Sliders, Type, Layers, Check, Zap, Eye } from 'lucide-react';

const BOTTLES = [
  { id: 'round', label: 'Chai Tròn Thủy Tinh', height: 210, width: 100, rx: 16, desc: 'Dáng truyền thống sang trọng' },
  { id: 'square', label: 'Chai Dẹt Cao Cấp', height: 210, width: 85, rx: 6, desc: 'Tối nén, thanh lịch hiện đại' },
  { id: 'hex', label: 'Hũ Yến Lục Giác', height: 160, width: 110, rx: 12, desc: 'Cạnh sắc sảo, khúc xạ 3D' }
];

const CAPS = [
  { id: 'wood', label: 'Nắp Gỗ Sồi', color: 'from-[#be9a68] to-[#9a7543]', text: 'Mộc mạc, bền vững', border: 'border-yellow-700/30' },
  { id: 'gold', label: 'Nắp Kim Loại Vàng', color: 'from-[#ffd700] via-[#ecc416] to-[#bba00a]', text: 'Tráng kim hoàng gia', border: 'border-amber-600/40' },
  { id: 'matte', label: 'Nắp Đen Nhám Premium', color: 'from-[#2e3440] to-[#1c202a]', text: 'Hiện đại, huyền bí', border: 'border-slate-800/50' }
];

const INKS = [
  { id: '#ffd700', name: 'Nhũ Vàng Gold', shadow: 'rgba(255,215,0,0.5)' },
  { id: '#e31e24', name: 'Đỏ Ruby ĐTL', shadow: 'rgba(227,30,36,0.5)' },
  { id: '#0ea5e9', name: 'Xanh Ngọc Sapphire', shadow: 'rgba(14,165,233,0.5)' },
  { id: '#ffffff', name: 'Trắng Sữa Satin', shadow: 'rgba(255,255,255,0.4)' },
  { id: '#111827', name: 'Đen Thẫm Midnight', shadow: 'rgba(0,0,0,0.4)' }
];

export function Interactive3DShowcase() {
  const [selectedBottle, setSelectedBottle] = useState('round');
  const [selectedCap, setSelectedCap] = useState('wood');
  const [selectedInk, setSelectedInk] = useState('#ffd700');
  const [brandText, setBrandText] = useState('ĐẠI TÀI LỢI');
  const [subText, setSubText] = useState('PREMIUM GLASS');

  // Mouse physical interaction tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth springs to avoid framerate stutter (60fps animation budget)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 16, stiffness: 140, mass: 0.15 };
  const rotateX = useSpring(useTransform(y, [0, 1], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-18, 18]), springConfig);

  // Dynamic light source pathing based on cursor coordinates for realistic specular metallic sheen!
  const lightX = useSpring(useTransform(x, [0, 1], [10, 90]), springConfig);
  const lightY = useSpring(useTransform(y, [0, 1], [10, 90]), springConfig);
  const reflectionX = useSpring(useTransform(x, [0, 1], [15, 85]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    x.set(rx);
    y.set(ry);
  };

  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  const currentBottle = BOTTLES.find(b => b.id === selectedBottle) || BOTTLES[0];
  const currentCap = CAPS.find(c => c.id === selectedCap) || CAPS[0];

  return (
    <section className="py-16 bg-gradient-to-b from-[#0e1726] to-[#0a0f1d] text-white border-y border-white/5 relative overflow-hidden" id="studio-3d">
      {/* Visual background ambient spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-dtl-red/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none"></div>
      
      {/* Decorative floating grids */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M15 0H0v15h15V0zm15 15H15v15h15V15z\" fill=\"%23ffffff\" fill-opacity=\"1\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')" }}
      ></div>

      <div className="max-w-[1220px] mx-auto px-5 relative z-10">
        
        {/* Floating tech badge and header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-dtl-red/30 to-rose-500/10 border border-dtl-red/40 text-rose-300 text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-dtl-red" />
            STUDIO THIẾT KẾ 3D PHÁT QUANG
          </span>
          <h2 className="text-3xl md:text-[38px] font-black leading-tight tracking-tight uppercase">
            TỰ THIẾT KẾ <em className="text-dtl-red not-italic">IN THƯƠNG HIỆU</em> 3D
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto font-sans leading-relaxed">
            Mô phỏng 3D thời gian thực cực kỳ sắc nét. Xoay chuột trên chai thủy tinh để trải nghiệm phản chiếu ánh sáng và kiểm tra bản in sấy lụa nổi độc quyền!
          </p>
          <div className="w-[80px] h-[3.5px] bg-dtl-red mx-auto mt-4 rounded-full shadow-[0_2px_10px_rgba(227,30,36,0.6)]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: 3D Physics View Container (take up 7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center relative min-h-[460px] md:min-h-[500px] rounded-2xl bg-slate-900/40 border border-white/5 p-6 backdrop-blur-md overflow-hidden group/view">
            
            {/* Holographic grid and scanning bar */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-dtl-red/40 to-transparent animate-[shimmer_2s_infinite]"></div>
            <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-black/40 px-3 py-1 rounded-full border border-white/5 z-20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span>RENDER ENGINE: 3D HYBRID SPRINGS VIA GPU</span>
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-1 font-mono text-[11px] text-slate-400 z-20">
              <Eye className="w-3.5 h-3.5 text-dtl-red" />
              <span>Xoay chuột để tương tác</span>
            </div>

            {/* Interactive Object Area */}
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative w-full h-[360px] flex items-center justify-center cursor-grab active:cursor-grabbing transform-gpu select-none"
              style={{ perspective: '1200px' }}
            >
              {/* Spinning orbit ring guide when not hovered */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  opacity: hovered ? 0 : 0.15,
                  scale: hovered ? 0.8 : 1
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 25, ease: 'linear' },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 }
                }}
                className="absolute w-64 h-64 rounded-full border-2 border-dashed border-white pointer-events-none z-0"
              />

              {/* Subtle interactive discoverability tooltip overlay */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ 
                  opacity: hovered ? 0 : 0.95, 
                  y: hovered ? 25 : 0,
                  scale: hovered ? 0.95 : 1
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute bottom-5 z-40 bg-gradient-to-r from-slate-900/95 to-black/95 backdrop-blur-md px-4.5 py-2 rounded-full border border-dtl-red/30 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] pointer-events-none"
              >
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dtl-red opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-dtl-red"></span>
                </div>
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-200 font-sans flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-dtl-red animate-[pulse_1.5s_infinite]" />
                  Di chuyển & Xoay chuột để tương tác 3D
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-white/5 py-0.5 px-1.5 rounded border border-white/5">
                  60 FPS ACTIVE
                </span>
              </motion.div>

              <motion.div
                style={{
                  rotateX: rotateX,
                  rotateY: rotateY,
                  transformStyle: 'preserve-3d',
                }}
                className="relative flex flex-col items-center justify-center will-change-transform z-10"
              >
                {/* 3D Bottle shadow on ground */}
                <motion.div 
                  className="absolute -bottom-10 w-[140px] h-[20px] bg-black/50 rounded-full blur-xl pointer-events-none"
                  style={{
                    scaleX: useTransform(rotateX, [15, -15], [0.85, 1.15]),
                    opacity: useTransform(rotateX, [15, -15], [0.4, 0.75])
                  }}
                />

                {/* THE 3D BOTTLE ASSEMBLY */}
                <div style={{ transform: 'translateZ(0px)' }} className="relative flex flex-col items-center select-none">
                  
                  {/* CAP LAYER with 3D Depth */}
                  <motion.div 
                    className={`relative z-30 bg-gradient-to-r ${currentCap.color} rounded-t-md shadow-lg will-change-transform border ${currentCap.border}`}
                    style={{
                      height: selectedBottle === 'hex' ? 26 : 32,
                      width: selectedBottle === 'hex' ? 84 : 54,
                      transform: 'translateZ(30px)',
                    }}
                    layout
                  >
                    {/* Highlight glare on wood or metal cap */}
                    <div className="absolute inset-y-0 left-1/4 w-3 bg-white/20 blur-[1px]"></div>
                    {/* Ring ridges on thread caps */}
                    {selectedCap !== 'wood' && (
                      <div className="absolute inset-x-0 bottom-1 flex flex-col gap-0.5 opacity-40">
                        <div className="h-[2px] bg-black/40"></div>
                        <div className="h-[2px] bg-black/40"></div>
                      </div>
                    )}
                  </motion.div>

                  {/* NECK JOINT */}
                  <div className="w-[30px] h-[14px] bg-slate-200/40 relative z-20 border-x border-slate-100/10 backdrop-blur-sm shadow-inner overflow-hidden">
                    <div className="absolute inset-y-0 left-1/3 w-1.5 bg-white/45 blur-[0.5px]"></div>
                  </div>

                  {/* BOTTLE BODY LAYER */}
                  <motion.div
                    className="relative z-10 bg-white/10 border-2 border-white/25 rounded-md flex flex-col items-center justify-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] overflow-hidden"
                    style={{
                      height: currentBottle.height,
                      width: currentBottle.width,
                      borderRadius: currentBottle.rx,
                      backdropFilter: 'blur(1px)',
                      background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.01) 100%)',
                      boxShadow: 'inset 0 10px 30px rgba(255,255,255,0.15), inset 0 -10px 20px rgba(0,0,0,0.3)',
                      transform: 'translateZ(15px)',
                    }}
                    layout
                  >
                    {/* Fluid liquid line mimicking fill (optional aesthetic) */}
                    <div className="absolute bottom-0 inset-x-0 h-[88%] bg-gradient-to-t from-slate-200/5 to-slate-100/2 rounded-b-[inherit]"></div>

                    {/* Specular Glare/Reflection running on container glass based on live mouse movements */}
                    <motion.div 
                      className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none mix-blend-overlay blur-[2px] z-20"
                      style={{
                        left: useTransform(reflectionX, [15, 85], ['-10%', '110%'])
                      }}
                    />

                    {/* Extreme bright highlight curve */}
                    <div className="absolute top-[8%] left-[8%] bottom-[8%] w-[2.5px] bg-white/45 rounded-full blur-[0.5px]"></div>
                    <div className="absolute top-[8%] right-[8%] bottom-[8%] w-[1.5px] bg-black/20 rounded-full"></div>

                    {/* IN-SITE EMBOSS SILK DESIGNED BRANDING */}
                    <motion.div 
                      className="relative z-30 p-2 flex flex-col items-center justify-center text-center select-none"
                      style={{
                        transform: 'translateZ(28px)', // Raise from the bottle surface so it looks clearly printed in 3D
                        color: selectedInk,
                        filter: `drop-shadow(0 2px 5px ${selectedInk === '#ffd700' ? 'rgba(212,175,55,0.4)' : selectedInk === '#e31e24' ? 'rgba(227,30,36,0.3)' : 'rgba(0,0,0,0.2)'})`
                      }}
                    >
                      {/* Interactive graphic logo */}
                      <div className="w-9 h-9 border-2 border-current rounded-full flex items-center justify-center mb-1.5 opacity-90 relative">
                        <span className="text-[14px] font-black tracking-tighter pt-0.5">DTL</span>
                        <div className="absolute -inset-1 border border-current rounded-full opacity-35 scale-110"></div>
                      </div>

                      {/* Configurable Brand Title */}
                      <span className="text-[12px] min-[380px]:text-[14px] font-black uppercase tracking-widest leading-none mb-0.5 block px-1 whitespace-nowrap overflow-hidden max-w-[130px] text-ellipsis">
                        {brandText || 'ĐẠI TÀI LỢI'}
                      </span>

                      {/* Thin separating lines */}
                      <div className="w-10 h-[1.5px] bg-current opacity-85 my-1.5"></div>

                      {/* Configurable Brand Subtext */}
                      <span className="text-[7.5px] min-[380px]:text-[8px] font-black uppercase tracking-[0.25em] leading-none mb-1 opacity-95">
                        {subText || 'PREMIUM BRAND'}
                      </span>
                      
                      {/* Premium labels */}
                      <div className="text-[6px] font-bold border border-current rounded-full px-1.5 py-0.5 mt-1 scale-90 opacity-75">
                        CÔNG NGHỆ CHÂN KHÔNG
                      </div>
                    </motion.div>

                  </motion.div>
                </div>

              </motion.div>
            </div>

            {/* Interactive metrics dashboard (Khangvibe aesthetic) */}
            <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-white/5 font-mono text-[10px] text-slate-400">
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">ROTATION X:</span>
                <span className="font-bold text-white">{rotateX.get().toFixed(1)}°</span>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">ROTATION Y:</span>
                <span className="font-bold text-white">{rotateY.get().toFixed(1)}°</span>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">GLOSS REFLECTION:</span>
                <span className="font-bold text-teal-400">FPS STABLE (60)</span>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">CURVATURE OPTION:</span>
                <span className="font-bold text-dtl-red uppercase">{selectedBottle}</span>
              </div>
            </div>

          </div>

          {/* RIGHT: High-end Design Studio Customization Side (take up 5 columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            
            {/* Customize steps */}
            <div className="space-y-6">
              
              {/* Step 1: Bottle Silhouette */}
              <div>
                <div className="flex items-center gap-1.5 mb-3.5">
                  <span className="w-5 h-5 bg-dtl-red text-white font-mono text-[11px] font-bold flex items-center justify-center rounded-sm">1</span>
                  <h3 className="text-[13px] font-bold uppercase text-slate-300">Chọn quy cách phôi chai</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BOTTLES.map((b) => {
                    const active = selectedBottle === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBottle(b.id)}
                        className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between h-[82px] cursor-pointer ${
                          active
                            ? 'bg-dtl-red/10 border-dtl-red shadow-[0_0_15px_rgba(227,30,36,0.15)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">{b.label}</span>
                          {active && (
                            <span className="w-3.5 h-3.5 rounded-full bg-dtl-red flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </div>
                        <span className="text-[9.5px] text-slate-400 mt-1 block leading-tight">{b.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Cap assembly */}
              <div>
                <div className="flex items-center gap-1.5 mb-3.5">
                  <span className="w-5 h-5 bg-dtl-red text-white font-mono text-[11px] font-bold flex items-center justify-center rounded-sm">2</span>
                  <h3 className="text-[13px] font-bold uppercase text-slate-300">Phụ kiện nắp đậy</h3>
                </div>
                <div className="space-y-2">
                  {CAPS.map((c) => {
                    const active = selectedCap === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCap(c.id)}
                        className={`w-full text-left py-2.5 px-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          active
                            ? 'bg-white/10 border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-4 bg-gradient-to-r ${c.color} rounded border ${c.border}`}></div>
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">{c.label}</span>
                            <span className="text-[9px] text-slate-400 block">{c.text}</span>
                          </div>
                        </div>
                        {active && (
                          <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-slate-900" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Ink Color options */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-5 h-5 bg-dtl-red text-white font-mono text-[11px] font-bold flex items-center justify-center rounded-sm">3</span>
                  <h3 className="text-[13px] font-bold uppercase text-slate-300">Màu mực in ấn bán nung</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INKS.map((ink) => {
                    const active = selectedInk === ink.id;
                    return (
                      <button
                        key={ink.id}
                        onClick={() => setSelectedInk(ink.id)}
                        className={`group relative p-1.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          active
                            ? 'bg-[#1b2a47] border-slate-400'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full border border-white/25 flex items-center justify-center shrink-0" 
                          style={{ 
                            backgroundColor: ink.id,
                            boxShadow: active ? `0 0 10px ${ink.shadow}` : 'none'
                          }}
                        >
                          {active && (
                            <Check className={`w-3 h-3 ${ink.id === '#ffffff' ? 'text-black' : 'text-white'}`} strokeWidth={3} />
                          )}
                        </div>
                        <span className="text-[11px] font-bold pr-1.5 text-slate-300">{ink.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Text Content branding */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-5 h-5 bg-dtl-red text-white font-mono text-[11px] font-bold flex items-center justify-center rounded-sm">4</span>
                  <h3 className="text-[13px] font-bold uppercase text-slate-300">Soạn tên nhãn hiệu sấy lụa</h3>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 text-slate-500">
                      <Type className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      value={brandText}
                      onChange={(e) => setBrandText(e.target.value.toUpperCase())}
                      placeholder="TÊN THƯƠNG HIỆU"
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-8.5 pr-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white focus:outline-none focus:border-dtl-red focus:ring-1 focus:ring-dtl-red/40"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 text-slate-500">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      maxLength={18}
                      value={subText}
                      onChange={(e) => setSubText(e.target.value.toUpperCase())}
                      placeholder="DÒNG CHỮ PHỤ CỦA CHAI"
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-8.5 pr-2.5 py-2 text-[11px] font-bold uppercase tracking-widest text-white focus:outline-none focus:border-dtl-red focus:ring-1 focus:ring-dtl-red/40"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Call to action panel */}
            <div className="mt-8 pt-5 border-t border-white/5 flex flex-col gap-3">
              <div className="bg-gradient-to-r from-dtl-red/25 to-transparent border-l-2 border-dtl-red p-3.5 rounded-r-lg">
                <span className="text-[11px] font-black text-[#ffa5a7] uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-dtl-red fill-dtl-red animate-pulse" /> CHIẾT KHẤU ĐẶC BIỆT
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-1">
                  Xưởng ĐTL miễn phí 100% bản vẽ thiết kế marquette 3D và tặng gói khuôn in trị giá 3.000.000đ cho đơn đặt hàng sỉ trong hôm nay.
                </p>
              </div>
              <a 
                href="#lien-he"
                className="w-full bg-dtl-red hover:bg-dtl-red-dark text-white font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-dtl-red/20 hover:-translate-y-0.5"
              >
                Nhận Báo Giá Đơn In 3D Sỉ Ngay →
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
