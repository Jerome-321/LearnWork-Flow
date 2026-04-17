import { ReactNode, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthPage } from "../pages/AuthPage";
import { WorkScheduleModal } from "./WorkScheduleModal";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, hasCompletedSchedule, scheduleChecked } = useAuth();

  const showScheduleModal = !!(user && scheduleChecked && !hasCompletedSchedule && !user.is_staff && !user.is_superuser);

  // Redirect admin users to Django admin panel
  useEffect(() => {
    if (user && (user.is_staff || user.is_superuser)) {
      window.location.href = '/admin/';
      return;
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <div className={`transition-all duration-500 ease-in-out ${showScheduleModal ? 'blur-md filter brightness-75' : ''}`}>
        {children}
      </div>
      <WorkScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {}}
      />
    </>
  );
}