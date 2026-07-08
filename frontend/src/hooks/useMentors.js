import { useState, useEffect, useCallback } from 'react';
import { mentorService } from '../services/mentorService';

/**
 * Reusable data-fetching hooks for mentors.
 *
 * These keep data access in the service layer (no axios in components) and give
 * every consumer consistent { loading, error, refetch } semantics — the basis
 * for skeleton/empty/error UI states required by the code-quality task.
 *
 * Implementation notes:
 *  - The fetch runs in an inline async IIFE inside the effect, so state is only
 *    updated *after* the await (never synchronously within the effect body).
 *  - `refetch` bumps a tick that the effect depends on, re-running the fetch.
 *  - Query/id changes reset loading during render (React's sanctioned pattern
 *    for deriving state from changing inputs), not in an effect.
 */

// List mentors. `params` is serialized to a stable key so the effect only
// refetches when the actual query changes (not on every render).
export const useMentors = (params = {}) => {
  const [mentors, setMentors] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const paramsKey = JSON.stringify(params);

  // When the query changes, go back to a loading state before the refetch runs.
  const [prevKey, setPrevKey] = useState(paramsKey);
  if (prevKey !== paramsKey) {
    setPrevKey(paramsKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { mentors: list, total, page, pages } = await mentorService.getMentors(JSON.parse(paramsKey));
        if (controller.signal.aborted) return;
        setMentors(list);
        setMeta({ total, page, pages });
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err);
        setMentors([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [paramsKey, reloadTick]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadTick((t) => t + 1);
  }, []);

  return { mentors, ...meta, loading, error, refetch };
};

// Fetch a single mentor by id.
export const useMentor = (id) => {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(id));
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Reset to a loading state whenever the requested id changes (render-phase).
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setMentor(null);
    setError(null);
    setLoading(Boolean(id));
  }

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    (async () => {
      try {
        const data = await mentorService.getMentorById(id);
        if (controller.signal.aborted) return;
        setMentor(data);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err);
        setMentor(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, reloadTick]);

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setReloadTick((t) => t + 1);
  }, [id]);

  return { mentor, loading, error, refetch };
};
