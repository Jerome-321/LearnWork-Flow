import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const startY = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Listen for online/offline changes
  useEffect(() => {
    const goOnline = () => {
      console.log('Network: ONLINE');
      setIsOnline(true);
    };
    const goOffline = () => {
      console.log('Network: OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Auto-refresh when coming back online
  useEffect(() => {
    if (isOnline && !isRefreshing) {
      console.log('Auto-refreshing after coming online...');
      handleRefresh();
    }
  }, [isOnline]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('[data-pull-to-refresh]') as HTMLElement;
    
    if (!scrollableParent || isRefreshing) return;
    
    scrollRef.current = scrollableParent;
    
    if (scrollableParent.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !scrollRef.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && scrollRef.current.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance / 2.5, threshold * 1.5));
    }
  };

  const onTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    
    const shouldRefresh = pullDistance >= threshold;
    
    setIsPulling(false);
    
    if (shouldRefresh) {
      if (!isOnline) {
        console.log('Cannot refresh - offline');
        setIsRefreshing(true);
        setPullDistance(threshold);
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 1500);
        return;
      }
      
      console.log('Pull to refresh triggered!');
      setPullDistance(threshold);
      await handleRefresh();
    }
    
    setPullDistance(0);
    scrollRef.current = null;
  };

  return {
    isPulling: isPulling || isRefreshing,
    pullDistance,
    isRefreshing,
    isOnline,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
