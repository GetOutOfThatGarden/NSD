import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export const SWRProvider = ({ children }: SWRProviderProps) => {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration
        refreshInterval: 0, // Disable automatic refresh by default
        revalidateOnFocus: true, // Revalidate when window gets focus
        revalidateOnReconnect: true, // Revalidate when network reconnects
        shouldRetryOnError: true, // Retry on error
        errorRetryCount: 3, // Maximum retry count
        errorRetryInterval: 5000, // Retry interval in ms
        dedupingInterval: 2000, // Deduping interval in ms
        focusThrottleInterval: 5000, // Throttle revalidation on focus
        
        // Global error handler
        onError: (error, key) => {
          console.error('SWR Error:', { error, key });
          // You can add global error reporting here
        },
        
        // Global success handler
        onSuccess: (data, key, config) => {
          // You can add global success logging here if needed
        },
        
        // Fallback data for all SWR hooks
        fallback: {},
      }}
    >
      {children}
    </SWRConfig>
  );
};