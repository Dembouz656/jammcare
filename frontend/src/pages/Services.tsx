import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Service } from '../types/index.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js';
import { Loader2 } from 'lucide-react';

export function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiClient.getServices(),
  });

  const categories = services
    ? Array.from(new Set((services as Service[]).map((s) => s.category)))
    : [];

  const filteredServices = services?.filter(
    (service: Service) => selectedCategory === 'all' || service.category === selectedCategory
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="text-4xl font-bold mb-2">Healthcare Services</h1>
        <p className="text-gray-600 mb-8">Browse our comprehensive range of healthcare services</p>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Services
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: Service) => (
            <Card key={service.id}>
              <CardHeader>
                {service.icon_url && (
                  <img
                    src={service.icon_url}
                    alt={service.name}
                    className="w-12 h-12 mb-2 rounded"
                  />
                )}
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {service.category}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center justify-between mb-4">
                  {service.price && (
                    <span className="text-2xl font-bold text-gray-900">
                      ${service.price}
                    </span>
                  )}
                  {service.duration_minutes && (
                    <span className="text-sm text-gray-500">
                      {service.duration_minutes} min
                    </span>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate({ to: '/login' });
                    } else {
                      navigate({ to: '/providers', search: { service: service.id } });
                    }
                  }}
                >
                  Find Providers
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No services found in this category</p>
            <Button variant="outline" onClick={() => setSelectedCategory('all')}>
              View All Services
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
