export const USERS = [
  'Boris', 'Ralf', 'Anika', 'Lasse', 'Jan', 'Peter',
  'Sina', 'Marten', 'Matthias', 'Artjom', 'Halit', 'Thorsten', 'Andrej'
];

export const VERKAEUFER = ['Matthias', 'Artjom', 'Halit', 'Ralf'];

export const SERVICE = ['Anika', 'Lasse', 'Boris'];

export const isService = (user) => SERVICE.includes(user);

export const TOYOTA_MODELS = [
  'Aygo', 'Yaris', 'Yaris Cross', 'C-HR', 'C-HR+', 'C-HR Plug-in',
  'Corolla', 'Corolla Touring Sports', 'Corolla Cross', 'RAV4', 'RAV4 Plug-in',
  'bZ4X', 'bZ4X Touring', 'Urban Cruiser', 'Proace City', 'Proace City Verso',
  'Proace', 'Proace Verso', 'Proace Verso City', 'Proace Max', 'Land Cruiser', 'Hilux',
];

export const STATUS_CONFIG = {
  1: { label: 'Verkaufsmeldung eingegangen', short: 'Verkaufsm.', color: '#9E9E9E', textColor: '#fff' },
  2: { label: 'Auftrag erstellt', short: 'Auftrag', color: '#2196F3', textColor: '#fff' },
  3: { label: 'Eingeplant Werkstatt', short: 'Eingeplant', color: '#FFC107', textColor: '#282830' },
  4: { label: 'In Arbeit', short: 'In Arbeit', color: '#FF9800', textColor: '#fff' },
  5: { label: 'Fertig Werkstatt', short: 'Fertig WS', color: '#8BC34A', textColor: '#fff' },
  6: { label: 'Wäsche und Verkaufsreihe', short: 'Wäsche', color: '#9C27B0', textColor: '#fff' },
  7: { label: 'Übergabebereit', short: 'Übergabebereit', color: '#2E7D32', textColor: '#fff' },
  8: { label: 'Übergeben', short: 'Übergeben', color: '#212121', textColor: '#fff' },
};

export const TOYOTA_RED = '#EB0A1E';
export const DARK_GRAY = '#282830';
