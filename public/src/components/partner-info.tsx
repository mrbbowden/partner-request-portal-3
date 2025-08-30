import React from 'react';

interface Partner {
  id: string;
  partnerName: string;
  caseManagerEmail: string;
  caseManagerPhone: string;
}

interface PartnerInfoProps {
  partner: Partner;
}

export default function PartnerInfo({ partner }: PartnerInfoProps) {
  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-200 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Partner Found!</h3>
      <div className="space-y-2">
        <p className="text-gray-700"><strong>Partner Name:</strong> {partner.partnerName}</p>
        <p className="text-gray-700"><strong>Case Manager's Email:</strong> {partner.caseManagerEmail}</p>
        <p className="text-gray-700"><strong>Case Manager's Phone:</strong> {partner.caseManagerPhone}</p>
      </div>
    </div>
  );
}