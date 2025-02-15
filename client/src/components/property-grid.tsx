import PropertyCard from "./property-card";
import type { Listing } from "@shared/schema";

export default function PropertyGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <PropertyCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
