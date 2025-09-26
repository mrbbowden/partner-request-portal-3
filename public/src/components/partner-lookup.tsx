import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ChevronDown, Check } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { setPartnerIdCookie, clearPartnerIdCookie } from "../lib/cookies";

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

interface PartnerLookupProps {
  onPartnerFound: (partner: Partner) => void;
  onPartnerNotFound: () => void;
  initialPartnerId?: string;
}

export interface PartnerLookupRef {
  clearPartnerId: () => void;
}

const PartnerLookup = forwardRef<PartnerLookupRef, PartnerLookupProps>(
  ({ onPartnerFound, onPartnerNotFound, initialPartnerId }, ref) => {
  const [partnerId, setPartnerId] = useState(initialPartnerId || "");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Manual fetch function
  const fetchPartner = useCallback(async (id: string) => {
    const capitalizedId = id.toUpperCase();
    console.log("=== fetchPartner called with id:", capitalizedId);
    setIsLoading(true);
    setError(null);
    setPartner(null); // Clear any previous partner data
    setShowDropdown(false); // Hide dropdown when fetching specific partner
    try {
      console.log("Making API call to:", `/api/partners/${capitalizedId}`);
      const response = await fetch(`/api/partners/${capitalizedId}`);
      console.log("API response status:", response.status);
      if (!response.ok) {
        throw new Error("Partner not found");
      }
      const data = await response.json();
      console.log("Partner data received:", data);
      console.log("Setting partner state to:", data);
      setPartner(data);
      setError(null);
    } catch (err) {
      console.log("Partner fetch error:", err);
      setPartner(null);
      setError(err instanceof Error ? err.message : "Partner not found");
    } finally {
      console.log("Setting isLoading to false");
      setIsLoading(false);
    }
  }, []); // Remove partner dependency to prevent infinite loops

  // Handle partner found/not found
  useEffect(() => {
    console.log("useEffect triggered at:", new Date().toISOString(), "- partner:", partner, "error:", error);
    if (partner) {
      console.log("Calling onPartnerFound with:", partner);
      // Set cookie when partner is found
      setPartnerIdCookie(partner.id);
      onPartnerFound(partner);
    } else if (error) {
      console.log("Calling onPartnerNotFound due to error:", error);
      // Clear any previous partner info when lookup fails
      onPartnerNotFound();
    }
  }, [partner, error, onPartnerFound, onPartnerNotFound]);

  // Auto-fetch partner when initialPartnerId is provided
  useEffect(() => {
    if (initialPartnerId && initialPartnerId.length === 4) {
      console.log("Auto-fetching partner with initialPartnerId:", initialPartnerId);
      fetchPartner(initialPartnerId);
    }
  }, [initialPartnerId, fetchPartner]);

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

  // Clear partner info when partnerId changes (user starts typing new ID)
  useEffect(() => {
    if (partnerId.length > 0 && partnerId.length < 4) {
      // Clear partner info when user is typing a new ID
      onPartnerNotFound();
    }
  }, [partnerId, onPartnerNotFound]);

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
          } else if (partnerId.length === 4) {
            handleGoClick();
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    } else if (e.key === "Enter" && partnerId.length === 4) {
      handleGoClick();
    }
  };

  // Select a partner from search results
  const selectPartner = (selectedPartner: Partner) => {
    setPartnerId(selectedPartner.id);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSearchResults([]);
    fetchPartner(selectedPartner.id);
  };

  // Handle Go button click
  const handleGoClick = () => {
    console.log("Go button clicked, partnerId:", partnerId);
    if (partnerId.length === 4) {
      console.log("Fetching partner data");
      fetchPartner(partnerId);
    }
  };

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

  // Expose clear method
  useImperativeHandle(ref, () => ({
    clearPartnerId: () => {
      setPartnerId("");
      setPartner(null);
      setError(null);
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      // Clear partner info when clearing the input
      onPartnerNotFound();
      // Clear the cookie when clearing the partner ID
      clearPartnerIdCookie();
    },
  }));

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Partner Lookup</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Type your Partner ID or partner name to search and select from the dropdown.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="partnerId">Partner ID or Name</Label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                id="partnerId"
                type="text"
                placeholder="Type partner ID or name..."
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                className="pr-8"
              />
              {(isSearching || showDropdown) && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                        index === selectedIndex
                          ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => selectPartner(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{result.id}</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
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
            <Button
              onClick={handleGoClick}
              disabled={partnerId.length < 3 || isLoading}
              className="min-w-[80px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Go"
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Partner ID not found. Please check your ID and try again.</span>
          </div>
        )}

        {initialPartnerId && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Partner ID {initialPartnerId} loaded from previous session</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearPartnerIdCookie();
                window.location.reload();
              }}
              className="text-xs"
            >
              Clear Saved ID
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

PartnerLookup.displayName = "PartnerLookup";

export default PartnerLookup;