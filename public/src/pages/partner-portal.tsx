import React, { useState, useRef, useEffect, useCallback } from "react";
import { Handshake, User, Settings, Search, AlertCircle, CheckCircle, Building2, Phone, Mail, MapPin, Sparkles, Loader2, ChevronDown, Check } from "lucide-react";
import { Link } from "wouter";
import RequestForm from "../components/request-form";
import { getPartnerIdCookie, setPartnerIdCookie, clearPartnerIdCookie } from "../lib/cookies";

interface Partner {
  id: string;
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;
  partnerStreetAddress?: string;
  partnerCity?: string;
  partnerState?: string;
  partnerZip?: string;
}

export default function PartnerPortal() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing partner ID cookie on component mount
  useEffect(() => {
    console.log("PartnerPortal: Checking for saved partner ID cookie...");
    const savedPartnerId = getPartnerIdCookie();
    console.log("PartnerPortal: Cookie check result:", savedPartnerId);
    if (savedPartnerId) {
      console.log("PartnerPortal: Found saved partner ID in cookie:", savedPartnerId);
      setPartnerId(savedPartnerId);
      // Auto-lookup the partner if we have a saved ID
      handleLookup(savedPartnerId);
    } else {
      console.log("PartnerPortal: No saved partner ID found");
    }
  }, []);

  const handlePartnerFound = (foundPartner: Partner) => {
    setPartner(foundPartner);
    setShowSuccess(false);
    setError(null);
    // Set cookie when partner is found
    setPartnerIdCookie(foundPartner.id);
  };

  const handlePartnerNotFound = () => {
    setPartner(null);
  };

  const handleRequestSubmitted = () => {
    setShowSuccess(true);
    // Keep partner and form visible, just show success message
    // Don't clear partner or partnerId - let the form handle its own clearing
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  const handleClearForm = () => {
    setPartner(null);
    setPartnerId("");
    setError(null);
    // Clear cookie when form is cleared
    clearPartnerIdCookie();
  };

  // Search function for dynamic lookup
  const searchPartners = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/partners/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      }
    } catch (err) {
      console.log("Search error:", err);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleLookup = async (id?: string) => {
    const lookupId = (id || partnerId).toUpperCase();
    if (lookupId.length < 3 || lookupId.length > 9) {
      setError("Please enter a partner ID between 3 and 9 characters");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPartner(null);
    setShowDropdown(false); // Hide dropdown when fetching specific partner

    try {
      const response = await fetch(`/api/partners/${lookupId}`);
      if (!response.ok) {
        throw new Error("Partner not found");
      }
      const data = await response.json();
      handlePartnerFound(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Partner not found");
      handlePartnerNotFound();
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (partnerId.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPartners(partnerId);
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [partnerId, searchPartners]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showDropdown && searchResults.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
            selectPartner(searchResults[selectedIndex]);
          } else if (partnerId.length >= 3 && partnerId.length <= 9) {
            handleLookup();
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    } else if (e.key === "Enter" && partnerId.length >= 3 && partnerId.length <= 9) {
      handleLookup();
    }
  };

  // Select a partner from search results
  const selectPartner = (selectedPartner: Partner) => {
    setPartnerId(selectedPartner.id);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSearchResults([]);
    handleLookup(selectedPartner.id);
  };

  const handleLookupClick = () => {
    handleLookup();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Handshake className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fully Furnished Ministries</h1>
                <p className="text-sm text-gray-600">Fully Furnished Ministries</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Current User</span>
              </div>
              <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center text-sm">
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Partner Lookup */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <Search className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Partner Lookup</h3>
              <p className="text-gray-600">Type your partner ID or name to search and select from the dropdown</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type partner ID or name..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-lg"
                maxLength={9}
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                disabled={isLoading}
              />
              {(isSearching || showDropdown) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                        index === selectedIndex
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => selectPartner(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{result.id}</div>
                          <div className="text-gray-600 text-xs">
                            {result.partnerName}
                          </div>
                        </div>
                        {index === selectedIndex && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-semibold"
              onClick={handleLookupClick}
              disabled={isLoading || partnerId.length < 3 || partnerId.length > 9}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Look Up Partner
                </>
              )}
            </button>
            <button 
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center font-semibold"
              onClick={handleClearForm}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Want to be a partner?{" "}
              <a 
                href="https://fullyfurnishedministries.org/partners" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                click here
              </a>
            </p>
          </div>
          
          {error && (
            <div className="mt-4 flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Partner Info */}
        {partner && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Partner Found!</h3>
                <p className="text-gray-600">Partner information retrieved successfully</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Building2 className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Partner Name</span>
                </div>
                <p className="text-base font-medium text-gray-900">{partner.partnerName}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Mail className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Partner Email</span>
                </div>
                <p className="text-base font-medium text-gray-900 break-all">
                  {partner.partnerEmail || 'Not provided'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Phone className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Partner Phone</span>
                </div>
                <p className="text-base font-medium text-gray-900">
                  {partner.partnerPhone || 'Not provided'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <MapPin className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Partner Address</span>
                </div>
                <p className="text-base font-medium text-gray-900">
                  {partner.partnerStreetAddress ? (
                    <>
                      {partner.partnerStreetAddress}<br />
                      {partner.partnerCity && partner.partnerState && partner.partnerZip ? 
                        `${partner.partnerCity}, ${partner.partnerState} ${partner.partnerZip}` : 
                        'Incomplete address'
                      }
                    </>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Request Form */}
        {partner && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <RequestForm
              partner={partner}
              onRequestSubmitted={handleRequestSubmitted}
              onClearForm={handleClearForm}
            />
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Request Submitted!</h3>
                <p className="text-sm opacity-90 mt-1">
                  Your request has been submitted successfully. You'll receive a confirmation email shortly.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
