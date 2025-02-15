import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@shared/schema";
import SearchFilters from "@/components/search-filters";
import PropertyGrid from "@/components/property-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [filters, setFilters] = useState({
    search: "",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
  });

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });

  const filteredListings = listings?.filter((listing) => {
    if (
      filters.search &&
      !listing.location.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.propertyType && listing.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.minPrice && listing.price < Number(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && listing.price > Number(filters.maxPrice)) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SearchFilters onFilter={setFilters} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SearchFilters onFilter={setFilters} />
      {filteredListings && <PropertyGrid listings={filteredListings} />}
    </div>
  );
}
