import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import authReducer, { logout, setCredentials } from "./features/authSlice"
import { baseApi } from "./api/baseApi"

const listenerMiddleware = createListenerMiddleware()

// Automatically purge all RTK Query cache when logging out or switching credentials
listenerMiddleware.startListening({
  actionCreator: logout,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState())
  },
})

listenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(baseApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch