import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the heavy country-city data
const loadCountryCityData = () => import("country-state-city").then(module => ({
  Country: module.Country,
  City: module.City,
}));

const loadFuse = () => import("fuse.js").then(module => module.default);

interface LocationSelectorProps {
  value?: string;
  onChange: (location: string) => void;
}

export const LocationSelector = ({ value, onChange }: LocationSelectorProps) => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [countryData, setCountryData] = useState<any>(null);
  const [cityData, setCityData] = useState<any>(null);
  const [FuseClass, setFuseClass] = useState<any>(null);

  // Load dependencies on mount
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [{ Country, City }, Fuse] = await Promise.all([
          loadCountryCityData(),
          loadFuse(),
        ]);
        setCountryData(Country);
        setCityData(City);
        setFuseClass(() => Fuse);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load location data:", error);
        setLoading(false);
      }
    };
    loadDependencies();
  }, []);

  // Parse initial value
  useEffect(() => {
    if (value && value.includes(",")) {
      const [city, country] = value.split(",").map(s => s.trim());
      setSelectedCity(city);
      setSelectedCountry(country);
    } else if (value) {
      setSelectedCountry(value);
    }
  }, [value]);

  // Get all countries
  const allCountries = useMemo(() => {
    if (!countryData) return [];
    return countryData.getAllCountries().map((country: any) => ({
      name: country.name,
      code: country.isoCode,
    }));
  }, [countryData]);

  // Fuzzy search for countries
  const countryFuse = useMemo(() => {
    if (!FuseClass || allCountries.length === 0) return null;
    return new FuseClass(allCountries, {
      keys: ['name'],
      threshold: 0.3,
      distance: 100,
    });
  }, [allCountries, FuseClass]);

  const filteredCountries = useMemo(() => {
    if (!countryFuse) return allCountries.slice(0, 10);
    if (!countrySearch) return allCountries.slice(0, 10);
    return countryFuse.search(countrySearch).slice(0, 10).map((result: any) => result.item);
  }, [countrySearch, countryFuse, allCountries]);

  // Get cities for selected country
  const countryCities = useMemo(() => {
    if (!selectedCountry || !cityData) return [];
    const countryInfo = allCountries.find((c: any) => c.name === selectedCountry);
    if (!countryInfo) return [];
    
    return cityData.getCitiesOfCountry(countryInfo.code)?.map((city: any) => ({
      name: city.name,
    })) || [];
  }, [selectedCountry, allCountries, cityData]);

  // Fuzzy search for cities
  const cityFuse = useMemo(() => {
    if (!FuseClass || countryCities.length === 0) return null;
    return new FuseClass(countryCities, {
      keys: ['name'],
      threshold: 0.3,
      distance: 100,
    });
  }, [countryCities, FuseClass]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return countryCities.slice(0, 10);
    if (!cityFuse) return [];
    return cityFuse.search(citySearch).slice(0, 10).map((result: any) => result.item);
  }, [citySearch, cityFuse, countryCities]);

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    setSelectedCity("");
    setCountryOpen(false);
    onChange(countryName);
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setCityOpen(false);
    onChange(`${cityName}, ${selectedCountry}`);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading location data...</span>
        </div>
      ) : (
        <>
          {/* Country Selector */}
          <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              className="w-full justify-between"
            >
              {selectedCountry || "Select country..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <Input
                  placeholder="Search country..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.name}
                      onSelect={() => handleCountrySelect(country.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountry === country.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {country.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              className="w-full justify-between"
              disabled={!selectedCountry}
            >
              {selectedCity || "Select city..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <Input
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {filteredCities.map((city) => (
                    <CommandItem
                      key={city.name}
                      value={city.name}
                      onSelect={() => handleCitySelect(city.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCity === city.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {city.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {!selectedCountry && (
          <p className="text-xs text-muted-foreground">
            Please select a country first
          </p>
        )}
      </div>
      </>
      )}
    </div>
  );
};
