import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Alert, AlertDescription } from '../components/ui/alert'
import { 
  User, 
  Mail,
  Calendar,
  Crown, 
  Users,
  Edit,
  Save,
  X,
  CheckCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin
} from 'lucide-react'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  })
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    linkedin: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  React.useEffect(() => {
    fetchSocialLinks()
  }, [])

  const fetchSocialLinks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/links`)
      if (response.ok) {
        const data = await response.json()
        setSocialLinks(data)
      }
    } catch (error) {
      console.error('Failed to fetch social links:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }, 1000)
  }

  const handleCancel = () => {
    setEditData({
      full_name: user?.full_name || '',
      phone: user?.phone || ''
    })
    setIsEditing(false)
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'paid':
        return {
          label: 'Paid Account',
          icon: Crown,
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Full access to APU control and premium features'
        }
      case 'admin':
        return {
          label: 'Administrator',
          icon: Crown,
          color: 'bg-purple-100 text-purple-800',
          description: 'Full system access and administrative privileges'
        }
      default:
        return {
          label: 'Free Account',
          icon: Users,
          color: 'bg-gray-100 text-gray-800',
          description: 'Access to basic features and community resources'
        }
    }
  }

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-500' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
  ]

  if (!user) return null

  const roleInfo = getRoleInfo(user.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={editData.full_name}
                      onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">{user.full_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <p className="text-sm text-gray-900 py-2">{user.email}</p>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{user.phone || 'Not provided'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Connect with EcoFleet on social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon
                  const url = socialLinks[platform.key as keyof typeof socialLinks]
                  
                  return (
                    <div key={platform.key} className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${platform.color}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{platform.label}</p>
                        {url ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() => window.open(url, '_blank')}
                          >
                            Visit Page
                          </Button>
                        ) : (
                          <p className="text-xs text-gray-500">Not available</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <RoleIcon className={`w-5 h-5 ${roleInfo.color.includes('yellow') ? 'text-yellow-600' : roleInfo.color.includes('purple') ? 'text-purple-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <Badge className={roleInfo.color} variant="secondary">
                    {roleInfo.label}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Member since:</span>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Email verified:</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {user.role === 'free' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Upgrade Account</CardTitle>
                <CardDescription className="text-yellow-700">
                  Get access to APU remote control and premium features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Paid
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={logout}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
