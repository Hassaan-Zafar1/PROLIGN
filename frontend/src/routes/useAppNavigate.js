import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pathForRoute } from './routeConfig';

/**
 * Compatibility hook that exposes the legacy `navigateTo(page, params)` API
 * on top of React Router. Every page/component already receives `navigateTo`
 * as a prop and calls it with page-keys; this keeps all of those call sites
 * working unchanged while routing is really driven by the router.
 *
 * Returns a stable callback: navigateTo(pageKey, params?, options?)
 */
export const useAppNavigate = () => {
  const navigate = useNavigate();

  return useCallback(
    (page, params = null, options = undefined) => {
      const path = pathForRoute(page, params);
      window.scrollTo(0, 0);
      navigate(path, options);
    },
    [navigate]
  );
};
