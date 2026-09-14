'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Stepper } from '../ui/Stepper';
import { PillToggle } from '../ui/PillToggle';
import { Switch } from '../ui/Switch';
import { DebateMode, RoomVisibility } from '@/types';

interface HostSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  currentMaxPlayers: number;
  currentPlayerCount: number;
  currentDebateMode: DebateMode;
  currentVisibility: RoomVisibility;
  onSave: (patch: { maxPlayers: number; debateMode: DebateMode; visibility: RoomVisibility }) => void;
}

export function HostSettingsPanel({
  open,
  onClose,
  currentMaxPlayers,
  currentPlayerCount,
  currentDebateMode,
  currentVisibility,
  onSave,
}: HostSettingsPanelProps) {
  const [maxPlayers, setMaxPlayers] = useState(currentMaxPlayers);
  const [debateMode, setDebateMode] = useState<DebateMode>(currentDebateMode);
  const [isPublic, setIsPublic] = useState(currentVisibility === 'PUBLIC');

  function save() {
    onSave({ maxPlayers, debateMode, visibility: isPublic ? 'PUBLIC' : 'PRIVATE' });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] bg-ink-900 border border-line-800 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold">إعدادات الغرفة</h2>
              <button onClick={onClose} aria-label="إغلاق" className="text-fg-500 hover:text-fg-100">
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">الحد الأقصى للاعبين</span>
                <Stepper value={maxPlayers} min={Math.max(4, currentPlayerCount)} max={12} onChange={setMaxPlayers} />
              </div>
              {maxPlayers === currentPlayerCount && currentPlayerCount > 4 && (
                <p className="text-[11px] text-fg-600 -mt-2">
                  لا يمكن أن يقل عن عدد اللاعبين الحاليين ({currentPlayerCount})
                </p>
              )}

              <div>
                <div className="font-bold text-sm mb-2.5">نمط المناظرة</div>
                <PillToggle
                  value={debateMode}
                  onChange={setDebateMode}
                  options={[
                    { value: 'TEXT', label: 'نص' },
                    { value: 'VOICE', label: 'صوت' },
                    { value: 'TEXT_VOICE', label: 'نص + صوت' },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">غرفة عامة</span>
                <Switch checked={isPublic} onChange={setIsPublic} />
              </div>
            </div>

            <Button onClick={save} className="mt-5">
              حفظ
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
