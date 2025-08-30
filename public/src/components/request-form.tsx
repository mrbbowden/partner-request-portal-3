import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';

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

interface RequestFormData {
  // Partner Information (auto-filled from partner lookup)
  partnerId: string;
  partnerName: string;
  caseManagerName: string;
  caseManagerEmail: string;
  caseManagerPhone: string;
  
  // Recipient Information
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
}

interface RequestFormProps {
  partner: Partner;
  onRequestSubmitted: () => void;
  onClearForm: () => void;
}

export default function RequestForm({ partner, onRequestSubmitted, onClearForm }: RequestFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<RequestFormData>({
    // Partner Information (auto-filled)
    partnerId: partner.id,
    partnerName: partner.partnerName,
    caseManagerName: '',
    caseManagerEmail: '',
    caseManagerPhone: '',
    
    // Recipient Information
    recipientsName: '',
    recipientsStreetAddress: '',
    recipientsCity: '',
    recipientsState: '',
    recipientsZip: '',
    recipientsEmail: '',
    recipientsPhone: '',
    race: '',
    ethnicity: '',
    // Household Information
    numberOfMenInHousehold: '',
    numberOfWomenInHousehold: '',
    numberOfChildrenInHousehold: '',
    employedHousehold: '',
    englishSpeaking: '',
    descriptionOfNeed: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const requiredFields = [
      'caseManagerName', 'caseManagerEmail', 'caseManagerPhone',
      'recipientsName', 'recipientsStreetAddress', 'recipientsCity', 'recipientsState', 'recipientsZip', 'recipientsEmail', 'recipientsPhone', 'race', 'ethnicity', 'numberOfMenInHousehold', 'numberOfWomenInHousehold', 'numberOfChildrenInHousehold', 'employedHousehold', 'englishSpeaking', 'descriptionOfNeed'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof RequestFormData] || formData[field as keyof RequestFormData].trim() === '') {
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        toast({ 
          title: 'Missing field', 
          description: `Please fill in ${fieldName}`, 
          variant: 'destructive' 
        });
        return;
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipientsEmail)) {
      toast({ 
        title: 'Invalid email', 
        description: 'Please enter a valid recipient email address', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!emailRegex.test(formData.caseManagerEmail)) {
      toast({ 
        title: 'Invalid email', 
        description: 'Please enter a valid case manager email address', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit request');
      }

      await response.json().catch(() => ({}));
      toast({ title: 'Success', description: 'Request submitted successfully' });
      
      // Reset form data - preserve partner information
      setFormData({
        // Preserve partner information (auto-filled from partner lookup)
        partnerId: partner.id,
        partnerName: partner.partnerName,
        caseManagerName: '',
        caseManagerEmail: '',
        caseManagerPhone: '',
        // Clear all request submission fields
        recipientsName: '',
        recipientsStreetAddress: '',
        recipientsCity: '',
        recipientsState: '',
        recipientsZip: '',
        recipientsEmail: '',
        recipientsPhone: '',
        race: '',
        ethnicity: '',
        numberOfMenInHousehold: '',
        numberOfWomenInHousehold: '',
        numberOfChildrenInHousehold: '',
        employedHousehold: '',
        englishSpeaking: '',
        descriptionOfNeed: '',
      });
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to submit request', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      // Preserve partner information (auto-filled from partner lookup)
      partnerId: partner.id,
      partnerName: partner.partnerName,
      caseManagerName: '',
      caseManagerEmail: '',
      caseManagerPhone: '',
      // Clear all request submission fields
      recipientsName: '',
      recipientsStreetAddress: '',
      recipientsCity: '',
      recipientsState: '',
      recipientsZip: '',
      recipientsEmail: '',
      recipientsPhone: '',
      race: '',
      ethnicity: '',
      numberOfMenInHousehold: '',
      numberOfWomenInHousehold: '',
      numberOfChildrenInHousehold: '',
      employedHousehold: '',
      englishSpeaking: '',
      descriptionOfNeed: '',
    });
    // Don't call onClearForm() as it clears the entire partner lookup
    // onClearForm();
  };

  return (
    <Card className="border-gray-200 bg-white transition-colors duration-200 backdrop-blur-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Submit Request</CardTitle>
        <p className="text-sm text-gray-600">Complete all fields to submit your request</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Partner Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Partner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <Label htmlFor="partnerId" className="text-sm font-medium text-gray-700">Partner ID</Label>
                <Input 
                  id="partnerId" 
                  value={formData.partnerId} 
                  disabled 
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="partnerName" className="text-sm font-medium text-gray-700">Partner Name</Label>
                <Input 
                  id="partnerName" 
                  value={formData.partnerName} 
                  disabled 
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="caseManagerName" className="text-sm font-medium text-gray-700">Case Manager Name</Label>
                <Input 
                  id="caseManagerName" 
                  value={formData.caseManagerName} 
                  onChange={(e) => setFormData({ ...formData, caseManagerName: e.target.value })}
                  placeholder="Enter case manager's name"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="caseManagerEmail" className="text-sm font-medium text-gray-700">Case Manager Email</Label>
                <Input 
                  id="caseManagerEmail" 
                  type="email"
                  value={formData.caseManagerEmail} 
                  onChange={(e) => setFormData({ ...formData, caseManagerEmail: e.target.value })}
                  placeholder="Enter case manager's email"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="caseManagerPhone" className="text-sm font-medium text-gray-700">Case Manager Phone</Label>
                <Input 
                  id="caseManagerPhone" 
                  value={formData.caseManagerPhone} 
                  onChange={(e) => setFormData({ ...formData, caseManagerPhone: e.target.value })}
                  placeholder="Enter case manager's phone"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>



          {/* Recipient Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Recipient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientsName" className="text-sm font-medium text-gray-700">Recipient's Name *</Label>
                <Input 
                  id="recipientsName" 
                  value={formData.recipientsName} 
                  onChange={(e) => setFormData({ ...formData, recipientsName: e.target.value })}
                  placeholder="Enter recipient's full name"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientsEmail" className="text-sm font-medium text-gray-700">Recipient's Email *</Label>
                <Input 
                  id="recipientsEmail" 
                  type="email" 
                  value={formData.recipientsEmail} 
                  onChange={(e) => setFormData({ ...formData, recipientsEmail: e.target.value })}
                  placeholder="Enter recipient's email address"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientsPhone" className="text-sm font-medium text-gray-700">Recipient's Phone *</Label>
                <Input 
                  id="recipientsPhone" 
                  value={formData.recipientsPhone} 
                  onChange={(e) => setFormData({ ...formData, recipientsPhone: e.target.value })}
                  placeholder="Enter recipient's phone number"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientsStreetAddress" className="text-sm font-medium text-gray-700">Recipient's Street Address *</Label>
                <Input 
                  id="recipientsStreetAddress" 
                  value={formData.recipientsStreetAddress} 
                  onChange={(e) => setFormData({ ...formData, recipientsStreetAddress: e.target.value })}
                  placeholder="Enter recipient's street address"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientsCity" className="text-sm font-medium text-gray-700">Recipient's City *</Label>
                <Input 
                  id="recipientsCity" 
                  value={formData.recipientsCity} 
                  onChange={(e) => setFormData({ ...formData, recipientsCity: e.target.value })}
                  placeholder="Enter recipient's city"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientsState" className="text-sm font-medium text-gray-700">Recipient's State *</Label>
                <Input 
                  id="recipientsState" 
                  value={formData.recipientsState} 
                  onChange={(e) => setFormData({ ...formData, recipientsState: e.target.value })}
                  placeholder="Enter recipient's state"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientsZip" className="text-sm font-medium text-gray-700">Recipient's Zip Code *</Label>
                <Input 
                  id="recipientsZip" 
                  value={formData.recipientsZip} 
                  onChange={(e) => setFormData({ ...formData, recipientsZip: e.target.value })}
                  placeholder="Enter recipient's zip code"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="descriptionOfNeed" className="text-sm font-medium text-gray-700">Description of Need *</Label>
                <Textarea 
                  id="descriptionOfNeed" 
                  value={formData.descriptionOfNeed} 
                  onChange={(e) => setFormData({ ...formData, descriptionOfNeed: e.target.value })}
                  placeholder="Please describe the specific need or requirement..."
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 min-h-[100px]"
                />
              </div>
            </div>

            {/* Household Information Subsection */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800 border-b border-gray-200 pb-2">Household Information</h4>
              
              {/* Demographic Information Notice */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Demographic Information</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  As a 501(c)(3) non-profit organization we need to collect demographic information that is kept confidential and primarily used for grant applications. This data will be kept private and is never used as a basis as a decision to provide or deny services.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numberOfMenInHousehold" className="text-sm font-medium text-gray-700">Number of Men in Household *</Label>
                  <Input 
                    id="numberOfMenInHousehold" 
                    type="number"
                    min="0"
                    value={formData.numberOfMenInHousehold} 
                    onChange={(e) => setFormData({ ...formData, numberOfMenInHousehold: e.target.value })}
                    placeholder="Enter number of men"
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfWomenInHousehold" className="text-sm font-medium text-gray-700">Number of Women in Household *</Label>
                  <Input 
                    id="numberOfWomenInHousehold" 
                    type="number"
                    min="0"
                    value={formData.numberOfWomenInHousehold} 
                    onChange={(e) => setFormData({ ...formData, numberOfWomenInHousehold: e.target.value })}
                    placeholder="Enter number of women"
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfChildrenInHousehold" className="text-sm font-medium text-gray-700">Number of Children in Household *</Label>
                  <Input 
                    id="numberOfChildrenInHousehold" 
                    type="number"
                    min="0"
                    value={formData.numberOfChildrenInHousehold} 
                    onChange={(e) => setFormData({ ...formData, numberOfChildrenInHousehold: e.target.value })}
                    placeholder="Enter number of children"
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="employedHousehold" className="text-sm font-medium text-gray-700">Employed Household *</Label>
                <Select value={formData.employedHousehold} onValueChange={(value) => setFormData({ ...formData, employedHousehold: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes - Household has employed members</SelectItem>
                    <SelectItem value="false">No - Household has no employed members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="race" className="text-sm font-medium text-gray-700">Race *</Label>
                <Select value={formData.race} onValueChange={(value) => setFormData({ ...formData, race: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select Race" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="American Indian or Alaska Native">American Indian or Alaska Native</SelectItem>
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="Black or African American">Black or African American</SelectItem>
                    <SelectItem value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</SelectItem>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ethnicity" className="text-sm font-medium text-gray-700">Ethnicity *</Label>
                <Select value={formData.ethnicity} onValueChange={(value) => setFormData({ ...formData, ethnicity: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select Ethnicity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hispanic or Latino or Spanish Origin">Hispanic or Latino or Spanish Origin</SelectItem>
                    <SelectItem value="Not Hispanic or Latino or Spanish Origin">Not Hispanic or Latino or Spanish Origin</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="englishSpeaking" className="text-sm font-medium text-gray-700">English Speaking *</Label>
                <Select value={formData.englishSpeaking} onValueChange={(value) => setFormData({ ...formData, englishSpeaking: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes - Household speaks English</SelectItem>
                    <SelectItem value="false">No - Household does not speak English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear Form
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            * Required fields
          </p>
        </form>
      </CardContent>
    </Card>
  );
}