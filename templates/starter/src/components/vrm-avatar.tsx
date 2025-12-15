import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useChatStore } from '../stores/chat-store';
import * as THREE from 'three';

// Default VRM model URL - using a public VRM model
const DEFAULT_VRM_URL = '/avatar.vrm';

interface VRMAvatarProps {
  url?: string;
  position?: [number, number, number];
  scale?: number;
}

export function VRMAvatar({
  url = DEFAULT_VRM_URL,
  position = [0, -0.8, 0],
  scale = 1
}: VRMAvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const isSpeaking = useChatStore((state) => state.isSpeaking);
  const isStreaming = useChatStore((state) => state.isStreaming);

  // Lip sync animation state
  const lipSyncRef = useRef({
    currentMouthOpen: 0,
    targetMouthOpen: 0,
    blinkTimer: 0,
    nextBlinkTime: 2,
    isBlinking: false,
    blinkProgress: 0,
  });

  // Load VRM model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const loadedVrm = gltf.userData.vrm as VRM;
        if (loadedVrm) {
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.removeUnnecessaryJoints(gltf.scene);

          // Rotate to face camera
          loadedVrm.scene.rotation.y = Math.PI;

          setVrm(loadedVrm);
          setError(null);
        }
      },
      (progress) => {
        console.log('Loading VRM:', (progress.loaded / progress.total) * 100, '%');
      },
      (err) => {
        console.error('Error loading VRM:', err);
        setError('Failed to load avatar model');
      }
    );

    return () => {
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene);
      }
    };
  }, [url]);

  // Animation frame
  useFrame(() => {
    if (!vrm) return;

    const delta = clockRef.current.getDelta();
    const lipSync = lipSyncRef.current;

    // Update VRM
    vrm.update(delta);

    // Lip sync animation when speaking
    if (isSpeaking || isStreaming) {
      // Random mouth movement for speech simulation
      lipSync.targetMouthOpen = 0.3 + Math.random() * 0.5;
    } else {
      lipSync.targetMouthOpen = 0;
    }

    // Smooth mouth transition
    lipSync.currentMouthOpen += (lipSync.targetMouthOpen - lipSync.currentMouthOpen) * 0.3;

    // Apply mouth expressions (using expression manager)
    if (vrm.expressionManager) {
      // Try different mouth blend shape names
      const mouthExpressionNames = ['aa', 'a', 'oh', 'o', 'mouth_open'];
      for (const name of mouthExpressionNames) {
        const expression = vrm.expressionManager.getExpression(name);
        if (expression) {
          vrm.expressionManager.setValue(name, lipSync.currentMouthOpen);
          break;
        }
      }
    }

    // Blink animation
    lipSync.blinkTimer += delta;
    if (lipSync.blinkTimer >= lipSync.nextBlinkTime && !lipSync.isBlinking) {
      lipSync.isBlinking = true;
      lipSync.blinkProgress = 0;
    }

    if (lipSync.isBlinking) {
      lipSync.blinkProgress += delta * 10;

      let blinkValue = 0;
      if (lipSync.blinkProgress < 0.5) {
        blinkValue = lipSync.blinkProgress * 2;
      } else if (lipSync.blinkProgress < 1) {
        blinkValue = 1 - (lipSync.blinkProgress - 0.5) * 2;
      } else {
        lipSync.isBlinking = false;
        lipSync.blinkTimer = 0;
        lipSync.nextBlinkTime = 2 + Math.random() * 4;
        blinkValue = 0;
      }

      if (vrm.expressionManager) {
        const blinkExpressionNames = ['blink', 'blinkLeft', 'blinkRight'];
        for (const name of blinkExpressionNames) {
          const expression = vrm.expressionManager.getExpression(name);
          if (expression) {
            vrm.expressionManager.setValue(name, blinkValue);
          }
        }
      }
    }

    // Look at camera
    if (vrm.lookAt) {
      vrm.lookAt.target = camera;
    }

    // Idle breathing animation
    if (vrm.humanoid) {
      const spine = vrm.humanoid.getNormalizedBoneNode('spine');
      if (spine) {
        spine.rotation.x = Math.sin(Date.now() * 0.001) * 0.02;
      }
    }
  });

  if (error) {
    return (
      <group ref={groupRef} position={position}>
        <mesh>
          <boxGeometry args={[0.5, 1, 0.3]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
      </group>
    );
  }

  if (!vrm) {
    return (
      <group ref={groupRef} position={position}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
          <meshStandardMaterial color="#8b5cf6" opacity={0.5} transparent />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={vrm.scene} />
    </group>
  );
}

// Orbit controls wrapper for VRM viewing
export function VRMAvatarScene() {
  const isSpeaking = useChatStore((state) => state.isSpeaking);

  return (
    <>
      {/* Avatar */}
      <VRMAvatar />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Rim light for character highlight */}
      <pointLight
        position={[0, 2, -2]}
        intensity={isSpeaking ? 2 : 0.5}
        color="#8b5cf6"
      />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Speaking indicator ring */}
      {isSpeaking && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.79, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="#8b5cf6" opacity={0.5} transparent />
        </mesh>
      )}
    </>
  );
}
