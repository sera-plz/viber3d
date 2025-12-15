import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAuthStore } from './stores/auth-store';
import { LoginForm } from './components/login-form';
import { ChatPanel } from './components/chat-panel';
import { VRMAvatarScene } from './components/vrm-avatar';

export function App() {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Show loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Main app with VRM avatar and chat
  return (
    <div className="h-screen w-screen bg-gray-900 overflow-hidden">
      {/* 3D Canvas with VRM Avatar */}
      <Canvas
        camera={{ position: [0, 0.5, 2], fov: 50 }}
        shadows
        gl={{ alpha: false, antialias: true }}
        className="absolute inset-0"
      >
        <color attach="background" args={['#0f0f1a']} />
        <fog attach="fog" args={['#0f0f1a', 5, 15]} />

        <VRMAvatarScene />

        <OrbitControls
          target={[0, 0.3, 0]}
          enablePan={false}
          minDistance={1.5}
          maxDistance={4}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Chat Panel Overlay */}
      <ChatPanel />

      {/* Logo/Title */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Unju AI</h1>
          <p className="text-xs text-gray-400">Chat with your avatar</p>
        </div>
      </div>
    </div>
  );
}
