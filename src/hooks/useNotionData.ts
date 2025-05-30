
import { useState, useEffect } from 'react';
import { apiService, NotionDatabase, NotionPage, NotionAttribute } from '@/services/api';

export function useNotionDatabases() {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Hook: Starting to fetch databases...');
      
      const data = await apiService.getNotionDatabases();
      console.log('Hook: Received databases:', data);
      
      setDatabases(data);
    } catch (err) {
      console.error('Hook: Error fetching databases:', err);
      
      let errorMessage = 'Failed to fetch databases';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  return { databases, loading, error, refetch: fetchDatabases };
}

export function useNotionPages(databaseId: string | null) {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!databaseId) {
      setPages([]);
      setError(null);
      return;
    }

    const fetchPages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiService.getNotionPages(databaseId);
        setPages(data);
      } catch (err) {
        console.error('Hook: Error fetching pages:', err);
        
        let errorMessage = 'Failed to fetch pages';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setPages([]);
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
      setError(null);
      return;
    }

    const fetchAttributes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiService.getNotionAttributes(databaseId);
        setAttributes(data);
      } catch (err) {
        console.error('Hook: Error fetching attributes:', err);
        
        let errorMessage = 'Failed to fetch attributes';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setAttributes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [databaseId]);

  return { attributes, loading, error };
}
