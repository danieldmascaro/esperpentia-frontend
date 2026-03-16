import { Navigate, Route, Routes } from "react-router-dom"

import { MainHeader } from "./components/MainHeader"
import { AccountPage } from "./pages/AccountPage"
import { ActivationPage } from "./pages/ActivationPage"
import { BookDetailPage } from "./pages/BookDetailPage"
import { CatalogPage } from "./pages/CatalogPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ProtectedRoute } from "./routes/ProtectedRoute"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/catalogo/:bookId" element={<BookDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate/:uid/:token" element={<ActivationPage />} />
          <Route
            path="/cuenta"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
