import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Search, Users, Heart, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Healthcare Services At Your Fingertips</h1>
            <p className="text-xl mb-8 text-blue-100">Find and book qualified healthcare providers in your area. Easy, fast, and secure.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => navigate({ to: '/services' })}
              >
                Find Services <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => navigate({ to: '/providers' })}
              >
                Browse Providers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose JammCare?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Easy Search</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Find qualified healthcare providers and services near you with our advanced search and filtering options.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Verified Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All our healthcare providers are verified professionals with proper credentials and certifications.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Secure Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Book appointments safely with secure payment processing and transparent pricing information.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Join thousands of satisfied customers who are using JammCare to book their healthcare services.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ to: '/register' })}
            >
              Sign Up Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: '/services' })}
            >
              Explore Services
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
