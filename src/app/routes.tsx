import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AllTasksPage } from "./pages/AllTasksPage";
import { AcademicPage } from "./pages/AcademicPage";
import { WorkPage } from "./pages/WorkPage";
import { PersonalPage } from "./pages/PersonalPage";
import { PriorityPage } from "./pages/PriorityPage";
import { CalendarPage } from "./pages/CalendarPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: AllTasksPage },
      { path: "academic", Component: AcademicPage },
      { path: "work", Component: WorkPage },
      { path: "personal", Component: PersonalPage },
      { path: "priority", Component: PriorityPage },
      { path: "calendar", Component: CalendarPage },
      { path: "progress", Component: ProgressPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);