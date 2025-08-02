import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { 
  Download, 
  FileText, 
  Package, 
  BookOpen, 
  Search,
  Calendar,
  HardDrive
} from 'lucide-react'

interface DownloadItem {
  id: string
  title: string
  description: string
  file_url: string
  category: string
  version?: string
  file_size: string
  upload_date: string
}

export function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [filteredDownloads, setFilteredDownloads] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchDownloads()
  }, [])

  useEffect(() => {
    filterDownloads()
  }, [downloads, searchTerm, categoryFilter])

  const fetchDownloads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/downloads`)
      if (response.ok) {
        const data = await response.json()
        setDownloads(data)
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDownloads = () => {
    let filtered = downloads

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    setFilteredDownloads(filtered)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'manual': return BookOpen
      case 'update': return Package
      case 'brochure': return FileText
      default: return Download
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'manual': return 'bg-blue-100 text-blue-800'
      case 'update': return 'bg-green-100 text-green-800'
      case 'brochure': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownload = (item: DownloadItem) => {
    window.open(item.file_url, '_blank')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Downloads</h1>
        <p className="text-gray-600">
          Access manuals, firmware updates, brochures, and documentation
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Downloads</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Search downloads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="manual">Manuals</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                  <SelectItem value="brochure">Brochures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDownloads.map((item) => {
          const CategoryIcon = getCategoryIcon(item.category)
          
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CategoryIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                      {item.version && (
                        <Badge variant="secondary" className="mt-1">
                          {item.version}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={getCategoryColor(item.category)} variant="secondary">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <HardDrive className="w-4 h-4" />
                    <span>{item.file_size}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(item.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleDownload(item)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredDownloads.length === 0 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Downloads Found</h3>
            <p className="text-gray-600">
              No downloads match your current search criteria. Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
