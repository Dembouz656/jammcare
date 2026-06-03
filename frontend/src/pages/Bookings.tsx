import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Booking } from '../types/index.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function BookingsPage() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.user_id],
    queryFn: () => user ? apiClient.getUserBookings(user.user_id) : [],
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const bookingsList = bookings || [];

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-600 mb-8">Manage your healthcare appointments</p>

        {bookingsList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">No bookings yet</p>
              <Button variant="outline">Browse Services</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookingsList.map((booking: Booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{booking.service_name}</CardTitle>
                      <CardDescription>with {booking.provider_name}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(booking.appointment_date), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {format(new Date(booking.appointment_date), 'HH:mm')}
                    </div>
                    {booking.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {booking.location}
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Notes:</strong> {booking.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <Button size="sm" variant="destructive">
                        Cancel Booking
                      </Button>
                    )}
                    {booking.status === 'completed' && (
                      <Button size="sm">Leave Review</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
