import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Download } from 'lucide-react';

export function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-4 max-w-sm w-full relative">
        <button
          onClick={close}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
          <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>

        <div className="flex-1 pr-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Update Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            A new version of ChatFlow is available. Click reload to update.
          </p>
          
          <button
            className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            onClick={() => updateServiceWorker(true)}
          >
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
}
