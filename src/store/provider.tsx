'use client';

import { Provider } from 'react-redux';
import { store } from './index';
import { useEffect } from 'react';
import { initCart } from './slices/cartSlice';
import { loadUser } from './slices/authSlice';

function StoreInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initCart());
    store.dispatch(loadUser());
  }, []);
  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StoreInitializer>{children}</StoreInitializer>
    </Provider>
  );
}
