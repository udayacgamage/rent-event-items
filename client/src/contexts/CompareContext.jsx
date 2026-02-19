import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState([]);

  const addToCompare = (item) => {
    setCompareItems((prev) => {
      if (prev.find((i) => i._id === item._id)) {
        toast('Already in compare list', { icon: 'ℹ️' });
        return prev;
      }
      if (prev.length >= 4) {
        toast.error('Max 4 items to compare');
        return prev;
      }
      toast.success(`${item.name} added to compare`);
      return [...prev, item];
    });
  };

  const removeFromCompare = (itemId) => {
    setCompareItems((prev) => prev.filter((i) => i._id !== itemId));
  };

  const clearCompare = () => setCompareItems([]);

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be inside CompareProvider');
  return ctx;
};
