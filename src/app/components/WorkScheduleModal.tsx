import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkScheduleAPI } from '../hooks/useWorkScheduleAPI';
import { getApiUrl } from '../lib/apiUrl';
import { toast } from 'sonner';

interface WorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkScheduleModal({ isOpen, onClose }: WorkScheduleModalProps) {
  const { user, setHasCompletedSchedule, getAccessToken } = useAuth();
  const { addSchedule, fetchSchedules } = useWorkScheduleAPI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_URL = getApiUrl();

  const [formData, setFormData] = useState({
    work_days: [] as string[],
    start_time: '',
    end_time: '',
    work_type: 'full-time',
    notes: ''
  });

  const workDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const handleClose = () => {
    // Mark as completed even if user skips
    setHasCompletedSchedule(true);
    localStorage.setItem('hasCompletedSchedule', 'true');
    onClose();
  };

  const handleDayChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      work_days: checked
        ? [...prev.work_days, day]
        : prev.work_days.filter(d => d !== day)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addSchedule({
        job_title: 'Work Schedule',
        work_days: formData.work_days,
        start_time: formData.start_time,
        end_time: formData.end_time,
        work_type: formData.work_type,
        notes: formData.notes
      });

      // Update local state
      setHasCompletedSchedule(true);
      localStorage.setItem('hasCompletedSchedule', 'true');

      // Refresh schedules
      await fetchSchedules();

      toast.success('Work schedule saved successfully!');
      handleClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-2xl transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
        <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Set Up Your Work Schedule</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Please provide your work schedule to help us optimize your task planning.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Days
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workDays.map(day => (
                <label key={day.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.work_days.includes(day.value)}
                    onChange={(e) => handleDayChange(day.value, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Type
            </label>
            <select
              value={formData.work_type}
              onChange={(e) => setFormData(prev => ({ ...prev, work_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="freelance">Freelance</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any additional notes about your schedule..."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Work Schedule'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}