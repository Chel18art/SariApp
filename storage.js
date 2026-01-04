import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'SARIAPP_INVENTORY';

export const getInventory = async () => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : {};
};

export const saveInventory = async (inventory) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(inventory));
};
