import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import { formatCountdown, secondsUntilMidnight } from '@/lib/utils';
import { useQuota } from '@/hooks/useQuota';

export function QuotaBanner() {
  const { data } = useQuota();
  const [countdown, setCountdown] = useState(() => formatCountdown(secondsUntilMidnight()));

  useEffect(() => {
    if (!data?.daily || data.daily.remaining > 0) return;

    const updateCountdown = () => {
      setCountdown(formatCountdown(secondsUntilMidnight(data.timezone)));
    };

    updateCountdown();
    const id = setInterval(() => {
      updateCountdown();
    }, 1000);
    return () => clearInterval(id);
  }, [data?.daily?.remaining, data?.timezone]);

  if (!data) return null;

  const dailyExhausted = data.daily.remaining <= 0;
  const userExhausted = !data.user.allowed;

  return (
    <AnimatePresence>
      {(dailyExhausted || userExhausted) && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="w-full"
        >
          {dailyExhausted && (
            <div
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm"
              style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a' }}
            >
              <Clock size={13} className="text-amber-600 flex-shrink-0" />
              <span className="font-kalam text-amber-800 text-xs">
                今日额度已用完，明天再来
              </span>
              <span className="font-caveat text-amber-700 font-semibold ml-1 tabular-nums">
                {countdown}
              </span>
            </div>
          )}
          {userExhausted && (
            <div
              className="w-full flex items-center justify-center gap-2 py-2 px-4"
              style={{ backgroundColor: '#fee2e2', borderBottom: '1px solid #fecaca' }}
            >
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <span className="font-kalam text-red-700 text-xs">
                已达 200 张上限，删除旧图片后继续
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
