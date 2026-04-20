import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-editorial text-[32px]">progress_activity</span>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
