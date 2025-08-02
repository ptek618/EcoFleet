import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { 
  History, 
  Plus, 
  Calendar, 
  DollarSign, 
  User, 
  Wrench,
  ShoppingCart,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface ServiceRecord {
  id: string
  user_id: string
  device_id: string
  service_type: string
  description: string
  cost?: number
  service_date: string
  technician: string
  status: string
}

export function ServiceHistoryPage() {
  const { user, token } = useAuth()
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({
    device_id: '',
    service_type: 'maintenance',
    description: '',
    cost: '',
    service_date: '',
    technician: '',
    status: 'completed'
  })

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    fetchServiceHistory()
  }, [])

  const fetchServiceHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/service/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error('Failed to fetch service history:', error)
    } finally {
      setLoading(false)
    }
  }

  const addServiceRecord = async () => {
    if (!newRecord.device_id || !newRecord.description || !newRecord.service_date) return

    try {
      const recordData = {
        ...newRecord,
        cost: newRecord.cost ? parseFloat(newRecord.cost) : undefined,
        service_date: new Date(newRecord.service_date).toISOString()
      }

      const response = await fetch(`${API_BASE_URL}/service/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      })

      if (response.ok) {
        setNewRecord({
          device_id: '',
          service_type: 'maintenance',
          description: '',
          cost: '',
          service_date: '',
          technician: '',
          status: 'completed'
        })
        setIsAddDialogOpen(false)
        fetchServiceHistory()
      }
    } catch (error) {
      console.error('Failed to add service record:', error)
    }
  }

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return Wrench
      case 'repair': return AlertTriangle
      case 'warranty': return Shield
      default: return History
    }
  }

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-blue-100 text-blue-800'
      case 'repair': return 'bg-red-100 text-red-800'
      case 'warranty': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'pending': return Clock
      case 'in-progress': return Wrench
      default: return History
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service History</h1>
            <p className="text-gray-600">
              Track your APU service records, maintenance, and warranty information
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Service Record</DialogTitle>
                <DialogDescription>
                  Record a new service, maintenance, or warranty event
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device_id">Device ID</Label>
                    <Input
                      id="device_id"
                      placeholder="Enter device ID"
                      value={newRecord.device_id}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, device_id: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type</Label>
                    <Select 
                      value={newRecord.service_type} 
                      onValueChange={(value) => setNewRecord(prev => ({ ...prev, service_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="warranty">Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the service performed"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0.00"
                      value={newRecord.cost}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, cost: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service_date">Service Date</Label>
                    <Input
                      id="service_date"
                      type="date"
                      value={newRecord.service_date}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, service_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="technician">Technician</Label>
                    <Input
                      id="technician"
                      placeholder="Technician name"
                      value={newRecord.technician}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, technician: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newRecord.status} 
                    onValueChange={(value) => setNewRecord(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addServiceRecord}>
                    Add Record
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {records.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Service Records</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your APU service history by adding your first record.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {records.map((record) => {
            const ServiceIcon = getServiceTypeIcon(record.service_type)
            const StatusIcon = getStatusIcon(record.status)
            
            return (
              <Card key={record.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ServiceIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {record.service_type.charAt(0).toUpperCase() + record.service_type.slice(1)} Service
                        </CardTitle>
                        <CardDescription>Device: {record.device_id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getServiceTypeColor(record.service_type)} variant="secondary">
                        {record.service_type}
                      </Badge>
                      <Badge className={getStatusColor(record.status)} variant="secondary">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-4">{record.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Service Date:</span>
                      <span className="font-medium">
                        {new Date(record.service_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {record.cost && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-medium">${record.cost.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {record.technician && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Technician:</span>
                        <span className="font-medium">{record.technician}</span>
                      </div>
                    )}
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
