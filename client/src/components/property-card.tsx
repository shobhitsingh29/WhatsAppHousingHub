import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Euro } from "lucide-react";
import type { Listing } from "@shared/schema";

export default function PropertyCard({ listing }: { listing: Listing }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={listing.imageUrl}
        alt={listing.title}
        className="h-48 w-full object-cover"
      />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{listing.title}</h3>
          <Badge variant="secondary">{listing.propertyType}</Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">{listing.location}</p>
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            {listing.bedrooms}
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            {listing.bathrooms}
          </div>
          <div className="flex items-center">
            <Euro className="h-4 w-4 mr-1" />
            {listing.price}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-sm text-gray-600">Contact: {listing.contactInfo}</p>
      </CardFooter>
    </Card>
  );
}
