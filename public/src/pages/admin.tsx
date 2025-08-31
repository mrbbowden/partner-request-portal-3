import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Users, FileText, Plus, Edit, Trash2, ArrowLeft, Shield } from 'lucide-react';
import { getAdminAuthCookie, setAdminAuthCookie, clearAdminAuthCookie } from '../lib/cookies';

// Define interfaces
interface Partner {
  id: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
  partnerStreetAddress: string;
  partnerCity: string;
  partnerState: string;
  partnerZip: string;
}

interface Request {
  id: string;
  partnerId: string;
  partnerName: string;
  caseManagerName: string;
  caseManagerEmail: string;
  caseManagerPhone: string;
  // Recipient fields
  recipientsName: string;
  recipientsStreetAddress: string;
  recipientsCity: string;
  recipientsState: string;
  recipientsZip: string;
  recipientsEmail: string;
  recipientsPhone: string;
  race: string;
  ethnicity: string;
  // Household Information
  numberOfMenInHousehold: string;
  numberOfWomenInHousehold: string;
  numberOfChildrenInHousehold: string;
  employedHousehold: string;
  englishSpeaking: string;
  descriptionOfNeed: string;
  createdAt: string;
}

interface PartnerFormData {
  id: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
  partnerStreetAddress: string;
  partnerCity: string;
  partnerState: string;
  partnerZip: string;
}



export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing admin authentication on component mount
  useEffect(() => {
    const savedPassword = getAdminAuthCookie();
    if (savedPassword) {
      console.log('Found saved admin authentication');
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  // Partners query
  const { data: partners = [], refetch: refetchPartners } = useQuery({
    queryKey: ['partners', password],
    queryFn: async () => {
      const response = await fetch('/api/admin/partners', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch partners');
      return response.json();
    },
    enabled: isAuthenticated && password.length > 0,
    refetchOnMount: true,
  });

  // Requests query
  const { data: requests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['requests', password],
    queryFn: async () => {
      const response = await fetch('/api/admin/requests', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    },
    enabled: isAuthenticated && password.length > 0,
    refetchOnMount: true,
  });

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Partner mutations
  const createPartnerMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create partner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners', password] });
      setShowPartnerDialog(false);
      toast({
        title: "Success",
        description: "Partner created successfully",
      });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerFormData }) => {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update partner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners', password] });
      setShowPartnerDialog(false);
      setEditingPartner(null);
      toast({
        title: "Success",
        description: "Partner updated successfully",
      });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete partner');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners', password] });
      setDeletingPartner(null);
      toast({
        title: "Success",
        description: "Partner deleted successfully",
      });
    },
  });



  const handleLogin = () => {
    if (password === 'scooby') {
      setIsAuthenticated(true);
      // Save authentication cookie for 24 hours
      setAdminAuthCookie(password);
      queryClient.removeQueries();
      refetchPartners();
      refetchRequests();
      toast({
        title: "Success",
        description: "Logged in successfully. You'll stay logged in for 24 hours.",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    // Clear authentication cookie
    clearAdminAuthCookie();
    queryClient.removeQueries();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-gray-600">Enter password to access admin panel</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600 text-lg">Manage partners and requests</p>
            </div>
            <div className="flex gap-4">
              <a href="/" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </a>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Users className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Partners</p>
                    <p className="text-3xl font-bold text-gray-900">{partners.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <FileText className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partners Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="w-6 h-6 mr-3 text-blue-600" />
                  <CardTitle className="text-2xl">Partners</CardTitle>
                </div>
                <Button onClick={() => setShowPartnerDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner: Partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-mono">{partner.id}</TableCell>
                        <TableCell className="font-medium">{partner.partnerName}</TableCell>
                        <TableCell>{partner.partnerEmail}</TableCell>
                        <TableCell>{partner.partnerPhone}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {partner.partnerStreetAddress}<br />
                          {partner.partnerCity}, {partner.partnerState} {partner.partnerZip}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPartner(partner);
                                setShowPartnerDialog(true);
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeletingPartner(partner)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Partner</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete partner {partner.partnerName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <Button
                                    variant="destructive"
                                    onClick={() => deletePartnerMutation.mutate(partner.id)}
                                    disabled={deletePartnerMutation.isPending}
                                  >
                                    {deletePartnerMutation.isPending ? "Deleting..." : "Delete"}
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Requests Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-green-600" />
                <CardTitle className="text-2xl">Requests (View Only)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Household</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRequests.map((request: Request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.partnerName}</p>
                            <p className="text-sm text-gray-500">ID: {request.partnerId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.recipientsName}</p>
                            <p className="text-sm text-gray-500">{request.recipientsEmail}</p>
                            <p className="text-sm text-gray-600 mt-2 max-w-xs truncate">
                              <strong>Need:</strong> {request.descriptionOfNeed}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{request.recipientsStreetAddress}</p>
                            <p>{request.recipientsCity}, {request.recipientsState} {request.recipientsZip}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>Men: {request.numberOfMenInHousehold}</p>
                            <p>Women: {request.numberOfWomenInHousehold}</p>
                            <p>Children: {request.numberOfChildrenInHousehold}</p>
                            <p>Employed: {request.employedHousehold === 'true' ? 'Yes' : 'No'}</p>
                            <p>English Speaking: {request.englishSpeaking === 'true' ? 'Yes' : 'No'}</p>
                            <p>Race: {request.race}</p>
                            <p>Ethnicity: {request.ethnicity}</p>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Partner Dialog */}
          <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? 'Edit Partner' : 'Add Partner'}
                </DialogTitle>
              </DialogHeader>
              <PartnerForm
                partner={editingPartner}
                onSubmit={(data) => {
                  if (editingPartner) {
                    updatePartnerMutation.mutate({ id: editingPartner.id, data });
                  } else {
                    createPartnerMutation.mutate(data);
                  }
                }}
                onCancel={() => {
                  setShowPartnerDialog(false);
                  setEditingPartner(null);
                }}
                isLoading={createPartnerMutation.isPending || updatePartnerMutation.isPending}
              />
            </DialogContent>
          </Dialog>


        </div>
      </div>
    </div>
  );
}

// Partner Form Component
function PartnerForm({ 
  partner, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  partner: Partner | null; 
  onSubmit: (data: PartnerFormData) => void; 
  onCancel: () => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState<PartnerFormData>({
    id: partner?.id || '',
    partnerName: partner?.partnerName || '',
    partnerEmail: partner?.partnerEmail || '',
    partnerPhone: partner?.partnerPhone || '',
    partnerStreetAddress: partner?.partnerStreetAddress || '',
    partnerCity: partner?.partnerCity || '',
    partnerState: partner?.partnerState || '',
    partnerZip: partner?.partnerZip || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="partnerId">Partner ID</Label>
        <Input
          id="partnerId"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
          placeholder="Enter partner ID (3-9 characters)"
          maxLength={9}
          required
          disabled={!!partner} // Disable editing partner ID when editing existing partner
        />
        {partner && (
          <p className="text-sm text-gray-500 mt-1">Partner ID cannot be changed for existing partners</p>
        )}
      </div>
      <div>
        <Label htmlFor="partnerName">Partner Name</Label>
        <Input
          id="partnerName"
          value={formData.partnerName}
          onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="partnerEmail">Partner Email</Label>
        <Input
          id="partnerEmail"
          type="email"
          value={formData.partnerEmail}
          onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="partnerPhone">Partner Phone</Label>
        <Input
          id="partnerPhone"
          value={formData.partnerPhone}
          onChange={(e) => setFormData({ ...formData, partnerPhone: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="partnerStreetAddress">Partner Street Address</Label>
        <Input
          id="partnerStreetAddress"
          value={formData.partnerStreetAddress}
          onChange={(e) => setFormData({ ...formData, partnerStreetAddress: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="partnerCity">City</Label>
          <Input
            id="partnerCity"
            value={formData.partnerCity}
            onChange={(e) => setFormData({ ...formData, partnerCity: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="partnerState">State</Label>
          <Input
            id="partnerState"
            value={formData.partnerState}
            onChange={(e) => setFormData({ ...formData, partnerState: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="partnerZip">Zip Code</Label>
          <Input
            id="partnerZip"
            value={formData.partnerZip}
            onChange={(e) => setFormData({ ...formData, partnerZip: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (partner ? 'Update' : 'Create')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


