import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@shared/schema";
import type { WhatsAppGroup } from "@shared/whatsapp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function Admin() {
  const { toast } = useToast();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLink, setNewGroupLink] = useState("");
  const [message, setMessage] = useState(""); // Added message state

  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<WhatsAppGroup[]>({
    queryKey: ["/api/whatsapp-groups"],
  });

  const addGroupMutation = useMutation({
    mutationFn: async (data: { name: string; inviteLink: string }) => {
      await apiRequest("POST", "/api/whatsapp-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-groups"] });
      toast({
        title: "Success",
        description: "WhatsApp group added successfully",
      });
      setNewGroupName("");
      setNewGroupLink("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add WhatsApp group",
        variant: "destructive",
      });
    },
  });

  const removeGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/whatsapp-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-groups"] });
      toast({
        title: "Success",
        description: "WhatsApp group removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove WhatsApp group",
        variant: "destructive",
      });
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/whatsapp-groups/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-groups"] });
      toast({
        title: "Success",
        description: "Group status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update group status",
        variant: "destructive",
      });
    },
  });

  const scrapeGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/whatsapp-groups/${id}/scrape`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Success",
        description: "Messages scraped successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to scrape messages",
        variant: "destructive",
      });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({ // Added sendMessageMutation
    mutationFn: async (data: { groupId: number; message: string }) => {
      await apiRequest("POST", `/api/whatsapp-groups/${data.groupId}/send-message`, data);
    },
    onSuccess: () => {
      setMessage(""); // Clear message input after successful send
      toast({ title: "Success", description: "Message sent successfully!" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${err.message}`,
        variant: "destructive",
      });
    },
  });


  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    addGroupMutation.mutate({ name: newGroupName, inviteLink: newGroupLink });
  };

  const handleSendMessage = (groupId: number) => {
    sendMessageMutation.mutate({ groupId, message });
  };

  if (listingsLoading || groupsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* WhatsApp Groups Section */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Groups</CardTitle>
          <CardDescription>
            Manage WhatsApp groups for listing aggregation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGroup} className="flex gap-4 mb-6">
            <Input
              placeholder="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
            <Input
              placeholder="Invite Link"
              value={newGroupLink}
              onChange={(e) => setNewGroupLink(e.target.value)}
              required
            />
            <Button type="submit" disabled={addGroupMutation.isPending}>
              Add Group
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Scraped</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups?.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupMutation.mutate({ id: group.id, isActive: !group.isActive })}
                    >
                      <Switch checked={group.isActive} />
                    </Button>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage(group.id)}
                        disabled={sendMessageMutation.isPending}
                      >
                        Send
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(group.lastScraped).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => scrapeGroupMutation.mutate(group.id)}
                        disabled={scrapeGroupMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGroupMutation.mutate(group.id)}
                        disabled={removeGroupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Listings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Listings</CardTitle>
          <CardDescription>
            Manage all property listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings?.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>{listing.id}</TableCell>
                  <TableCell>{listing.title}</TableCell>
                  <TableCell>{listing.location}</TableCell>
                  <TableCell>€{listing.price}</TableCell>
                  <TableCell>{listing.propertyType}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteListingMutation.mutate(listing.id)}
                      disabled={deleteListingMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}