import { useNotesStore } from '../store/useNotesStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface VaultSwitcherProps {
  collapsed?: boolean
}

export default function VaultSwitcher({ collapsed }: VaultSwitcherProps) {
  const { vaults, activeVaultId, setActiveVault } = useNotesStore()

  if (vaults.length <= 1) return null

  return (
    <div className={cn('px-2 pb-2', collapsed && 'px-1')}>
      <Select value={activeVaultId} onValueChange={(v) => setActiveVault(v)}>
        <SelectTrigger size="sm" className={cn('w-full text-[10px] h-7', collapsed && 'px-1')}>
          <SelectValue placeholder="Vault" />
        </SelectTrigger>
        <SelectContent>
          {vaults.map((v) => (
            <SelectItem key={v.id} value={v.id} className="text-xs">
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}