import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MainLayout />
      </ChatProvider>
    </AuthProvider>
  );
}
