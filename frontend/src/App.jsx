import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HomePage from './pages/home/HomePage.jsx';
import LoginPage from './pages/auth/login/LoginPage';
import SignupPage from './pages/auth/signup/SignUpPage'
import SideBar from './components/common/SideBar';
import RightPanel from './components/common/RightPanel';
import NotificationPage from './pages/notification/NotificationPage';
import ProfilePage from './pages/profile/ProfilePage';

function App() {

  const { data: authUser, isPending } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.error) return null;
        if (!res.ok) throw new Error(data.error || 'Something went wroung');
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    retry: false
  });

  if (isPending) {
    return (
      <div className='h-screen w-full flex justify-center align-middle'>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className='flex max-w-6xl mx-auto'>
      {authUser && <SideBar />}
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to={'/login'} />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={'/'} />} />
        <Route path='/signup' element={!authUser ? <SignupPage /> : <Navigate to={'/'} />} />
        <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to={'/login'} />} />
        <Route path='profile/:username' element={authUser ? <ProfilePage /> : <Navigate to={'/login'} />} />
      </Routes>
      {authUser && <RightPanel />}
    </div>
  )
}

export default App;
