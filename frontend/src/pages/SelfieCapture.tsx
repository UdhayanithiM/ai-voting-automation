// src/pages/SelfieCapture.tsx
import { useState, useRef } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useVoterStore } from '@/store/useVoteStore'

export default function SelfieCapture() {
  const webcamRef = useRef<Webcam>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const navigate = useNavigate()

  // Access the updateSelfie function from Zustand store
  const updateSelfie = useVoterStore((state) => state.updateSelfie)

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      updateSelfie(imageSrc) // Update the global selfie state in Zustand
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
        updateSelfie(reader.result as string) // Update the global selfie state in Zustand
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    navigate('/confirmation') // Next screen
  }

  const displayImage = capturedImage || uploadedImage

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Capture or Upload Selfie</h1>

      <div className="w-64 h-64 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt="Captured" className="object-cover w-full h-full" />
        ) : (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover rounded-xl"
            videoConstraints={{ facingMode: 'user' }}
          />
        )}
      </div>

      <div className="space-y-4">
        {!displayImage ? (
          <>
            <Button onClick={handleCapture} className="w-full">📸 Capture Selfie</Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              title="Upload your selfie"
              placeholder="Choose a file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </>
        ) : (
          <div className="flex gap-4">
            <Button onClick={() => { setCapturedImage(null); setUploadedImage(null); }}>
              Retake
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        )}
      </div>
    </div>
  )
}
