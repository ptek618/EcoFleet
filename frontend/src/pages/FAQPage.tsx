import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible'
import { Badge } from '../components/ui/badge'
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Wrench,
  Zap,
  Settings,
  AlertCircle
} from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
}

export function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchFaqs()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterFaqs()
  }, [faqs, searchTerm, categoryFilter])

  const fetchFaqs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/faq`)
      if (response.ok) {
        const data = await response.json()
        setFaqs(data)
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/faq/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const filterFaqs = () => {
    let filtered = faqs

    if (searchTerm) {
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(faq => faq.category === categoryFilter)
    }

    setFilteredFaqs(filtered)
  }

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operation': return Zap
      case 'maintenance': return Wrench
      case 'troubleshooting': return AlertCircle
      case 'installation': return Settings
      default: return HelpCircle
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'operation': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-green-100 text-green-800'
      case 'troubleshooting': return 'bg-red-100 text-red-800'
      case 'installation': return 'bg-purple-100 text-purple-800'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600">
          Find answers to common questions about EcoFleet APU systems
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search FAQ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Search questions and answers..."
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredFaqs.map((faq) => {
          const CategoryIcon = getCategoryIcon(faq.category)
          const isOpen = openItems.has(faq.id)
          
          return (
            <Card key={faq.id} className="overflow-hidden">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleItem(faq.id)}
                >
                  <CardHeader className="hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3 text-left">
                        <div className="p-2 bg-blue-100 rounded-lg mt-1">
                          <CategoryIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">
                            {faq.question}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge 
                              className={getCategoryColor(faq.category)} 
                              variant="secondary"
                            >
                              {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="pl-14">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>

      {filteredFaqs.length === 0 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Found</h3>
            <p className="text-gray-600">
              No questions match your current search criteria. Try adjusting your search terms or category filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
