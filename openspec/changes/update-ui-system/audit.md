<!-- INPUT: 代码扫描结果（禁用色/图标对比度/间距/过渡）。 -->
<!-- OUTPUT: UI 审计清单（供修正执行）。 -->
<!-- POS: update-ui-system 变更的审计记录。 -->
# UI 审计清单（阶段 1：扫描）

说明：本清单为静态扫描结果，包含禁用色/图标对比度/间距/过渡候选点；需在实现阶段逐条复核。

## 禁用色与硬编码色值（#000/#fff）

```txt
components/AstroChart.tsx:598:    planetBg: isDark ? '#0a0e1a' : '#ffffff',
components/AstroChart.tsx:732:    const color = ASPECT_COLORS[aspect.type] || '#fff';
components/cbt/ReportDashboard.tsx:129:  const chartGrid = isLight ? '#E4D7C6' : '#ffffff08';
components/cbt/AnalysisViews.tsx:933:                <Tooltip contentStyle={{background:'#000', border:'none', borderRadius:'8px', fontSize:'10px'}} itemStyle={{color:'#fff'}}/>
```

## 纯黑/纯白 Tailwind 类（bg/text）

```txt
App.tsx:661:            {[1,2,3].map(i => <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-gold-500' : (theme === 'dark' ? 'bg-white/10' : 'bg-paper-300')}`} />)}
App.tsx:708:                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-gold-500/15' : 'bg-white border-gray-200'} shadow-lg max-h-48 overflow-auto`}>
App.tsx:890:                    <div className={`h-1 w-full rounded-full overflow-hidden mb-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-paper-200'}`}>
App.tsx:2078:                            <div className={`rounded-2xl border ${bubbleBorder} p-6 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-white'}`}>
App.tsx:3420:                    className={`w-full h-10 px-4 pr-8 rounded-lg outline-none transition-all font-sans text-sm appearance-none bg-no-repeat ${theme === 'dark' ? 'bg-space-900 border border-gold-500/15 text-star-50' : 'bg-white border-paper-300 text-paper-900'}`}
App.tsx:3525:                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-gold-500/15' : 'bg-white border-gray-200'} shadow-lg max-h-48 overflow-auto`}>
App.tsx:3720:                                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-paper-200'}`}>
App.tsx:5433:                                                : 'bg-white border-paper-300 hover:bg-paper-100 hover:border-gold-600/30'
App.tsx:5464:                                        : 'bg-white/90 border-paper-300 shadow-xl'
App.tsx:5494:                                            : 'bg-white border-paper-300 text-gold-600'
App.tsx:5543:                            <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-paper-200 border border-paper-300 group-hover:bg-paper-300' : 'bg-white/5 group-hover:bg-gold-500/20 group-hover:text-gold-400'}`}>
App.tsx:5552:                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${isLight ? 'border-gold-500/40 bg-white text-gold-600' : 'border-gold-500/30 bg-space-950 text-gold-500'}`}>
App.tsx:5639:                                                    iconTone: theme === 'dark' ? 'border-gold-500/30 bg-space-950 text-gold-500' : 'border-gold-600/40 bg-white text-gold-600',
App.tsx:5649:                                                    iconTone: theme === 'dark' ? 'border-accent/30 bg-space-950 text-accent' : 'border-accent/30 bg-white text-accent',
App.tsx:5659:                                                    iconTone: theme === 'dark' ? 'border-star-200/30 bg-space-950 text-star-200' : 'border-gold-600/30 bg-white text-gold-600',
App.tsx:5669:                                                    iconTone: theme === 'dark' ? 'border-success/30 bg-space-950 text-success' : 'border-success/30 bg-white text-success',
App.tsx:5679:                                                    iconTone: theme === 'dark' ? 'border-gold-400/30 bg-space-950 text-gold-400' : 'border-gold-600/30 bg-white text-gold-600',
App.tsx:5822:                                                    : 'border-gold-600/30 bg-white text-gold-600'
App.tsx:6031:                    <ActionButton onClick={onReset} size="sm" className="bg-danger border-danger text-white hover:bg-danger/80 w-full">
App.tsx:6380:                <Card className={`p-6 md:p-8 ${isDark ? 'bg-space-900 border-gold-500/20' : 'bg-white border-paper-300'}`}>
App.tsx:6414:                <Card className={`p-6 md:p-8 ${isDark ? 'bg-space-900 border-gold-500/20' : 'bg-white border-paper-300'}`}>
App.tsx:6431:                                    : 'bg-white border-paper-300 hover:bg-paper-100 text-paper-900'
App.tsx:6448:                                    ? 'bg-white text-black hover:bg-gray-100'
App.tsx:6449:                                    : 'bg-black text-white hover:bg-gray-900'
App.tsx:6639:                <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-space-950/90 border-gold-500/15' : 'bg-white/90 border-paper-300'}`}>
App.tsx:6700:                     <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg ${theme === 'dark' ? 'bg-space-900/80 border-gold-500/15' : 'bg-white/80 border-paper-300'}`}>
App.tsx:6736:                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
App.tsx:6742:                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
App.tsx:6747:                            <h2 className="text-xl font-bold text-white">{authT.migrate_title}</h2>
components/reports/ReportViewPage.tsx:184:        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
components/UIComponents.tsx:154:        : "bg-white/90 border-paper-300 text-paper-900 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-paper-400"
components/UIComponents.tsx:246:        : "bg-white text-paper-900 hover:bg-paper-100 hover:border-accent/50 border border-paper-300",
components/UIComponents.tsx:334:    <div className={`rounded-lg overflow-hidden mb-3 border transition-colors ${isOpen ? 'border-accent/40' : s.divider} ${theme === 'dark' ? 'bg-space-900/40' : 'bg-white/60'}`}>
components/UIComponents.tsx:507:        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
components/UIComponents.tsx:514:        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl z-10 animate-slide-up border ${s.divider} ${theme === 'dark' ? 'bg-space-900' : 'bg-white'} ${className} focus:outline-none`}
components/UIComponents.tsx:516:        <div className={`sticky top-0 z-20 flex justify-between items-center px-6 py-4 border-b ${s.divider} backdrop-blur-md ${theme === 'dark' ? 'bg-space-900/80' : 'bg-white/80'}`}>
components/UIComponents.tsx:521:            className={`w-8 h-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center rounded-lg transition-colors ${s.muted} hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
components/UIComponents.tsx:712:          <div className="p-2 rounded-xl transition-all bg-white/5 group-hover:bg-gold-500/20">
components/UIComponents.tsx:732:    ? 'bg-white/70 border border-paper-300/80 shadow-[0_12px_20px_rgba(122,104,78,0.08)]'
components/UIComponents.tsx:806:        <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-white/90 border border-paper-300 group-hover:bg-paper-200 shadow-lg' : 'bg-white/5 group-hover:bg-gold-500/20'}`}>
components/design-tokens.ts:160:    input: 'bg-white/90 border-paper-300 text-paper-900 placeholder-paper-400',
components/design-tokens.ts:202:  overlay: 'fixed inset-0 bg-black/40 backdrop-blur-sm',
components/design-tokens.ts:234:    light: 'bg-white text-paper-900 border border-paper-300',
components/design-tokens.ts:395:      default: 'bg-mystic-500 text-white',
components/design-tokens.ts:401:      default: 'bg-psycho-500 text-white',
components/design-tokens.ts:431:    veryPositive: 'bg-emerald-500 text-white',
components/design-tokens.ts:432:    positive: 'bg-green-500 text-white',
components/design-tokens.ts:433:    neutral: 'bg-amber-500 text-white',
components/design-tokens.ts:434:    negative: 'bg-orange-500 text-white',
components/design-tokens.ts:435:    veryNegative: 'bg-red-500 text-white',
components/Paywall.tsx:37:    card: isDark ? 'bg-space-900' : 'bg-white',
components/Paywall.tsx:274:        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
components/Paywall.tsx:283:          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
components/Paywall.tsx:291:          <h2 className="text-xl font-bold text-white">解锁 {displayName}</h2>
components/Paywall.tsx:298:              <h3 className="font-medium text-white">使用积分解锁</h3>
components/Paywall.tsx:303:              className={`px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-full font-medium transition-colors ${(!canSpend || isProcessing) ? 'opacity-60 cursor-not-allowed' : ''}`}
components/Paywall.tsx:315:              <h3 className="font-medium text-white">购买积分</h3>
components/Paywall.tsx:320:              className={`px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
components/Paywall.tsx:331:            <span className="absolute -top-3 left-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-medium">
components/Paywall.tsx:336:                <h3 className="font-medium text-white flex items-center gap-2">
components/Paywall.tsx:344:                className={`px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-full font-medium transition-colors ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
components/Paywall.tsx:448:      <span className="font-medium text-white">{quota.totalLeft}</span>
components/TechSpecsComponents.tsx:127:        <div className={`bg-black/10 ${headerClass}`}></div>
components/TechSpecsComponents.tsx:135:            <div className={`flex flex-col items-center justify-center p-2 gap-1 bg-black/5 border-r ${borderClass}`}>
components/TechSpecsComponents.tsx:208:  const emptyBg = isDark ? 'bg-space-900/40' : 'bg-white';
components/TechSpecsComponents.tsx:408:  const headerBg = isDark ? 'bg-black/20' : 'bg-black/5';
components/TechSpecsComponents.tsx:447:  const headerBg = isDark ? 'bg-black/20' : 'bg-black/5';
components/TechSpecsComponents.tsx:539:  const emptyBg = isDark ? 'bg-space-900/40' : 'bg-white';
components/TechSpecsComponents.tsx:658:  const emptyBg = isDark ? 'bg-space-900/40' : 'bg-white';
components/wiki/WikiIndexPage.tsx:174:        <div className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center text-2xl ${theme === 'dark' ? 'bg-space-900/70' : 'bg-white/80'}`}>
components/wiki/WikiDetailPage.tsx:221:            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-white/80 border-paper-200'}`}>
components/wiki/WikiDetailPage.tsx:225:            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-white/80 border-paper-200'}`}>
components/wiki/WikiDetailPage.tsx:234:            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-white/80 border-paper-200'}`}>
components/wiki/WikiDetailPage.tsx:243:            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-white/80 border-paper-200'}`}>
components/wiki/WikiDetailPage.tsx:252:            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-white/80 border-paper-200'}`}>
components/wiki/WikiDetailPage.tsx:261:            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-white/80 border-paper-200'}`}>
components/wiki/WikiHomePage.tsx:239:                        <div key={item.title} className={`p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`}>
components/wiki/WikiHomePage.tsx:259:                <div className={`absolute inset-0 rounded-2xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`} />
components/wiki/WikiHomePage.tsx:363:                <div key={item.title} className={`p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`}>
components/wiki/synthetica/ReportView.tsx:74:      <div className={`rounded-2xl border border-l-4 border-l-gold-500 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
components/wiki/synthetica/ReportView.tsx:76:          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-gold-600/30 bg-white text-gold-600' : 'border-gold-500/30 bg-space-950 text-gold-500'}`}>
components/wiki/synthetica/ReportView.tsx:96:          { accent: 'border-l-accent', iconTone: isLight ? 'border-accent/30 bg-white text-accent' : 'border-accent/30 bg-space-950 text-accent' },
components/wiki/synthetica/ReportView.tsx:97:          { accent: 'border-l-success', iconTone: isLight ? 'border-success/30 bg-white text-success' : 'border-success/30 bg-space-950 text-success' },
components/wiki/synthetica/ReportView.tsx:98:          { accent: 'border-l-gold-400', iconTone: isLight ? 'border-gold-600/30 bg-white text-gold-600' : 'border-gold-400/30 bg-space-950 text-gold-400' },
components/wiki/synthetica/ReportView.tsx:99:          { accent: 'border-l-star-200', iconTone: isLight ? 'border-star-200/30 bg-white text-star-200' : 'border-star-200/30 bg-space-950 text-star-200' },
components/wiki/synthetica/ReportView.tsx:106:            className={`rounded-2xl border border-l-4 ${style.accent} p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}
components/wiki/synthetica/ReportView.tsx:196:          className={`w-full py-3 rounded-xl border transition-all ${isLight ? 'bg-white border-paper-300 hover:border-gold-500/50 text-paper-700' : 'bg-space-900 border-gold-500/20 hover:border-gold-500/40 text-star-200'}`}
components/wiki/WikiSyntheticaPage.tsx:271:                    : 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-md')
components/wiki/WikiSyntheticaPage.tsx:275:                      : 'bg-white border-2 border-gold-500 text-gold-600 shadow-lg')
components/wiki/WikiSyntheticaPage.tsx:408:                  : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg'
components/wiki/WikiClassicsPage.tsx:77:  const panelSurface = isDark ? 'bg-space-900/60' : 'bg-white/95'; // 提升不透明度 80→95
components/wiki/WikiClassicsPage.tsx:78:  const cardSurface = isDark ? 'bg-space-900/80' : 'bg-white/95'; // 提升不透明度 90→95
components/wiki/WikiClassicsPage.tsx:296:            <div className="absolute left-1.5 top-0 h-full w-px bg-white/20" />
components/wiki/WikiClassicsPage.tsx:466:                      <div className={`h-px w-full ${isDark ? 'bg-white/5' : 'bg-paper-200/60'}`} />
components/ColorSystemDemo.tsx:78:                  ${SEMANTIC_COLORS.success.bg} text-white text-lg
components/ColorSystemDemo.tsx:101:                  ${SEMANTIC_COLORS.warning.bg} text-white text-lg
components/ColorSystemDemo.tsx:124:                  ${SEMANTIC_COLORS.danger.bg} text-white text-lg
components/ColorSystemDemo.tsx:147:                  ${SEMANTIC_COLORS.info.bg} text-white text-lg
components/ColorSystemDemo.tsx:183:                  text-white text-2xl
components/ColorSystemDemo.tsx:200:                text-white font-medium
components/ColorSystemDemo.tsx:220:                  text-white text-2xl
components/ColorSystemDemo.tsx:237:                text-white font-medium
components/ColorSystemDemo.tsx:473:                  <div className="w-12 h-12 rounded-xl bg-mystic-500 flex items-center justify-center text-white text-xl">✨</div>
components/ColorSystemDemo.tsx:480:                  <div className="w-12 h-12 rounded-xl bg-psycho-500 flex items-center justify-center text-white text-xl">🧠</div>
components/auth/UserMenu.tsx:148:            : 'bg-white border-paper-200'
components/auth/PaymentSuccessPage.tsx:87:            <CheckCircle className="w-12 h-12 text-white" />
components/cbt/CBTWizard.tsx:38:    ? 'bg-white/5 border-white/10'
components/cbt/CBTWizard.tsx:46:  const panelSurfaceSoftTone = isLight ? 'bg-paper-100/70' : 'bg-white/5';
components/cbt/CBTWizard.tsx:57:    : 'bg-white/5 border-white/10 text-star-400 hover:bg-white/10';
components/cbt/CBTWizard.tsx:67:  const overlayTone = isLight ? 'bg-paper-200/80' : 'bg-black/85';
components/cbt/CBTWizard.tsx:73:  const progressTrackTone = isLight ? 'bg-paper-200' : 'bg-white/10';
components/cbt/CBTWizard.tsx:76:    : 'bg-white/5 border-gold-500/10 text-star-400 hover:bg-danger/20 hover:text-danger';
components/cbt/CBTWizard.tsx:77:  const guideCardTone = isLight ? 'bg-paper-100/80 border-paper-300' : 'bg-white/[0.02] border-gold-500/10';
components/cbt/CBTWizard.tsx:583:            <button onClick={onClose} className={`flex items-center gap-3 font-bold transition-all px-4 py-2 rounded-xl ${isLight ? 'text-star-200 hover:bg-paper-200' : 'text-star-400 hover:text-star-50 hover:bg-white/5'}`}><ArrowLeft size={20} /> {t.journal.back_to_journal}</button>
components/cbt/CBTWizard.tsx:640:                  className={`group flex flex-col items-center gap-8 p-8 rounded-[3rem] border hover:scale-105 transition-all duration-700 shadow-2xl relative overflow-hidden ${panelSurfaceTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-200' : 'hover:bg-white/[0.08] hover:border-gold-500/50'}`}
components/cbt/CBTWizard.tsx:712:                    <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all border shadow-xl ${currentStep === 0 ? 'opacity-0 invisible' : (isLight ? 'bg-paper-100 text-star-200 border-paper-300 hover:bg-paper-200' : 'bg-white/5 text-star-400 hover:text-star-50 hover:bg-white/10 border-gold-500/10')}`}><ArrowLeft size={16} /> {t.journal.prev_step}</button>
components/auth/Paywall.tsx:156:          isDark ? 'bg-space-900 border border-space-600' : 'bg-white border border-paper-300'
components/cbt/ReportDashboard.tsx:201:      <div className={`rounded-xl border border-l-4 border-l-gold-500 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
components/cbt/ReportDashboard.tsx:223:      <div className={`rounded-xl border border-l-4 border-l-accent p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
components/cbt/ReportDashboard.tsx:225:          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-accent/30 bg-white text-accent' : 'border-accent/30 bg-space-950 text-accent'}`}>
components/cbt/ReportDashboard.tsx:243:      <div className={`rounded-xl border border-l-4 border-l-success p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
components/cbt/ReportDashboard.tsx:245:          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-success/30 bg-white text-success' : 'border-success/30 bg-space-950 text-success'}`}>
components/cbt/ReportDashboard.tsx:264:      <div className={`rounded-xl border border-l-4 border-l-gold-500 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
components/cbt/ReportDashboard.tsx:266:          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-gold-600/30 bg-white text-gold-600' : 'border-gold-500/30 bg-space-950 text-gold-500'}`}>
components/cbt/ReportDashboard.tsx:303:      <div className={`rounded-xl border border-l-4 border-l-star-200 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
components/cbt/ReportDashboard.tsx:305:          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-star-200/30 bg-white text-star-200' : 'border-star-200/30 bg-space-950 text-star-200'}`}>
components/cbt/AnalysisViews.tsx:171:  const panelTone = isLight ? 'bg-white/80 border-paper-200' : 'bg-space-800/40 border-gold-500/10';
components/cbt/AnalysisViews.tsx:175:    : 'bg-white/5 hover:bg-white/10 text-star-400 hover:text-gold-400 border border-white/5';
components/cbt/AnalysisViews.tsx:283:  const cardTone = isLight ? 'bg-white border-paper-200 shadow-sm' : 'bg-space-800/20 border-gold-500/10';
components/cbt/AnalysisViews.tsx:353:  const overlayTone = isLight ? 'bg-paper-200/80' : 'bg-black/80';
components/cbt/AnalysisViews.tsx:368:          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-paper-200 text-star-200' : 'hover:bg-white/10 text-star-400'}`}><X size={20}/></button>
components/cbt/CalendarStats.tsx:31:    ? 'bg-white/90 border-paper-300 text-paper-900 shadow-sm'
components/cbt/CalendarStats.tsx:248:            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
components/cbt/CalendarStats.tsx:332:      <div className={`absolute inset-0 backdrop-blur-xl ${isLight ? 'bg-paper-200/80' : 'bg-black/85'}`} onClick={onClose}></div>
components/auth/LoginModal.tsx:183:                : 'bg-white border-paper-300 hover:bg-paper-100 text-paper-900'
components/auth/LoginModal.tsx:200:                ? 'bg-white text-black hover:bg-gray-100'
components/auth/LoginModal.tsx:201:                : 'bg-black text-white hover:bg-gray-900'
components/auth/UpgradeModal.tsx:174:            <Crown className="w-8 h-8 text-white" />
components/auth/UpgradeModal.tsx:214:                        : 'bg-white shadow-md'
components/auth/UpgradeModal.tsx:215:                      : 'hover:bg-white/5'
components/auth/UpgradeModal.tsx:236:                        : 'bg-white shadow-md ring-2 ring-gold-500'
components/auth/UpgradeModal.tsx:237:                      : 'hover:bg-white/5'
components/auth/UpgradeModal.tsx:242:                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-white rounded-full">
```

## Unicode 图标（星座/行星）出现位置

```txt
App.tsx:196:    { key: 'sun', label: t.me.sun || '☉ Sun', subtitle: t.me.sun_sub || 'Core Identity', data: data?.sun, accent: 'border-l-red-500' },
App.tsx:197:    { key: 'moon', label: t.me.moon || '☽ Moon', subtitle: t.me.moon_sub || 'Inner World', data: data?.moon, accent: 'border-l-blue-500' },
App.tsx:1991:                        <SensCard icon="♀" label={t.us.perspective_venus} p={data.sensitivity_panel.venus} />
App.tsx:1992:                        <SensCard icon="♂" label={t.us.perspective_mars} p={data.sensitivity_panel.mars} />
App.tsx:1993:                        <SensCard icon="☿" label={t.us.perspective_mercury} p={data.sensitivity_panel.mercury} />
App.tsx:2271:                                        <span className="text-2xl">♇</span>
App.tsx:4348:                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-red-500/15 text-red-500' : 'bg-red-500/10 text-red-500'}`}>☉</div>
App.tsx:4358:                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-blue-500/15 text-blue-500' : 'bg-blue-500/10 text-blue-500'}`}>☽</div>
App.tsx:4389:                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-blue-400/15 text-blue-400' : 'bg-blue-400/10 text-blue-400'}`}>☿</div>
App.tsx:4399:                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-pink-500/15 text-pink-500' : 'bg-pink-500/10 text-pink-500'}`}>♀</div>
App.tsx:4409:                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-orange-500/15 text-orange-500' : 'bg-orange-500/10 text-orange-500'}`}>♂</div>
App.tsx:4565:                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'}`}>☿</div>
App.tsx:4572:                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'}`}>♀</div>
App.tsx:4579:                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-danger/15 text-danger' : 'bg-danger/10 text-danger'}`}>♂</div>
constants.ts:112:    'Sun': { glyph: '☉', color: '#FF6B6B', keywords: { zh: '自我、意志、生命力', en: 'Self, Will, Vitality' } },
constants.ts:113:    'Moon': { glyph: '☽', color: '#74B9FF', keywords: { zh: '情绪、安全感、内在需求', en: 'Emotions, Security, Inner Needs' } },
constants.ts:114:    'Mercury': { glyph: '☿', color: '#FFEAA7', keywords: { zh: '思维、沟通、学习', en: 'Mind, Communication, Learning' } },
constants.ts:115:    'Venus': { glyph: '♀', color: '#55EFC4', keywords: { zh: '爱、美、价值观', en: 'Love, Beauty, Values' } },
constants.ts:116:    'Mars': { glyph: '♂', color: '#FF85C1', keywords: { zh: '行动、欲望、勇气', en: 'Action, Desire, Courage' } },
constants.ts:117:    'Jupiter': { glyph: '♃', color: '#FF7675', keywords: { zh: '扩张、信仰、好运', en: 'Expansion, Faith, Fortune' } },
constants.ts:118:    'Saturn': { glyph: '♄', color: '#DFE6E9', keywords: { zh: '责任、限制、成熟', en: 'Responsibility, Limits, Maturity' } },
constants.ts:119:    'Uranus': { glyph: '♅', color: '#00CEC9', keywords: { zh: '变革、独立、创新', en: 'Change, Independence, Innovation' } },
constants.ts:120:    'Neptune': { glyph: '♆', color: '#74B9FF', keywords: { zh: '梦想、灵感、迷惑', en: 'Dreams, Inspiration, Illusion' } },
constants.ts:121:    'Pluto': { glyph: '♇', color: '#A29BFE', keywords: { zh: '转化、权力、重生', en: 'Transformation, Power, Rebirth' } },
constants.ts:140:    'Aries': { glyph: '♈', element: 'Fire', modality: 'Cardinal', color: '#FF6B6B' },
constants.ts:141:    'Taurus': { glyph: '♉', element: 'Earth', modality: 'Fixed', color: '#FFEAA7' },
constants.ts:142:    'Gemini': { glyph: '♊', element: 'Air', modality: 'Mutable', color: '#00CEC9' },
constants.ts:143:    'Cancer': { glyph: '♋', element: 'Water', modality: 'Cardinal', color: '#74B9FF' },
constants.ts:144:    'Leo': { glyph: '♌', element: 'Fire', modality: 'Fixed', color: '#FF7675' },
constants.ts:145:    'Virgo': { glyph: '♍', element: 'Earth', modality: 'Mutable', color: '#FFEAA7' },
constants.ts:146:    'Libra': { glyph: '♎', element: 'Air', modality: 'Cardinal', color: '#00CEC9' },
constants.ts:147:    'Scorpio': { glyph: '♏', element: 'Water', modality: 'Fixed', color: '#74B9FF' },
constants.ts:148:    'Sagittarius': { glyph: '♐', element: 'Fire', modality: 'Mutable', color: '#FF6B6B' },
constants.ts:149:    'Capricorn': { glyph: '♑', element: 'Earth', modality: 'Cardinal', color: '#FFEAA7' },
constants.ts:150:    'Aquarius': { glyph: '♒', element: 'Air', modality: 'Fixed', color: '#00CEC9' },
constants.ts:151:    'Pisces': { glyph: '♓', element: 'Water', modality: 'Mutable', color: '#74B9FF' },
components/wiki/WikiIndexPage.tsx:16:  sun: '☉',
components/wiki/WikiIndexPage.tsx:18:  mercury: '☿',
components/wiki/WikiIndexPage.tsx:19:  venus: '♀',
components/wiki/WikiIndexPage.tsx:20:  mars: '♂',
components/wiki/WikiIndexPage.tsx:21:  jupiter: '♃',
components/wiki/WikiIndexPage.tsx:22:  saturn: '♄',
components/wiki/WikiIndexPage.tsx:23:  uranus: '♅',
components/wiki/WikiIndexPage.tsx:24:  neptune: '♆',
components/wiki/WikiIndexPage.tsx:25:  pluto: '♇',
components/wiki/WikiIndexPage.tsx:26:  aries: '♈',
components/wiki/WikiIndexPage.tsx:27:  taurus: '♉',
components/wiki/WikiIndexPage.tsx:28:  gemini: '♊',
components/wiki/WikiIndexPage.tsx:29:  cancer: '♋',
components/wiki/WikiIndexPage.tsx:30:  leo: '♌',
components/wiki/WikiIndexPage.tsx:31:  virgo: '♍',
components/wiki/WikiIndexPage.tsx:32:  libra: '♎',
components/wiki/WikiIndexPage.tsx:33:  scorpio: '♏',
components/wiki/WikiIndexPage.tsx:34:  sagittarius: '♐',
components/wiki/WikiIndexPage.tsx:35:  capricorn: '♑',
components/wiki/WikiIndexPage.tsx:36:  aquarius: '♒',
components/wiki/WikiIndexPage.tsx:37:  pisces: '♓',
components/wiki/WikiHomePage.tsx:17:  planets: '☉',
components/wiki/synthetica/constants.ts:20:  { id: 'sun', name: 'Sun', symbol: '☉', keywords: ['self', 'identity', 'life purpose'], archetype: 'The Hero', tier: 1 },
components/wiki/synthetica/constants.ts:21:  { id: 'moon', name: 'Moon', symbol: '☽', keywords: ['emotions', 'needs', 'security'], archetype: 'Inner Child / Mother', tier: 1 },
components/wiki/synthetica/constants.ts:22:  { id: 'mercury', name: 'Mercury', symbol: '☿', keywords: ['communication', 'logic', 'mind'], archetype: 'The Messenger', tier: 2 },
components/wiki/synthetica/constants.ts:23:  { id: 'venus', name: 'Venus', symbol: '♀', keywords: ['love', 'values', 'harmony'], archetype: 'The Lover', tier: 2 },
components/wiki/synthetica/constants.ts:24:  { id: 'mars', name: 'Mars', symbol: '♂', keywords: ['action', 'drive', 'conflict'], archetype: 'The Warrior', tier: 2 },
components/wiki/synthetica/constants.ts:25:  { id: 'jupiter', name: 'Jupiter', symbol: '♃', keywords: ['expansion', 'wisdom', 'fortune'], archetype: 'The Sage', tier: 3 },
components/wiki/synthetica/constants.ts:26:  { id: 'saturn', name: 'Saturn', symbol: '♄', keywords: ['structure', 'discipline', 'time'], archetype: 'The Builder', tier: 3 },
components/wiki/synthetica/constants.ts:27:  { id: 'uranus', name: 'Uranus', symbol: '♅', keywords: ['change', 'rebellion', 'innovation'], archetype: 'The Awakener', tier: 4 },
components/wiki/synthetica/constants.ts:28:  { id: 'neptune', name: 'Neptune', symbol: '♆', keywords: ['dreams', 'illusion', 'spirit'], archetype: 'The Mystic', tier: 4 },
components/wiki/synthetica/constants.ts:29:  { id: 'pluto', name: 'Pluto', symbol: '♇', keywords: ['transformation', 'power', 'rebirth'], archetype: 'The Transformer', tier: 4 },
components/wiki/synthetica/constants.ts:33:  { id: 'aries', name: 'Aries', symbol: '♈︎', element: 'Fire', modality: 'Cardinal', archetype: 'The Pioneer' },
components/wiki/synthetica/constants.ts:34:  { id: 'taurus', name: 'Taurus', symbol: '♉︎', element: 'Earth', modality: 'Fixed', archetype: 'The Stabilizer' },
components/wiki/synthetica/constants.ts:35:  { id: 'gemini', name: 'Gemini', symbol: '♊︎', element: 'Air', modality: 'Mutable', archetype: 'The Communicator' },
components/wiki/synthetica/constants.ts:36:  { id: 'cancer', name: 'Cancer', symbol: '♋︎', element: 'Water', modality: 'Cardinal', archetype: 'The Nurturer' },
components/wiki/synthetica/constants.ts:37:  { id: 'leo', name: 'Leo', symbol: '♌︎', element: 'Fire', modality: 'Fixed', archetype: 'The Creator' },
components/wiki/synthetica/constants.ts:38:  { id: 'virgo', name: 'Virgo', symbol: '♍︎', element: 'Earth', modality: 'Mutable', archetype: 'The Analyst' },
components/wiki/synthetica/constants.ts:39:  { id: 'libra', name: 'Libra', symbol: '♎︎', element: 'Air', modality: 'Cardinal', archetype: 'The Diplomat' },
components/wiki/synthetica/constants.ts:40:  { id: 'scorpio', name: 'Scorpio', symbol: '♏︎', element: 'Water', modality: 'Fixed', archetype: 'The Alchemist' },
components/wiki/synthetica/constants.ts:41:  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐︎', element: 'Fire', modality: 'Mutable', archetype: 'The Explorer' },
components/wiki/synthetica/constants.ts:42:  { id: 'capricorn', name: 'Capricorn', symbol: '♑︎', element: 'Earth', modality: 'Cardinal', archetype: 'The Strategist' },
components/wiki/synthetica/constants.ts:43:  { id: 'aquarius', name: 'Aquarius', symbol: '♒︎', element: 'Air', modality: 'Fixed', archetype: 'The Innovator' },
components/wiki/synthetica/constants.ts:44:  { id: 'pisces', name: 'Pisces', symbol: '♓︎', element: 'Water', modality: 'Mutable', archetype: 'The Dreamer' },
```

## 小间距候选（p-2/3/4, gap-1/2, space-y-1/2）

```txt
App.tsx:159:    <div className={`mb-8 p-4 rounded-lg border border-dashed ${borderColor} text-xs ${mutedText}`}>
App.tsx:202:    { title: t.me.melody, content: (<div className="space-y-2">{(data?.core_melody?.keywords || []).slice(0, 2).map((k, i) => (<div key={i} className="text-sm leading-relaxed"><span className="font-bold text-green-600 dark:text-green-500 uppercase text-xs tracking-wider block mb-0.5">{k}</span><span className="opacity-90">{data?.core_melody?.explanations?.[i]}</span></div>))}</div>), accent: 'border-l-green-500' },
App.tsx:205:    { title: t.me.trigger, content: (<div className="text-sm leading-relaxed space-y-1"><div className="opacity-90">{data?.trigger_card?.inner_need}</div><div className="text-xs text-purple-600 dark:text-purple-500 font-medium">{data?.trigger_card?.buffer_action}</div></div>), accent: 'border-l-purple-500' }
App.tsx:219:            <div className="flex flex-wrap gap-1.5 mb-3">
App.tsx:232:          <Card key={i} className={`border-l-2 ${c.accent} p-4`}>
App.tsx:266:  if (!data) return <div className="p-4 text-danger">{t.app.error}</div>;
App.tsx:295:                <div className="flex flex-wrap gap-2">{(data?.what_helps || []).map((h,i) => <span key={i} className="text-sm px-3 py-1.5 rounded border border-green-500/30 bg-green-500/5">{h}</span>)}</div>
App.tsx:302:             <ol className="list-decimal pl-4 text-sm space-y-2 opacity-90">{(data?.practice?.steps || []).map((s,i) => <li key={i} className="leading-relaxed">{s}</li>)}</ol>
App.tsx:390:          <ul className="mt-4 space-y-2 text-sm opacity-90">
App.tsx:392:              <li key={index} className="flex gap-2">
App.tsx:514:    if (!extendedData) return <div className="p-4 text-danger">{t.app.error}</div>;
App.tsx:660:        <div className="mb-8 flex gap-2 justify-center">
App.tsx:883:            <div className="p-4 h-full flex flex-col">
App.tsx:895:                <div className="text-xs space-y-1.5 opacity-90 flex-1 flex flex-col justify-between">
App.tsx:1219:                              <div className="p-4 text-center flex flex-col justify-center">
App.tsx:1237:                              <div className="text-sm font-bold text-emerald-400 uppercase mb-2 tracking-widest flex items-center gap-2">
App.tsx:1245:                              <div className="text-sm font-bold text-red-400 uppercase mb-2 tracking-widest flex items-center gap-2">
App.tsx:1585:          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[260px]">
App.tsx:1708:                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-gold-500/15 border border-gold-500/30' : 'bg-gold-500/10 border border-gold-500/20'}`}>
App.tsx:1823:            <ul className="space-y-2">
App.tsx:1825:                <li key={i} className="flex items-start gap-2 text-sm">
App.tsx:1834:            <ul className="space-y-2">
App.tsx:1836:                <li key={i} className="flex items-start gap-2 text-sm">
App.tsx:1875:            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.color}`}>
App.tsx:1907:                    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-space-900/60' : 'bg-paper-100'} border border-dashed ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
App.tsx:1933:            <div className="space-y-2 text-sm">
App.tsx:1965:                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
App.tsx:1969:                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-success/10' : 'bg-success/5'}`}>
App.tsx:1981:                        <div className="flex flex-wrap gap-2 mb-4">
App.tsx:2003:                                    <div className={`${DETAIL_LABEL_CLASS} flex flex-wrap gap-2 mb-2`}>
App.tsx:2010:                                    <div className={`p-3 rounded-lg border border-danger/30 border-l-2 border-l-danger/60 ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
App.tsx:2014:                                    <div className={`p-3 rounded-lg border border-accent/30 border-l-2 border-l-accent/60 ${theme === 'dark' ? 'bg-accent/10' : 'bg-accent/5'}`}>
App.tsx:2018:                                    <div className={`p-3 rounded-lg border border-gold-500/30 border-l-2 border-l-gold-500/60 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100'}`}>
App.tsx:2142:                        <div className="p-4 rounded-xl border border-l-2 border-l-blue-500/60">
App.tsx:2281:                                    <div className="p-3 rounded-lg border border-l-2 border-l-danger/60 border-danger/30">
App.tsx:2298:                                <div className="p-3 rounded-lg border border-l-2 border-l-success/60 border-success/30">
App.tsx:3152:            <div className="space-y-2">
App.tsx:3165:            <div className="space-y-2">
App.tsx:3198:            <div className="space-y-2">
App.tsx:3211:            <div className="space-y-2">
App.tsx:3243:            <div className="space-y-2">
App.tsx:3256:            <div className="space-y-2">
App.tsx:3328:            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
App.tsx:3366:                      <div className="flex items-center gap-2 flex-wrap">
App.tsx:3387:                      <div className="flex items-center gap-2 shrink-0">
App.tsx:3660:            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
App.tsx:3698:                               <div className="flex flex-wrap gap-2">
App.tsx:3750:                                   <div className={`p-4 rounded-lg border-l-2 border-purple-500 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100'}`}>
App.tsx:3755:                                     <ul className="space-y-2 text-sm">
App.tsx:3757:                                         <li key={i} className="flex gap-2 items-start">
App.tsx:3771:                                         <div className="space-y-2 text-xs">
App.tsx:3795:                                         <div className="space-y-2 text-xs">
App.tsx:3847:                                           <div className="space-y-2">
App.tsx:3896:                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
App.tsx:3900:                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
App.tsx:3904:                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
App.tsx:3908:                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
App.tsx:4029:                                   <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}>
App.tsx:4043:                                   <div className="grid grid-cols-7 gap-1 md:gap-2">
App.tsx:4049:                                         <div key={i} className={`p-2 rounded-lg text-center ${
App.tsx:4086:                                         <div key={i} className={`p-3 rounded-lg border-l-2 ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`} style={{ borderLeftColor: `var(--color-${periodStyle.color})` }}>
App.tsx:4087:                                           <div className="flex items-center gap-2 mb-2">
App.tsx:4103:                                       <div key={i} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
App.tsx:4104:                                         <div className="flex items-center gap-2 mb-2">
App.tsx:4111:                                             <ul className="mt-1 space-y-1">
App.tsx:4117:                                             <ul className="mt-1 space-y-1">
App.tsx:4206:                                 <div className={`mt-6 p-4 rounded-lg border text-xs ${theme === 'dark' ? 'border-gold-500/15/60 bg-space-900/60 text-star-300' : 'border-paper-300 bg-paper-100 text-paper-500'}`}>
App.tsx:4350:                                            <div className="flex items-center gap-2 mb-1">
App.tsx:4360:                                            <div className="flex items-center gap-2 mb-1">
App.tsx:4370:                                            <div className="flex items-center gap-2 mb-1">
App.tsx:4391:                                          <div className="flex items-center gap-2 mb-1">
App.tsx:4401:                                          <div className="flex items-center gap-2 mb-1">
App.tsx:4411:                                          <div className="flex items-center gap-2 mb-1">
App.tsx:4421:                                      <div className="space-y-2">
App.tsx:4423:                                          <div key={i} className="flex gap-2 items-start">
App.tsx:4436:                                        <div className="flex items-center gap-2 mb-2">
App.tsx:4443:                                        <div className="flex items-center gap-2 mb-2">
App.tsx:4450:                                        <div className="flex items-center gap-2 mb-2">
App.tsx:4457:                                        <div className="flex items-center gap-2 mb-2">
App.tsx:4488:                                            <div className="flex items-center gap-2 mb-3">
App.tsx:4498:                                            <div className="flex items-center gap-2 mb-3">
App.tsx:4518:                                      <div className="flex flex-wrap items-center gap-2 mb-3">
App.tsx:4589:                                        <div className="space-y-2">
App.tsx:4591:                                            <div key={i} className="flex gap-2 items-center">
App.tsx:5343:                            <div className="flex items-center justify-center gap-2 mt-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-600/70">
App.tsx:5354:                    <div className={`flex flex-wrap justify-center gap-2 mb-2 border-b pb-2 shrink-0 ${theme === 'dark' ? 'border-gold-500/15/30' : 'border-paper-300'}`}>
App.tsx:5360:                                    flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-all border rounded-md
App.tsx:5499:                                    <span className="mt-1 flex items-center gap-2 text-gold-500">
App.tsx:5543:                            <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-paper-200 border border-paper-300 group-hover:bg-paper-300' : 'bg-white/5 group-hover:bg-gold-500/20 group-hover:text-gold-400'}`}>
App.tsx:5549:                            className={`flex items-center gap-2 px-3 py-1 rounded-full border max-w-[70vw] ${isLight ? 'border-gold-500/30 bg-gold-500/10 text-gold-700' : 'border-gold-500/30 bg-gold-500/10 text-gold-400'}`}
App.tsx:5717:                                                    <span className="flex flex-wrap gap-1">
App.tsx:5775:                                                                <div className="flex flex-wrap items-center gap-2">
App.tsx:6403:                        <div className="space-y-2 text-sm">
App.tsx:6405:                                <div key={item} className="flex items-center gap-2">
App.tsx:6642:                        <div className="flex items-center gap-2 font-serif font-medium text-xl cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
App.tsx:6673:                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-colors ${
App.tsx:6734:                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
components/ErrorBoundary.tsx:53:        <div className="min-h-screen flex items-center justify-center p-4 bg-space-950">
components/ErrorBoundary.tsx:56:            <div className="space-y-2">
components/ErrorBoundary.tsx:66:              <details className="text-left bg-space-800/50 rounded-lg p-4 text-xs text-star-400 border border-gold-500/10">
components/reports/ReportsPage.tsx:156:        <div className={`mb-8 p-4 rounded-xl flex items-center justify-center gap-3 ${
components/reports/ReportsPage.tsx:167:        <div className={`mb-8 p-3 rounded-lg text-sm text-center ${
components/reports/ReportsPage.tsx:239:                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
components/reports/ReportsPage.tsx:250:                  <div className="flex items-baseline gap-2 mb-4">
components/reports/ReportsPage.tsx:277:                      <span className="flex items-center justify-center gap-2">
components/reports/ReportsPage.tsx:290:                        <span className="flex items-center justify-center gap-2">
components/reports/ReportsPage.tsx:294:                        <span className="flex items-center justify-center gap-2">
components/reports/ReportViewPage.tsx:139:          className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-star-400 hover:text-star-200' : 'text-paper-500 hover:text-paper-700'}`}
components/reports/ReportViewPage.tsx:161:            <div className="hidden md:flex items-center gap-2">
components/reports/ReportViewPage.tsx:209:      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-space-950 to-transparent">
components/reports/ReportViewPage.tsx:210:        <div className="flex gap-2">
components/reports/ReportViewPage.tsx:271:            <div className="flex items-center gap-2 mb-4">
components/reports/ReportViewPage.tsx:300:              <div className="flex items-center gap-2 mb-3">
components/reports/ReportViewPage.tsx:306:              <div className="space-y-1.5">
components/reports/ReportViewPage.tsx:310:                    className="flex items-start gap-2 text-sm"
components/reports/ReportViewPage.tsx:323:              <div className="flex items-center gap-2 mb-3">
components/reports/ReportViewPage.tsx:329:              <div className="space-y-1.5">
components/reports/ReportViewPage.tsx:333:                    className="flex items-start gap-2 text-sm"
components/UIComponents.tsx:264:            flex items-center justify-center gap-2
components/UIComponents.tsx:389:      <div className="flex justify-between items-baseline mb-1 gap-2">
components/UIComponents.tsx:394:      <div className="flex gap-2 mt-2 flex-wrap">
components/UIComponents.tsx:438:        className={`flex items-center gap-2 text-xs font-medium transition-colors hover:text-accent ${copied ? 'text-success' : (theme === 'dark' ? 'text-star-400' : 'text-paper-400')}`}
components/UIComponents.tsx:501:      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
components/UIComponents.tsx:712:          <div className="p-2 rounded-xl transition-all bg-white/5 group-hover:bg-gold-500/20">
components/UIComponents.tsx:792:      <span className="flex flex-wrap gap-1">
components/UIComponents.tsx:806:        <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-white/90 border border-paper-300 group-hover:bg-paper-200 shadow-lg' : 'bg-white/5 group-hover:bg-gold-500/20'}`}>
components/UIComponents.tsx:819:          <div className="text-center space-y-2 py-6">
components/UIComponents.tsx:853:                      <div className={`p-3 rounded-2xl ${goldIconTone}`}>
components/UIComponents.tsx:873:                    <div className={`p-3 rounded-2xl ${goldIconTone}`}>
components/UIComponents.tsx:898:                    <div className={`p-3 rounded-2xl ${goldIconTone}`}>
components/UIComponents.tsx:922:                                  <div key={nodeIdx} className="space-y-2">
components/design-tokens.ts:42:  cardCompact: 'p-4',    // 紧凑卡片
components/design-tokens.ts:47:  gapXs: 'gap-1.5',      // 6px
components/design-tokens.ts:48:  gapSm: 'gap-2',        // 8px
components/Paywall.tsx:271:    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
components/Paywall.tsx:295:        <div className="border border-white/10 rounded-xl p-4 mb-4 hover:border-white/20 transition-colors">
components/Paywall.tsx:312:        <div className="border border-white/10 rounded-xl p-4 mb-4 hover:border-white/20 transition-colors">
components/Paywall.tsx:330:          <div className="border-2 border-amber-500 rounded-xl p-4 relative">
components/Paywall.tsx:336:                <h3 className="font-medium text-white flex items-center gap-2">
components/Paywall.tsx:353:              <ul className="text-sm text-gray-400 space-y-1">
components/Paywall.tsx:354:                <li className="flex items-center gap-2">
components/Paywall.tsx:358:                <li className="flex items-center gap-2">
components/Paywall.tsx:362:                <li className="flex items-center gap-2">
components/Paywall.tsx:366:                <li className="flex items-center gap-2">
components/Paywall.tsx:370:                <li className="flex items-center gap-2">
components/Paywall.tsx:381:          <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
components/Paywall.tsx:390:          <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
components/Paywall.tsx:398:          <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
components/TechSpecsComponents.tsx:135:            <div className={`flex flex-col items-center justify-center p-2 gap-1 bg-black/5 border-r ${borderClass}`}>
components/TechSpecsComponents.tsx:146:                    <div key={modKey} className="relative flex flex-wrap items-center justify-center gap-2 p-2 h-full min-h-[60px]">
components/TechSpecsComponents.tsx:382:      <div className="flex items-center gap-2">
components/TechSpecsComponents.tsx:478:            <div className="flex items-center gap-2">
components/TechSpecsComponents.tsx:485:            <div className="flex items-center gap-2">
components/TechSpecsComponents.tsx:490:            <div className="text-right flex items-center justify-end gap-2">
components/TechSpecsComponents.tsx:492:              <span className="flex items-center gap-1 text-[10px] font-bold bg-gold-500/10 text-gold-500 px-2 py-1 rounded border border-gold-500/20">
components/wiki/WikiIndexPage.tsx:177:        <div className="flex-1 min-w-0 space-y-2">
components/wiki/WikiIndexPage.tsx:191:      md: { padding: 'p-4', symbol: 'text-2xl', title: 'text-sm', subtitle: 'text-[11px]', aspect: 'aspect-[4/3]' },
components/wiki/WikiIndexPage.tsx:192:      sm: { padding: 'p-4', symbol: 'text-2xl', title: 'text-sm', subtitle: 'text-[11px]', aspect: 'aspect-[4/3]' },
components/wiki/WikiIndexPage.tsx:206:        <div className="space-y-1">
components/wiki/WikiIndexPage.tsx:223:      <div className="p-4 flex items-start gap-3">
components/wiki/WikiIndexPage.tsx:225:        <div className="flex-1 min-w-0 space-y-2">
components/wiki/WikiDetailPage.tsx:35:      <div className="space-y-1.5">
components/wiki/WikiDetailPage.tsx:176:          <Link to="/wiki?tab=library" className={`inline-flex items-center gap-2 text-sm ${mutedText}`}>
components/wiki/WikiDetailPage.tsx:188:          <Link to="/wiki?tab=library" className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-gold-500 transition-colors`}>
components/wiki/WikiDetailPage.tsx:197:              <div className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${borderColor}`}>
components/wiki/WikiDetailPage.tsx:205:              <div className="flex flex-wrap gap-2">
components/wiki/WikiDetailPage.tsx:236:                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-600'}`}>
components/wiki/WikiDetailPage.tsx:245:                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
components/wiki/WikiDetailPage.tsx:254:                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`}>
components/wiki/WikiDetailPage.tsx:263:                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
components/wiki/WikiHomePage.tsx:175:              <div className="p-4 border-b border-dashed border-current/10 flex items-center justify-between">
components/wiki/WikiHomePage.tsx:181:                  <div className={`p-4 text-sm ${mutedText}`}>{t.wiki.search_empty}</div>
components/wiki/WikiHomePage.tsx:224:                <div className="flex items-center gap-2">
components/wiki/WikiHomePage.tsx:239:                        <div key={item.title} className={`p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`}>
components/wiki/WikiHomePage.tsx:260:                <div className="relative h-full p-4">
components/wiki/WikiHomePage.tsx:284:              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold-500">
components/wiki/WikiHomePage.tsx:302:              <div className="flex items-center gap-2">
components/wiki/WikiHomePage.tsx:363:                <div key={item.title} className={`p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`}>
components/wiki/synthetica/ReportView.tsx:57:        <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-gold-600' : 'text-gold-400'}`}>
components/wiki/synthetica/ReportView.tsx:83:        <div className="pl-12 space-y-2">
components/wiki/synthetica/ReportView.tsx:118:                  <div className="flex flex-wrap gap-1.5 mt-1">
components/wiki/synthetica/ReportView.tsx:132:                <div className="space-y-2">
components/wiki/synthetica/ReportView.tsx:133:                  <div className="flex items-center gap-2">
components/wiki/synthetica/ReportView.tsx:139:                  <div className="space-y-2">
components/wiki/synthetica/ReportView.tsx:151:                <div className="space-y-2">
components/wiki/synthetica/ReportView.tsx:152:                  <div className="flex items-center gap-2">
components/wiki/synthetica/ReportView.tsx:158:                  <div className="space-y-2">
components/wiki/synthetica/ReportView.tsx:170:                <div className="space-y-2">
components/wiki/synthetica/ReportView.tsx:171:                  <div className="flex items-center gap-2">
components/wiki/synthetica/ReportView.tsx:177:                  <div className="space-y-2">
components/wiki/synthetica/SelectionCard.tsx:39:  const paddingClass = compact ? 'p-3' : 'p-5';
components/wiki/WikiSyntheticaPage.tsx:221:        flex items-center gap-2 px-4 py-2 rounded-xl
components/wiki/WikiSyntheticaPage.tsx:263:            <div key={s.key} className="flex flex-col items-center gap-2">
components/wiki/WikiSyntheticaPage.tsx:424:                <span className="relative z-10 flex items-center justify-center gap-2">
components/wiki/WikiSyntheticaPage.tsx:619:                        flex items-center justify-between p-4 rounded-2xl border animate-fade-in
components/wiki/WikiSyntheticaPage.tsx:653:                             p-2 rounded-lg cursor-pointer transition-all duration-200
components/wiki/WikiSyntheticaPage.tsx:684:                       transition-all duration-200 flex items-center justify-center gap-2
components/wiki/WikiSyntheticaPage.tsx:761:        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-center text-red-200 mb-8 max-w-2xl mx-auto">
components/wiki/WikiClassicsPage.tsx:378:                <div className={`text-[11px] uppercase tracking-[0.25em] ${mutedText} flex items-center gap-2`}>
components/wiki/WikiClassicsPage.tsx:398:          <span className={`text-xs uppercase tracking-[0.2em] ${mutedText} flex items-center gap-2`}>
components/wiki/WikiClassicDetailPage.tsx:476:          className={`mb-5 p-4 rounded-lg border ${palette.preBorder} ${palette.preBg} overflow-x-auto text-[12.5px] md:text-[13px] ${palette.inkMuted} font-mono leading-relaxed whitespace-pre shadow-inner`}
components/wiki/WikiClassicDetailPage.tsx:564:          className={`inline-flex items-center gap-2 ${palette.inkMuted} ${linkHover} mb-6 transition-colors`}
components/OracleLoading.tsx:41:      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
components/OracleLoading.tsx:65:          <div className="flex justify-center gap-1.5 mt-2">
components/OracleLoading.tsx:511:        <div className="flex justify-center gap-2 mt-4">
components/AstroChart.tsx:759:          <div className="flex items-center gap-1.5">
components/AstroChart.tsx:762:          <div className="flex items-center gap-1.5">
components/AstroChart.tsx:765:          <div className="flex items-center gap-1.5">
components/AstroChart.tsx:768:          <div className="flex items-center gap-1.5">
components/ColorSystemDemo.tsx:60:          <div className="space-y-2">
components/ColorSystemDemo.tsx:164:          <div className="space-y-2">
components/ColorSystemDemo.tsx:187:                <div className="flex-1 space-y-1">
components/ColorSystemDemo.tsx:224:                <div className="flex-1 space-y-1">
components/ColorSystemDemo.tsx:261:                <div className="flex-1 space-y-1">
components/ColorSystemDemo.tsx:287:          <div className="space-y-2">
components/ColorSystemDemo.tsx:363:          <div className="space-y-2">
components/ColorSystemDemo.tsx:409:                    flex items-center gap-4 p-4 rounded-2xl
components/ColorSystemDemo.tsx:431:          <div className="space-y-2">
components/ColorSystemDemo.tsx:445:                <div className="space-y-2">
components/ColorSystemDemo.tsx:451:                <div className="space-y-2">
components/ColorSystemDemo.tsx:457:                <div className="space-y-2">
components/ColorSystemDemo.tsx:502:                <div className="space-y-2">
components/ColorSystemDemo.tsx:506:                <div className="space-y-2">
components/ColorSystemDemo.tsx:510:                <div className="space-y-2">
components/auth/UpgradeModal.tsx:192:            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-success/20 text-success' : 'bg-green-100 text-green-700'}`}>
components/auth/UpgradeModal.tsx:206:              <div className="grid grid-cols-2 gap-1">
components/auth/UpgradeModal.tsx:265:              <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-space-800/50' : 'border-paper-300 bg-paper-100'}`}>
components/auth/UpgradeModal.tsx:269:                <ul className="space-y-2">
components/auth/UpgradeModal.tsx:271:                    <li key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
components/auth/UpgradeModal.tsx:280:              <div className={`p-4 rounded-xl border-2 border-gold-500/50 ${isDark ? 'bg-gold-500/5' : 'bg-gold-50'}`}>
components/auth/UpgradeModal.tsx:281:                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-gold-500">
components/auth/UpgradeModal.tsx:285:                <ul className="space-y-2">
components/auth/UpgradeModal.tsx:287:                    <li key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-star-200' : 'text-paper-700'}`}>
components/auth/UpgradeModal.tsx:298:              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
components/auth/UpgradeModal.tsx:311:                <span className="flex items-center justify-center gap-2">
components/auth/UpgradeModal.tsx:315:                <span className="flex items-center justify-center gap-2">
components/auth/Paywall.tsx:182:                <span className="flex items-center justify-center gap-2">
components/auth/Paywall.tsx:193:                  <span className="flex items-center justify-center gap-2">
components/auth/UserMenu.tsx:83:        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
components/auth/UserMenu.tsx:100:        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
components/auth/UserMenu.tsx:126:          <div className="flex items-center gap-1">
components/auth/UserMenu.tsx:156:              <div className="flex items-center gap-1 mt-1">
components/auth/PaymentSuccessPage.tsx:97:        <div className="flex items-center justify-center gap-2 mb-6">
components/auth/LoginModal.tsx:170:          <div className={`text-sm p-3 rounded-lg ${isDark ? 'bg-space-800 text-star-300' : 'bg-paper-200 text-paper-600'}`}>
components/auth/LoginModal.tsx:290:            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
components/cbt/RecordDetailModal.tsx:28:        <button onClick={onClose} className={`flex items-center gap-2 transition-all ${isLight ? 'text-paper-600 hover:text-gold-700' : 'text-star-400 hover:text-gold-400'}`}>
components/cbt/CBTWizard.tsx:276:              <div className={`mb-6 p-3 rounded-xl inline-flex items-center gap-2 font-bold text-sm ${goldBadgeTone}`}>
components/cbt/CBTWizard.tsx:296:              <div className="space-y-2">
components/cbt/CBTWizard.tsx:321:              <button onClick={addMood} className="w-full bg-gold-600 hover:bg-gold-500 px-6 py-4 rounded-xl text-space-900 transition-all active:scale-95 shadow-lg shadow-gold-900/40 font-bold flex items-center justify-center gap-2 text-lg">
components/cbt/CBTWizard.tsx:334:              <div className="space-y-2">
components/cbt/CBTWizard.tsx:338:                    className={`p-4 border rounded-2xl group transition-all ${panelSurfaceMutedTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}
components/cbt/CBTWizard.tsx:345:                      <button onClick={() => setMoods(moods.filter(x => x.id !== m.id))} className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-star-200 hover:text-danger' : 'text-star-400 hover:text-danger'}`}>
components/cbt/CBTWizard.tsx:385:                  <h4 className={`text-xs font-black uppercase mb-3 tracking-[0.25em] border-b pb-1.5 flex items-center gap-2 ${goldTextTone} ${panelBorderTone}`}>
components/cbt/CBTWizard.tsx:388:                  <div className="flex flex-col gap-2">
components/cbt/CBTWizard.tsx:403:           <div className={`w-full max-w-4xl p-4 rounded-2xl border flex flex-wrap gap-2 items-center ${panelSurfaceSoftTone} ${panelBorderTone}`}>
components/cbt/CBTWizard.tsx:406:                <div key={s} className={`px-3 py-1 rounded-lg text-sm font-bold border flex items-center gap-2 ${symptomChipTone}`}>
components/cbt/CBTWizard.tsx:431:              <div className={`p-4 rounded-[1.5rem] flex items-start gap-4 border ${isAgainst ? 'bg-danger/10 border-danger/20' : (isLight ? 'bg-gold-500/10 border-gold-600/35' : 'bg-gold-950/20 border-gold-500/20')}`}>
components/cbt/CBTWizard.tsx:432:                <div className={`p-2 rounded-xl mt-1 ${isAgainst ? 'bg-danger/20 text-danger' : (isLight ? 'bg-gold-500/20 text-gold-700' : 'bg-gold-500/20 text-gold-400')}`}><Zap size={16}/></div>
components/cbt/CBTWizard.tsx:443:              <div className="space-y-2">
components/cbt/CBTWizard.tsx:457:                className={`w-full ${isAgainst ? 'bg-danger hover:bg-danger/80' : 'bg-gold-600 hover:bg-gold-500'} px-6 py-4 rounded-xl text-space-900 transition-all active:scale-95 shadow-lg font-bold flex items-center justify-center gap-2 text-lg`}
components/cbt/CBTWizard.tsx:470:                <div className="space-y-2">
components/cbt/CBTWizard.tsx:472:                    <div key={i} className={`group p-4 border rounded-2xl animate-in slide-in-from-left-4 ${isAgainst ? 'bg-danger/5 border-danger/20' : `${panelSurfaceMutedTone} ${panelBorderTone}`} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}>
components/cbt/CBTWizard.tsx:478:                        <button onClick={() => removeItem(i)} className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-star-200 hover:text-danger' : 'text-star-400 hover:text-danger'}`}>
components/cbt/CBTWizard.tsx:492:          <p className={`text-sm mb-4 flex items-center gap-2 px-4 ${mutedTextTone}`}><Info size={16}/> {t.journal.select_hot_thought}</p>
components/cbt/CBTWizard.tsx:513:            <div className="space-y-2">
components/cbt/CBTWizard.tsx:518:                className={`w-full h-32 rounded-xl p-4 text-lg border outline-none resize-none transition-all ${journalInputTone}`}
components/cbt/CBTWizard.tsx:538:            <button onClick={addBalanced} className="w-full bg-gold-600 hover:bg-gold-500 px-6 py-4 rounded-xl text-space-900 transition-all active:scale-95 shadow-lg shadow-gold-900/40 font-bold flex items-center justify-center gap-2 text-lg">
components/cbt/CBTWizard.tsx:550:              <div className="space-y-2">
components/cbt/CBTWizard.tsx:552:                  <div key={b.id} className={`group p-4 border rounded-2xl animate-in slide-in-from-right-4 ${panelSurfaceMutedTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}>
components/cbt/CBTWizard.tsx:558:                      <button onClick={() => setBalancedEntries(balancedEntries.filter(x => x.id !== b.id))} className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-star-200 hover:text-danger' : 'text-star-400 hover:text-danger'}`}>
components/cbt/CBTWizard.tsx:584:            <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-sm"><CheckCircle2 size={20} /> {t.journal.analysis_saved}</div>
components/cbt/CBTWizard.tsx:646:                  <div className="space-y-1">
components/cbt/CBTWizard.tsx:666:    <div className={`fixed inset-0 z-[150] backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 ${overlayTone}`}>
components/cbt/CBTWizard.tsx:668:        <button onClick={onClose} className={`absolute top-8 right-8 z-50 p-4 rounded-3xl transition-all border shadow-xl ${closeButtonTone}`}><X size={24} /></button>
components/cbt/CBTWizard.tsx:672:                <div className="flex gap-2 h-1 mt-4">
components/cbt/CBTWizard.tsx:685:                   <div className={`p-4 rounded-3xl shadow-inner ${isLight ? 'bg-gold-500/15 text-gold-700' : 'bg-gold-500/20 text-gold-400'}`}><Wand2 size={24} /></div>
components/cbt/CBTWizard.tsx:692:                      <div className="absolute -top-4 -left-4 p-4 bg-accent/20 rounded-2xl text-accent shadow-xl border border-accent/30 group-hover:scale-110 transition-transform"><Sparkles size={20} /></div>
components/cbt/CBTWizard.tsx:702:                        <div className="p-2 bg-accent/10 rounded-xl text-accent shadow-inner"><Lightbulb size={20} /></div>
components/cbt/TimelineFeed.tsx:88:        <div className={`mb-6 mx-2 p-4 border rounded-2xl flex items-center gap-3 animate-pulse ${bannerTone}`}>
components/cbt/TimelineFeed.tsx:99:          <div className="flex flex-col items-center justify-center h-full text-star-400 opacity-50 space-y-2 py-20">
components/cbt/TimelineFeed.tsx:116:                className={`group relative border rounded-[1.8rem] p-4 cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-xl ${cardTone}`}
components/cbt/TimelineFeed.tsx:124:                    <div className="flex items-center gap-2 mb-1">
components/cbt/TimelineFeed.tsx:141:                    className={`p-3 rounded-full transition-all ${completed ? 'text-accent bg-accent/10' : `${metaTone} hover:text-accent hover:bg-accent/10`}`}
components/cbt/CalendarStats.tsx:137:            className={`p-2 rounded-full transition-all active:scale-90 ${navButtonTone}`}
components/cbt/CalendarStats.tsx:154:            className={`p-2 rounded-full transition-all active:scale-90 ${navButtonTone}`}
components/cbt/CalendarStats.tsx:161:      <div className={`flex-1 border rounded-[3.5rem] p-4 relative overflow-hidden backdrop-blur-sm shadow-inner max-w-[720px] mx-auto w-full mt-[2px] mb-[2px] ${calendarShellTone}`}>
components/cbt/CalendarStats.tsx:162:        <div className="grid grid-cols-7 gap-2 md:gap-3 relative z-10">
components/cbt/CalendarStats.tsx:223:                className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${statCardTone} ${statCardHoverTone}`}
components/cbt/CalendarStats.tsx:358:        <div className={`flex border-t p-4 gap-3 ${isLight ? 'border-paper-300 bg-paper-100/70' : 'border-gold-500/10 bg-space-900/50'}`}>
components/cbt/ReportDashboard.tsx:193:      <div className="space-y-2">
components/cbt/ReportDashboard.tsx:231:          <div className="flex flex-wrap gap-2">
components/cbt/ReportDashboard.tsx:281:            <div className={`mt-4 pt-4 border-t space-y-2 ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
components/cbt/ReportDashboard.tsx:310:        <div className="pl-12 space-y-2">
components/cbt/AnalysisViews.tsx:120:    <div className={`absolute inset-0 z-[100] p-4 md:p-8 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto custom-scrollbar ${containerTone}`}>
components/cbt/AnalysisViews.tsx:129:            <div className={`p-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.15)] border ${iconTone}`}>
components/cbt/AnalysisViews.tsx:140:              <button onClick={handlePrevMonth} className={`p-2 rounded-full border transition-all ${monthNavTone}`}>
components/cbt/AnalysisViews.tsx:143:              <div className={`flex items-center gap-2 px-4 py-2 border rounded-xl min-w-[140px] justify-center ${monthNavTone}`}>
components/cbt/AnalysisViews.tsx:147:              <button onClick={handleNextMonth} className={`p-2 rounded-full border transition-all ${monthNavTone}`}>
components/cbt/AnalysisViews.tsx:153:          <button onClick={onClose} className={`p-2 rounded-full border transition-all ${monthNavTone}`}>
components/cbt/AnalysisViews.tsx:182:          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-90 ${labelTone} ${headingFont}`}>
components/cbt/AnalysisViews.tsx:217:      <div className={`p-3 rounded-2xl shrink-0 mt-1 ${iconBg}`}><TrendingUp size={20}/></div>
components/cbt/AnalysisViews.tsx:292:      <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${isLight ? 'bg-gold-500/10 text-gold-700' : 'bg-accent/10 text-accent'}`}>
components/cbt/AnalysisViews.tsx:333:      <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${iconBg}`}>
components/cbt/AnalysisViews.tsx:361:    <div className={`fixed inset-0 z-[200] backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 ${overlayTone}`}>
components/cbt/AnalysisViews.tsx:368:          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-paper-200 text-star-200' : 'hover:bg-white/10 text-star-400'}`}><X size={20}/></button>
components/cbt/AnalysisViews.tsx:1069:      <DataRow className="grid grid-cols-3 gap-2 text-center p-4">
```

## 过渡候选（含 hover 但缺少 transition 的行级命中）

```txt
App.tsx:712:                          className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-gray-100'}`}
App.tsx:3389:                          className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-space-500/70 text-star-200 hover:text-star-50"
App.tsx:3398:                          className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-danger/50 text-danger/80 hover:text-danger"
App.tsx:3436:                      className="text-xs uppercase tracking-widest opacity-70 hover:opacity-100 whitespace-nowrap"
App.tsx:3529:                        className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-gray-100'}`}
App.tsx:3657:                <button onClick={() => setView('select')} className="text-xs text-gold-500 uppercase tracking-widest hover:underline">{t.us.new_analysis}</button>
App.tsx:3929:                                           className="mt-2 text-xs text-accent hover:underline"
App.tsx:5363:                                        : 'border-gold-500/15 text-star-400 hover:border-gold-500/50 hover:text-star-200 bg-space-900/50'
App.tsx:5432:                                                ? 'bg-space-900 border-gold-500/15 hover:border-gold-500/50 hover:bg-space-800'
App.tsx:5433:                                                : 'bg-white border-paper-300 hover:bg-paper-100 hover:border-gold-600/30'
App.tsx:5490:                                            : 'hover:border-gold-500/60 hover:text-gold-400'
App.tsx:5766:                                                        hover:shadow-lg
App.tsx:5767:                                                        ${theme === 'dark' ? 'hover:shadow-gold-500/5' : 'hover:shadow-paper-400/20'}
App.tsx:6031:                    <ActionButton onClick={onReset} size="sm" className="bg-danger border-danger text-white hover:bg-danger/80 w-full">
App.tsx:6430:                                    ? 'bg-space-800 border-gold-500/20 hover:bg-space-700 text-star-100'
App.tsx:6431:                                    : 'bg-white border-paper-300 hover:bg-paper-100 text-paper-900'
App.tsx:6448:                                    ? 'bg-white text-black hover:bg-gray-100'
App.tsx:6449:                                    : 'bg-black text-white hover:bg-gray-900'
App.tsx:6675:                                            ? 'border-gold-500/30 text-gold-300 hover:border-gold-500/60 hover:text-gold-200'
App.tsx:6676:                                            : 'border-gold-500/40 text-gold-700 hover:border-gold-500/70'
App.tsx:6686:                            <Link to="/settings" className="hidden md:flex w-10 h-10 items-center justify-center text-3xl leading-none font-bold uppercase opacity-70 hover:opacity-100 shrink-0">⚙</Link>
App.tsx:6687:                            <button onClick={toggleTheme} className="hidden md:flex w-8 h-8 items-center justify-center text-2xl leading-none font-bold uppercase opacity-70 hover:opacity-100 shrink-0">{theme === 'dark' ? '☀' : '☾'}</button>
components/reports/ReportViewPage.tsx:139:          className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-star-400 hover:text-star-200' : 'text-paper-500 hover:text-paper-700'}`}
components/UIComponents.tsx:139:    hover: theme === 'dark'
components/UIComponents.tsx:140:        ? "hover:border-accent/50 hover:bg-space-900/70"
components/UIComponents.tsx:141:        : "hover:border-accent/40 hover:bg-paper-100/70",
components/UIComponents.tsx:241:    primary: "bg-gradient-primary text-space-950 hover:opacity-95 font-semibold shadow-glow border border-transparent",
components/UIComponents.tsx:245:        ? "bg-space-800/70 text-star-50 hover:bg-space-700/70 hover:border-accent/60 border border-gold-500/20"
components/UIComponents.tsx:246:        : "bg-white text-paper-900 hover:bg-paper-100 hover:border-accent/50 border border-paper-300",
components/UIComponents.tsx:250:        ? "bg-transparent text-star-50 border border-gold-500/20 hover:border-accent/60"
components/UIComponents.tsx:251:        : "bg-transparent text-paper-900 border border-paper-300 hover:border-accent/50",
components/UIComponents.tsx:254:    ghost: "bg-transparent hover:bg-space-700/50 text-accent hover:text-accent-hover border-none shadow-none"
components/UIComponents.tsx:284:    ? "bg-transparent text-star-400 border-gold-500/20 hover:border-accent/50 hover:text-star-200"
components/UIComponents.tsx:285:    : "bg-transparent text-paper-400 border-paper-300 hover:border-accent/50 hover:text-paper-900";
components/UIComponents.tsx:999:              ? 'border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/70'
components/UIComponents.tsx:1000:              : 'border-accent/40 text-accent hover:bg-accent/5 hover:border-accent/60'
components/design-tokens.ts:147:    cardHover: 'hover:border-accent/50 hover:bg-space-900/70',
components/design-tokens.ts:159:    cardHover: 'hover:border-accent/40 hover:bg-paper-100/70',
components/design-tokens.ts:230:    hover: 'hover:opacity-95',
components/design-tokens.ts:235:    hover: {
components/design-tokens.ts:236:      dark: 'hover:bg-space-700/70 hover:border-accent/60',
components/design-tokens.ts:237:      light: 'hover:bg-paper-100 hover:border-accent/50',
components/design-tokens.ts:243:    hover: {
components/design-tokens.ts:244:      dark: 'hover:border-accent/60',
components/design-tokens.ts:245:      light: 'hover:border-accent/50',
components/design-tokens.ts:250:    hover: 'hover:bg-space-700/50 hover:text-accent-hover',
components/design-tokens.ts:274:    hover: 'hover:bg-success/15',
components/design-tokens.ts:284:    hover: 'hover:bg-warning/15',
components/design-tokens.ts:294:    hover: 'hover:bg-danger/15',
components/design-tokens.ts:304:    hover: 'hover:bg-info/15',
components/design-tokens.ts:320:    hover: 'hover:bg-mystic-500/15 hover:border-mystic-500/40',
components/design-tokens.ts:332:    hover: 'hover:bg-psycho-500/15 hover:border-psycho-500/40',
components/design-tokens.ts:344:    hover: 'hover:bg-accent/15 hover:border-accent/40',
components/design-tokens.ts:382:    hover: 'hover:text-accent-hover hover:underline',
components/design-tokens.ts:390:      hover: 'hover:opacity-95 hover:shadow-glow',
components/design-tokens.ts:396:      hover: 'hover:bg-mystic-600 hover:shadow-[0_0_20px_-6px_rgba(168,85,247,0.4)]',
components/design-tokens.ts:402:      hover: 'hover:bg-psycho-600 hover:shadow-[0_0_20px_-6px_rgba(59,130,246,0.4)]',
components/design-tokens.ts:411:    hover: 'hover:border-accent/50 hover:bg-space-900/70',
components/TechSpecsComponents.tsx:474:            className={`grid grid-cols-[0.7fr_1.4fr_1.4fr_0.9fr] px-4 py-3 border-t ${borderClass} items-center ${isDark ? 'hover:bg-space-800/50' : 'hover:bg-paper-100'}`}
components/wiki/WikiIndexPage.tsx:91:    ? 'hover:border-accent/40 hover:bg-space-900/70'
components/wiki/WikiIndexPage.tsx:92:    : 'hover:border-accent/40 hover:bg-paper-100/80';
components/wiki/WikiDetailPage.tsx:294:                  <Sparkles size={16} className={`${mutedText} group-hover:text-gold-400`} />
components/wiki/WikiHomePage.tsx:305:                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${borderColor} ${theme === 'dark' ? 'text-star-300 hover:text-gold-400' : 'text-paper-500 hover:text-gold-600'}`}
components/wiki/WikiHomePage.tsx:311:                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${borderColor} ${theme === 'dark' ? 'text-star-300 hover:text-gold-400' : 'text-paper-500 hover:text-gold-600'}`}
components/wiki/WikiHomePage.tsx:319:                className={`text-xs uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-gold-400' : 'text-gold-600'} hover:opacity-80`}
components/wiki/synthetica/SelectionCard.tsx:35:    ? 'bg-space-900/60 border-space-700/60 hover:border-gold-500/40 hover:bg-space-800/80 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
components/wiki/synthetica/SelectionCard.tsx:36:    : 'bg-paper-50/90 border-paper-300 hover:border-gold-400/50 hover:bg-paper-100 hover:shadow-md';
components/wiki/synthetica/SelectionCard.tsx:48:        transform hover:scale-[1.02] active:scale-[0.98]
components/wiki/synthetica/SelectionCard.tsx:126:          : (theme === 'dark' ? 'text-star-100 group-hover:text-gold-200' : 'text-paper-800 group-hover:text-gold-700')
components/wiki/WikiSyntheticaPage.tsx:225:          ? 'bg-space-800/60 border border-space-700 text-star-300 hover:bg-space-700/80 hover:border-gold-500/40 hover:text-gold-300'
components/wiki/WikiSyntheticaPage.tsx:226:          : 'bg-paper-100 border border-paper-300 text-paper-600 hover:bg-paper-50 hover:border-gold-400/50 hover:text-gold-700'
components/wiki/WikiSyntheticaPage.tsx:404:                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
components/wiki/WikiSyntheticaPage.tsx:596:                        ? 'text-star-400 hover:text-gold-400 underline underline-offset-4 decoration-star-600 hover:decoration-gold-500'
components/wiki/WikiSyntheticaPage.tsx:597:                        : 'text-paper-500 hover:text-gold-600 underline underline-offset-4'
components/wiki/WikiSyntheticaPage.tsx:621:                          ? 'bg-space-800/60 border-space-700 hover:border-gold-500/30'
components/wiki/WikiSyntheticaPage.tsx:622:                          : 'bg-paper-50 border-paper-300 hover:border-gold-400/50'
components/wiki/WikiSyntheticaPage.tsx:655:                               ? 'text-star-500 hover:text-red-400 hover:bg-red-500/10'
components/wiki/WikiSyntheticaPage.tsx:656:                               : 'text-paper-400 hover:text-red-500 hover:bg-red-50'
components/wiki/WikiSyntheticaPage.tsx:686:                         ? 'border-space-600 text-star-300 hover:border-gold-500/50 hover:text-gold-300 hover:bg-gold-500/5'
components/wiki/WikiSyntheticaPage.tsx:687:                         : 'border-paper-300 text-paper-600 hover:border-gold-400/50 hover:text-gold-700 hover:bg-gold-50'
components/wiki/WikiClassicsPage.tsx:286:            group-hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.4)]
components/wiki/WikiClassicsPage.tsx:287:            group-hover:-translate-y-4
components/wiki/WikiClassicDetailPage.tsx:305:  const linkHover = theme === 'dark' ? 'hover:text-[#fbf8f1]' : 'hover:text-[#2a251f]';
components/ColorSystemDemo.tsx:21:  hover:scale-[1.02] hover:shadow-lg
components/ColorSystemDemo.tsx:30:  hover:shadow-xl
components/ColorSystemDemo.tsx:73:              hover:shadow-xl hover:scale-[1.02]
components/ColorSystemDemo.tsx:96:              hover:shadow-xl hover:scale-[1.02]
components/ColorSystemDemo.tsx:119:              hover:shadow-xl hover:scale-[1.02]
components/ColorSystemDemo.tsx:142:              hover:shadow-xl hover:scale-[1.02]
components/ColorSystemDemo.tsx:177:              hover:shadow-xl hover:scale-[1.01]
components/ColorSystemDemo.tsx:202:                hover:scale-[1.02] hover:shadow-lg hover:shadow-mystic-500/20
components/ColorSystemDemo.tsx:214:              hover:shadow-xl hover:scale-[1.01]
components/ColorSystemDemo.tsx:239:                hover:scale-[1.02] hover:shadow-lg hover:shadow-psycho-500/20
components/ColorSystemDemo.tsx:251:              hover:shadow-xl hover:scale-[1.01]
components/ColorSystemDemo.tsx:276:                hover:scale-[1.02] shadow-glow
components/ColorSystemDemo.tsx:308:                className={`${buttonBase} ${INTERACTIVE_STATES.button.primary.default} opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none`}
components/ColorSystemDemo.tsx:324:              <div className={`${cardBase} cursor-pointer hover:scale-[1.02] hover:bg-space-900/60`}>
components/ColorSystemDemo.tsx:348:                <a href="#" className={`mx-1 text-mystic-400 hover:text-mystic-300 hover:underline ${TRANSITION}`}>
components/ColorSystemDemo.tsx:352:                <a href="#" className={`mx-1 text-psycho-400 hover:text-psycho-300 hover:underline ${TRANSITION}`}>
components/ColorSystemDemo.tsx:381:                    hover:scale-105 hover:shadow-lg
components/ColorSystemDemo.tsx:412:                    hover:bg-space-900/50 hover:scale-[1.02]
components/auth/UpgradeModal.tsx:215:                      : 'hover:bg-white/5'
components/auth/UpgradeModal.tsx:237:                      : 'hover:bg-white/5'
components/auth/Paywall.tsx:202:                    className={`text-sm ${isDark ? 'text-star-400 hover:text-star-200' : 'text-paper-500 hover:text-paper-700'}`}
components/auth/UserMenu.tsx:85:            ? 'bg-space-700 hover:bg-space-600 text-star-100'
components/auth/UserMenu.tsx:86:            : 'bg-paper-200 hover:bg-paper-300 text-paper-800'
components/auth/UserMenu.tsx:102:            ? 'hover:bg-space-700'
components/auth/UserMenu.tsx:103:            : 'hover:bg-paper-200'
components/auth/UserMenu.tsx:173:                    ? 'text-gold-400 hover:bg-gold-500/10'
components/auth/UserMenu.tsx:174:                    : 'text-gold-600 hover:bg-gold-50'
components/auth/UserMenu.tsx:189:                  ? 'text-star-200 hover:bg-space-700'
components/auth/UserMenu.tsx:190:                  : 'text-paper-600 hover:bg-paper-100'
components/auth/UserMenu.tsx:202:                    ? 'text-star-200 hover:bg-space-700'
components/auth/UserMenu.tsx:203:                    : 'text-paper-600 hover:bg-paper-100'
components/auth/UserMenu.tsx:221:                  ? 'text-red-400 hover:bg-red-500/10'
components/auth/UserMenu.tsx:222:                  : 'text-red-600 hover:bg-red-50'
components/auth/LoginModal.tsx:182:                ? 'bg-space-800 border-gold-500/20 hover:bg-space-700 text-star-100'
components/auth/LoginModal.tsx:183:                : 'bg-white border-paper-300 hover:bg-paper-100 text-paper-900'
components/auth/LoginModal.tsx:200:                ? 'bg-white text-black hover:bg-gray-100'
components/auth/LoginModal.tsx:201:                : 'bg-black text-white hover:bg-gray-900'
components/cbt/CBTWizard.tsx:56:    ? 'bg-paper-50 border-paper-300 text-star-200 hover:bg-paper-100'
components/cbt/CBTWizard.tsx:57:    : 'bg-white/5 border-white/10 text-star-400 hover:bg-white/10';
components/cbt/CBTWizard.tsx:65:    ? 'bg-paper-50 border-paper-300 hover:border-gold-600/30'
components/cbt/CBTWizard.tsx:66:    : 'bg-space-800/10 border-gold-500/10 hover:border-gold-500/30';
components/cbt/CBTWizard.tsx:75:    ? 'bg-paper-100/80 border-paper-300 text-star-200 hover:bg-paper-200'
components/cbt/CBTWizard.tsx:76:    : 'bg-white/5 border-gold-500/10 text-star-400 hover:bg-danger/20 hover:text-danger';
components/cbt/CBTWizard.tsx:472:                    <div key={i} className={`group p-4 border rounded-2xl animate-in slide-in-from-left-4 ${isAgainst ? 'bg-danger/5 border-danger/20' : `${panelSurfaceMutedTone} ${panelBorderTone}`} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}>
components/cbt/CBTWizard.tsx:502:              {hotThought === thought ? <Sparkles size={28} className="text-accent animate-pulse z-10" /> : <Eye size={24} className="text-star-400 group-hover:text-star-400 z-10" />}
components/cbt/CBTWizard.tsx:552:                  <div key={b.id} className={`group p-4 border rounded-2xl animate-in slide-in-from-right-4 ${panelSurfaceMutedTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}>
components/cbt/CBTWizard.tsx:606:              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border ${isLight ? 'border-paper-300 text-star-200' : 'border-white/10 text-star-50'} hover:border-gold-500/60`}
components/cbt/CalendarStats.tsx:25:    ? 'bg-paper-100 text-paper-600 hover:bg-paper-200'
components/cbt/CalendarStats.tsx:26:    : 'bg-space-800/50 text-star-400 hover:bg-space-800 hover:text-star-50';
components/cbt/CalendarStats.tsx:34:    ? 'hover:border-gold-500/50 hover:bg-paper-50 hover:shadow-glow'
components/cbt/CalendarStats.tsx:35:    : 'hover:border-gold-500/40 hover:bg-space-800/70 hover:shadow-glow';
components/cbt/CalendarStats.tsx:191:                  ${hasEntry ? `border-transparent shadow-xl hover:scale-110` : (isLight ? 'border-paper-300 hover:bg-paper-100' : 'border-gold-500/5 hover:bg-gold-500/5')}
components/cbt/AnalysisViews.tsx:90:    ? 'bg-paper-100 border-paper-300 text-star-200 hover:bg-paper-200'
components/cbt/AnalysisViews.tsx:91:    : 'bg-space-800/50 border-gold-500/10 text-star-400 hover:bg-space-800';
components/cbt/AnalysisViews.tsx:174:    ? 'bg-paper-100 hover:bg-paper-200 text-star-300 border border-paper-200'
components/cbt/AnalysisViews.tsx:175:    : 'bg-white/5 hover:bg-white/10 text-star-400 hover:text-gold-400 border border-white/5';
components/cbt/TimelineFeed.tsx:25:    ? 'bg-paper-100/80 border-paper-300 hover:bg-paper-100'
components/cbt/TimelineFeed.tsx:26:    : 'bg-space-800/30 border-gold-500/10 hover:bg-space-800/50';
```
