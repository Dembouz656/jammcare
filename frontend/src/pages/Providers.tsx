import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.js';
import { Provider } from '../types/index.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js';
import { Star, MapPin, Loader2 } from 'lucide-react';

export function ProvidersPage() {
  const [sortBy, setSortBy] = useState('rating');
  const navigate = useNavigate();

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => apiClient.getProviders(),
  });

  const sortedProviders = providers
    ? [...providers].sort((a: Provider, b: Provider) => {
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        return 0;
      })
    : [];

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
        <h1 className="text-4xl font-bold mb-2">Healthcare Providers</h1>
        <p className="text-gray-600 mb-8">Find qualified healthcare providers near you</p>

        {/* Sort Options */}
        <div className="mb-8 flex gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Providers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProviders.map((provider: Provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {provider.avatar_url && (
                      <img
                        src={provider.avatar_url}
                        alt={provider.full_name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{provider.full_name}</CardTitle>
                      {provider.specialization && (
                        <CardDescription className="text-xs">
                          {provider.specialization}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(provider.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                  </div>

                  {/* Bio */}
                  {provider.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{provider.bio}</p>
                  )}

                  {/* License Status */}
                  <div className="inline-flex bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    ✓ Verified
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => navigate({ to: `/providers/${provider.id}` })}
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No providers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
