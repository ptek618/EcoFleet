import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, MapPin, Plus, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/utils/api'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
}

interface Download {
  id: string
  title: string
  description: string
  file_url: string
  category: string
  version?: string
  file_size: string
  upload_date: string
}

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
}

export default function AdminContentPage() {
  const { token } = useAuth()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [downloads, setDownloads] = useState<Download[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllContent()
  }, [])

  const fetchAllContent = async () => {
    try {
      const [faqResponse, downloadsResponse, dealersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/content/faq`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/content/downloads`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/content/dealers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (faqResponse.ok) {
        const faqData = await faqResponse.json()
        setFaqs(faqData)
      }

      if (downloadsResponse.ok) {
        const downloadsData = await downloadsResponse.json()
        setDownloads(downloadsData)
      }

      if (dealersResponse.ok) {
        const dealersData = await dealersResponse.json()
        setDealers(dealersData)
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <FileText className="h-8 w-8" />
          Content Management
        </h1>
        <p className="text-gray-600 mt-2">Manage FAQ, downloads, and dealer information</p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQ ({faqs.length})</TabsTrigger>
          <TabsTrigger value="downloads">Downloads ({downloads.length})</TabsTrigger>
          <TabsTrigger value="dealers">Dealers ({dealers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">FAQ Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-600 text-sm mb-2">{faq.answer}</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {faq.category}
                        </span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                          Order: {faq.order}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Downloads Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Download
            </Button>
          </div>
          
          <div className="space-y-4">
            {downloads.map((download) => (
              <Card key={download.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Download className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium text-gray-900">{download.title}</h3>
                        {download.version && (
                          <span className="text-xs bg-green-100 px-2 py-1 rounded">
                            v{download.version}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{download.description}</p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>{download.category}</span>
                        <span>•</span>
                        <span>{download.file_size}</span>
                        <span>•</span>
                        <span>{new Date(download.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dealers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Dealer Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Dealer
            </Button>
          </div>
          
          <div className="space-y-4">
            {dealers.map((dealer) => (
              <Card key={dealer.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <h3 className="font-medium text-gray-900">{dealer.name}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        {dealer.address}, {dealer.city}, {dealer.state} {dealer.zip_code}
                      </p>
                      <p className="text-gray-600 text-sm mb-2">
                        {dealer.phone} • {dealer.email}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {(Array.isArray(dealer.services) ? dealer.services : []).map((service, index) => (
                          <span key={index} className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
