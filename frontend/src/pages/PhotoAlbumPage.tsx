import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Camera as CapacitorCamera } from '@capacitor/camera'
import { CameraResultType, CameraSource } from '@capacitor/camera'
import { 
  Camera, 
  Upload, 
  Eye, 
  User, 
  Image,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

interface Photo {
  id: string
  user_id: string
  filename: string
  caption: string
  status: 'pending' | 'approved' | 'rejected'
  upload_date: string
  approval_date?: string
  admin_notes?: string
}

export function PhotoAlbumPage() {
  const { token } = useAuth()
  const [publicPhotos, setPublicPhotos] = useState<Photo[]>([])
  const [myPhotos, setMyPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadCaption, setUploadCaption] = useState('')

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchPublicPhotos()
    fetchMyPhotos()
  }, [])

  const fetchPublicPhotos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photos?status=approved`)
      if (response.ok) {
        const data = await response.json()
        setPublicPhotos(data)
      }
    } catch (error) {
      console.error('Failed to fetch public photos:', error)
    }
  }

  const fetchMyPhotos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photos/my-uploads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMyPhotos(data)
      }
    } catch (error) {
      console.error('Failed to fetch my photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCameraCapture = async () => {
    if (!uploadCaption) return

    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      })

      if (image.dataUrl) {
        const response = await fetch(image.dataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('caption', uploadCaption)

        const uploadResponse = await fetch(`${API_BASE_URL}/photos/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (uploadResponse.ok) {
          setUploadCaption('')
          setIsUploadDialogOpen(false)
          fetchMyPhotos()
        }
      }
    } catch (error) {
      console.error('Camera error:', error)
      alert('Failed to capture photo')
    }
  }

  const uploadPhoto = async () => {
    if (!uploadCaption) return

    try {
      const response = await fetch(`${API_BASE_URL}/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caption: uploadCaption
        })
      })

      if (response.ok) {
        setUploadCaption('')
        setIsUploadDialogOpen(false)
        fetchMyPhotos()
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle
      case 'pending': return Clock
      case 'rejected': return X
      default: return Clock
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Album</h1>
            <p className="text-gray-600">
              Share photos of your EcoFleet APU and view community testimonials
            </p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Photo</DialogTitle>
                <DialogDescription>
                  Share a photo of your EcoFleet APU. All photos are reviewed before being made public.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo File</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Take a photo or select from gallery</p>
                    <p className="text-sm text-gray-500">JPG, PNG up to 10MB</p>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        type="button"
                        onClick={handleCameraCapture}
                        disabled={!uploadCaption}
                        variant="outline"
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <Input type="file" accept="image/*" className="flex-1" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    placeholder="Describe your photo or share your experience"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={uploadPhoto}>
                    Upload Photo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="public" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Public Gallery</span>
          </TabsTrigger>
          <TabsTrigger value="my-photos" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>My Photos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="public" className="mt-6">
          {publicPhotos.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="text-center py-12">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Public Photos</h3>
                <p className="text-gray-600">
                  Be the first to share a photo with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-700 mb-2">{photo.caption}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(photo.upload_date).toLocaleDateString()}</span>
                      <Badge className={getStatusColor(photo.status)} variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-photos" className="mt-6">
          {myPhotos.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Photos Uploaded</h3>
                <p className="text-gray-600 mb-6">
                  Upload your first photo to share with the EcoFleet community.
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Photo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPhotos.map((photo) => {
                const StatusIcon = getStatusIcon(photo.status)
                
                return (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700 mb-2">{photo.caption}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{new Date(photo.upload_date).toLocaleDateString()}</span>
                        <Badge className={getStatusColor(photo.status)} variant="secondary">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                        </Badge>
                      </div>
                      {photo.admin_notes && (
                        <p className="text-xs text-gray-600 italic">
                          Admin: {photo.admin_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
