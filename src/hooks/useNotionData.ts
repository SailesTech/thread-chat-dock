
import { useState, useEffect } from 'react';
import { apiService, NotionDatabase, NotionPage, NotionAttribute } from '@/services/api';

export function useNotionDatabases() {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const data = await apiService.getNotionDatabases();
        setDatabases(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch databases');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  return { databases, loading, error, refetch: () => fetchDatabases() };
}

export function useNotionPages(databaseId: string | null) {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!databaseId) {
      setPages([]);
      return;
    }

    const fetchPages = async () => {
      try {
        setLoading(true);
        const data = await apiService.getNotionPages(databaseId);
        setPages(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch pages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [databaseId]);

  return { pages, loading, error };
}

export function useNotionAttributes(databaseId: string | null) {
  const [attributes, setAttributes] = useState<NotionAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!databaseId) {
      setAttributes([]);
      return;
    }

    const fetchAttributes = async () => {
      try {
        setLoading(true);
        const data = await apiService.getNotionAttributes(databaseId);
        setAttributes(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch attributes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [databaseId]);

  return { attributes, loading, error };
}
