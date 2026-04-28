import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout.jsx'
import LoginPage from './pages/login-page.jsx'
import RegisterPage from './pages/register-page.jsx'
import AccountLayout, {
  AccountProfileTab,
  AccountPetsTab,
  AccountBookingsTab,
  AccountActivityTab,
  AccountNotificationsTab,
  AccountSubscriptionTab,
  AccountReviewsTab,
} from './pages/account-page.jsx'
import AddPetPage from './pages/AddPetPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import OwnerHome from './pages/OwnerHome.jsx'
import HomeRouter from './components/HomeRouter.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ProLayout from './layouts/ProLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import ProDashboardPage from './pages/pro/Dashboard.jsx'
import ProReviewsPage from './pages/pro/ProReviewsPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import ProBookingsPage from './pages/pro/ProBookingsPage.jsx'
import ProCalendarPage from './pages/pro/ProCalendarPage.jsx'
import SettingsPage from './pages/pro/SettingsPage.jsx'
import ProServicesPage from './pages/pro/ProServicesPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import ProfessionalProfilePage from './pages/ProfessionalProfilePage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminProfessionals from './pages/admin/AdminProfessionals.jsx'
import AdminBookings from './pages/admin/AdminBookings.jsx'
import AdminPayments from './pages/admin/AdminPayments.jsx'
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx'
import { UserContextProvider } from './UserContext.jsx'
import { MessagesUnreadProvider } from './MessagesUnreadContext.jsx'

function App() {
  return (
    <UserContextProvider>
      <MessagesUnreadProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeRouter />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="professionals/:id" element={<ProfessionalProfilePage />} />
            <Route path="dashboard" element={<Navigate to="/pro/dashboard" replace />} />
            <Route
              path="home"
              element={(
                <ProtectedRoute allowRole="owner">
                  <OwnerHome />
                </ProtectedRoute>
              )}
            />
            <Route
              path="review/:bookingId"
              element={(
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              )}
            />
            <Route path="owner/home" element={<Navigate to="/home" replace />} />
            <Route
              path="messages"
              element={(
                <ProtectedRoute allowRole="owner">
                  <MessagesPage />
                </ProtectedRoute>
              )}
            />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountProfileTab />} />
              <Route path="pets" element={<AccountPetsTab />} />
              <Route path="pets/new" element={<AddPetPage />} />
              <Route path="bookings" element={<AccountBookingsTab />} />
              <Route path="reviews" element={<AccountReviewsTab />} />
              <Route path="activity" element={<AccountActivityTab />} />
              <Route path="notifications" element={<AccountNotificationsTab />} />
              <Route
                path="subscription"
                element={<AccountSubscriptionTab />}
              />
              <Route path="*" element={<Navigate to="/account" replace />} />
            </Route>
          </Route>

          <Route
            path="/pro"
            element={(
              <ProtectedRoute allowRole="professional">
                <ProLayout />
              </ProtectedRoute>
            )}
          >
            <Route index element={<Navigate to="/pro/dashboard" replace />} />
            <Route path="dashboard" element={<ProDashboardPage />} />
            <Route path="calendar" element={<ProCalendarPage />} />
            <Route path="bookings" element={<ProBookingsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="reviews" element={<ProReviewsPage />} />
            <Route path="services" element={<ProServicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/admin"
            element={(
              <ProtectedRoute allowRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            )}
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="professionals" element={<AdminProfessionals />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
          </Routes>
        </BrowserRouter>
      </MessagesUnreadProvider>
    </UserContextProvider>
  )
}

export default App
