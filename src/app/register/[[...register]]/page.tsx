import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Annathan Pay</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/auth-redirect"
          appearance={{
            variables: { colorPrimary: "#7c3aed", borderRadius: "0.75rem" },
            elements: {
              card: "shadow-xl shadow-violet-500/10 border border-gray-100",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
