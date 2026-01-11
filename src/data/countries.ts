import { Country, State } from 'country-state-city';

export const getAllCountries = () => {
  return Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));
};

export const getStatesByCountry = (countryCode: string) => {
  return State.getStatesOfCountry(countryCode).map((state) => ({
    value: state.isoCode,
    label: state.name,
  }));
};

export const getCountryName = (countryCode: string) => {
  const country = Country.getCountryByCode(countryCode);
  return country?.name || countryCode;
};

export const getStateName = (countryCode: string, stateCode: string) => {
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  return state?.name || stateCode;
};
