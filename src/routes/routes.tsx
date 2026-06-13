import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loader fullscreen />}>{children}</Suspense>;
}

const Home = lazy(() => import("@/pages/home/page"));
const Translate = lazy(() => import("@/pages/translate/page"));
const NotFound = lazy(() => import("@/pages/not-found/page"));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route
        path="home" 
        element={
          <S>
            <Home />
          </S>
        }
      />

      <Route
        path="translate"
        element={
          <S>
            <Translate />
          </S>
        }
      />

      <Route
        path="not-found"
        element={
          <S>
            <NotFound />
          </S>
        }
      />

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default AppRoutes;
