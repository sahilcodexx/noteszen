import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AITypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex size-6 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-3 text-primary animate-pulse" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">AI is thinking</span>
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
          <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:120ms]" />
          <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  )
}