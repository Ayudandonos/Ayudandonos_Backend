export type LocationCountryDto = {
  iso2: string;
  name: string;
  phonecode: string | null;
  emoji: string | null;
  flag: string | null;
};

export type LocationStateDto = {
  iso2: string;
  name: string;
  countryIso2: string;
};

export type LocationCityDto = {
  name: string;
  stateIso2: string;
  countryIso2: string;
};

export type CscCountryRaw = {
  id?: number;
  name: string;
  iso2: string;
  phonecode?: string;
  emoji?: string;
};

export type CscStateRaw = {
  id?: number;
  name: string;
  iso2: string;
  country_code?: string;
};

export type CscCityRaw = {
  id?: number;
  name: string;
};
