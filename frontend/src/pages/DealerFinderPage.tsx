import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Navigation, 
  Search,
  Wrench,
  ShoppingCart,
  HelpCircle
} from 'lucide-react'

interface Dealer {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  services: string[]
  latitude: number
  longitude: number
  distance?: number
}

export function DealerFinderPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchState, setSearchState] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    fetchDealers()
    getUserLocation()
  }, [])

  useEffect(() => {
    filterDealers()
  }, [dealers, searchState, serviceFilter])

  const fetchDealers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dealers`)
      if (response.ok) {
        const data = await response.json()
        setDealers(data)
      }
    } catch (error) {
      console.error('Failed to fetch dealers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }

  const findNearbyDealers = async () => {
    if (!userLocation) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/dealers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50`
      )
      if (response.ok) {
        const data = await response.json()
        setFilteredDealers(data)
      }
    } catch (error) {
      console.error('Failed to fetch nearby dealers:', error)
    }
  }

  const filterDealers = () => {
    let filtered = dealers

    if (searchState) {
      filtered = filtered.filter(dealer => 
        dealer.state.toLowerCase().includes(searchState.toLowerCase()) ||
        dealer.city.toLowerCase().includes(searchState.toLowerCase())
      )
    }

    if (serviceFilter && serviceFilter !== 'all') {
      filtered = filtered.filter(dealer => 
        dealer.services.includes(serviceFilter)
      )
    }

    setFilteredDealers(filtered)
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'sales': return ShoppingCart
      case 'service': return Wrench
      case 'support': return HelpCircle
      default: return MapPin
    }
  }

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'sales': return 'bg-green-100 text-green-800'
      case 'service': return 'bg-blue-100 text-blue-800'
      case 'support': return 'bg-purple-100 text-purple-800'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dealer Finder</h1>
        <p className="text-gray-600">
          Find authorized EcoFleet dealers for sales, service, and support
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State or City</Label>
              <Input
                id="state"
                placeholder="Enter state or city"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">Service Type</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={findNearbyDealers}
                disabled={!userLocation}
                className="w-full"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Find Nearby
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDealers.map((dealer) => (
          <Card key={dealer.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{dealer.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{dealer.city}, {dealer.state}</span>
                    {dealer.distance && (
                      <Badge variant="secondary" className="ml-2">
                        {dealer.distance} miles away
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {dealer.address}<br />
                  {dealer.city}, {dealer.state} {dealer.zip_code}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {dealer.services.map((service) => {
                  const ServiceIcon = getServiceIcon(service)
                  return (
                    <Badge 
                      key={service} 
                      className={getServiceColor(service)}
                      variant="secondary"
                    >
                      <ServiceIcon className="w-3 h-3 mr-1" />
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </Badge>
                  )
                })}
              </div>
              
              <Separator />
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`tel:${dealer.phone}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`mailto:${dealer.email}`)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(
                    `https://maps.google.com?q=${dealer.latitude},${dealer.longitude}`
                  )}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDealers.length === 0 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Dealers Found</h3>
            <p className="text-gray-600">
              No dealers match your current search criteria. Try adjusting your filters or search terms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
