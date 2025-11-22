import React, { useState, useEffect, useCallback } from 'react';
import { ReferenceImage, GenerationSettings } from './types';
import { checkApiKey, requestApiKey, generateCharacterImage } from './services/geminiService';
import { ReferenceUploader } from './components/ReferenceUploader';
import { PromptSettings } from './components/PromptSettings';
import { ResultDisplay } from './components/ResultDisplay';

const App: React.FC = () => {
  const [apiKeyValid, setApiKeyValid] = useState<boolean>(false);
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: "1:1",
    imageSize: "1K" // Defaulting to 1K for better reliability
  });
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // Initial Check for API Key
  const verifyKey = useCallback(async () => {
    try {
      const valid = await checkApiKey();
      setApiKeyValid(valid);
    } catch (e) {
      console.warn("API Key check failed", e);
      setApiKeyValid(false);
    }
  }, []);

  useEffect(() => {
    verifyKey();
    // Re-check visibility changes in case they authorized in another tab/popup
    document.addEventListener("visibilitychange", verifyKey);
    return () => document.removeEventListener("visibilitychange", verifyKey);
  }, [verifyKey]);

  const handleRequestKey = async () => {
    try {
      await requestApiKey();
      // Assume success after dialog interaction, but let the component re-render to verify
      setApiKeyValid(true); 
    } catch (e) {
      console.error("Failed to request key", e);
      setError("Failed to open key selection dialog.");
    }
  };

  const handleAddImages = (newImages: ReferenceImage[]) => {
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGenerate = async () => {
    if (!apiKeyValid) {
        // Just in case button was enabled via some state glitch
        await handleRequestKey();
        return;
    }

    setError(undefined);
    setIsGenerating(true);
    setGeneratedImage(undefined);

    try {
      const result = await generateCharacterImage(prompt, images, settings);
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        setError("The model returned text but no image. Try adjusting your prompt.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API Key Invalid") {
          setApiKeyValid(false);
          setError("API Key session expired or invalid. Please select a key again.");
      } else {
          setError(err.message || "An unexpected error occurred during generation.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
            <div className="bg-brand-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h1 className="font-bold text-lg tracking-tight">OC Forge <span className="text-gray-500 text-sm font-normal ml-2">Gemini 3 Pro</span></h1>
        </div>
        <div className="flex items-center gap-4">
             <div className={`text-xs px-2 py-1 rounded border ${apiKeyValid ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'}`}>
                {apiKeyValid ? 'API Connected' : 'No API Key'}
             </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Reference Folder */}
        <ReferenceUploader 
          images={images} 
          onAddImages={handleAddImages} 
          onRemoveImage={handleRemoveImage} 
        />

        {/* Right Area: Display & Controls */}
        <div className="flex-1 flex flex-col h-full relative bg-gray-950">
            <ResultDisplay 
              imageUrl={generatedImage} 
              isGenerating={isGenerating} 
              error={error}
            />
            
            <PromptSettings 
              prompt={prompt}
              setPrompt={setPrompt}
              settings={settings}
              setSettings={setSettings}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasKey={apiKeyValid}
              onRequestKey={handleRequestKey}
              referenceCount={images.length}
            />
        </div>
      </main>
    </div>
  );
};

export default App;