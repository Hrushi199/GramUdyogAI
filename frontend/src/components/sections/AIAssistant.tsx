import React, { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Leva, useControls } from "leva";

// Avatar with head movement when speaking
function AvatarModel({ url, isSpeaking }: { url: string; isSpeaking: boolean }) {
  const { scene } = useGLTF(url);
  const ref = useRef<any>();

  // Leva controls for avatar position and rotation
  const { posY, rotX, scale } = useControls("Avatar", {
    posY: { value: -33.32, min: -100, max: 5, step: 0.01 },
    rotX: { value: -0.16, min: -Math.PI, max: Math.PI, step: 0.01 },
    scale: { value: 19.8, min: 0, max:105, step: 0.1 },
  });

  useFrame((state) => {
    if (ref.current) {
      if (isSpeaking) {
        ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 6) * 0.07 + rotX;
        ref.current.position.y = Math.sin(state.clock.getElapsedTime() * 3) * 0.05 + posY;
      } else {
        ref.current.rotation.x = rotX;
        ref.current.position.y = posY;
      }
      ref.current.scale.set(scale, scale, scale);
    }
  });

  return <primitive ref={ref} object={scene} />;
}

export default function AIAssistant({ lang }: { lang: string }) {
  const [userInput, setUserInput] = useState("");
  const [assistantOutput, setAssistantOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcribed, setTranscribed] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Path to your .glb file in public/avatars/my-avatar.glb
  const modelUrl = "../public/female2.glb";

  // Basic browser STT
  const handleStartListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setTranscribed(transcript);
      console.log("Transcribed audio:", transcript);
    };
    recognition.start();
  };

  const handleProcess = async () => {
    setLoading(true);
    setAssistantOutput("");
    const response = await fetch(`${VITE_API_BASE_URL}/api/ai-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: userInput, lang }),
    });
    const data = await response.json();
    setAssistantOutput(data.output);
    setLoading(false);

    // Browser TTS with animation
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(data.output);
      utter.lang = lang;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div
      className="text-white bg-gray-900 rounded-xl shadow-2xl p-6"
      style={{
        width: 380,
        height: 700,
        maxWidth: "100vw",
        maxHeight: "100vh",
        overflowY: "auto",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <Leva collapsed />
      <div className="flex flex-col items-center">
        {/* 3D Avatar */}
        <div style={{ width: 300, height: 200 }}>
          <Canvas camera={{ position: [0, 5, 5] }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 5, 2]} intensity={1} />
            <Suspense fallback={null}>
              <AvatarModel url={modelUrl} isSpeaking={isSpeaking} />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 2.5}
            />
          </Canvas>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2 mt-2">Ask for help</h2>
      <button
        className="bg-blue-700 text-white px-4 py-2 rounded-lg mb-2"
        onClick={handleStartListening}
      >
        🎤 Speak
      </button>
      {transcribed && (
        <div className="mb-2 text-green-400">
          <strong>Transcribed:</strong> {transcribed}
        </div>
      )}
      <textarea
        className="w-full p-3 rounded-lg bg-gray-800 text-white mb-2"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Type or speak your request..."
        style={{ minHeight: 60 }}
      />
      <div className="mb-2 text-xs text-gray-400 w-full break-words">
        <strong>Request to LLM:</strong> {JSON.stringify({ text: userInput, lang })}
      </div>
      <button
        className="bg-purple-700 text-white px-4 py-2 rounded-lg w-full"
        onClick={handleProcess}
        disabled={loading || !userInput}
      >
        {loading ? "Processing..." : "Ask Assistant"}
      </button>
      {assistantOutput && (
        <div className="mt-4 bg-gray-700 p-4 rounded-lg text-white h-36 overflow-y-auto w-full">
          <strong>Assistant:</strong>
          <div>{assistantOutput}</div>
        </div>
      )}
    </div>
  );
}

// Required for GLTF loading
useGLTF.preload("../public/female2.glb");
