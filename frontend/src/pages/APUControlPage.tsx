import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Separator } from '../components/ui/separator'
import { 
  Zap, 
  Power, 
  PowerOff, 
  Thermometer, 
  Battery, 
  Clock, 
  Wrench,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface APUDevice {
  id: string
  name: string
  model: string
  status: 'stopped' | 'running' | 'maintenance' | 'error'
  temperature?: number
  voltage?: number
  runtime_hours?: number
  last_maintenance?: string
  owner_id: string
}

export function APUControlPage() {
  const { user, token } = useAuth()
  const [devices, setDevices] = useState<APUDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [controlLoading, setControlLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/apu/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDevices(data)
      } else {
        setError('Failed to fetch APU devices')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const controlAPU = async (deviceId: string, action: 'start' | 'stop') => {
    setControlLoading(deviceId)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/apu/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          device_id: deviceId,
          action: action
        })
      })
      
      if (response.ok) {
        await fetchDevices() // Refresh device status
      } else {
        const errorData = await response.json()
        setError(errorData.detail || `Failed to ${action} APU`)
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setControlLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'stopped': return 'bg-gray-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return CheckCircle
      case 'stopped': return PowerOff
      case 'maintenance': return Wrench
      case 'error': return AlertTriangle
      default: return Power
    }
  }

  if (user?.role === 'free') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
          <CardHeader className="text-center">
            <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-yellow-800">Premium Feature</CardTitle>
            <CardDescription className="text-yellow-700">
              APU remote control requires a paid subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-yellow-700 mb-6">
              Upgrade your account to access remote APU control, real-time monitoring, 
              and maintenance tracking features.
            </p>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Upgrade to Paid Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">APU Control Center</h1>
        <p className="text-gray-600">
          Monitor and control your EcoFleet APU devices remotely
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {devices.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No APU Devices Found</h3>
            <p className="text-gray-600 mb-6">
              No APU devices are currently registered to your account. 
              Contact support to register your devices.
            </p>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map((device) => {
            const StatusIcon = getStatusIcon(device.status)
            const isControlling = controlLoading === device.id
            
            return (
              <Card key={device.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{device.name}</CardTitle>
                      <CardDescription>{device.model}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(device.status)} text-white`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {device.temperature && (
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-600">Temperature</span>
                        <span className="font-semibold">{device.temperature}°F</span>
                      </div>
                    )}
                    
                    {device.voltage && (
                      <div className="flex items-center space-x-2">
                        <Battery className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Voltage</span>
                        <span className="font-semibold">{device.voltage}V</span>
                      </div>
                    )}
                    
                    {device.runtime_hours && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Runtime</span>
                        <span className="font-semibold">{device.runtime_hours}h</span>
                      </div>
                    )}
                    
                    {device.last_maintenance && (
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Last Service</span>
                        <span className="font-semibold text-xs">
                          {new Date(device.last_maintenance).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => controlAPU(device.id, 'start')}
                      disabled={device.status === 'running' || isControlling}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Power className="w-4 h-4 mr-2" />
                      {isControlling ? 'Starting...' : 'Start APU'}
                    </Button>
                    
                    <Button
                      onClick={() => controlAPU(device.id, 'stop')}
                      disabled={device.status === 'stopped' || isControlling}
                      variant="destructive"
                      className="flex-1"
                    >
                      <PowerOff className="w-4 h-4 mr-2" />
                      {isControlling ? 'Stopping...' : 'Stop APU'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
