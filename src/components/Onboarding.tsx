import { useState, useEffect } from 'react'
import { Sparkles, Terminal, Search, Zap, Calendar, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'

export default function Onboarding() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isDone = localStorage.getItem('noteszen-onboarding-done')
    if (!isDone) {
      setVisible(true)
    }
  }, [])

  const handleFinish = () => {
    localStorage.setItem('noteszen-onboarding-done', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md select-none p-4">
      <div className="w-[520px] rounded-2xl border shadow-2xl p-6 bg-popover text-popover-foreground border-border flex flex-col items-center text-center">
        
        {/* Animated Brand Logo Icon */}
        <div className="p-3 rounded-full bg-primary/10 text-primary mb-4 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Welcome to NotesZen
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          The fastest desktop app for capturing and finding thoughts.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-4 w-full text-left mb-8">
          <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold leading-none mb-1">Quick Capture</p>
              <p className="text-[10px] text-muted-foreground leading-normal">Press <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Ctrl+Shift+Space</kbd> to open the thought jotter anywhere.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
            <Terminal className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold leading-none mb-1">Command Palette</p>
              <p className="text-[10px] text-muted-foreground leading-normal">Press <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Ctrl+K</kbd> to execute actions entirely via keyboard.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold leading-none mb-1">Daily Log</p>
              <p className="text-[10px] text-muted-foreground leading-normal">Use date-based notes for structured logs. Trigger via <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Ctrl+D</kbd>.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
            <Search className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold leading-none mb-1">Fuzzy Search</p>
              <p className="text-[10px] text-muted-foreground leading-normal">Fuzzy match over everything. Open global search via <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Ctrl+Shift+F</kbd>.</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleFinish}
          variant="default"
          className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          Start Writing Thoughts
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
