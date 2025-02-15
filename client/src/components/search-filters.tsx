import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

const filterSchema = z.object({
  search: z.string(),
  propertyType: z.string().optional(),
  minPrice: z.string(),
  maxPrice: z.string(),
});

type FilterValues = z.infer<typeof filterSchema>;

interface SearchFiltersProps {
  onFilter: (values: FilterValues) => void;
}

export default function SearchFilters({ onFilter }: SearchFiltersProps) {
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      minPrice: "",
      maxPrice: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFilter)}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
      >
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search</FormLabel>
              <FormControl>
                <Input placeholder="Search locations..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="propertyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Price</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Min €" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Price</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Max €" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="md:col-span-4">
          Apply Filters
        </Button>
      </form>
    </Form>
  );
}
