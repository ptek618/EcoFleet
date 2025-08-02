import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/Navigation'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { APUControlPage } from '@/pages/APUControlPage'
import { DealerFinderPage } from '@/pages/DealerFinderPage'
import { DownloadsPage } from '@/pages/DownloadsPage'
import { FAQPage } from '@/pages/FAQPage'
import { ContactPage } from '@/pages/ContactPage'
import { ForumPage } from '@/pages/ForumPage'
import { ServiceHistoryPage } from '@/pages/ServiceHistoryPage'
import { PhotoAlbumPage } from '@/pages/PhotoAlbumPage'
import { ProfilePage } from '@/pages/ProfilePage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminUsersPage from '@/pages/AdminUsersPage'
import AdminPhotosPage from '@/pages/AdminPhotosPage'
import AdminContentPage from '@/pages/AdminContentPage'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navigation />}
      <main className={user ? "pt-16" : ""}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/apu-control" element={
            <ProtectedRoute>
              <APUControlPage />
            </ProtectedRoute>
          } />
          <Route path="/dealers" element={
            <ProtectedRoute>
              <DealerFinderPage />
            </ProtectedRoute>
          } />
          <Route path="/downloads" element={
            <ProtectedRoute>
              <DownloadsPage />
            </ProtectedRoute>
          } />
          <Route path="/faq" element={
            <ProtectedRoute>
              <FAQPage />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <ContactPage />
            </ProtectedRoute>
          } />
          <Route path="/forum" element={
            <ProtectedRoute>
              <ForumPage />
            </ProtectedRoute>
          } />
          <Route path="/service-history" element={
            <ProtectedRoute>
              <ServiceHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/photos" element={
            <ProtectedRoute>
              <PhotoAlbumPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          } />
          <Route path="/admin/photos" element={
            <AdminRoute>
              <AdminPhotosPage />
            </AdminRoute>
          } />
          <Route path="/admin/content" element={
            <AdminRoute>
              <AdminContentPage />
            </AdminRoute>
          } />
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
