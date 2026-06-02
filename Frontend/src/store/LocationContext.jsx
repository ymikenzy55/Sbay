import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { sbay } from '../api/client';

const STORAGE_KEY = 'sbay.campus';

const Ctx = createContext(null);

/**
 * Provides the user's selected campus / school to the whole app.
 * The selection is persisted in localStorage so it survives page refreshes.
 *
 * Shape exposed by the context:
 *   campus     — { id, label, city } | null
 *   setCampus  — (school) => void
 *   clearCampus— () => void
 *   schools    — all available schools (for the picker)
 *   loading    — true while the school list is being fetched
 */
export function LocationProvider({ children }) {
  const [campus, setCampusState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    sbay.getSchoolTree()
      .then((tree) => { if (alive) setSchools(tree.filter((s) => s.id !== 'all')); })
      .catch(() => { if (alive) setSchools([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const setCampus = useCallback((school) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(school)); }
    catch { /* ignore */ }
    setCampusState(school);
  }, []);

  const clearCampus = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); }
    catch { /* ignore */ }
    setCampusState(null);
  }, []);

  return (
    <Ctx.Provider value={{ campus, setCampus, clearCampus, schools, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLocation = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocation must be inside LocationProvider');
  return ctx;
};
