import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getDashboard } from "../api/dashboardApi";
import { getContacts } from "../api/contactApi";
import { getNotes } from "../api/noteApi";
import { getStatuses } from "../api/statusApi";
import { getProfile } from "../api/userApi";

const CACHE_TTL = 60_000; // 60 seconds

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  fetchedAt: number;
};

type AppDataState = {
  dashboard: ResourceState<unknown>;
  profile: ResourceState<unknown>;
  contacts: ResourceState<unknown>;
  notes: ResourceState<unknown>;
  statuses: ResourceState<unknown>;

  preloadAppData: () => Promise<void>;

  refreshDashboard: (force?: boolean) => Promise<unknown | null>;
  refreshProfile: (force?: boolean) => Promise<unknown | null>;
  refreshContacts: (force?: boolean) => Promise<unknown | null>;
  refreshNotes: (force?: boolean) => Promise<unknown | null>;
  refreshStatuses: (force?: boolean) => Promise<unknown | null>;

  invalidateDashboard: () => void;
  invalidateProfile: () => void;
  invalidateContacts: () => void;
  invalidateNotes: () => void;
  invalidateStatuses: () => void;

  clearAppData: () => void;
};

function createInitialResource<T>(): ResourceState<T> {
  return {
    data: null,
    loading: false,
    refreshing: false,
    error: "",
    fetchedAt: 0,
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

const AppDataContext = createContext<AppDataState | null>(null);

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return value;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [dashboard, setDashboard] = useState<ResourceState<unknown>>(() =>
    createInitialResource()
  );
  const [profile, setProfile] = useState<ResourceState<unknown>>(() =>
    createInitialResource()
  );
  const [contacts, setContacts] = useState<ResourceState<unknown>>(() =>
    createInitialResource()
  );
  const [notes, setNotes] = useState<ResourceState<unknown>>(() =>
    createInitialResource()
  );
  const [statuses, setStatuses] = useState<ResourceState<unknown>>(() =>
    createInitialResource()
  );

  const inflight = useRef<Record<string, Promise<unknown> | null>>({
    dashboard: null,
    profile: null,
    contacts: null,
    notes: null,
    statuses: null,
  });

  const stateRef = useRef({
    dashboard,
    profile,
    contacts,
    notes,
    statuses,
  });

  useEffect(() => {
    stateRef.current = { dashboard, profile, contacts, notes, statuses };
  }, [dashboard, profile, contacts, notes, statuses]);

  const shouldUseCache = useCallback((fetchedAt: number, force?: boolean) => {
    if (force) return false;
    if (fetchedAt === 0) return false;
    return Date.now() - fetchedAt < CACHE_TTL;
  }, []);

  const makeRefresh = useCallback(
    <T,>(
      key: string,
      setResource: React.Dispatch<React.SetStateAction<ResourceState<T>>>,
      fetcher: () => Promise<T>,
      fallbackError: string
    ) => {
      return async (force = false): Promise<T | null> => {
        const current = stateRef.current[key as keyof typeof stateRef.current] as ResourceState<T>;

        if (shouldUseCache(current.fetchedAt, force)) {
          return current.data;
        }

        if (!force && inflight.current[key]) {
          return inflight.current[key] as Promise<T>;
        }

        const promise = (async () => {
          const hasData = Boolean(current.data);

          setResource((prev) => ({
            ...prev,
            loading: !hasData,
            refreshing: hasData,
            error: "",
          }));

          try {
            const response = await fetcher();

            setResource({
              data: response,
              loading: false,
              refreshing: false,
              error: "",
              fetchedAt: Date.now(),
            });

            return response;
          } catch (error) {
            setResource((prev) => ({
              ...prev,
              loading: false,
              refreshing: false,
              error: errorMessage(error, fallbackError),
            }));

            return null;
          } finally {
            inflight.current[key] = null;
          }
        })();

        inflight.current[key] = promise;
        return promise;
      };
    },
    [shouldUseCache]
  );

  const refreshProfile = useCallback(
    async (force = false) => {
      return makeRefresh(
        "profile",
        setProfile,
        getProfile,
        "Cannot load profile."
      )(force);
    },
    [makeRefresh]
  );

  const refreshDashboard = useCallback(
    async (force = false) => {
      return makeRefresh(
        "dashboard",
        setDashboard,
        getDashboard,
        "Cannot load dashboard."
      )(force);
    },
    [makeRefresh]
  );

  const refreshContacts = useCallback(
    async (force = false) => {
      return makeRefresh(
        "contacts",
        setContacts,
        getContacts,
        "Cannot load contacts."
      )(force);
    },
    [makeRefresh]
  );

  const refreshNotes = useCallback(
    async (force = false) => {
      return makeRefresh(
        "notes",
        setNotes,
        getNotes,
        "Cannot load notes."
      )(force);
    },
    [makeRefresh]
  );

  const refreshStatuses = useCallback(
    async (force = false) => {
      return makeRefresh(
        "statuses",
        setStatuses,
        getStatuses,
        "Cannot load statuses."
      )(force);
    },
    [makeRefresh]
  );

  const preloadAppData = useCallback(async () => {
    await Promise.allSettled([
      refreshProfile(false),
      refreshDashboard(false),
      refreshContacts(false),
      refreshNotes(false),
      refreshStatuses(false),
    ]);
  }, [refreshProfile, refreshDashboard, refreshContacts, refreshNotes, refreshStatuses]);

  const invalidateProfile = useCallback(() => {
    setProfile((prev) => ({ ...prev, fetchedAt: 0 }));
  }, []);

  const invalidateDashboard = useCallback(() => {
    setDashboard((prev) => ({ ...prev, fetchedAt: 0 }));
  }, []);

  const invalidateContacts = useCallback(() => {
    setContacts((prev) => ({ ...prev, fetchedAt: 0 }));
  }, []);

  const invalidateNotes = useCallback(() => {
    setNotes((prev) => ({ ...prev, fetchedAt: 0 }));
  }, []);

  const invalidateStatuses = useCallback(() => {
    setStatuses((prev) => ({ ...prev, fetchedAt: 0 }));
  }, []);

  const clearAppData = useCallback(() => {
    inflight.current = {
      dashboard: null,
      profile: null,
      contacts: null,
      notes: null,
      statuses: null,
    };
    setProfile(createInitialResource());
    setDashboard(createInitialResource());
    setContacts(createInitialResource());
    setNotes(createInitialResource());
    setStatuses(createInitialResource());
  }, []);

  const value = useMemo<AppDataState>(
    () => ({
      dashboard,
      profile,
      contacts,
      notes,
      statuses,

      preloadAppData,

      refreshDashboard,
      refreshProfile,
      refreshContacts,
      refreshNotes,
      refreshStatuses,

      invalidateDashboard,
      invalidateProfile,
      invalidateContacts,
      invalidateNotes,
      invalidateStatuses,

      clearAppData,
    }),
    [
      dashboard,
      profile,
      contacts,
      notes,
      statuses,
      preloadAppData,
      refreshDashboard,
      refreshProfile,
      refreshContacts,
      refreshNotes,
      refreshStatuses,
      invalidateDashboard,
      invalidateProfile,
      invalidateContacts,
      invalidateNotes,
      invalidateStatuses,
      clearAppData,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}
