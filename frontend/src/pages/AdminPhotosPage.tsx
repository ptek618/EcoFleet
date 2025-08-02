import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Camera, Check, Eye, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/utils/api'

interface Photo {
  id: string
  user_id: string
  filename: string
  caption: string
  status: string
  upload_date: string
  approval_date?: string
  admin_notes?: string
}

export default function AdminPhotosPage() {
  const { token } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  useEffect(() => {
    fetchPendingPhotos()
  }, [])

  const fetchPendingPhotos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/photos/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      }
    } catch (error) {
      console.error('Failed to fetch pending photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePhoto = async (photoId: string, notes?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/photos/${photoId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: notes })
      })
      
      if (response.ok) {
        fetchPendingPhotos()
        setIsReviewDialogOpen(false)
        setSelectedPhoto(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Failed to approve photo:', error)
    }
  }

  const handleRejectPhoto = async (photoId: string, notes: string) => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/photos/${photoId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: notes })
      })
      
      if (response.ok) {
        fetchPendingPhotos()
        setIsReviewDialogOpen(false)
        setSelectedPhoto(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Failed to reject photo:', error)
    }
  }

  const openReviewDialog = (photo: Photo) => {
    setSelectedPhoto(photo)
    setAdminNotes('')
    setIsReviewDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="h-8 w-8" />
          Photo Review
        </h1>
        <p className="text-gray-600 mt-2">Review and approve user photo submissions</p>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending photos</h3>
            <p className="text-gray-500">All photo submissions have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">
                    {photo.filename}
                  </CardTitle>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Image Preview</span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Caption:</p>
                  <p className="text-sm text-gray-600">{photo.caption}</p>
                </div>
                
                <div className="text-xs text-gray-500">
                  Uploaded: {new Date(photo.upload_date).toLocaleDateString()}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprovePhoto(photo.id)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  
                  <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(photo)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Review Photo</DialogTitle>
                      </DialogHeader>
                      {selectedPhoto && (
                        <PhotoReviewForm
                          photo={selectedPhoto}
                          adminNotes={adminNotes}
                          setAdminNotes={setAdminNotes}
                          onApprove={() => handleApprovePhoto(selectedPhoto.id, adminNotes)}
                          onReject={() => handleRejectPhoto(selectedPhoto.id, adminNotes)}
                          onCancel={() => {
                            setIsReviewDialogOpen(false)
                            setSelectedPhoto(null)
                            setAdminNotes('')
                          }}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoReviewForm({ 
  photo, 
  adminNotes, 
  setAdminNotes, 
  onApprove, 
  onReject, 
  onCancel 
}: {
  photo: Photo
  adminNotes: string
  setAdminNotes: (notes: string) => void
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <Camera className="h-12 w-12 text-gray-400" />
        <span className="ml-2 text-gray-500">Image Preview</span>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-900 mb-1">Filename:</p>
        <p className="text-sm text-gray-600">{photo.filename}</p>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-900 mb-1">Caption:</p>
        <p className="text-sm text-gray-600">{photo.caption}</p>
      </div>
      
      <div>
        <Label htmlFor="admin_notes">Admin Notes (optional)</Label>
        <Textarea
          id="admin_notes"
          placeholder="Add notes about this photo..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={onReject}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
        <Button onClick={onApprove} className="flex-1">
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
      </div>
    </div>
  )
}
