
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { Scale, Gavel, User, DollarSign, Brain, CheckCircle, MessageSquare, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { chat } from '../services/aiMatrix';

// Types for the Decision Room
interface AgentOpinion {
  agentName: string;
  role: string;
  avatar: React.ReactNode;
  opinion: string;
  verdict: 'approve' | 'reject' | 'neutral';
  color: string;
}

const DecisionRoomPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [topic, setTopic] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [opinions, setOpinions] = useState<AgentOpinion[]>([]);
  const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
  
  // Ref to track if component is mounted to prevent crashes
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAnalyze = async () => {
    if (!topic.trim()) return;
    
    setIsAnalyzing(true);
    setOpinions([]);
    setFinalVerdict(null);

    // Agents Configuration
    const agents = [
      {
        name: isAr ? 'المحامي الصارم' : 'Strict Lawyer',
        role: isAr ? 'قانوني' : 'Legal',
        icon: <Gavel size={20} />,
        color: 'text-red-500 bg-red-500/10',
        prompt: isAr 
          ? `أنت محامي صارم جداً. حلل هذا القرار: "${topic}". ركز فقط على المخاطر القانونية والالتزامات. كن متشائماً وحذراً. اختصر في جملتين.`
          : `You are a strict lawyer. Analyze this decision: "${topic}". Focus ONLY on legal risks and liabilities. Be pessimistic and cautious. Keep it to 2 sentences.`,
        system: 'You are a strict, risk-averse lawyer.'
      },
      {
        name: isAr ? 'المستثمر الطموح' : 'Ambitious Investor',
        role: isAr ? 'مالي' : 'Financial',
        icon: <DollarSign size={20} />,
        color: 'text-green-500 bg-green-500/10',
        prompt: isAr
          ? `أنت مستثمر طموح جداً ومغامر. حلل هذا القرار: "${topic}". ركز على الأرباح والفرص والمكاسب المحتملة. كن متفائلاً. اختصر في جملتين.`
          : `You are an ambitious investor. Analyze this decision: "${topic}". Focus on ROI, profits, and opportunities. Be optimistic. Keep it to 2 sentences.`,
        system: 'You are a high-risk, high-reward investor.'
      },
      {
        name: isAr ? 'الفيلسوف الحكيم' : 'Wise Philosopher',
        role: isAr ? 'أخلاقي' : 'Ethical',
        icon: <Brain size={20} />,
        color: 'text-blue-500 bg-blue-500/10',
        prompt: isAr
          ? `أنت فيلسوف حكيم. حلل هذا القرار: "${topic}". ركز على الأخلاق والقيم والمبادئ الإنسانية. كن متوازناً وعميقاً. اختصر في جملتين.`
          : `You are a wise philosopher. Analyze this decision: "${topic}". Focus on ethics, values, and human principles. Be balanced and deep. Keep it to 2 sentences.`,
        system: 'You are a wise, ethical philosopher.'
      }
    ];

    try {
      // Loop through agents sequentially to simulate "speaking"
      for (const agent of agents) {
        if (!isMounted.current) return;

        // Call AI for this agent
        let opinionText = '';
        let verdict: 'approve' | 'reject' | 'neutral' = 'neutral';

        try {
          const response = await chat(
            [{ role: 'user', content: agent.prompt }],
            { systemPrompt: agent.system, timeout: 10000 } // Short timeout for speed
          );
          opinionText = response.content;
          
          // Simple sentiment analysis for verdict color
          const lower = opinionText.toLowerCase();
          if (agent.role === (isAr ? 'مالي' : 'Financial')) verdict = 'approve';
          else if (agent.role === (isAr ? 'قانوني' : 'Legal')) verdict = 'reject';
          else verdict = 'neutral';

        } catch (e) {
          console.error(`Agent ${agent.name} failed`, e);
          opinionText = isAr ? "لا أستطيع التعليق حالياً." : "I cannot comment at this time.";
        }

        if (!isMounted.current) return;

        setOpinions(prev => [...prev, {
          agentName: agent.name,
          role: agent.role,
          avatar: agent.icon,
          color: agent.color,
          verdict,
          opinion: opinionText
        }]);

        // Small delay between agents for UI effect
        await new Promise(r => setTimeout(r, 500));
      }

      // Final Verdict (Synthesis)
      if (!isMounted.current) return;
      
      const summaryPrompt = isAr 
        ? `بناءً على الآراء السابقة (قانوني: مخاطر، مالي: أرباح، فيلسوف: أخلاق) حول موضوع "${topic}"، اعطني حكماً نهائياً مختصراً جداً (سطر واحد) هل نمضي قدماً أم لا ولماذا؟`
        : `Based on the previous perspectives (Legal, Financial, Ethical) regarding "${topic}", give me a very concise final verdict (one line). Should we proceed or not and why?`;

      const finalResponse = await chat(
        [{ role: 'user', content: summaryPrompt }],
        { systemPrompt: 'You are the Chief Decision Maker. Synthesize opinions.' }
      );

      setFinalVerdict(finalResponse.content);
      
      setIsAnalyzing(false);
      toast.success(isAr ? 'تم اكتمال المجلس!' : 'Council adjourned!');
    } catch (error) {
      console.error("Decision Room Error:", error);
      setIsAnalyzing(false);
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error');
    }
  };

  return (
    <div className={`h-full flex flex-col ${c.bg}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className={`p-6 border-b ${c.border} flex items-center justify-between`}>
        <div>
          <h1 className={`text-2xl font-bold ${c.text} flex items-center gap-3`}>
            <Scale className="text-purple-500" />
            {isAr ? 'غرفة اتخاذ القرار' : 'The Decision Room'}
          </h1>
          <p className={`${c.textSecondary} mt-1`}>
            {isAr ? 'مجلس استشاري من الذكاء الاصطناعي لحل معضلاتك' : 'AI advisory council to solve your dilemmas'}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Input Section */}
          <div className={`${c.card} p-6 rounded-2xl border ${c.border} shadow-lg`}>
            <label className={`block text-sm font-medium ${c.text} mb-2`}>
              {isAr ? 'ما هو القرار الذي يحيرك؟' : 'What decision is troubling you?'}
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={isAr ? 'مثلاً: هل أقبل عرض العمل الجديد؟' : 'e.g., Should I accept the new job offer?'}
                className={`flex-1 p-4 rounded-xl bg-black/20 border ${c.border} ${c.text} outline-none focus:border-purple-500 transition`}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !topic.trim()}
                className={`px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Gavel />}
                {isAr ? 'اعقد المجلس' : 'Convene Council'}
              </button>
            </div>
          </div>

          {/* Agents Opinions */}
          <div className="space-y-4">
            {opinions.map((op, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 p-5 rounded-2xl border ${c.border} ${c.bgSecondary} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${op.color}`}>
                  {op.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold ${c.text}`}>{op.agentName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${c.textSecondary}`}>
                      {op.role}
                    </span>
                    {op.verdict === 'approve' && <CheckCircle size={14} className="text-green-500" />}
                    {op.verdict === 'reject' && <X size={14} className="text-red-500" />}
                  </div>
                  <p className={`${c.textSecondary} leading-relaxed`}>
                    "{op.opinion}"
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Final Verdict */}
          {finalVerdict && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 text-center animate-in zoom-in duration-500">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isAr ? '⚖️ الحكم النهائي' : '⚖️ Final Verdict'}
              </h2>
              <p className="text-lg text-purple-200">
                {finalVerdict}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DecisionRoomPage;
