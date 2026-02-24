"use client"

import { CountryGroup } from '@/types/database'

interface GroupFilterProps {
  groups: CountryGroup[]
  activeGroup: string | null
  onGroupChange: (groupId: string | null) => void
}

export function GroupFilter({ groups, activeGroup, onGroupChange }: GroupFilterProps) {
  if (groups.length < 1) return null

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 max-h-[60vh] overflow-y-auto rounded-lg">
      <button
        onClick={() => onGroupChange(null)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          activeGroup === null
            ? 'bg-white text-gray-900 shadow-lg'
            : 'bg-white/10 text-white/80 hover:bg-white/20'
        }`}
      >
        All
      </button>
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onGroupChange(group.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeGroup === group.id
              ? 'bg-white text-gray-900 shadow-lg'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: group.color }}
          />
          {group.name}
        </button>
      ))}
    </div>
  )
}
