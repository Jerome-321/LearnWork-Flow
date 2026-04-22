import { useState, useEffect } from 'react';

const API_URL = 'https://learnwork-flow.onrender.com';

interface StreakData {
  id: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_days_active: number;
  created_at: string;
  updated_at: string;
}

export const useStreakAPI = () => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchStreak = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/streak/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch streak data');
      }
      const data = await response.json();
      setStreak(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch streak data';
      setError(errorMsg);
      console.error('Error fetching streak:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/streak/update/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update streak');
      }
      const data = await response.json();
      setStreak(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update streak';
      setError(errorMsg);
      console.error('Error updating streak:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  return {
    streak,
    loading,
    error,
    fetchStreak,
    updateStreak,
  };
};
