'use client';

import { Provider } from 'react-redux';
import { store } from './index';
import { useEffect } from 'react';
import { initCart } from './slices/cartSlice';
import { hydrateFromStorage, loadUser } from './slices/authSlice';

let clientStoreBootstrapped = false;

function bootstrapClientStore() {
  if (clientStoreBootstrapped || typeof window === 'undefined') return;
  store.dispatch(hydrateFromStorage());
  store.dispatch(initCart());
  clientStoreBootstrapped = true;
}

function StoreInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bootstrapClientStore();
    store.dispatch(loadUser());
  }, []);
  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  bootstrapClientStore();

  return (
    <Provider store={store}>
      <StoreInitializer>{children}</StoreInitializer>
    </Provider>
  );
}
