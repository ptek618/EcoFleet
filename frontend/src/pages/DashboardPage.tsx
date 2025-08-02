import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Link } from 'react-router-dom'
import { 
  Zap, 
  MapPin, 
  Download, 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  History, 
  Camera,
  Crown,
  Users,
  Wrench
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()

  const features = [
    {
      title: 'APU Control',
      description: 'Start, stop, and monitor your APU remotely',
      icon: Zap,
      path: '/apu-control',
      requiresPaid: true,
      color: 'bg-blue-500'
    },
    {
      title: 'Dealer Finder',
      description: 'Find nearby service, sales, and support dealers',
      icon: MapPin,
      path: '/dealers',
      requiresPaid: false,
      color: 'bg-green-500'
    },
    {
      title: 'Downloads',
      description: 'Access manuals, updates, and documentation',
      icon: Download,
      path: '/downloads',
      requiresPaid: false,
      color: 'bg-purple-500'
    },
    {
      title: 'Support FAQ',
      description: 'Get answers to common questions',
      icon: HelpCircle,
      path: '/faq',
      requiresPaid: false,
      color: 'bg-orange-500'
    },
    {
      title: 'Contact Support',
      description: 'Send messages and support requests',
      icon: Mail,
      path: '/contact',
      requiresPaid: false,
      color: 'bg-red-500'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other EcoFleet users',
      icon: MessageSquare,
      path: '/forum',
      requiresPaid: false,
      color: 'bg-indigo-500'
    },
    {
      title: 'Service History',
      description: 'View your service and sales records',
      icon: History,
      path: '/service-history',
      requiresPaid: false,
      color: 'bg-teal-500'
    },
    {
      title: 'Photo Album',
      description: 'Share photos and testimonials',
      icon: Camera,
      path: '/photos',
      requiresPaid: false,
      color: 'bg-pink-500'
    }
  ]

  const availableFeatures = features.filter(feature => 
    !feature.requiresPaid || (user?.role === 'paid' || user?.role === 'admin')
  )

  const stats = [
    {
      title: 'Account Type',
      value: user?.role === 'paid' ? 'Paid' : user?.role === 'admin' ? 'Admin' : 'Free',
      icon: user?.role === 'paid' || user?.role === 'admin' ? Crown : Users,
      color: user?.role === 'paid' || user?.role === 'admin' ? 'text-yellow-600' : 'text-gray-600'
    },
    {
      title: 'Features Available',
      value: `${availableFeatures.length}/${features.length}`,
      icon: Wrench,
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-600">
          Manage your EcoFleet APU system and access all available features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {user?.role === 'free' && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Upgrade to Paid Account</h3>
                <p className="text-yellow-700">
                  Get access to APU remote control and advanced features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const isAvailable = !feature.requiresPaid || (user?.role === 'paid' || user?.role === 'admin')
          
          return (
            <Card key={index} className={`transition-all hover:shadow-lg ${!isAvailable ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {feature.requiresPaid && (
                    <Badge variant={isAvailable ? "default" : "secondary"}>
                      {isAvailable ? "Premium" : "Paid Only"}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isAvailable ? (
                  <Button asChild className="w-full">
                    <Link to={feature.path}>
                      Open {feature.title}
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Requires Paid Account
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
