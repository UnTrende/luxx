
import React, { useState, useCallback } from 'react';
import { generateHairstyle } from '../services/geminiService';
import { Sparkles, UploadCloud, Send } from 'lucide-react';

const AIHairstylePage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setOriginalImage(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !imageFile) {
      setError('Please provide both an image and a description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const resultImageUrl = await generateHairstyle(prompt, imageFile);
      setGeneratedImage(resultImageUrl);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFile]);
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Sparkles className="mx-auto text-lime-accent h-12 w-12 mb-4" />
        <h1 className="text-4xl font-bold text-center text-lime-accent">AI Hairstyle Preview</h1>
        <p className="mt-2 text-lg text-subtle-text max-w-2xl mx-auto">
          Curious about a new look? Upload a photo and describe a hairstyle to see an AI-generated preview.
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-charcoal-card p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="image-upload" className="block text-lg font-semibold mb-2">1. Upload Your Photo</label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-text border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="image-upload" className="relative cursor-pointer bg-dark-text rounded-md font-medium text-lime-accent hover:brightness-110 focus-within:outline-none p-1">
                            <span>Upload a file</span>
                            <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <p className="pl-1 text-subtle-text">or drag and drop</p>
                    </div>
                    <p className="text-xs text-subtle-text/80">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="prompt" className="block text-lg font-semibold mb-2">2. Describe Your Desired Hairstyle</label>
            <div className="relative">
                <input
                    id="prompt"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., a curly pompadour, a silver buzz cut, vibrant blue highlights"
                    className="w-full p-4 pr-12 bg-dark-text border-2 border-transparent rounded-lg focus:outline-none focus:border-lime-accent"
                />
            </div>
          </div>

          <div>
            <button type="submit" disabled={isLoading || !imageFile || !prompt} className="w-full flex justify-center items-center gap-3 bg-lime-accent text-dark-text font-bold py-3 px-8 rounded-lg hover:brightness-110 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
              ) : (
                <>Generate Preview <Send size={20}/></>
              )}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-center mb-4">Original</h3>
            <div className="aspect-square bg-dark-text rounded-lg flex items-center justify-center">
              {originalImage ? <img src={originalImage} alt="Original" className="object-cover h-full w-full rounded-lg" /> : <p className="text-subtle-text">Your photo</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-center mb-4">AI Preview</h3>
            <div className="aspect-square bg-dark-text rounded-lg flex items-center justify-center">
              {isLoading && <p className="text-subtle-text">Generating your new look...</p>}
              {generatedImage && <img src={generatedImage} alt="Generated Hairstyle" className="object-cover h-full w-full rounded-lg" />}
               {!isLoading && !generatedImage && <p className="text-subtle-text">Your preview will appear here</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHairstylePage;