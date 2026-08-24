'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackVkAdsPageView } from '@/lib/vk-ads';

// Пиксель VK Рекламы: один pageView на открытие страницы и по одному
// на каждый клиентский переход. Дедупликация — внутри trackVkAdsPageView.
export default function VkAdsPixel() {
  const pathname = usePathname();

  useEffect(() => {
    trackVkAdsPageView(pathname);
  }, [pathname]);

  return null;
}
